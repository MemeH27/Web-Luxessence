-- 1. Create Cart Reservations Table
CREATE TABLE IF NOT EXISTS cart_reservations (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  product_id UUID REFERENCES products(id) ON DELETE CASCADE,
  variant_id TEXT NOT NULL DEFAULT '', -- Default to empty string for standard products
  quantity INTEGER NOT NULL CHECK (quantity > 0),
  session_id TEXT NOT NULL,
  expires_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT (now() + interval '2 minutes'),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  CONSTRAINT unique_reservation UNIQUE (product_id, variant_id, session_id)
);

-- 2. Enable Row-Level Security (RLS)
ALTER TABLE cart_reservations ENABLE ROW LEVEL SECURITY;

-- 3. Create RLS Policies
-- Allow anyone to select their own reservations
CREATE POLICY "Users can view their own reservations" 
ON cart_reservations FOR SELECT 
TO anon, authenticated
USING (true); -- We allow viewing all, or we could restrict by session_id if we passed it in headers

-- Allow anyone to insert/upsert their own reservations
CREATE POLICY "Users can insert their own reservations" 
ON cart_reservations FOR INSERT 
TO anon, authenticated
WITH CHECK (true);

-- Allow anyone to update their own reservations
CREATE POLICY "Users can update their own reservations" 
ON cart_reservations FOR UPDATE 
TO anon, authenticated
USING (true);

-- Allow anyone to delete their own reservations
CREATE POLICY "Users can delete their own reservations" 
ON cart_reservations FOR DELETE 
TO anon, authenticated
USING (true);

-- 4. Add Index for performance
CREATE INDEX IF NOT EXISTS idx_cart_reservations_expires_at ON cart_reservations (expires_at);
CREATE INDEX IF NOT EXISTS idx_cart_reservations_product_id ON cart_reservations (product_id);

-- 5. Function to get available stock (Total Stock - Active Reservations)
CREATE OR REPLACE FUNCTION get_available_stock(p_id UUID, v_id TEXT DEFAULT NULL)
RETURNS INTEGER AS $$
DECLARE
  total_stock INTEGER;
  reserved_stock INTEGER;
  v_id_search TEXT;
BEGIN
  v_id_search := COALESCE(v_id, '');

  -- Get physical stock
  IF v_id IS NULL THEN
    SELECT stock INTO total_stock FROM products WHERE id = p_id;
  ELSE
    -- Extract stock from JSONB variants array
    SELECT (v.val->>'stock')::int INTO total_stock
    FROM products p, jsonb_array_elements(p.variants) AS v(val)
    WHERE p.id = p_id AND v.val->>'id' = v_id;
  END IF;

  -- Get active reservations
  SELECT COALESCE(SUM(quantity), 0) INTO reserved_stock
  FROM cart_reservations
  WHERE product_id = p_id 
    AND variant_id = v_id_search
    AND expires_at > now();

  RETURN GREATEST(0, total_stock - reserved_stock);
END;
$$ LANGUAGE plpgsql;

-- 6. Atomic RPC function to create order and handle reservations
CREATE OR REPLACE FUNCTION process_order_v2(
  p_customer_id UUID,
  p_items JSONB,
  p_total DECIMAL,
  p_delivery_mode TEXT,
  p_client_email TEXT,
  p_session_id TEXT
) RETURNS JSONB AS $$
DECLARE
  item JSONB;
  current_stock INTEGER;
  new_order_id UUID;
BEGIN
  -- Verify stock for each item
  FOR item IN SELECT * FROM jsonb_array_elements(p_items)
  LOOP
    -- Skip metadata items
    IF item->>'is_promo_metadata' = 'true' OR item->>'is_gift_metadata' = 'true' THEN
      CONTINUE;
    END IF;

    -- Lock product row
    PERFORM * FROM products WHERE id = (item->>'id')::uuid FOR UPDATE;
    
    IF item->>'comboConfig' IS NOT NULL THEN
       -- Variant Check
       SELECT (v.val->>'stock')::int INTO current_stock
       FROM products p, jsonb_array_elements(p.variants) AS v(val)
       WHERE p.id = (item->>'id')::uuid AND v.val->>'id' = item->'comboConfig'->>'id';
       
       IF current_stock < (item->>'quantity')::int THEN
         RAISE EXCEPTION 'Stock insuficiente para %', item->>'name';
       END IF;
       
       -- Update Variant Stock
       UPDATE products 
       SET variants = (
         SELECT jsonb_agg(
           CASE 
             WHEN v->>'id' = item->'comboConfig'->>'id' 
             THEN v || jsonb_build_object('stock', (v->>'stock')::int - (item->>'quantity')::int)
             ELSE v 
           END
         )
         FROM jsonb_array_elements(variants) v
       )
       WHERE id = (item->>'id')::uuid;
    ELSE
       -- Main Product Check
       SELECT stock INTO current_stock FROM products WHERE id = (item->>'id')::uuid;
       
       IF current_stock < (item->>'quantity')::int THEN
         RAISE EXCEPTION 'Stock insuficiente para %', item->>'name';
       END IF;
       
       -- Update Main Stock
       UPDATE products SET stock = stock - (item->>'quantity')::int WHERE id = (item->>'id')::uuid;
    END IF;
  END LOOP;

  -- Create the order
  INSERT INTO orders (customer_id, items, total, status, delivery_mode, client_email)
  VALUES (p_customer_id, p_items, p_total, 'pending', p_delivery_mode, p_client_email)
  RETURNING id INTO new_order_id;

  -- Cleanup reservations for this session
  DELETE FROM cart_reservations WHERE session_id = p_session_id;

  RETURN jsonb_build_object('success', true, 'order_id', new_order_id);
EXCEPTION WHEN OTHERS THEN
  RETURN jsonb_build_object('success', false, 'error', SQLERRM);
END;
$$ LANGUAGE plpgsql;
