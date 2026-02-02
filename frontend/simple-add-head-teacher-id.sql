-- Simple migration to add head_teacher_id field to departments table
-- This is a minimal version that just adds the field without data migration

-- Step 1: Add the new column
ALTER TABLE departments 
ADD COLUMN IF NOT EXISTS head_teacher_id TEXT;

-- Step 2: Add foreign key constraint
ALTER TABLE departments 
ADD CONSTRAINT fk_departments_head_teacher 
FOREIGN KEY (head_teacher_id) REFERENCES teachers(id) ON DELETE SET NULL;

-- Step 3: Create index for performance
CREATE INDEX IF NOT EXISTS idx_departments_head_teacher_id ON departments(head_teacher_id);

-- Step 4: Verify the changes
SELECT column_name, data_type, is_nullable, column_default
FROM information_schema.columns
WHERE table_schema = 'public'
AND table_name = 'departments'
AND column_name IN ('head', 'head_teacher_id')
ORDER BY ordinal_position;

-- Show current departments with their head information
SELECT 
  d.id,
  d.name,
  d.head as old_head_name,
  d.head_teacher_id,
  t.name as head_teacher_name
FROM departments d
LEFT JOIN teachers t ON d.head_teacher_id = t.id;


