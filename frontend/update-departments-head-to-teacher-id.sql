-- Update departments table to link head field to teachers table
-- This migration changes the 'head' field from a text field to a foreign key reference

-- Step 1: Add a new column for the teacher ID
ALTER TABLE departments 
ADD COLUMN head_teacher_id TEXT REFERENCES teachers(id) ON DELETE SET NULL;

-- Step 2: Create an index for the new foreign key
CREATE INDEX IF NOT EXISTS idx_departments_head_teacher_id ON departments(head_teacher_id);

-- Step 3: Update existing data (if any)
-- This will try to match existing head names with teacher names
-- Note: This is a basic matching - you may need to manually update some records
UPDATE departments 
SET head_teacher_id = (
  SELECT t.id 
  FROM teachers t 
  WHERE t.name = departments.head 
  LIMIT 1
)
WHERE departments.head IS NOT NULL AND departments.head != '';

-- Step 4: Add RLS policy for the new column (if RLS is enabled)
-- Note: This assumes RLS is already enabled on departments table
-- If not, you may need to enable it first

-- Step 5: Update the database schema documentation
-- The 'head' field will now store teacher ID instead of teacher name
-- You can optionally drop the old 'head' column after confirming everything works

-- Optional: Drop the old head column (uncomment after testing)
-- ALTER TABLE departments DROP COLUMN head;

-- Verify the changes
SELECT 
  d.id,
  d.name,
  d.head_teacher_id,
  t.name as head_teacher_name
FROM departments d
LEFT JOIN teachers t ON d.head_teacher_id = t.id;

-- Show the updated table structure
SELECT column_name, data_type, is_nullable, column_default
FROM information_schema.columns
WHERE table_schema = 'public'
AND table_name = 'departments'
ORDER BY ordinal_position;


