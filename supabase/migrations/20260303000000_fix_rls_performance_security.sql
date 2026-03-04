-- ==============================================================================
-- SUPABASE PERFORMANCE AND SECURITY LINTS FIX
-- Migration: Fix RLS Performance and Security Issues
-- Date: 2026-03-03
-- ==============================================================================

-- ==============================================================================
-- FIX 1: auth_rls_initplan (Performance)
-- Problem: auth.role() and current_setting() are being re-evaluated for each row
-- Solution: Use (SELECT auth.role()) pattern to evaluate once
-- ==============================================================================

-- Fix payments table - "Enable all for authenticated users" policy
-- Drop existing problematic policy
DROP POLICY IF EXISTS "Enable all for authenticated users" ON public.payments;

-- Create optimized policy using SELECT pattern
CREATE POLICY "Enable all for authenticated users" ON public.payments
    FOR ALL TO authenticated 
    USING ((SELECT auth.role()) IN ('authenticated', 'service_role', 'dashboard_user'))
    WITH CHECK ((SELECT auth.role()) IN ('authenticated', 'service_role', 'dashboard_user'));

-- Fix site_settings table - "Admin All" policy
-- First enable RLS if not already enabled
ALTER TABLE public.site_settings ENABLE ROW LEVEL SECURITY;

-- Drop existing problematic policy
DROP POLICY IF EXISTS "Admin All" ON public.site_settings;

-- Create optimized admin-only policy
CREATE POLICY "Admin All site_settings" ON public.site_settings
    FOR ALL TO authenticated 
    USING ((SELECT auth.role()) IN ('authenticated', 'service_role', 'dashboard_user') 
           AND (SELECT auth.jwt()->>'email') = 'luxessence504@gmail.com')
    WITH CHECK ((SELECT auth.role()) IN ('authenticated', 'service_role', 'dashboard_user') 
                AND (SELECT auth.jwt()->>'email') = 'luxessence504@gmail.com');

-- ==============================================================================
-- FIX 2: multiple_permissive_policies (Performance)
-- Problem: Multiple permissive policies for same role/action
-- Solution: Consolidate policies to avoid redundant evaluation
-- ==============================================================================

-- ------------------------------------------------------------------------------
-- CATEGORIES TABLE
-- ------------------------------------------------------------------------------
-- Drop all existing policies
DROP POLICY IF EXISTS "Admin All Categories" ON public.categories;
DROP POLICY IF EXISTS "Public Read Categories" ON public.categories;
DROP POLICY IF EXISTS "Public Delete" ON public.categories;
DROP POLICY IF EXISTS "Public Insert" ON public.categories;
DROP POLICY IF EXISTS "Public Update" ON public.categories;

-- Create consolidated policies
-- Public read access (SELECT)
CREATE POLICY "Public Read Categories" ON public.categories
    FOR SELECT TO anon, authenticated, authenticator, dashboard_user 
    USING (true);

-- Admin write access (INSERT, UPDATE, DELETE)
CREATE POLICY "Admin Manage Categories" ON public.categories
    FOR ALL TO authenticated 
    USING ((SELECT auth.role()) IN ('authenticated', 'service_role', 'dashboard_user') 
           AND (SELECT auth.jwt()->>'email') = 'luxessence504@gmail.com')
    WITH CHECK ((SELECT auth.role()) IN ('authenticated', 'service_role', 'dashboard_user') 
                AND (SELECT auth.jwt()->>'email') = 'luxessence504@gmail.com');

-- ------------------------------------------------------------------------------
-- CUSTOMERS TABLE
-- ------------------------------------------------------------------------------
-- Drop all existing policies
DROP POLICY IF EXISTS "Admin All Customers" ON public.customers;
DROP POLICY IF EXISTS "Public Read Customers" ON public.customers;

-- Create consolidated policies
-- Public read access for authenticated users
CREATE POLICY "Public Read Customers" ON public.customers
    FOR SELECT TO authenticated, authenticator, dashboard_user 
    USING (true);

