-- Check the structure of teachers_with_departments view
-- This will help us understand what fields are available

-- Check if the view exists and its structure
SELECT column_name, data_type, is_nullable
FROM information_schema.columns
WHERE table_schema = 'public'
AND table_name = 'teachers_with_departments'
ORDER BY ordinal_position;

-- Check if is_active field exists in the view
SELECT 
  CASE 
    WHEN EXISTS (
      SELECT 1 FROM information_schema.columns 
      WHERE table_schema = 'public' 
      AND table_name = 'teachers_with_departments' 
      AND column_name = 'is_active'
    ) THEN 'is_active field EXISTS in view'
    ELSE 'is_active field MISSING from view'
  END as field_status;

-- Show sample data from the view
SELECT 
  id,
  name,
  name_en,
  is_active,
  created_at
FROM teachers_with_departments
LIMIT 5;

-- Check the base teachers table structure
SELECT column_name, data_type, is_nullable
FROM information_schema.columns
WHERE table_schema = 'public'
AND table_name = 'teachers'
AND column_name IN ('id', 'name', 'name_en', 'is_active')
ORDER BY ordinal_position;


