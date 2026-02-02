-- ==============================================
-- DEBUG SUPABASE CONNECTION AND RLS POLICIES
-- This script helps debug why API queries return 0 results
-- ==============================================

-- Test 1: Check current user and role
SELECT 'Test 1: Check current user and role' as test;
SELECT 
  current_user,
  current_role,
  session_user,
  user;

-- Test 2: Check RLS status on student_invoices table
SELECT 'Test 2: Check RLS status' as test;
SELECT 
  schemaname,
  tablename,
  rowsecurity
FROM pg_tables 
WHERE tablename = 'student_invoices';

-- Test 2b: Check RLS status using pg_class
SELECT 'Test 2b: Check RLS from pg_class' as test;
SELECT 
  c.relname as table_name,
  c.relrowsecurity as rls_enabled,
  c.relforcerowsecurity as rls_forced
FROM pg_class c
JOIN pg_namespace n ON n.oid = c.relnamespace
WHERE c.relname = 'student_invoices' 
  AND n.nspname = 'public';

-- Test 3: Check RLS policies on student_invoices
SELECT 'Test 3: Check RLS policies' as test;
SELECT 
  schemaname,
  tablename,
  policyname,
  permissive,
  roles,
  cmd,
  qual,
  with_check
FROM pg_policies 
WHERE tablename = 'student_invoices'
ORDER BY policyname;

-- Test 4: Test direct query without any joins
SELECT 'Test 4: Direct query test' as test;
SELECT COUNT(*) as invoice_count FROM student_invoices;

-- Test 5: Test with explicit schema
SELECT 'Test 5: Explicit schema test' as test;
SELECT COUNT(*) as invoice_count FROM public.student_invoices;

-- Test 6: Check if we can see the data
SELECT 'Test 6: Check data visibility' as test;
SELECT 
  id,
  invoice_number,
  student_id,
  total_amount,
  status
FROM student_invoices
LIMIT 3;

-- Test 7: Check auth context
SELECT 'Test 7: Check auth context' as test;
SELECT 
  auth.uid() as auth_uid,
  auth.role() as auth_role,
  auth.jwt() as auth_jwt;

-- Test 8: Test with different roles
SELECT 'Test 8: Test role permissions' as test;
-- This will show what roles can access the data
SELECT 
  r.rolname as role_name,
  has_table_privilege(r.rolname, 'student_invoices', 'SELECT') as can_select,
  has_table_privilege(r.rolname, 'student_invoices', 'INSERT') as can_insert,
  has_table_privilege(r.rolname, 'student_invoices', 'UPDATE') as can_update,
  has_table_privilege(r.rolname, 'student_invoices', 'DELETE') as can_delete
FROM pg_roles r
WHERE r.rolname IN ('authenticated', 'anon', 'postgres', 'service_role')
ORDER BY r.rolname;

-- Test 9: Check table permissions for current user
SELECT 'Test 9: Check table permissions' as test;
SELECT 
  has_table_privilege('student_invoices', 'SELECT') as can_select,
  has_table_privilege('student_invoices', 'INSERT') as can_insert,
  has_table_privilege('student_invoices', 'UPDATE') as can_update,
  has_table_privilege('student_invoices', 'DELETE') as can_delete;

-- Test 10: Check if RLS is causing the issue
SELECT 'Test 10: Test RLS bypass' as test;
-- This should work if RLS is the issue
SET row_security = off;
SELECT COUNT(*) as invoice_count_without_rls FROM student_invoices;
SET row_security = on;

-- Final summary
SELECT 'Supabase connection debug completed!' as final_status;
