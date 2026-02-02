-- Test invoice generation process
-- Run this in Supabase SQL Editor

-- Test 1: Check if we can fetch subjects with required columns
SELECT id, code, name, total_cost
FROM subjects 
WHERE is_active = true
LIMIT 3;

-- Test 2: Check if student_invoices table exists and is accessible
SELECT COUNT(*) as invoice_count
FROM student_invoices;

-- Test 3: Check if invoice_items table exists and is accessible
SELECT COUNT(*) as items_count
FROM invoice_items;

-- Test 4: Test creating a sample invoice
INSERT INTO student_invoices (student_id, semester_id, department_id, total_amount, status)
VALUES (
    'ST259570',
    (SELECT id FROM semesters WHERE is_active = true LIMIT 1),
    (SELECT id FROM departments LIMIT 1),
    1000.00,
    'pending'
)
RETURNING id, student_id, total_amount, status;

-- Test 5: Test creating invoice items
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
LIMIT 2
RETURNING *;
