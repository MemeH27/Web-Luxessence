-- Security Fix: Enforce Admin-Only Write Policies
-- This migration updates RLS policies to only allow admin email to write

-- Drop existing permissive policies
DROP POLICY IF EXISTS "Allow authenticated manage categories" ON public.categories;
DROP POLICY IF EXISTS "Allow authenticated manage products" ON public.products;
DROP POLICY IF EXISTS "Allow authenticated manage customers" ON public.customers;
DROP POLICY IF EXISTS "Allow authenticated manage orders" ON public.orders;
DROP POLICY IF EXISTS "Allow authenticated manage sales" ON public.sales;
DROP POLICY IF EXISTS "Allow authenticated manage payments" ON public.payments;

-- Create strict admin-only write policies
-- Categories: Only admin can insert/update/delete
CREATE POLICY "Allow admin manage categories" ON public.categories
    FOR ALL TO authenticated 
    USING (current_user_is_admin() = true)
    WITH CHECK (current_user_is_admin() = true);

-- Products: Only admin can insert/update/delete
CREATE POLICY "Allow admin manage products" ON public.products
    FOR ALL TO authenticated 
    USING (current_user_is_admin() = true)
    WITH CHECK (current_user_is_admin() = true);

-- Customers: Only admin can insert/update/delete
CREATE POLICY "Allow admin manage customers" ON public.customers
    FOR ALL TO authenticated 
    USING (current_user_is_admin() = true)
    WITH CHECK (current_user_is_admin() = true);

-- Orders: Only admin can insert/update/delete
CREATE POLICY "Allow admin manage orders" ON public.orders
    FOR ALL TO authenticated 
    USING (current_user_is_admin() = true)
    WITH CHECK (current_user_is_admin() = true);

-- Sales: Only admin can insert/update/delete
CREATE POLICY "Allow admin manage sales" ON public.sales
    FOR ALL TO authenticated 
    USING (current_user_is_admin() = true)
    WITH CHECK (current_user_is_admin() = true);

-- Payments: Only admin can insert/update/delete
CREATE POLICY "Allow admin manage payments" ON public.payments
    FOR ALL TO authenticated 
    USING (current_user_is_admin() = true)
    WITH CHECK (current_user_is_admin() = true);
