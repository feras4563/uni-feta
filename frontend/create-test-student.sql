-- Quick script to create a test student
-- Run this in Supabase SQL Editor

-- First, get a department ID
SELECT 'Available Departments:' as info;
SELECT id, name FROM departments LIMIT 5;

-- Create a test student (replace 'DEPT_MANAGEMENT' with actual department ID)
INSERT INTO students (
  name,
  name_en,
  email,
  phone,
  department_id,
  status,
  national_id_passport
) VALUES (
  'أحمد محمد',
  'Ahmed Mohammed',
  'ahmed.test@university.edu',
  '0501234567',
  'DEPT_MANAGEMENT', -- Replace with actual department ID
  'active',
  '1234567890'
);

-- Verify the student was created
SELECT 'Created Student:' as info;
SELECT id, name, email, department_id, status 
FROM students 
WHERE email = 'ahmed.test@university.edu';











