-- ======================================================================
-- CREATE STUDENT GROUPS AND REGISTRATIONS TABLES
-- ======================================================================
-- This fixes both "مجموعات الطلاب" and "قائمة التسجيلات" loading issues

-- ======================================================================
-- 1. CREATE STUDENT GROUPS TABLE
-- ======================================================================

CREATE TABLE IF NOT EXISTS student_groups (
    id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::TEXT,
    group_name TEXT NOT NULL,
    department_id TEXT REFERENCES departments(id) ON DELETE CASCADE,
    semester_id TEXT REFERENCES semesters(id) ON DELETE CASCADE,
    semester_number INTEGER NOT NULL,
    max_students INTEGER DEFAULT 30,
    current_students INTEGER DEFAULT 0,
    is_active BOOLEAN DEFAULT true,
    description TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(department_id, semester_id, group_name)
);

-- ======================================================================
-- 2. CREATE STUDENT SEMESTER REGISTRATIONS TABLE
-- ======================================================================

CREATE TABLE IF NOT EXISTS student_semester_registrations (
    id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::TEXT,
    student_id TEXT REFERENCES students(id) ON DELETE CASCADE,
    semester_id TEXT REFERENCES semesters(id) ON DELETE CASCADE,
    study_year_id TEXT REFERENCES study_years(id) ON DELETE CASCADE,
    department_id TEXT REFERENCES departments(id) ON DELETE CASCADE,
    group_id TEXT REFERENCES student_groups(id) ON DELETE SET NULL,
    semester_number INTEGER NOT NULL,
    registration_date DATE DEFAULT CURRENT_DATE,
    status TEXT DEFAULT 'active' CHECK (status IN ('active', 'suspended', 'completed', 'dropped')),
    tuition_paid BOOLEAN DEFAULT false,
    notes TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(student_id, semester_id)
);

-- ======================================================================
-- 3. CREATE STUDENT SUBJECT ENROLLMENTS TABLE
-- ======================================================================

CREATE TABLE IF NOT EXISTS student_subject_enrollments (
    id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::TEXT,
    student_id TEXT REFERENCES students(id) ON DELETE CASCADE,
    subject_id TEXT REFERENCES subjects(id) ON DELETE CASCADE,
    semester_id TEXT REFERENCES semesters(id) ON DELETE CASCADE,
    registration_id TEXT REFERENCES student_semester_registrations(id) ON DELETE CASCADE,
    enrollment_date DATE DEFAULT CURRENT_DATE,
    status TEXT DEFAULT 'active' CHECK (status IN ('active', 'dropped', 'completed', 'suspended')),
    final_grade DECIMAL(5,2),
    attendance_percentage DECIMAL(5,2) DEFAULT 0,
    notes TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(student_id, subject_id, semester_id)
);

-- ======================================================================
-- 4. ADD SAMPLE STUDENT GROUPS DATA
-- ======================================================================

-- Get current semester ID
DO $$
DECLARE
    current_semester_id TEXT;
    dept1_id TEXT;
    dept2_id TEXT;
BEGIN
    -- Get current semester (Fall 2024)
    SELECT id INTO current_semester_id FROM semesters WHERE name = 'الفصل الأول' LIMIT 1;
    
    -- Get department IDs
    SELECT id INTO dept1_id FROM departments LIMIT 1;
    SELECT id INTO dept2_id FROM departments OFFSET 1 LIMIT 1;
    
    IF current_semester_id IS NOT NULL AND dept1_id IS NOT NULL THEN
        -- Create sample groups for department 1
        INSERT INTO student_groups (group_name, department_id, semester_id, semester_number, max_students, description)
        VALUES 
            ('المجموعة الأولى', dept1_id, current_semester_id, 1, 25, 'المجموعة الأولى للفصل الدراسي الأول'),
            ('المجموعة الثانية', dept1_id, current_semester_id, 1, 30, 'المجموعة الثانية للفصل الدراسي الأول')
        ON CONFLICT (department_id, semester_id, group_name) DO NOTHING;
        
        -- Create sample groups for department 2 (if exists)
        IF dept2_id IS NOT NULL THEN
            INSERT INTO student_groups (group_name, department_id, semester_id, semester_number, max_students, description)
            VALUES 
                ('المجموعة الأولى', dept2_id, current_semester_id, 1, 20, 'المجموعة الأولى للفصل الدراسي الأول'),
                ('المجموعة الثانية', dept2_id, current_semester_id, 1, 25, 'المجموعة الثانية للفصل الدراسي الأول')
            ON CONFLICT (department_id, semester_id, group_name) DO NOTHING;
        END IF;
        
        RAISE NOTICE 'Sample student groups created successfully!';
    END IF;
