-- Setup Manager User Script
-- Run this in Supabase SQL Editor to create a manager user

-- 1. First, check if you have any users in auth.users
SELECT email, id FROM auth.users LIMIT 5;

-- 2. Create a manager user in auth.users (if you don't have one)
-- Replace 'your-email@example.com' with your actual email
INSERT INTO auth.users (
    instance_id,
    id,
    aud,
    role,
    email,
    encrypted_password,
    email_confirmed_at,
    recovery_sent_at,
    last_sign_in_at,
    raw_app_meta_data,
    raw_user_meta_data,
    created_at,
    updated_at,
    confirmation_token,
    email_change,
    email_change_token_new,
    recovery_token
) VALUES (
    '00000000-0000-0000-0000-000000000000',
    gen_random_uuid(),
    'authenticated',
    'authenticated',
    'manager@university.edu', -- Change this to your email
    crypt('password123', gen_salt('bf')), -- Change this password
    NOW(),
    NOW(),
    NOW(),
    '{"provider": "email", "providers": ["email"]}',
    '{}',
    NOW(),
    NOW(),
    '',
    '',
    '',
    ''
) ON CONFLICT (email) DO NOTHING;

-- 3. Create the manager user in app_users table
INSERT INTO app_users (
    auth_user_id,
    email,
    full_name,
    role,
    status
)
SELECT 
    id,
    email,
    'مدير النظام',
    'manager',
    'active'
FROM auth.users 
WHERE email = 'manager@university.edu' -- Change this to your email
ON CONFLICT (auth_user_id) DO UPDATE SET
    role = 'manager',
    full_name = 'مدير النظام',
    status = 'active';

-- 4. Verify the user was created
SELECT 
    au.email,
    au.full_name,
    au.role,
    au.status,
    au.created_at
FROM app_users au
WHERE au.email = 'manager@university.edu'; -- Change this to your email

-- 5. Alternative: Update existing user to manager role
-- If you already have a user account, you can just update their role:
-- UPDATE app_users 
-- SET role = 'manager', full_name = 'مدير النظام'
-- WHERE email = 'your-email@example.com';

SELECT 'Manager user setup completed!' as status;


