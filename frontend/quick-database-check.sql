-- Quick check to see what's in the current database
-- Run this in Supabase SQL editor to see the current state

-- Check what tables exist
SELECT table_name 
FROM information_schema.tables 
WHERE table_schema = 'public' 
AND table_type = 'BASE TABLE'
ORDER BY table_name;

-- Check students table structure (if it exists)
SELECT column_name, data_type, is_nullable
FROM information_schema.columns 
WHERE table_name = 'students' 
AND table_schema = 'public'
ORDER BY ordinal_position;

-- Check if we have any data
SELECT COUNT(*) as student_count FROM students;
SELECT COUNT(*) as department_count FROM departments;

