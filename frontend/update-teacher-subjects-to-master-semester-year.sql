-- Update teacher_subjects table to link to master semester and year tables
-- This migration updates the teacher_subjects table to use proper foreign keys

-- First, let's check if we have the required tables
DO $$
BEGIN
    -- Check if study_years table exists
    IF NOT EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'study_years') THEN
        RAISE EXCEPTION 'study_years table does not exist. Please create it first.';
    END IF;
    
    -- Check if semesters table exists
    IF NOT EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'semesters') THEN
        RAISE EXCEPTION 'semesters table does not exist. Please create it first.';
    END IF;
END $$;

-- Add new columns to teacher_subjects table
ALTER TABLE teacher_subjects 
ADD COLUMN IF NOT EXISTS study_year_id TEXT REFERENCES study_years(id) ON DELETE CASCADE,
ADD COLUMN IF NOT EXISTS semester_id TEXT REFERENCES semesters(id) ON DELETE CASCADE;

-- Create indexes for the new foreign key columns
CREATE INDEX IF NOT EXISTS idx_teacher_subjects_study_year ON teacher_subjects(study_year_id);
CREATE INDEX IF NOT EXISTS idx_teacher_subjects_semester ON teacher_subjects(semester_id);

-- Update existing records to link to master tables
-- This will try to match existing academic_year and semester values with the master tables

-- Update study_year_id based on academic_year field
UPDATE teacher_subjects 
SET study_year_id = sy.id
FROM study_years sy
WHERE teacher_subjects.academic_year = sy.name
AND teacher_subjects.study_year_id IS NULL;

-- Update semester_id based on semester field
-- Map the old semester values to the new semester table
UPDATE teacher_subjects 
SET semester_id = s.id
FROM semesters s
JOIN study_years sy ON s.study_year_id = sy.id
WHERE teacher_subjects.semester = CASE 
    WHEN s.name ILIKE '%خريف%' OR s.name ILIKE '%fall%' OR s.code ILIKE '%F%' THEN 'fall'
    WHEN s.name ILIKE '%ربيع%' OR s.name ILIKE '%spring%' OR s.code ILIKE '%S%' THEN 'spring'
    WHEN s.name ILIKE '%صيف%' OR s.name ILIKE '%summer%' OR s.code ILIKE '%U%' THEN 'summer'
    ELSE teacher_subjects.semester
END
AND teacher_subjects.study_year_id = sy.id
AND teacher_subjects.semester_id IS NULL;

-- For any remaining records that couldn't be matched, try to use current year/semester
UPDATE teacher_subjects 
SET study_year_id = (
    SELECT id FROM study_years WHERE is_current = true LIMIT 1
)
WHERE study_year_id IS NULL;

UPDATE teacher_subjects 
SET semester_id = (
    SELECT id FROM semesters WHERE is_current = true LIMIT 1
)
WHERE semester_id IS NULL;

-- Make the new columns NOT NULL after populating them
ALTER TABLE teacher_subjects 
ALTER COLUMN study_year_id SET NOT NULL,
ALTER COLUMN semester_id SET NOT NULL;

-- Remove NOT NULL constraint from old columns to allow NULL values
ALTER TABLE teacher_subjects 
ALTER COLUMN academic_year DROP NOT NULL,
ALTER COLUMN semester DROP NOT NULL;

-- Update the unique constraint to use the new foreign keys
ALTER TABLE teacher_subjects 
DROP CONSTRAINT IF EXISTS teacher_subjects_teacher_id_subject_id_academic_year_semester_key;

ALTER TABLE teacher_subjects 
ADD CONSTRAINT teacher_subjects_unique_assignment 
UNIQUE(teacher_id, subject_id, study_year_id, semester_id);

-- Add comments to document the changes
COMMENT ON COLUMN teacher_subjects.study_year_id IS 'Foreign key to study_years table - replaces academic_year field';
COMMENT ON COLUMN teacher_subjects.semester_id IS 'Foreign key to semesters table - replaces semester field';
COMMENT ON COLUMN teacher_subjects.academic_year IS 'DEPRECATED: Use study_year_id instead';
COMMENT ON COLUMN teacher_subjects.semester IS 'DEPRECATED: Use semester_id instead';

-- Create a view for backward compatibility
CREATE OR REPLACE VIEW teacher_subjects_with_master_data AS
SELECT 
    ts.*,
    sy.name as academic_year_name,
    sy.name_en as academic_year_name_en,
    s.name as semester_name,
    s.name_en as semester_name_en,
    s.code as semester_code
FROM teacher_subjects ts
JOIN study_years sy ON ts.study_year_id = sy.id
JOIN semesters s ON ts.semester_id = s.id;

-- Update RLS policies if they exist
DO $$
BEGIN
    -- Drop existing policies
    DROP POLICY IF EXISTS "Anyone can view teacher subjects" ON teacher_subjects;
    DROP POLICY IF EXISTS "Authenticated users can insert teacher subjects" ON teacher_subjects;
    DROP POLICY IF EXISTS "Authenticated users can update teacher subjects" ON teacher_subjects;
    DROP POLICY IF EXISTS "Authenticated users can delete teacher subjects" ON teacher_subjects;
    
    -- Create new policies
    CREATE POLICY "Anyone can view teacher subjects" ON teacher_subjects
        FOR SELECT USING (true);
    
    CREATE POLICY "Authenticated users can insert teacher subjects" ON teacher_subjects
        FOR INSERT WITH CHECK (true);
    
    CREATE POLICY "Authenticated users can update teacher subjects" ON teacher_subjects
        FOR UPDATE USING (true);
    
    CREATE POLICY "Authenticated users can delete teacher subjects" ON teacher_subjects
        FOR DELETE USING (true);
EXCEPTION
    WHEN OTHERS THEN
        -- RLS might not be enabled, ignore errors
        NULL;
END $$;

-- Display summary
SELECT 
    'Migration completed successfully' as status,
    COUNT(*) as total_teacher_subjects,
    COUNT(study_year_id) as linked_to_study_years,
    COUNT(semester_id) as linked_to_semesters
FROM teacher_subjects;
