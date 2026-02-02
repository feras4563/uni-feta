-- Simple script to just add the head_teacher_id column
-- Use this if you only need to add the column without constraints

-- Add the column if it doesn't exist
ALTER TABLE departments 
ADD COLUMN IF NOT EXISTS head_teacher_id TEXT;

-- Verify the column was added
SELECT column_name, data_type, is_nullable, column_default
FROM information_schema.columns
WHERE table_schema = 'public'
AND table_name = 'departments'
AND column_name = 'head_teacher_id';

-- Show current departments
SELECT 
  id,
  name,
  head as old_head_name,
  head_teacher_id
FROM departments
ORDER BY name;


