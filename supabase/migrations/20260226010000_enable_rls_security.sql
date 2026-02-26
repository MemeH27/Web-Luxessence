-- Security Improvements: Enable Row Level Security (RLS)
-- This migration enables RLS on all tables and creates appropriate policies

-- Enable RLS on all tables
ALTER TABLE public.categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.products ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.customers ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.sales ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.payments ENABLE ROW LEVEL SECURITY;

-- Create policies for public read access ( storefront )
-- Categories: Everyone can read
CREATE POLICY "Allow public read categories" ON public.categories
    FOR SELECT USING (true);

-- Products: Everyone can read (for storefront)
CREATE POLICY "Allow public read products" ON public.products
    FOR SELECT USING (true);

-- Customers: Only authenticated users can read
CREATE POLICY "Allow authenticated read customers" ON public.customers
    FOR SELECT TO authenticated USING (true);

-- Orders: Only authenticated users can read
CREATE POLICY "Allow authenticated read orders" ON public.orders
    FOR SELECT TO authenticated USING (true);

-- Sales: Only authenticated users can read
CREATE POLICY "Allow authenticated read sales" ON public.sales
    FOR SELECT TO authenticated USING (true);

-- Payments: Only authenticated users can read
CREATE POLICY "Allow authenticated read payments" ON public.payments
    FOR SELECT TO authenticated USING (true);

-- Create policies for authenticated write access (admin only)
-- Note: In a production app, you'd want more granular policies

-- Categories: Only authenticated can insert/update/delete
CREATE POLICY "Allow authenticated manage categories" ON public.categories
    FOR ALL TO authenticated USING (true)
    WITH CHECK (auth.role() = 'authenticated');

-- Products: Only authenticated can insert/update/delete
CREATE POLICY "Allow authenticated manage products" ON public.products
    FOR ALL TO authenticated USING (true)
    WITH CHECK (auth.role() = 'authenticated');

-- Customers: Only authenticated can insert/update/delete
CREATE POLICY "Allow authenticated manage customers" ON public.customers
    FOR ALL TO authenticated USING (true)
    WITH CHECK (auth.role() = 'authenticated');

-- Orders: Only authenticated can insert/update/delete
CREATE POLICY "Allow authenticated manage orders" ON public.orders
    FOR ALL TO authenticated USING (true)
    WITH CHECK (auth.role() = 'authenticated');

-- Sales: Only authenticated can insert/update/delete
CREATE POLICY "Allow authenticated manage sales" ON public.sales
    FOR ALL TO authenticated USING (true)
    WITH CHECK (auth.role() = 'authenticated');

-- Payments: Only authenticated can insert/update/delete
CREATE POLICY "Allow authenticated manage payments" ON public.payments
    FOR ALL TO authenticated USING (true)
    WITH CHECK (auth.role() = 'authenticated');

-- Create index for better query performance
CREATE INDEX IF NOT EXISTS idx_products_category ON public.products(category_id);
CREATE INDEX IF NOT EXISTS idx_products_name ON public.products(name);
CREATE INDEX IF NOT EXISTS idx_orders_customer ON public.orders(customer_id);
CREATE INDEX IF NOT EXISTS idx_orders_status ON public.orders(status);
CREATE INDEX IF NOT EXISTS idx_sales_date ON public.sales(created_at);
CREATE INDEX IF NOT EXISTS idx_payments_sale ON public.payments(sale_id);
