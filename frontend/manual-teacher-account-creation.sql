-- Manual Teacher Account Creation Script
-- Use this if the automatic creation doesn't work

-- Step 1: Create the auth user manually
-- Replace 'teacher.email@university.edu' with the actual teacher email
-- Replace 'Teacher Full Name' with the actual teacher name

INSERT INTO auth.users (
  id,
  instance_id,
  email,
  encrypted_password,
  email_confirmed_at,
  created_at,
  updated_at,
  raw_app_meta_data,
  raw_user_meta_data,
  is_super_admin,
  role
) VALUES (
  gen_random_uuid(),
  '00000000-0000-0000-0000-000000000000',
  'teacher.email@university.edu', -- CHANGE THIS
  crypt('teacher123', gen_salt('bf')),
  now(),
  now(),
  now(),
  '{"provider": "email", "providers": ["email"]}',
  '{"full_name": "Teacher Full Name", "role": "teacher"}', -- CHANGE THIS
  false,
  'authenticated'
);

-- Step 2: Link the teacher record to the auth user
-- Replace 'teacher-record-id' with the actual teacher ID from the teachers table
-- Replace 'teacher.email@university.edu' with the same email used above

UPDATE public.teachers 
SET auth_user_id = (
  SELECT id FROM auth.users WHERE email = 'teacher.email@university.edu' -- CHANGE THIS
)
WHERE id = 'teacher-record-id'; -- CHANGE THIS to the teacher's ID

-- Step 3: Verify the linking worked
SELECT 
  t.id as teacher_id,
  t.name as teacher_name,
  t.email as teacher_email,
  t.auth_user_id,
  u.email as auth_email
FROM public.teachers t
LEFT JOIN auth.users u ON t.auth_user_id = u.id
WHERE t.email = 'teacher.email@university.edu'; -- CHANGE THIS

-- Step 4: Test login credentials
-- Email: teacher.email@university.edu (the email you used)
-- Password: teacher123

-- ============================================================================
-- EXAMPLE: Creating a specific teacher account
-- ============================================================================

-- Example for Dr. Ahmed Mohammed
/*
INSERT INTO auth.users (
  id,
  instance_id,
  email,
  encrypted_password,
  email_confirmed_at,
  created_at,
  updated_at,
  raw_app_meta_data,
  raw_user_meta_data,
  is_super_admin,
  role
) VALUES (
  gen_random_uuid(),
  '00000000-0000-0000-0000-000000000000',
  'ahmed.mohammed@university.edu',
  crypt('teacher123', gen_salt('bf')),
  now(),
  now(),
  now(),
  '{"provider": "email", "providers": ["email"]}',
  '{"full_name": "د. أحمد محمد", "role": "teacher"}',
  false,
  'authenticated'
);

UPDATE public.teachers 
SET auth_user_id = (
  SELECT id FROM auth.users WHERE email = 'ahmed.mohammed@university.edu'
)
WHERE email = 'ahmed.mohammed@university.edu';
*/

-- ============================================================================
-- TROUBLESHOOTING
-- ============================================================================

-- Check if teacher exists in database
SELECT id, name, email, auth_user_id FROM public.teachers WHERE email = 'teacher.email@university.edu';

-- Check if auth user exists
SELECT id, email, created_at FROM auth.users WHERE email = 'teacher.email@university.edu';

-- Check if they are linked
SELECT 
  t.name,
  t.email,
  CASE 
    WHEN t.auth_user_id IS NOT NULL THEN 'Linked'
    ELSE 'Not Linked'
  END as status
FROM public.teachers t
WHERE t.email = 'teacher.email@university.edu';
