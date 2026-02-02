-- Fix teacher_subjects table structure
-- This script ensures the teacher_subjects table has the correct structure

-- Drop and recreate the table with the correct structure
DROP TABLE IF EXISTS teacher_subjects CASCADE;

CREATE TABLE teacher_subjects (
    id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
    teacher_id TEXT NOT NULL REFERENCES teachers(id) ON DELETE CASCADE,
    subject_id TEXT NOT NULL REFERENCES subjects(id) ON DELETE CASCADE,
    department_id TEXT NOT NULL REFERENCES departments(id) ON DELETE CASCADE,
    
    -- Academic period
    academic_year VARCHAR(20) NOT NULL,
    semester VARCHAR(20) NOT NULL CHECK (semester IN ('fall', 'spring', 'summer')),
    
    -- Assignment details
    is_primary_teacher BOOLEAN DEFAULT true, -- Main teacher for this subject
    can_edit_grades BOOLEAN DEFAULT true,
    can_take_attendance BOOLEAN DEFAULT true,
    
    -- Status
    is_active BOOLEAN DEFAULT true,
    start_date DATE DEFAULT CURRENT_DATE,
    end_date DATE,
    
    -- Metadata
    notes TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    
    -- Prevent duplicate assignments
    UNIQUE(teacher_id, subject_id, academic_year, semester)
);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_teacher_subjects_teacher_id ON teacher_subjects(teacher_id);
CREATE INDEX IF NOT EXISTS idx_teacher_subjects_subject_id ON teacher_subjects(subject_id);
CREATE INDEX IF NOT EXISTS idx_teacher_subjects_active ON teacher_subjects(is_active);

-- Enable RLS
ALTER TABLE teacher_subjects ENABLE ROW LEVEL SECURITY;

-- Create RLS policies
DROP POLICY IF EXISTS "Anyone can view teacher subjects" ON teacher_subjects;
CREATE POLICY "Anyone can view teacher subjects" ON teacher_subjects
    FOR SELECT USING (true);

DROP POLICY IF EXISTS "Authenticated users can insert teacher subjects" ON teacher_subjects;
CREATE POLICY "Authenticated users can insert teacher subjects" ON teacher_subjects
    FOR INSERT WITH CHECK (true);

DROP POLICY IF EXISTS "Authenticated users can update teacher subjects" ON teacher_subjects;
CREATE POLICY "Authenticated users can update teacher subjects" ON teacher_subjects
    FOR UPDATE USING (true);

DROP POLICY IF EXISTS "Authenticated users can delete teacher subjects" ON teacher_subjects;
CREATE POLICY "Authenticated users can delete teacher subjects" ON teacher_subjects
    FOR DELETE USING (true);

-- Create trigger for updated_at
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

DROP TRIGGER IF EXISTS update_teacher_subjects_updated_at ON teacher_subjects;
CREATE TRIGGER update_teacher_subjects_updated_at 
    BEFORE UPDATE ON teacher_subjects 
    FOR EACH ROW 
    EXECUTE FUNCTION update_updated_at_column();

-- Verify table creation
SELECT 'teacher_subjects table created successfully' as status;


