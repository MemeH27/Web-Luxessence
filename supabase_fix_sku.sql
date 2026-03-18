-- Ejecutar esto en tu consola de Supabase para arreglar el error de SKU
ALTER TABLE products ADD COLUMN IF NOT EXISTS sku TEXT;
CREATE UNIQUE INDEX IF NOT EXISTS products_sku_key ON products(sku) WHERE sku IS NOT NULL;
