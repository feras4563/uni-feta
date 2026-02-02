-- Fix both student_invoices and invoice_items tables
-- Run this in Supabase SQL Editor

-- ======================================================================
-- 1. FIX student_invoices TABLE
-- ======================================================================

-- Drop and recreate student_invoices with correct structure
DROP TABLE IF EXISTS student_invoices CASCADE;

CREATE TABLE student_invoices (
    id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
    student_id TEXT NOT NULL,
    semester_id TEXT,
    department_id TEXT,
    invoice_number TEXT UNIQUE,
    invoice_date TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    due_date TIMESTAMP WITH TIME ZONE,
    total_amount DECIMAL(10,2) DEFAULT 0,
    paid_amount DECIMAL(10,2) DEFAULT 0,
    remaining_amount DECIMAL(10,2) DEFAULT 0,
    status TEXT DEFAULT 'unpaid',
    payment_status TEXT DEFAULT 'unpaid',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ======================================================================
-- 2. FIX invoice_items TABLE
-- ======================================================================

-- Drop and recreate invoice_items with correct structure
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

-- ======================================================================
-- 3. ADD FOREIGN KEY CONSTRAINTS
-- ======================================================================

-- student_invoices foreign keys
ALTER TABLE student_invoices 
ADD CONSTRAINT student_invoices_student_id_fkey 
FOREIGN KEY (student_id) REFERENCES students(id);

ALTER TABLE student_invoices 
ADD CONSTRAINT student_invoices_semester_id_fkey 
FOREIGN KEY (semester_id) REFERENCES semesters(id);

ALTER TABLE student_invoices 
ADD CONSTRAINT student_invoices_department_id_fkey 
FOREIGN KEY (department_id) REFERENCES departments(id);

-- invoice_items foreign keys
ALTER TABLE invoice_items 
ADD CONSTRAINT invoice_items_invoice_id_fkey 
FOREIGN KEY (invoice_id) REFERENCES student_invoices(id) ON DELETE CASCADE;

ALTER TABLE invoice_items 
ADD CONSTRAINT invoice_items_subject_id_fkey 
FOREIGN KEY (subject_id) REFERENCES subjects(id);

-- ======================================================================
-- 4. DISABLE RLS FOR TESTING
-- ======================================================================

ALTER TABLE student_invoices DISABLE ROW LEVEL SECURITY;
ALTER TABLE invoice_items DISABLE ROW LEVEL SECURITY;

-- ======================================================================
-- 5. INSERT SAMPLE DATA FOR TESTING
-- ======================================================================

-- Insert sample invoice
INSERT INTO student_invoices (student_id, semester_id, department_id, total_amount, status, payment_status)
SELECT 
    'ST259570',
    sem.id,
    d.id,
    1000.00,
    'pending',
    'unpaid'
FROM semesters sem
CROSS JOIN departments d
WHERE sem.is_active = true
LIMIT 1
RETURNING id;

-- Insert sample invoice items
WITH new_invoice AS (
    SELECT id FROM student_invoices 
    WHERE student_id = 'ST259570' 
    ORDER BY created_at DESC 
    LIMIT 1
)
INSERT INTO invoice_items (invoice_id, subject_id, description, quantity, unit_price, total_cost)
SELECT 
    ni.id,
    s.id,
    s.code || ' - ' || s.name,
    1,
    s.total_cost,
    s.total_cost
FROM new_invoice ni
CROSS JOIN subjects s
WHERE s.is_active = true
LIMIT 2;

-- ======================================================================
-- 6. VERIFY STRUCTURE
-- ======================================================================

-- Check student_invoices structure
SELECT 'student_invoices structure:' as table_name;
SELECT column_name, data_type, is_nullable
FROM information_schema.columns 
WHERE table_name = 'student_invoices'
ORDER BY column_name;

-- Check invoice_items structure
SELECT 'invoice_items structure:' as table_name;
SELECT column_name, data_type, is_nullable
FROM information_schema.columns 
WHERE table_name = 'invoice_items'
ORDER BY column_name;

SELECT 'SUCCESS: Both invoice tables fixed with correct schemas!' as result;
