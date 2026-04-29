-- ==============================================================================
-- ADD CUSTOMER UPDATE POLICY
-- Date: 2026-04-29
-- ==============================================================================
-- Allows guests and authenticated users to update their customer records during checkout.
-- Fixes RLS row violation on "customers" table when using upsert.
-- ==============================================================================

CREATE POLICY "Public Update Customers" ON public.customers
    FOR UPDATE TO anon, authenticated, authenticator, dashboard_user 
    USING (
        (SELECT auth.role()) IS NOT NULL
    )
    WITH CHECK (
        (SELECT auth.role()) IS NOT NULL
    );
