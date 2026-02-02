-- ======================================================================
-- FIX STUDY YEARS TABLE AND DATA
-- ======================================================================
-- This script fixes the study years loading issue

-- ======================================================================
-- 1. CHECK IF STUDY_YEARS TABLE EXISTS
-- ======================================================================

-- Check if study_years table exists
SELECT 
    'Checking study_years table...' as status,
    EXISTS (
        SELECT 1 FROM information_schema.tables 
        WHERE table_schema = 'public' AND table_name = 'study_years'
    ) as table_exists;

-- If table exists, check its structure
SELECT 
    column_name,
    data_type,
    is_nullable,
    column_default
FROM information_schema.columns
WHERE table_schema = 'public' 
AND table_name = 'study_years'
ORDER BY ordinal_position;

-- Check current data in study_years (if table exists)
SELECT 
    'Current study_years data:' as info,
    COUNT(*) as total_records
FROM study_years;

-- Show existing data
SELECT * FROM study_years ORDER BY created_at DESC LIMIT 5;

-- ======================================================================
-- 2. CREATE STUDY_YEARS TABLE (IF NOT EXISTS)
-- ======================================================================

CREATE TABLE IF NOT EXISTS study_years (
    id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
    name VARCHAR(100) NOT NULL UNIQUE, -- e.g., "2024-2025"
    name_en VARCHAR(100), -- e.g., "2024-2025"
    start_date DATE NOT NULL,
    end_date DATE NOT NULL,
    is_current BOOLEAN DEFAULT false, -- Only one year can be current
    is_active BOOLEAN DEFAULT true,
    description TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    
    -- Ensure end_date is after start_date
    CONSTRAINT check_dates CHECK (end_date > start_date)
);

-- ======================================================================
-- 3. ADD SAMPLE STUDY YEARS DATA (IF EMPTY)
-- ======================================================================

-- Insert sample study years if table is empty
INSERT INTO study_years (name, name_en, start_date, end_date, is_current, is_active, description)
SELECT 
    '2023-2024', '2023-2024', '2023-09-01'::date, '2024-06-30'::date, false, true, 'العام الدراسي 2023-2024'
WHERE NOT EXISTS (SELECT 1 FROM study_years WHERE name = '2023-2024');

INSERT INTO study_years (name, name_en, start_date, end_date, is_current, is_active, description)
SELECT 
    '2024-2025', '2024-2025', '2024-09-01'::date, '2025-06-30'::date, true, true, 'العام الدراسي الحالي 2024-2025'
WHERE NOT EXISTS (SELECT 1 FROM study_years WHERE name = '2024-2025');

INSERT INTO study_years (name, name_en, start_date, end_date, is_current, is_active, description)
SELECT 
    '2025-2026', '2025-2026', '2025-09-01'::date, '2026-06-30'::date, false, true, 'العام الدراسي 2025-2026'
WHERE NOT EXISTS (SELECT 1 FROM study_years WHERE name = '2025-2026');

-- ======================================================================
-- 4. CREATE SEMESTERS TABLE (IF NOT EXISTS)
-- ======================================================================

CREATE TABLE IF NOT EXISTS semesters (
    id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
    name VARCHAR(50) NOT NULL, -- e.g., "الفصل الأول", "الفصل الثاني"
    name_en VARCHAR(50), -- e.g., "Fall Semester", "Spring Semester"
    code VARCHAR(20) NOT NULL, -- e.g., "F24", "S25"
    study_year_id TEXT NOT NULL REFERENCES study_years(id) ON DELETE CASCADE,
    start_date DATE NOT NULL,
    end_date DATE NOT NULL,
    is_current BOOLEAN DEFAULT false, -- Only one semester can be current
    is_active BOOLEAN DEFAULT true,
    description TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    
    -- Ensure end_date is after start_date
    CONSTRAINT check_semester_dates CHECK (end_date > start_date),
    -- Unique code per study year
    UNIQUE(code, study_year_id)
);

-- ======================================================================
-- 5. ADD SAMPLE SEMESTERS DATA
-- ======================================================================

-- Add semesters for 2024-2025 academic year
DO $$
DECLARE
    current_year_id TEXT;
BEGIN
    -- Get the current academic year ID
    SELECT id INTO current_year_id FROM study_years WHERE name = '2024-2025';
    
    IF current_year_id IS NOT NULL THEN
        -- Insert Fall 2024 semester
        INSERT INTO semesters (name, name_en, code, study_year_id, start_date, end_date, is_current, description)
        SELECT 
            'الفصل الأول', 'Fall Semester', 'F24', current_year_id, 
            '2024-09-01'::date, '2024-12-31'::date, true, 'الفصل الدراسي الأول 2024'
        WHERE NOT EXISTS (
            SELECT 1 FROM semesters WHERE code = 'F24' AND study_year_id = current_year_id
        );
        
        -- Insert Spring 2025 semester
        INSERT INTO semesters (name, name_en, code, study_year_id, start_date, end_date, is_current, description)
        SELECT 
            'الفصل الثاني', 'Spring Semester', 'S25', current_year_id, 
            '2025-01-01'::date, '2025-06-30'::date, false, 'الفصل الدراسي الثاني 2025'
        WHERE NOT EXISTS (
            SELECT 1 FROM semesters WHERE code = 'S25' AND study_year_id = current_year_id
        );
        
        RAISE NOTICE 'Semesters created for academic year 2024-2025';
    END IF;
END $$;

-- ======================================================================
-- 6. DISABLE RLS FOR DEVELOPMENT
-- ======================================================================

-- Disable Row Level Security for development
ALTER TABLE study_years DISABLE ROW LEVEL SECURITY;
ALTER TABLE semesters DISABLE ROW LEVEL SECURITY;

-- ======================================================================
-- 7. VERIFY THE FIX
-- ======================================================================

-- Check final results
SELECT 
    'Final verification:' as status,
    COUNT(*) as study_years_count
FROM study_years;

SELECT 
    sy.name as academic_year,
    COUNT(s.id) as semesters_count,
    array_agg(s.name ORDER BY s.start_date) as semester_names
FROM study_years sy
LEFT JOIN semesters s ON s.study_year_id = sy.id
WHERE sy.is_active = true
GROUP BY sy.id, sy.name, sy.start_date
ORDER BY sy.start_date DESC;

-- Test the API query that was failing
SELECT * FROM study_years ORDER BY start_date DESC;

-- ======================================================================
-- SUCCESS MESSAGE
-- ======================================================================

SELECT 'SUCCESS: Study years table created and populated!' as result;
