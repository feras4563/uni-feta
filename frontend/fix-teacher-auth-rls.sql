-- Fix RLS policies for teacher authentication
-- Run this in Supabase SQL Editor if you're still having issues

-- 1. Check current RLS policies on teachers table
SELECT schemaname, tablename, policyname, permissive, roles, cmd, qual 
FROM pg_policies 
WHERE tablename = 'teachers';

-- 2. Temporarily disable RLS on teachers table for testing
ALTER TABLE public.teachers DISABLE ROW LEVEL SECURITY;

-- 3. Or create a more permissive policy for authenticated users
DROP POLICY IF EXISTS "Teachers can view their own data" ON public.teachers;
CREATE POLICY "Teachers can view their own data" ON public.teachers
  FOR SELECT TO authenticated
  USING (true); -- Allow all authenticated users to read teachers table

-- 4. Also check departments table RLS
ALTER TABLE public.departments DISABLE ROW LEVEL SECURITY;

-- 5. If you want to re-enable RLS later with proper policies:
-- ALTER TABLE public.teachers ENABLE ROW LEVEL SECURITY;
-- CREATE POLICY "Teachers can view their own data" ON public.teachers
--   FOR SELECT TO authenticated
--   USING (auth_user_id = auth.uid() OR auth.jwt() ->> 'role' = 'manager');

-- 6. Verify the teachers table has the auth_user_id column
SELECT column_name, data_type, is_nullable 
FROM information_schema.columns 
WHERE table_name = 'teachers' AND table_schema = 'public';

-- 7. Check if there are any teachers with auth_user_id set
SELECT id, name, email, auth_user_id 
FROM public.teachers 
WHERE auth_user_id IS NOT NULL;

-- 8. If auth_user_id column doesn't exist, add it
ALTER TABLE public.teachers ADD COLUMN IF NOT EXISTS auth_user_id UUID REFERENCES auth.users(id);

-- 9. Create index for better performance
CREATE INDEX IF NOT EXISTS idx_teachers_auth_user_id ON public.teachers(auth_user_id);
