-- ==============================================
-- SUBJECT-BASED STUDENT GROUPS MIGRATION
-- This creates a proper academic group system where:
-- 1. Groups are tied to specific subjects
-- 2. Teachers can see their subject groups
-- 3. Attendance can be taken per subject group
-- ==============================================

-- First, let's modify the existing student_groups table to be subject-based
ALTER TABLE student_groups 
ADD COLUMN IF NOT EXISTS subject_id TEXT REFERENCES subjects(id) ON DELETE CASCADE,
ADD COLUMN IF NOT EXISTS teacher_id TEXT REFERENCES teachers(id) ON DELETE CASCADE,
ADD COLUMN IF NOT EXISTS academic_year VARCHAR(20) DEFAULT '2024-2025',
ADD COLUMN IF NOT EXISTS semester_name VARCHAR(20) DEFAULT 'fall';

-- Update the unique constraint to include subject
ALTER TABLE student_groups DROP CONSTRAINT IF EXISTS student_groups_department_id_semester_id_group_name_key;
ALTER TABLE student_groups ADD CONSTRAINT student_groups_unique 
UNIQUE(subject_id, semester_id, group_name, academic_year);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_student_groups_subject ON student_groups(subject_id);
CREATE INDEX IF NOT EXISTS idx_student_groups_teacher ON student_groups(teacher_id);
CREATE INDEX IF NOT EXISTS idx_student_groups_academic_year ON student_groups(academic_year);

-- ==============================================
-- CREATE SUBJECT GROUP ENROLLMENTS TABLE
-- This replaces the generic student_semester_registrations for groups
-- ==============================================

CREATE TABLE IF NOT EXISTS subject_group_enrollments (
  id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::TEXT,
  student_id TEXT REFERENCES students(id) ON DELETE CASCADE,
  group_id TEXT REFERENCES student_groups(id) ON DELETE CASCADE,
  subject_id TEXT REFERENCES subjects(id) ON DELETE CASCADE,
  teacher_id TEXT REFERENCES teachers(id) ON DELETE CASCADE,
  
  -- Academic period
  academic_year VARCHAR(20) NOT NULL,
  semester_id TEXT REFERENCES semesters(id) ON DELETE CASCADE,
  semester_name VARCHAR(20) NOT NULL,
  
  -- Enrollment details
  enrollment_date DATE DEFAULT CURRENT_DATE,
  status TEXT DEFAULT 'active' CHECK (status IN ('active', 'dropped', 'completed', 'suspended')),
  
  -- Academic tracking
  final_grade DECIMAL(5,2),
  attendance_percentage DECIMAL(5,2) DEFAULT 0,
  
  -- Metadata
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  
  -- Prevent duplicate enrollments
  UNIQUE(student_id, group_id, academic_year)
);

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_subject_enrollments_student ON subject_group_enrollments(student_id);
CREATE INDEX IF NOT EXISTS idx_subject_enrollments_group ON subject_group_enrollments(group_id);
CREATE INDEX IF NOT EXISTS idx_subject_enrollments_subject ON subject_group_enrollments(subject_id);
CREATE INDEX IF NOT EXISTS idx_subject_enrollments_teacher ON subject_group_enrollments(teacher_id);
CREATE INDEX IF NOT EXISTS idx_subject_enrollments_status ON subject_group_enrollments(status);

-- ==============================================
-- CREATE ATTENDANCE SESSIONS FOR SUBJECT GROUPS
-- Enhanced attendance system for subject-based groups
-- ==============================================

