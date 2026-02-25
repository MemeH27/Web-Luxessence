-- 1. Categories
CREATE TABLE categories (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT NOT NULL,
  slug TEXT UNIQUE NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 2. Products
CREATE TABLE products (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT NOT NULL,
  description TEXT,
  price DECIMAL(10,2) NOT NULL,
  cost DECIMAL(10,2) NOT NULL,
  stock INTEGER DEFAULT 0,
  category_id UUID REFERENCES categories(id) ON DELETE SET NULL,
  image_url TEXT,
  is_new_arrival BOOLEAN DEFAULT false,
  is_gift_option BOOLEAN DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 3. Customers
CREATE TABLE customers (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  first_name TEXT NOT NULL,
  last_name TEXT NOT NULL,
  phone TEXT UNIQUE NOT NULL, -- Format: +504 XXXX-XXXX
  address TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 4. Orders (Pending orders from storefront)
CREATE TABLE orders (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  customer_id UUID REFERENCES customers(id),
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'processed', 'cancelled')),
  total DECIMAL(10,2) NOT NULL,
  items JSONB NOT NULL, -- [{product_id, name, quantity, price}]
  delivery_mode TEXT DEFAULT 'domicilio',
  client_email TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 5. Sales (Finalized sales with detailed billing info)
CREATE TABLE sales (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  order_id UUID REFERENCES orders(id),
  customer_id UUID REFERENCES customers(id),
  total DECIMAL(10,2) NOT NULL,
  discount DECIMAL(10,2) DEFAULT 0,
  payment_method TEXT CHECK (payment_method IN ('Contado', 'Crédito')),
  is_paid BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Indices for better performance
CREATE INDEX idx_products_category ON products(category_id);
CREATE INDEX idx_orders_customer ON orders(customer_id);
CREATE INDEX idx_sales_customer ON sales(customer_id);

-- Enable RLS (Optional, for now we assume simple setup for the user)
-- ALTER TABLE products ENABLE ROW LEVEL SECURITY;
-- ... and so on for other tables. Untuk saat ini, user bisa mematikan RLS untuk kemudahan development awal.