END $$;

-- ======================================================================
-- 5. ADD SAMPLE REGISTRATION DATA
-- ======================================================================

-- Create sample registrations for existing students
DO $$
DECLARE
    current_semester_id TEXT;
    current_year_id TEXT;
    student_record RECORD;
    dept_id TEXT;
BEGIN
    -- Get current semester and year IDs
    SELECT id INTO current_semester_id FROM semesters WHERE name = 'الفصل الأول' LIMIT 1;
    SELECT id INTO current_year_id FROM study_years WHERE name = '2024-2025' LIMIT 1;
    
    IF current_semester_id IS NOT NULL AND current_year_id IS NOT NULL THEN
        -- Create registrations for first 5 students
        FOR student_record IN 
            SELECT id, department_id FROM students LIMIT 5
        LOOP
            INSERT INTO student_semester_registrations (
                student_id, semester_id, study_year_id, department_id, 
                semester_number, status, registration_date
            )
            VALUES (
                student_record.id, 
                current_semester_id, 
                current_year_id, 
                student_record.department_id,
                1, 
                'active', 
                CURRENT_DATE
            )
            ON CONFLICT (student_id, semester_id) DO NOTHING;
        END LOOP;
        
        RAISE NOTICE 'Sample registrations created successfully!';
    END IF;
END $$;

-- ======================================================================
-- 6. DISABLE RLS FOR DEVELOPMENT
-- ======================================================================

ALTER TABLE student_groups DISABLE ROW LEVEL SECURITY;
ALTER TABLE student_semester_registrations DISABLE ROW LEVEL SECURITY;
ALTER TABLE student_subject_enrollments DISABLE ROW LEVEL SECURITY;

-- ======================================================================
-- 7. VERIFY THE CREATION
-- ======================================================================

-- Check tables were created
SELECT 
    'Tables created:' as status,
    COUNT(*) as count
FROM information_schema.tables 
WHERE table_schema = 'public' 
AND table_name IN ('student_groups', 'student_semester_registrations', 'student_subject_enrollments');

-- Check sample data
SELECT 
    'Student Groups:' as table_name,
    COUNT(*) as record_count
FROM student_groups
UNION ALL
SELECT 
    'Registrations:' as table_name,
    COUNT(*) as record_count
FROM student_semester_registrations;

-- Show sample groups
SELECT 
    sg.group_name,
    d.name as department_name,
    s.name as semester_name,
    sg.max_students,
    sg.current_students
FROM student_groups sg
JOIN departments d ON d.id = sg.department_id
JOIN semesters s ON s.id = sg.semester_id
ORDER BY sg.group_name;

-- Show sample registrations
SELECT 
    st.name as student_name,
    d.name as department_name,
    s.name as semester_name,
    ssr.status,
    ssr.registration_date
FROM student_semester_registrations ssr
JOIN students st ON st.id = ssr.student_id
JOIN departments d ON d.id = ssr.department_id
JOIN semesters s ON s.id = ssr.semester_id
ORDER BY ssr.registration_date DESC
LIMIT 5;

-- ======================================================================
-- SUCCESS MESSAGE
-- ======================================================================

SELECT 'SUCCESS: Student Groups and Registrations tables created with sample data!' as result;
