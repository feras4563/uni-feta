-- Test script to verify department head functionality
-- Run this to check if everything is working correctly

-- 1. Check if head_teacher_id column exists and has data
SELECT 
  'head_teacher_id column exists' as check_name,
  CASE 
    WHEN EXISTS (
      SELECT 1 FROM information_schema.columns 
      WHERE table_schema = 'public' 
      AND table_name = 'departments' 
      AND column_name = 'head_teacher_id'
    ) THEN 'YES' 
    ELSE 'NO' 
  END as result;

-- 2. Check if there are active teachers available
SELECT 
  'Active teachers available' as check_name,
  COUNT(*) as result
FROM teachers 
WHERE is_active = true;

-- 3. Show active teachers for dropdown
SELECT 
  'Available teachers for department head' as info,
  id,
  name,
  name_en,
  is_active
FROM teachers 
WHERE is_active = true
ORDER BY name;

-- 4. Show current departments and their head teachers
SELECT 
  'Current departments and heads' as info,
  d.id,
  d.name,
  d.head as old_head_name,
  d.head_teacher_id,
  t.name as head_teacher_name,
  t.name_en as head_teacher_name_en
FROM departments d
LEFT JOIN teachers t ON d.head_teacher_id = t.id
ORDER BY d.name;

-- 5. Test foreign key constraint
SELECT 
  'Foreign key constraint exists' as check_name,
  CASE 
    WHEN EXISTS (
      SELECT 1 FROM information_schema.table_constraints 
      WHERE constraint_name = 'fk_departments_head_teacher'
      AND table_name = 'departments'
    ) THEN 'YES' 
    ELSE 'NO' 
  END as result;
