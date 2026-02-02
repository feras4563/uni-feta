-- Fix invoice_items table to match API expectations
-- Run this in Supabase SQL Editor

-- Drop and recreate invoice_items table with correct columns
DROP TABLE IF EXISTS invoice_items CASCADE;

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

-- Insert sample data for testing
INSERT INTO invoice_items (invoice_id, subject_id, description, quantity, unit_price, total_cost)
SELECT 
    si.id,
    s.id,
    s.code || ' - ' || s.name,
    1,
    s.total_cost,
    s.total_cost
FROM student_invoices si
CROSS JOIN subjects s
WHERE si.student_id = 'ST259570'
LIMIT 2;

SELECT 'SUCCESS: invoice_items table fixed with correct columns!' as result;