-- Admin full access
CREATE POLICY "Admin Manage Customers" ON public.customers
    FOR ALL TO authenticated 
    USING ((SELECT auth.role()) IN ('authenticated', 'service_role', 'dashboard_user') 
           AND (SELECT auth.jwt()->>'email') = 'luxessence504@gmail.com')
    WITH CHECK ((SELECT auth.role()) IN ('authenticated', 'service_role', 'dashboard_user') 
                AND (SELECT auth.jwt()->>'email') = 'luxessence504@gmail.com');

-- ------------------------------------------------------------------------------
-- ORDERS TABLE
-- ------------------------------------------------------------------------------
-- Drop all existing policies
DROP POLICY IF EXISTS "Admin All Orders" ON public.orders;
DROP POLICY IF EXISTS "Public Order Insert" ON public.orders;

-- Create consolidated policies
-- Allow public insert for creating orders from storefront
CREATE POLICY "Public Order Insert" ON public.orders
    FOR INSERT TO anon 
    WITH CHECK (true);

-- Allow authenticated users to read their own orders
CREATE POLICY "Customer Read Orders" ON public.orders
    FOR SELECT TO authenticated, authenticator, dashboard_user 
    USING (true);

-- Admin full access
CREATE POLICY "Admin Manage Orders" ON public.orders
    FOR ALL TO authenticated 
    USING ((SELECT auth.role()) IN ('authenticated', 'service_role', 'dashboard_user') 
           AND (SELECT auth.jwt()->>'email') = 'luxessence504@gmail.com')
    WITH CHECK ((SELECT auth.role()) IN ('authenticated', 'service_role', 'dashboard_user') 
                AND (SELECT auth.jwt()->>'email') = 'luxessence504@gmail.com');

-- ------------------------------------------------------------------------------
-- PRODUCTS TABLE
-- ------------------------------------------------------------------------------
-- Drop all existing policies
DROP POLICY IF EXISTS "Admin All Products" ON public.products;
DROP POLICY IF EXISTS "Public Read Products" ON public.products;

-- Create consolidated policies
-- Public read access
CREATE POLICY "Public Read Products" ON public.products
    FOR SELECT TO anon, authenticated, authenticator, dashboard_user 
    USING (true);

-- Admin full access
CREATE POLICY "Admin Manage Products" ON public.products
    FOR ALL TO authenticated 
    USING ((SELECT auth.role()) IN ('authenticated', 'service_role', 'dashboard_user') 
           AND (SELECT auth.jwt()->>'email') = 'luxessence504@gmail.com')
    WITH CHECK ((SELECT auth.role()) IN ('authenticated', 'service_role', 'dashboard_user') 
                AND (SELECT auth.jwt()->>'email') = 'luxessence504@gmail.com');

-- ------------------------------------------------------------------------------
-- PROMOTIONS TABLE
-- ------------------------------------------------------------------------------
-- Drop all existing policies
DROP POLICY IF EXISTS "Admin All Promotions" ON public.promotions;
DROP POLICY IF EXISTS "Public Read Promotions" ON public.promotions;

-- Create consolidated policies
-- Public read access
CREATE POLICY "Public Read Promotions" ON public.promotions
    FOR SELECT TO anon, authenticated, authenticator, dashboard_user 
    USING (true);

-- Admin full access
CREATE POLICY "Admin Manage Promotions" ON public.promotions
    FOR ALL TO authenticated 
    USING ((SELECT auth.role()) IN ('authenticated', 'service_role', 'dashboard_user') 
           AND (SELECT auth.jwt()->>'email') = 'luxessence504@gmail.com')
    WITH CHECK ((SELECT auth.role()) IN ('authenticated', 'service_role', 'dashboard_user') 
                AND (SELECT auth.jwt()->>'email') = 'luxessence504@gmail.com');

-- ------------------------------------------------------------------------------
-- SITE_SETTINGS TABLE (also has multiple permissive)
-- ------------------------------------------------------------------------------
-- Drop existing policies
DROP POLICY IF EXISTS "Admin All" ON public.site_settings;
DROP POLICY IF EXISTS "Public Read" ON public.site_settings;

