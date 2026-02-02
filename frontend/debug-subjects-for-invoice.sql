-- Debug subjects fetching for invoice generation
-- Run this in Supabase SQL Editor

-- Check if subjects table has the required columns
SELECT column_name, data_type, is_nullable
FROM information_schema.columns 
WHERE table_name = 'subjects' 
AND column_name IN ('id', 'code', 'name', 'total_cost')
ORDER BY column_name;

-- Check sample subjects data
SELECT id, code, name, total_cost, is_active
FROM subjects 
WHERE is_active = true
LIMIT 5;

-- Check if invoice_items table exists and has correct structure
SELECT column_name, data_type, is_nullable
FROM information_schema.columns 
WHERE table_name = 'invoice_items'
ORDER BY column_name;

-- Check if student_invoices table exists
SELECT column_name, data_type, is_nullable
FROM information_schema.columns 
WHERE table_name = 'student_invoices'
ORDER BY column_name;
