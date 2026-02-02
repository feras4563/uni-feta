-- Step-by-step migration for teacher_subjects table
-- Run these commands one by one to avoid issues

-- Step 1: Check current table structure
SELECT 'Current table structure:' as step;
SELECT column_name, data_type, is_nullable 
FROM information_schema.columns 
WHERE table_name = 'teacher_subjects' 
ORDER BY ordinal_position;

-- Step 2: Remove NOT NULL constraints from old columns (if they exist)
SELECT 'Removing NOT NULL constraints...' as step;
ALTER TABLE teacher_subjects 
ALTER COLUMN academic_year DROP NOT NULL;

ALTER TABLE teacher_subjects 
ALTER COLUMN semester DROP NOT NULL;

-- Step 3: Add new columns (if they don't exist)
SELECT 'Adding new columns...' as step;
ALTER TABLE teacher_subjects 
ADD COLUMN IF NOT EXISTS study_year_id TEXT;

ALTER TABLE teacher_subjects 
ADD COLUMN IF NOT EXISTS semester_id TEXT;

-- Step 4: Add foreign key constraints (if the referenced tables exist)
SELECT 'Adding foreign key constraints...' as step;
DO $$
BEGIN
    -- Check if study_years table exists
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'study_years') THEN
        ALTER TABLE teacher_subjects 
        ADD CONSTRAINT fk_teacher_subjects_study_year 
        FOREIGN KEY (study_year_id) REFERENCES study_years(id) ON DELETE CASCADE;
    END IF;
    
    -- Check if semesters table exists
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'semesters') THEN
        ALTER TABLE teacher_subjects 
        ADD CONSTRAINT fk_teacher_subjects_semester 
        FOREIGN KEY (semester_id) REFERENCES semesters(id) ON DELETE CASCADE;
    END IF;
EXCEPTION
    WHEN duplicate_object THEN
        -- Constraints already exist, ignore
        NULL;
END $$;

-- Step 5: Create indexes
SELECT 'Creating indexes...' as step;
CREATE INDEX IF NOT EXISTS idx_teacher_subjects_study_year ON teacher_subjects(study_year_id);
CREATE INDEX IF NOT EXISTS idx_teacher_subjects_semester ON teacher_subjects(semester_id);

-- Step 6: Show final structure
SELECT 'Final table structure:' as step;
SELECT column_name, data_type, is_nullable 
FROM information_schema.columns 
WHERE table_name = 'teacher_subjects' 
ORDER BY ordinal_position;

SELECT 'Migration completed successfully!' as status;