CREATE TABLE IF NOT EXISTS subject_attendance_sessions (
  id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::TEXT,
  group_id TEXT REFERENCES student_groups(id) ON DELETE CASCADE,
  subject_id TEXT REFERENCES subjects(id) ON DELETE CASCADE,
  teacher_id TEXT REFERENCES teachers(id) ON DELETE CASCADE,
  
  -- Session details
  session_title TEXT NOT NULL,
  session_date DATE NOT NULL,
  start_time TIME NOT NULL,
  end_time TIME NOT NULL,
  
  -- Location and context
  room_id TEXT REFERENCES rooms(id) ON DELETE SET NULL,
  location TEXT,
  session_type TEXT DEFAULT 'lecture' CHECK (session_type IN ('lecture', 'lab', 'seminar', 'exam', 'assignment')),
  
  -- Attendance tracking
  total_students INTEGER DEFAULT 0,
  present_students INTEGER DEFAULT 0,
  absent_students INTEGER DEFAULT 0,
  
  -- Status
  status TEXT DEFAULT 'scheduled' CHECK (status IN ('scheduled', 'in_progress', 'completed', 'cancelled')),
  
  -- Metadata
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_attendance_sessions_group ON subject_attendance_sessions(group_id);
CREATE INDEX IF NOT EXISTS idx_attendance_sessions_subject ON subject_attendance_sessions(subject_id);
CREATE INDEX IF NOT EXISTS idx_attendance_sessions_teacher ON subject_attendance_sessions(teacher_id);
CREATE INDEX IF NOT EXISTS idx_attendance_sessions_date ON subject_attendance_sessions(session_date);

-- ==============================================
-- CREATE STUDENT ATTENDANCE RECORDS
-- Individual attendance records for each session
-- ==============================================

CREATE TABLE IF NOT EXISTS student_subject_attendance (
  id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::TEXT,
  session_id TEXT REFERENCES subject_attendance_sessions(id) ON DELETE CASCADE,
  student_id TEXT REFERENCES students(id) ON DELETE CASCADE,
  group_id TEXT REFERENCES student_groups(id) ON DELETE CASCADE,
  
  -- Attendance details
  attendance_status TEXT DEFAULT 'absent' CHECK (attendance_status IN ('present', 'absent', 'late', 'excused')),
  check_in_time TIMESTAMPTZ,
  check_out_time TIMESTAMPTZ,
  
  -- Additional info
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  
  -- Prevent duplicate attendance records
  UNIQUE(session_id, student_id)
);

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_student_attendance_session ON student_subject_attendance(session_id);
CREATE INDEX IF NOT EXISTS idx_student_attendance_student ON student_subject_attendance(student_id);
CREATE INDEX IF NOT EXISTS idx_student_attendance_group ON student_subject_attendance(group_id);
CREATE INDEX IF NOT EXISTS idx_student_attendance_status ON student_subject_attendance(attendance_status);

-- ==============================================
-- ENABLE ROW LEVEL SECURITY
-- ==============================================

ALTER TABLE subject_group_enrollments ENABLE ROW LEVEL SECURITY;
ALTER TABLE subject_attendance_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE student_subject_attendance ENABLE ROW LEVEL SECURITY;

-- Create RLS policies
CREATE POLICY "Anyone can view subject group enrollments" ON subject_group_enrollments
FOR SELECT USING (true);

CREATE POLICY "Authenticated users can manage enrollments" ON subject_group_enrollments
FOR ALL USING (auth.role() = 'authenticated');

CREATE POLICY "Anyone can view attendance sessions" ON subject_attendance_sessions
FOR SELECT USING (true);

CREATE POLICY "Authenticated users can manage attendance sessions" ON subject_attendance_sessions
FOR ALL USING (auth.role() = 'authenticated');

CREATE POLICY "Anyone can view student attendance" ON student_subject_attendance
FOR SELECT USING (true);

CREATE POLICY "Authenticated users can manage student attendance" ON student_subject_attendance
FOR ALL USING (auth.role() = 'authenticated');

-- ==============================================
-- CREATE TRIGGERS FOR AUTOMATIC UPDATES
-- ==============================================

-- Function to update group student count
CREATE OR REPLACE FUNCTION update_subject_group_student_count()
RETURNS TRIGGER AS $$
BEGIN
  IF TG_OP = 'INSERT' OR TG_OP = 'UPDATE' THEN
    UPDATE student_groups 
    SET current_students = (
      SELECT COUNT(*) 
      FROM subject_group_enrollments 
      WHERE group_id = NEW.group_id 
      AND status = 'active'
    )
    WHERE id = NEW.group_id;
  END IF;
  
  IF TG_OP = 'DELETE' OR TG_OP = 'UPDATE' THEN
    UPDATE student_groups 
    SET current_students = (
      SELECT COUNT(*) 
      FROM subject_group_enrollments 
      WHERE group_id = OLD.group_id 
      AND status = 'active'
    )
    WHERE id = OLD.group_id;
  END IF;
  
  RETURN COALESCE(NEW, OLD);
END;
$$ LANGUAGE plpgsql;

-- Create trigger
DROP TRIGGER IF EXISTS update_subject_group_count_trigger ON subject_group_enrollments;
CREATE TRIGGER update_subject_group_count_trigger
  AFTER INSERT OR UPDATE OR DELETE ON subject_group_enrollments
  FOR EACH ROW EXECUTE FUNCTION update_subject_group_student_count();

-- Function to update attendance session counts
CREATE OR REPLACE FUNCTION update_attendance_session_counts()
RETURNS TRIGGER AS $$
BEGIN
  IF TG_OP = 'INSERT' OR TG_OP = 'UPDATE' THEN
    UPDATE subject_attendance_sessions 
    SET 
      total_students = (
        SELECT COUNT(*) 
        FROM subject_group_enrollments 
        WHERE group_id = NEW.group_id 
        AND status = 'active'
      ),
      present_students = (
        SELECT COUNT(*) 
        FROM student_subject_attendance 
        WHERE session_id = NEW.session_id 
        AND attendance_status IN ('present', 'late')
      ),
      absent_students = (
        SELECT COUNT(*) 
        FROM student_subject_attendance 
        WHERE session_id = NEW.session_id 
        AND attendance_status = 'absent'
      )
    WHERE id = NEW.session_id;
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger
DROP TRIGGER IF EXISTS update_attendance_counts_trigger ON student_subject_attendance;
CREATE TRIGGER update_attendance_counts_trigger
  AFTER INSERT OR UPDATE OR DELETE ON student_subject_attendance
  FOR EACH ROW EXECUTE FUNCTION update_attendance_session_counts();

-- ==============================================
-- INSERT SAMPLE DATA
-- ==============================================

-- Sample subject-based groups (assuming you have subjects and teachers)
-- You'll need to replace these with actual IDs from your database

-- Example: Create groups for existing subjects
-- INSERT INTO student_groups (group_name, subject_id, teacher_id, department_id, semester_id, semester_number, max_students, academic_year, semester_name)
-- SELECT 
--   CONCAT(s.name, ' - Group A') as group_name,
--   s.id as subject_id,
--   s.teacher_id,
--   s.department_id,
--   (SELECT id FROM semesters LIMIT 1) as semester_id,
--   1 as semester_number,
--   30 as max_students,
--   '2024-2025' as academic_year,
--   'fall' as semester_name
-- FROM subjects s
-- WHERE s.teacher_id IS NOT NULL
-- LIMIT 5;

-- ==============================================
-- VERIFICATION QUERIES
-- ==============================================

-- Check the new structure
SELECT 
  'student_groups' as table_name,
  COUNT(*) as record_count 
FROM student_groups
UNION ALL
SELECT 
  'subject_group_enrollments' as table_name,
  COUNT(*) as record_count 
FROM subject_group_enrollments
UNION ALL
SELECT 
  'subject_attendance_sessions' as table_name,
  COUNT(*) as record_count 
FROM subject_attendance_sessions
UNION ALL
SELECT 
  'student_subject_attendance' as table_name,
  COUNT(*) as record_count 
FROM student_subject_attendance;

-- Show the new group structure
SELECT 
  sg.group_name,
  s.name as subject_name,
  t.name as teacher_name,
  d.name as department_name,
  sg.current_students,
  sg.max_students,
  sg.academic_year,
  sg.semester_name
FROM student_groups sg
LEFT JOIN subjects s ON sg.subject_id = s.id
LEFT JOIN teachers t ON sg.teacher_id = t.id
LEFT JOIN departments d ON sg.department_id = d.id
ORDER BY sg.created_at DESC;

-- ==============================================
-- SUCCESS MESSAGE
-- ==============================================

DO $$
BEGIN
    RAISE NOTICE '==============================================';
    RAISE NOTICE 'SUBJECT-BASED STUDENT GROUPS SYSTEM CREATED!';
    RAISE NOTICE '==============================================';
    RAISE NOTICE 'New Tables Created:';
    RAISE NOTICE '- subject_group_enrollments (replaces generic registrations)';
    RAISE NOTICE '- subject_attendance_sessions (subject-specific attendance)';
    RAISE NOTICE '- student_subject_attendance (individual attendance records)';
    RAISE NOTICE '';
    RAISE NOTICE 'Enhanced Tables:';
    RAISE NOTICE '- student_groups (now subject-based)';
    RAISE NOTICE '';
    RAISE NOTICE 'Key Features:';
    RAISE NOTICE '✅ Groups are tied to specific subjects';
    RAISE NOTICE '✅ Teachers can see their subject groups';
    RAISE NOTICE '✅ Attendance can be taken per subject';
    RAISE NOTICE '✅ Academic year and semester tracking';
    RAISE NOTICE '✅ Automatic student count updates';
    RAISE NOTICE '';
    RAISE NOTICE 'Next Steps:';
    RAISE NOTICE '1. Update your frontend to use subject-based groups';
    RAISE NOTICE '2. Create groups for each subject';
    RAISE NOTICE '3. Enroll students in subject groups';
    RAISE NOTICE '4. Teachers can now take attendance per subject!';
    RAISE NOTICE '==============================================';
END $$;











