-- Minimal fix for student_subject_enrollments table
-- Run this in Supabase SQL Editor

-- Create table if it doesn't exist
CREATE TABLE IF NOT EXISTS student_subject_enrollments (
    id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
    student_id TEXT NOT NULL,
    subject_id TEXT NOT NULL,
    semester_id TEXT,
    department_id TEXT,
    subject_cost DECIMAL(10,2) DEFAULT 0,
    status TEXT DEFAULT 'enrolled',
    payment_status TEXT DEFAULT 'unpaid',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Add missing columns
ALTER TABLE student_subject_enrollments 
ADD COLUMN IF NOT EXISTS department_id TEXT;

ALTER TABLE student_subject_enrollments 
ADD COLUMN IF NOT EXISTS subject_cost DECIMAL(10,2) DEFAULT 0;

ALTER TABLE student_subject_enrollments 
ADD COLUMN IF NOT EXISTS status TEXT DEFAULT 'enrolled';

ALTER TABLE student_subject_enrollments 
ADD COLUMN IF NOT EXISTS payment_status TEXT DEFAULT 'unpaid';

-- Update existing records with department_id
UPDATE student_subject_enrollments 
SET department_id = s.department_id
FROM subjects s
WHERE student_subject_enrollments.subject_id = s.id
AND student_subject_enrollments.department_id IS NULL;

-- Disable RLS for testing
ALTER TABLE student_subject_enrollments DISABLE ROW LEVEL SECURITY;
