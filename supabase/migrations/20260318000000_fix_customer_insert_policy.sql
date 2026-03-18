-- ==============================================================================
-- ADD CUSTOMER INSERT POLICY
-- Date: 2026-03-18
-- ==============================================================================
-- Allows guests and authenticated users to create customer records during checkout.
-- Fixes RLS row violation on "customers" table.
-- ==============================================================================

CREATE POLICY "Public Insert Customers" ON public.customers
    FOR INSERT TO anon, authenticated, authenticator, dashboard_user 
    WITH CHECK (
        (SELECT auth.role()) IS NOT NULL
    );
