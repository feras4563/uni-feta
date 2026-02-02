-- Safe migration script that handles existing constraints
-- This script will work even if some parts were already run

-- Step 1: Add head_teacher_id column if it doesn't exist
DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_schema = 'public' 
        AND table_name = 'departments' 
        AND column_name = 'head_teacher_id'
    ) THEN
        ALTER TABLE departments ADD COLUMN head_teacher_id TEXT;
        RAISE NOTICE 'Added head_teacher_id column';
    ELSE
        RAISE NOTICE 'head_teacher_id column already exists';
    END IF;
END $$;

-- Step 2: Drop existing foreign key constraint if it exists, then recreate it
DO $$ 
BEGIN
    -- Drop the constraint if it exists
    IF EXISTS (
        SELECT 1 FROM information_schema.table_constraints 
        WHERE constraint_name = 'fk_departments_head_teacher'
        AND table_name = 'departments'
    ) THEN
        ALTER TABLE departments DROP CONSTRAINT fk_departments_head_teacher;
        RAISE NOTICE 'Dropped existing fk_departments_head_teacher constraint';
    END IF;
    
    -- Add the constraint
    ALTER TABLE departments 
    ADD CONSTRAINT fk_departments_head_teacher 
    FOREIGN KEY (head_teacher_id) REFERENCES teachers(id) ON DELETE SET NULL;
    RAISE NOTICE 'Added fk_departments_head_teacher constraint';
END $$;

-- Step 3: Create index if it doesn't exist
CREATE INDEX IF NOT EXISTS idx_departments_head_teacher_id ON departments(head_teacher_id);

-- Step 4: Verify the final state
SELECT 
  'Migration completed successfully!' as status,
  COUNT(*) as total_departments,
  COUNT(head_teacher_id) as departments_with_head_teacher
FROM departments;

-- Show the final table structure
SELECT column_name, data_type, is_nullable, column_default
FROM information_schema.columns
WHERE table_schema = 'public'
AND table_name = 'departments'
AND column_name IN ('head', 'head_teacher_id')
ORDER BY ordinal_position;


