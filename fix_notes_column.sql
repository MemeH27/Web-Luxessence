-- Run this in your Supabase SQL Editor to fix the name display for guest users
-- This adds the missing 'notes' column to the 'orders' table
ALTER TABLE orders ADD COLUMN IF NOT EXISTS notes TEXT;
