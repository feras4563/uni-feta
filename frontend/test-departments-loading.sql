-- Test script to check if departments are loading correctly
-- Run this to verify the departments table structure and data

-- 1. Check if departments table exists and has data
SELECT 
  'Departments table check' as test_name,
  COUNT(*) as total_departments
FROM departments;

-- 2. Show all departments with their current structure
SELECT 
  id,
  name,
  name_en,
  head,
  head_teacher_id,
  is_locked,
  created_at
FROM departments
ORDER BY name;

-- 3. Check if head_teacher_id column exists
SELECT 
  'head_teacher_id column check' as test_name,
  CASE 
    WHEN EXISTS (
      SELECT 1 FROM information_schema.columns 
      WHERE table_schema = 'public' 
      AND table_name = 'departments' 
      AND column_name = 'head_teacher_id'
    ) THEN 'EXISTS' 
    ELSE 'MISSING' 
  END as column_status;

-- 4. Check foreign key constraint
SELECT 
  'Foreign key constraint check' as test_name,
  CASE 
    WHEN EXISTS (
      SELECT 1 FROM information_schema.table_constraints 
      WHERE constraint_name = 'fk_departments_head_teacher'
      AND table_name = 'departments'
    ) THEN 'EXISTS' 
    ELSE 'MISSING' 
  END as constraint_status;

-- 5. Test a simple query that should work
SELECT 
  'Simple query test' as test_name,
  id,
  name,
  head_teacher_id
FROM departments
LIMIT 3;


