-- Fix invoice_items table with wrong schema
-- Run this in Supabase SQL Editor

-- The invoice_items table has the wrong schema (it has student_invoices columns)
-- We need to recreate it with the correct structure

-- Drop the incorrectly structured invoice_items table
DROP TABLE IF EXISTS invoice_items CASCADE;

-- Create invoice_items table with correct structure
CREATE TABLE invoice_items (
    id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
    invoice_id TEXT NOT NULL,
    subject_id TEXT NOT NULL,
    description TEXT,
    quantity INTEGER DEFAULT 1,
    unit_price DECIMAL(10,2) DEFAULT 0,
    total_cost DECIMAL(10,2) DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Add foreign key constraints
ALTER TABLE invoice_items 
ADD CONSTRAINT invoice_items_invoice_id_fkey 
FOREIGN KEY (invoice_id) REFERENCES student_invoices(id) ON DELETE CASCADE;

ALTER TABLE invoice_items 
ADD CONSTRAINT invoice_items_subject_id_fkey 
FOREIGN KEY (subject_id) REFERENCES subjects(id);

-- Disable RLS for testing
ALTER TABLE invoice_items DISABLE ROW LEVEL SECURITY;

-- Verify the new structure
SELECT column_name, data_type, is_nullable
FROM information_schema.columns 
WHERE table_name = 'invoice_items'
ORDER BY column_name;

SELECT 'SUCCESS: invoice_items table recreated with correct schema!' as result;
