-- Migration: Add semester_count column to departments table
-- This migration adds a field to specify how many semesters each department has

-- Add semester_count column to departments table
ALTER TABLE departments ADD COLUMN IF NOT EXISTS semester_count INTEGER DEFAULT 2;

-- Add constraint to ensure semester_count is positive
ALTER TABLE departments ADD CONSTRAINT check_semester_count_positive 
    CHECK (semester_count > 0 AND semester_count <= 10);

-- Update existing departments to have default semester count of 2
UPDATE departments SET semester_count = 2 WHERE semester_count IS NULL;

-- Create index for better performance
CREATE INDEX IF NOT EXISTS idx_departments_semester_count ON departments(semester_count);

-- Verify the changes
SELECT 'Semester count column added to departments table successfully' as status;
SELECT column_name, data_type, is_nullable, column_default 
FROM information_schema.columns 
WHERE table_name = 'departments' AND column_name = 'semester_count';
