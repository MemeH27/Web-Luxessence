-- ==============================================================================
-- SUPABASE STORAGE POLICIES FIX
-- Migration: Ensure categories, settings, and products buckets have correct RLS
-- Date: 2026-03-03
-- ==============================================================================

-- 1. Create buckets if they don't exist (using storage.buckets table)
-- Note: 'categories', 'settings', 'products'
INSERT INTO storage.buckets (id, name, public)
VALUES ('categories', 'categories', true)
ON CONFLICT (id) DO UPDATE SET public = true;

INSERT INTO storage.buckets (id, name, public)
VALUES ('settings', 'settings', true)
ON CONFLICT (id) DO UPDATE SET public = true;

INSERT INTO storage.buckets (id, name, public)
VALUES ('products', 'products', true)
ON CONFLICT (id) DO UPDATE SET public = true;

-- 2. Enable RLS on storage.objects if not already (Supabase does this by default usually)
ALTER TABLE storage.objects ENABLE ROW LEVEL SECURITY;

-- 3. Consolidated Storage Policies for Luxessence
-- We allow public read for everyone (since public=true bucket doesn't strictly need it but good to be explicit)
-- We allow full access to authenticated admins for these specific buckets

-- DROP OLD POLICIES
DROP POLICY IF EXISTS "Public Read Categories" ON storage.objects;
DROP POLICY IF EXISTS "Admin Upload Categories" ON storage.objects;
DROP POLICY IF EXISTS "Public Read Settings" ON storage.objects;
DROP POLICY IF EXISTS "Admin Upload Settings" ON storage.objects;
DROP POLICY IF EXISTS "Public Read Products" ON storage.objects;
DROP POLICY IF EXISTS "Admin Upload Products" ON storage.objects;

-- CATEGORIES BUCKET
CREATE POLICY "Public Read Categories" ON storage.objects
    FOR SELECT TO public
    USING (bucket_id = 'categories');

CREATE POLICY "Admin Upload Categories" ON storage.objects
    FOR ALL TO authenticated
    USING (bucket_id = 'categories' AND (SELECT auth.jwt()->>'email') = 'luxessence504@gmail.com')
    WITH CHECK (bucket_id = 'categories' AND (SELECT auth.jwt()->>'email') = 'luxessence504@gmail.com');

-- SETTINGS BUCKET
CREATE POLICY "Public Read Settings" ON storage.objects
    FOR SELECT TO public
    USING (bucket_id = 'settings');

CREATE POLICY "Admin Upload Settings" ON storage.objects
    FOR ALL TO authenticated
    USING (bucket_id = 'settings' AND (SELECT auth.jwt()->>'email') = 'luxessence504@gmail.com')
    WITH CHECK (bucket_id = 'settings' AND (SELECT auth.jwt()->>'email') = 'luxessence504@gmail.com');

-- PRODUCTS BUCKET
CREATE POLICY "Public Read Products" ON storage.objects
    FOR SELECT TO public
    USING (bucket_id = 'products');

CREATE POLICY "Admin Upload Products" ON storage.objects
    FOR ALL TO authenticated
    USING (bucket_id = 'products' AND (SELECT auth.jwt()->>'email') = 'luxessence504@gmail.com')
    WITH CHECK (bucket_id = 'products' AND (SELECT auth.jwt()->>'email') = 'luxessence504@gmail.com');
