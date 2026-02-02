-- Quick script to create test student groups
-- Run this in Supabase SQL Editor to create some test groups

-- First, let's see what departments and semesters exist
SELECT 'Departments:' as info;
SELECT id, name FROM departments LIMIT 5;

SELECT 'Semesters:' as info;
SELECT id, name FROM semesters LIMIT 5;

-- Create some test groups (replace the IDs with actual ones from above)
INSERT INTO student_groups (
  group_name,
  department_id,
  semester_id,
  semester_number,
  max_students,
  current_students,
  description,
  is_active
) VALUES 
-- Replace 'DEPT_MANAGEMENT' and semester IDs with actual IDs from your database
('مجموعة الرياضيات - أ', 'DEPT_MANAGEMENT', (SELECT id FROM semesters LIMIT 1), 1, 30, 0, 'مجموعة الرياضيات الأساسية', true),
('مجموعة الرياضيات - ب', 'DEPT_MANAGEMENT', (SELECT id FROM semesters LIMIT 1), 1, 30, 0, 'مجموعة الرياضيات المتقدمة', true),
('مجموعة الفيزياء - أ', 'DEPT_MANAGEMENT', (SELECT id FROM semesters LIMIT 1), 1, 25, 0, 'مجموعة الفيزياء الأساسية', true),
('مجموعة الكيمياء - أ', 'DEPT_MANAGEMENT', (SELECT id FROM semesters LIMIT 1), 1, 25, 0, 'مجموعة الكيمياء الأساسية', true),
('مجموعة اللغة الإنجليزية - أ', 'DEPT_MANAGEMENT', (SELECT id FROM semesters LIMIT 1), 1, 20, 0, 'مجموعة اللغة الإنجليزية', true);

-- Verify the groups were created
SELECT 'Created Groups:' as info;
SELECT id, group_name, department_id, semester_id, max_students, current_students 
FROM student_groups 
ORDER BY created_at DESC 
LIMIT 10;