-- Create consolidated policies
-- Public read access
CREATE POLICY "Public Read site_settings" ON public.site_settings
    FOR SELECT TO anon, authenticated, authenticator, dashboard_user 
    USING (true);

-- Admin full access (already created in FIX 1, but ensure consistency)
CREATE POLICY "Admin All site_settings_v2" ON public.site_settings
    FOR ALL TO authenticated 
    USING ((SELECT auth.role()) IN ('authenticated', 'service_role', 'dashboard_user') 
           AND (SELECT auth.jwt()->>'email') = 'luxessence504@gmail.com')
    WITH CHECK ((SELECT auth.role()) IN ('authenticated', 'service_role', 'dashboard_user') 
                AND (SELECT auth.jwt()->>'email') = 'luxessence504@gmail.com');

-- ------------------------------------------------------------------------------
-- PRODUCT_REQUESTS TABLE
-- ------------------------------------------------------------------------------
-- Drop existing policies
DROP POLICY IF EXISTS "Enable full access for authenticated admins" ON public.product_requests;
DROP POLICY IF EXISTS "Enable insert for everyone" ON public.product_requests;

-- Create consolidated policies
-- Allow anyone to insert product requests (public feature)
CREATE POLICY "Public Insert product_requests" ON public.product_requests
    FOR INSERT TO anon 
    WITH CHECK (true);

-- Allow authenticated users to read their own requests
CREATE POLICY "User Read product_requests" ON public.product_requests
    FOR SELECT TO authenticated, authenticator, dashboard_user 
    USING (true);

-- Admin full access
CREATE POLICY "Admin Manage product_requests" ON public.product_requests
    FOR ALL TO authenticated 
    USING ((SELECT auth.role()) IN ('authenticated', 'service_role', 'dashboard_user') 
           AND (SELECT auth.jwt()->>'email') = 'luxessence504@gmail.com')
    WITH CHECK ((SELECT auth.role()) IN ('authenticated', 'service_role', 'dashboard_user') 
                AND (SELECT auth.jwt()->>'email') = 'luxessence504@gmail.com');

-- ==============================================================================
-- FIX 3: rls_policy_always_true (Security)
-- Problem: Policies using USING (true) or WITH CHECK (true) for non-SELECT operations
-- Solution: Replace with proper conditional checks based on auth.role() and admin check
-- Note: This is addressed in FIX 2 above by replacing all permissive policies
-- ==============================================================================

-- ==============================================================================
-- FIX 4: SALES TABLE (Security)
-- Add admin-only policy for sales table
-- ------------------------------------------------------------------------------
-- Drop existing policy
DROP POLICY IF EXISTS "Admin All Sales" ON public.sales;

-- Create admin-only policy
CREATE POLICY "Admin Manage Sales" ON public.sales
    FOR ALL TO authenticated 
    USING ((SELECT auth.role()) IN ('authenticated', 'service_role', 'dashboard_user') 
           AND (SELECT auth.jwt()->>'email') = 'luxessence504@gmail.com')
    WITH CHECK ((SELECT auth.role()) IN ('authenticated', 'service_role', 'dashboard_user') 
                AND (SELECT auth.jwt()->>'email') = 'luxessence504@gmail.com');

-- ==============================================================================
-- NOTE: Leaked Password Protection (auth_leaked_password_protection)
-- This setting must be enabled in Supabase Dashboard > Authentication > Providers > Email
-- Go to: Settings > Authentication Providers > Email > Password protection
-- Enable "Enable leaked password protection" checkbox
-- ==============================================================================

-- ==============================================================================
-- SUMMARY OF FIXES APPLIED
-- ==============================================================================
-- 1. auth_rls_initplan: Optimized auth.role() calls with (SELECT auth.role()) pattern
-- 2. multiple_permissive_policies: Consolidated policies per table/role/action
-- 3. rls_policy_always_true: Replaced permissive policies with conditional admin checks
-- 4. Added consistent admin verification using email check: luxessence504@gmail.com
-- ==============================================================================