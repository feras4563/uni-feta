-- ==============================================
-- QUICK DEBUG FOR INVOICE DISPLAY ISSUE
-- Run this first to quickly identify the problem
-- ==============================================

-- 1. Check if table exists and has data
SELECT 'Step 1: Check table and data' as step;
SELECT COUNT(*) as total_invoices FROM student_invoices;

-- 2. Check RLS status
SELECT 'Step 2: Check RLS status' as step;
SELECT 
  c.relname as table_name,
  c.relrowsecurity as rls_enabled,
  c.relforcerowsecurity as rls_forced
FROM pg_class c
JOIN pg_namespace n ON n.oid = c.relnamespace
WHERE c.relname = 'student_invoices' 
  AND n.nspname = 'public';

-- 3. Check RLS policies
SELECT 'Step 3: Check RLS policies' as step;
SELECT 
  policyname,
  permissive,
  roles,
  cmd
FROM pg_policies 
WHERE tablename = 'student_invoices';

-- 4. Check current user and auth
SELECT 'Step 4: Check auth context' as step;
SELECT 
  current_user,
  auth.uid() as auth_uid,
  auth.role() as auth_role;

-- 5. Test direct access
SELECT 'Step 5: Test direct access' as step;
SELECT 
  id,
  invoice_number,
  student_id,
  total_amount,
  status
FROM student_invoices
LIMIT 2;

-- 6. Test with RLS disabled (if possible)
SELECT 'Step 6: Test without RLS' as step;
-- Note: This might not work depending on permissions
SELECT COUNT(*) as count_without_rls FROM student_invoices;

-- Summary
SELECT 'Quick debug completed! Check the results above.' as summary;





