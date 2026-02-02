-- Test script to verify teachers are available for department head selection
-- Run this in Supabase SQL Editor to check if teachers exist and are active

-- Check if teachers table exists and has data
SELECT 
  COUNT(*) as total_teachers,
  COUNT(CASE WHEN is_active = true THEN 1 END) as active_teachers
FROM teachers;

-- Show all active teachers
SELECT 
  id,
  name,
  name_en,
  is_active,
  created_at
FROM teachers 
WHERE is_active = true
ORDER BY name;

-- Check departments table structure
SELECT column_name, data_type, is_nullable, column_default
FROM information_schema.columns
WHERE table_schema = 'public'
AND table_name = 'departments'
ORDER BY ordinal_position;

-- Show current departments
SELECT 
  id,
  name,
  head,
  head_teacher_id,
  is_locked
FROM departments
ORDER BY name;
