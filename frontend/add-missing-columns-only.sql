-- Add missing columns to existing tables
-- Run this in Supabase SQL Editor

-- Add missing columns to student_subject_enrollments
ALTER TABLE student_subject_enrollments 
ADD COLUMN IF NOT EXISTS payment_status TEXT DEFAULT 'unpaid';

ALTER TABLE student_subject_enrollments 
ADD COLUMN IF NOT EXISTS enrollment_date TIMESTAMP WITH TIME ZONE DEFAULT NOW();

ALTER TABLE student_subject_enrollments 
ADD COLUMN IF NOT EXISTS department_id TEXT;

ALTER TABLE student_subject_enrollments 
ADD COLUMN IF NOT EXISTS subject_cost DECIMAL(10,2) DEFAULT 0;

ALTER TABLE student_subject_enrollments 
ADD COLUMN IF NOT EXISTS status TEXT DEFAULT 'enrolled';

-- Create student_invoices table if it doesn't exist
CREATE TABLE IF NOT EXISTS student_invoices (
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

-- Create invoice_items table if it doesn't exist
CREATE TABLE IF NOT EXISTS invoice_items (
    id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
    invoice_id TEXT NOT NULL,
    subject_id TEXT NOT NULL,
    subject_name TEXT,
    subject_code TEXT,
    credits INTEGER DEFAULT 0,
    cost_per_credit DECIMAL(10,2) DEFAULT 0,
    total_cost DECIMAL(10,2) DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Disable RLS for testing
ALTER TABLE student_subject_enrollments DISABLE ROW LEVEL SECURITY;
ALTER TABLE student_invoices DISABLE ROW LEVEL SECURITY;
ALTER TABLE invoice_items DISABLE ROW LEVEL SECURITY;
