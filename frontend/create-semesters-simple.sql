-- Create semesters table - Simple version
-- This creates the missing semesters table

-- Create semesters table
CREATE TABLE semesters (
    id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
    name VARCHAR(50) NOT NULL,
    name_en VARCHAR(50),
    code VARCHAR(20) NOT NULL,
    study_year_id TEXT NOT NULL REFERENCES study_years(id) ON DELETE CASCADE,
    start_date DATE NOT NULL,
    end_date DATE NOT NULL,
    is_current BOOLEAN DEFAULT false,
    is_active BOOLEAN DEFAULT true,
    description TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Add sample semesters for 2024-2025 academic year
INSERT INTO semesters (name, name_en, code, study_year_id, start_date, end_date, is_current, is_active, description) 
SELECT 
    'الفصل الأول', 'Fall Semester', 'F24', sy.id, '2024-09-01', '2024-12-31', true, true, 'الفصل الدراسي الأول 2024'
FROM study_years sy 
WHERE sy.name = '2024-2025';

INSERT INTO semesters (name, name_en, code, study_year_id, start_date, end_date, is_current, is_active, description) 
SELECT 
    'الفصل الثاني', 'Spring Semester', 'S25', sy.id, '2025-01-01', '2025-06-30', false, true, 'الفصل الدراسي الثاني 2025'
FROM study_years sy 
WHERE sy.name = '2024-2025';

-- Add semesters for 2023-2024 academic year
INSERT INTO semesters (name, name_en, code, study_year_id, start_date, end_date, is_current, is_active, description) 
SELECT 
    'الفصل الأول', 'Fall Semester', 'F23', sy.id, '2023-09-01', '2023-12-31', false, true, 'الفصل الدراسي الأول 2023'
FROM study_years sy 
WHERE sy.name = '2023-2024';

INSERT INTO semesters (name, name_en, code, study_year_id, start_date, end_date, is_current, is_active, description) 
SELECT 
    'الفصل الثاني', 'Spring Semester', 'S24', sy.id, '2024-01-01', '2024-06-30', false, true, 'الفصل الدراسي الثاني 2024'
FROM study_years sy 
WHERE sy.name = '2023-2024';

-- Disable RLS for development
ALTER TABLE semesters DISABLE ROW LEVEL SECURITY;

-- Test the table
SELECT 'Semesters table created successfully!' as result;
SELECT 
    s.name as semester_name,
    sy.name as academic_year,
    s.code,
    s.is_current,
    s.is_active
FROM semesters s
JOIN study_years sy ON sy.id = s.study_year_id
ORDER BY sy.start_date DESC, s.start_date DESC;
