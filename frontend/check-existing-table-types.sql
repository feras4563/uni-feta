-- Check existing table ID types
SELECT 
    table_name,
    column_name,
    data_type,
    is_nullable
FROM information_schema.columns 
WHERE table_schema = 'public' 
  AND table_name IN ('students', 'teachers', 'departments', 'subjects', 'semesters', 'study_years')
  AND column_name = 'id'
ORDER BY table_name;

-- Also check if rooms table already exists
SELECT 
    table_name,
    column_name,
    data_type,
    is_nullable
FROM information_schema.columns 
WHERE table_schema = 'public' 
  AND table_name = 'rooms'
  AND column_name = 'id';
