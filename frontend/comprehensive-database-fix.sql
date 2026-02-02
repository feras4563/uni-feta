-- Comprehensive fix for all database issues
-- Run this in Supabase SQL Editor

-- ======================================================================
-- 1. CREATE/FIX student_subject_enrollments TABLE
-- ======================================================================

-- Drop and recreate the table to ensure clean structure
DROP TABLE IF EXISTS student_subject_enrollments CASCADE;

CREATE TABLE student_subject_enrollments (
    id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
    student_id TEXT NOT NULL,
    subject_id TEXT NOT NULL,
    semester_id TEXT,
    department_id TEXT,
    subject_cost DECIMAL(10,2) DEFAULT 0,
    status TEXT DEFAULT 'enrolled',
    payment_status TEXT DEFAULT 'unpaid',
    enrollment_date TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ======================================================================
-- 2. CREATE/FIX student_invoices TABLE
-- ======================================================================

-- Drop and recreate the table to ensure clean structure
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
-- 3. CREATE/FIX invoice_items TABLE
-- ======================================================================

-- Drop and recreate the table to ensure clean structure
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
-- 4. ADD FOREIGN KEY CONSTRAINTS
-- ======================================================================

-- student_subject_enrollments foreign keys
ALTER TABLE student_subject_enrollments 
ADD CONSTRAINT student_subject_enrollments_student_id_fkey 
FOREIGN KEY (student_id) REFERENCES students(id);

ALTER TABLE student_subject_enrollments 
ADD CONSTRAINT student_subject_enrollments_subject_id_fkey 
FOREIGN KEY (subject_id) REFERENCES subjects(id);

ALTER TABLE student_subject_enrollments 
ADD CONSTRAINT student_subject_enrollments_semester_id_fkey 
FOREIGN KEY (semester_id) REFERENCES semesters(id);

ALTER TABLE student_subject_enrollments 
ADD CONSTRAINT student_subject_enrollments_department_id_fkey 
FOREIGN KEY (department_id) REFERENCES departments(id);

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
-- 5. DISABLE RLS FOR TESTING
-- ======================================================================

ALTER TABLE student_subject_enrollments DISABLE ROW LEVEL SECURITY;
ALTER TABLE student_invoices DISABLE ROW LEVEL SECURITY;
ALTER TABLE invoice_items DISABLE ROW LEVEL SECURITY;

-- ======================================================================
-- 6. INSERT SAMPLE DATA FOR TESTING
-- ======================================================================

-- Insert sample enrollment data
INSERT INTO student_subject_enrollments (student_id, subject_id, semester_id, department_id, subject_cost, status, payment_status)
SELECT 
    'ST259570',
    s.id,
    sem.id,
    s.department_id,
    s.total_cost,
    'enrolled',
    'unpaid'
FROM subjects s
CROSS JOIN semesters sem
WHERE s.is_active = true
LIMIT 3;

-- Insert sample invoice data
INSERT INTO student_invoices (student_id, semester_id, department_id, invoice_number, total_amount, status, payment_status)
SELECT 
    'ST259570',
    sem.id,
    d.id,
    'INV-' || EXTRACT(YEAR FROM NOW()) || '-' || LPAD(EXTRACT(DOY FROM NOW())::text, 3, '0') || '-' || LPAD((SELECT COUNT(*) + 1 FROM student_invoices)::text, 4, '0'),
    (SELECT SUM(total_cost) FROM subjects WHERE is_active = true LIMIT 3),
    'unpaid',
    'unpaid'
FROM semesters sem
CROSS JOIN departments d
WHERE sem.is_active = true
LIMIT 1;

-- ======================================================================
-- SUCCESS MESSAGE
-- ======================================================================

SELECT 'SUCCESS: All database tables created and fixed!' as result;
