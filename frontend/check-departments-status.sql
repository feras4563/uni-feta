-- Check current status of departments table and constraints
-- Run this first to see what's already in place

-- 1. Check if head_teacher_id column exists
SELECT column_name, data_type, is_nullable, column_default
FROM information_schema.columns
WHERE table_schema = 'public'
AND table_name = 'departments'
AND column_name IN ('head', 'head_teacher_id')
ORDER BY ordinal_position;

-- 2. Check existing constraints on departments table
SELECT 
  conname as constraint_name,
  contype as constraint_type,
  pg_get_constraintdef(oid) as constraint_definition
FROM pg_constraint 
WHERE conrelid = 'departments'::regclass
AND conname LIKE '%head%';

-- 3. Check if foreign key constraint exists
SELECT 
  tc.constraint_name,
  tc.table_name,
  kcu.column_name,
  ccu.table_name AS foreign_table_name,
  ccu.column_name AS foreign_column_name
FROM information_schema.table_constraints AS tc
JOIN information_schema.key_column_usage AS kcu
  ON tc.constraint_name = kcu.constraint_name
  AND tc.table_schema = kcu.table_schema
JOIN information_schema.constraint_column_usage AS ccu
  ON ccu.constraint_name = tc.constraint_name
  AND ccu.table_schema = tc.table_schema
WHERE tc.constraint_type = 'FOREIGN KEY'
AND tc.table_name = 'departments'
AND kcu.column_name = 'head_teacher_id';

-- 4. Show current departments data
SELECT 
  id,
  name,
  head as old_head_name,
  head_teacher_id,
  CASE 
    WHEN head_teacher_id IS NOT NULL THEN 
      (SELECT name FROM teachers WHERE id = departments.head_teacher_id)
    ELSE 'No teacher linked'
  END as head_teacher_name
FROM departments
ORDER BY name;


