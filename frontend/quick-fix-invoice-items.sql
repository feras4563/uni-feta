-- Quick fix: Add missing columns to existing invoice_items table
-- Run this in Supabase SQL Editor

-- Add missing columns to invoice_items
ALTER TABLE invoice_items 
ADD COLUMN IF NOT EXISTS description TEXT;

ALTER TABLE invoice_items 
ADD COLUMN IF NOT EXISTS quantity INTEGER DEFAULT 1;

ALTER TABLE invoice_items 
ADD COLUMN IF NOT EXISTS unit_price DECIMAL(10,2) DEFAULT 0;

-- Disable RLS for testing
ALTER TABLE invoice_items DISABLE ROW LEVEL SECURITY;

SELECT 'SUCCESS: Missing columns added to invoice_items!' as result;
