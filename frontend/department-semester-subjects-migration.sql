-- Migration: Create department_semester_subjects table
-- This migration creates a junction table for managing subjects within department semesters

-- Create department_semester_subjects table
CREATE TABLE IF NOT EXISTS department_semester_subjects (
    id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
    department_id TEXT NOT NULL REFERENCES departments(id) ON DELETE CASCADE,
    semester_id TEXT NOT NULL REFERENCES semesters(id) ON DELETE CASCADE,
    subject_id TEXT NOT NULL REFERENCES subjects(id) ON DELETE CASCADE,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    
    -- Ensure unique combination of department, semester, and subject
    UNIQUE(department_id, semester_id, subject_id)
);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_department_semester_subjects_department ON department_semester_subjects(department_id);
CREATE INDEX IF NOT EXISTS idx_department_semester_subjects_semester ON department_semester_subjects(semester_id);
CREATE INDEX IF NOT EXISTS idx_department_semester_subjects_subject ON department_semester_subjects(subject_id);
CREATE INDEX IF NOT EXISTS idx_department_semester_subjects_active ON department_semester_subjects(is_active) WHERE is_active = true;

-- Create updated_at trigger
CREATE TRIGGER update_department_semester_subjects_updated_at 
    BEFORE UPDATE ON department_semester_subjects 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Enable Row Level Security
ALTER TABLE department_semester_subjects ENABLE ROW LEVEL SECURITY;

-- Create RLS policies
CREATE POLICY "Anyone can view department semester subjects" ON department_semester_subjects
    FOR SELECT USING (true);

CREATE POLICY "Authenticated users can insert department semester subjects" ON department_semester_subjects
    FOR INSERT WITH CHECK (auth.role() = 'authenticated');

CREATE POLICY "Authenticated users can update department semester subjects" ON department_semester_subjects
    FOR UPDATE USING (auth.role() = 'authenticated');

CREATE POLICY "Authenticated users can delete department semester subjects" ON department_semester_subjects
    FOR DELETE USING (auth.role() = 'authenticated');

-- Verify the table was created successfully
SELECT 'Department semester subjects table created successfully' as status;
SELECT table_name FROM information_schema.tables WHERE table_name = 'department_semester_subjects';

