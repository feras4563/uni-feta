-- Fix Semester Structure: Make semesters generic numbers instead of year-specific
-- This allows semesters to be reused across different academic years

-- First, let's create a new simplified semesters table
CREATE TABLE IF NOT EXISTS semesters_new (
  id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::TEXT,
  semester_number INTEGER NOT NULL UNIQUE, -- 1, 2, 3, 4, etc.
  name TEXT NOT NULL, -- "الفصل الأول", "الفصل الثاني", etc.
  name_en TEXT, -- "First Semester", "Second Semester", etc.
  description TEXT,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Insert default semesters (1-8 to cover most programs)
INSERT INTO semesters_new (semester_number, name, name_en, description) VALUES
(1, 'الفصل الأول', 'First Semester', 'الفصل الدراسي الأول'),
(2, 'الفصل الثاني', 'Second Semester', 'الفصل الدراسي الثاني'),
(3, 'الفصل الثالث', 'Third Semester', 'الفصل الدراسي الثالث'),
(4, 'الفصل الرابع', 'Fourth Semester', 'الفصل الدراسي الرابع'),
(5, 'الفصل الخامس', 'Fifth Semester', 'الفصل الدراسي الخامس'),
(6, 'الفصل السادس', 'Sixth Semester', 'الفصل الدراسي السادس'),
(7, 'الفصل السابع', 'Seventh Semester', 'الفصل الدراسي السابع'),
(8, 'الفصل الثامن', 'Eighth Semester', 'الفصل الدراسي الثامن')
ON CONFLICT (semester_number) DO NOTHING;

-- Create RLS policies for semesters_new
ALTER TABLE semesters_new ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Allow all operations for authenticated users" ON semesters_new
FOR ALL USING (auth.role() = 'authenticated') WITH CHECK (auth.role() = 'authenticated');

-- Now let's update the department_semester_subjects table to use semester_number instead of semester_id
-- First, add the new column
ALTER TABLE department_semester_subjects 
ADD COLUMN IF NOT EXISTS semester_number INTEGER;

-- Update existing records to use semester numbers
-- This is a temporary mapping - you'll need to manually set the correct semester numbers
UPDATE department_semester_subjects 
SET semester_number = 1 
WHERE semester_id IN (SELECT id FROM semesters WHERE name LIKE '%fall%' OR name LIKE '%الفصل الأول%');

UPDATE department_semester_subjects 
SET semester_number = 2 
WHERE semester_id IN (SELECT id FROM semesters WHERE name LIKE '%spring%' OR name LIKE '%الفصل الثاني%');

-- Add more mappings as needed based on your existing data
-- You can check your existing semesters with:
-- SELECT DISTINCT semester_id, s.name FROM department_semester_subjects dss 
-- JOIN semesters s ON dss.semester_id = s.id;

-- Make semester_number NOT NULL after updating
ALTER TABLE department_semester_subjects 
ALTER COLUMN semester_number SET NOT NULL;

-- Add unique constraint on (department_id, semester_number, subject_id)
ALTER TABLE department_semester_subjects 
ADD CONSTRAINT unique_department_semester_subject 
UNIQUE (department_id, semester_number, subject_id);

-- Create index for better performance
CREATE INDEX IF NOT EXISTS idx_department_semester_subjects_semester_number 
ON department_semester_subjects (semester_number);

-- Add trigger to update updated_at
CREATE OR REPLACE FUNCTION update_semesters_new_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_semesters_new_updated_at_trigger
  BEFORE UPDATE ON semesters_new
  FOR EACH ROW
  EXECUTE FUNCTION update_semesters_new_updated_at();

-- After you've verified everything works, you can drop the old semester_id column:
-- ALTER TABLE department_semester_subjects DROP COLUMN semester_id;
-- DROP TABLE semesters; -- Only after confirming everything works with semesters_new
