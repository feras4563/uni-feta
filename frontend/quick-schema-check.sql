-- Quick check of your existing table ID types
-- Run this first to see what types your tables actually use

SELECT 
    table_name,
    column_name,
    data_type,
    character_maximum_length
FROM information_schema.columns 
WHERE table_schema = 'public' 
  AND table_name IN ('students', 'teachers', 'departments', 'subjects', 'semesters', 'study_years')
  AND column_name = 'id'
ORDER BY table_name;
