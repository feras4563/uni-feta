-- ============================================================================
-- TEACHER SYSTEM DATABASE MIGRATION - STEP 2
-- Main migration (run AFTER step 1 is complete)
-- Run this SQL in your Supabase SQL Editor AFTER step 1
-- ============================================================================

-- 2. Update teachers table to support authentication (using TEXT IDs)
ALTER TABLE teachers ADD COLUMN IF NOT EXISTS username VARCHAR(50) UNIQUE;
ALTER TABLE teachers ADD COLUMN IF NOT EXISTS password_hash VARCHAR(255);
ALTER TABLE teachers ADD COLUMN IF NOT EXISTS is_active BOOLEAN DEFAULT true;
ALTER TABLE teachers ADD COLUMN IF NOT EXISTS last_login TIMESTAMP WITH TIME ZONE;
ALTER TABLE teachers ADD COLUMN IF NOT EXISTS auth_user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL;

-- Create index for better performance
CREATE INDEX IF NOT EXISTS idx_teachers_username ON teachers(username);
CREATE INDEX IF NOT EXISTS idx_teachers_auth_user_id ON teachers(auth_user_id);

-- 3. Create class_sessions table for QR-based attendance (using TEXT IDs)
CREATE TABLE IF NOT EXISTS class_sessions (
    id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
    teacher_id TEXT NOT NULL REFERENCES teachers(id) ON DELETE CASCADE,
    subject_id TEXT NOT NULL REFERENCES subjects(id) ON DELETE CASCADE,
    department_id TEXT NOT NULL REFERENCES departments(id) ON DELETE CASCADE,
    
    -- Session details
    session_name VARCHAR(255) NOT NULL,
    session_date DATE NOT NULL,
    start_time TIME NOT NULL,
    end_time TIME NOT NULL,
    room VARCHAR(100),
    
    -- QR Code system
    qr_code_data TEXT, -- Encrypted QR data
    qr_generated_at TIMESTAMP WITH TIME ZONE,
    qr_expires_at TIMESTAMP WITH TIME ZONE,
    qr_signature VARCHAR(255), -- Security signature
    
    -- Session status
    status VARCHAR(20) DEFAULT 'scheduled' CHECK (status IN ('scheduled', 'active', 'completed', 'cancelled')),
    max_students INTEGER DEFAULT 50,
    
    -- Metadata
    notes TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    
    -- Constraints
    CONSTRAINT valid_time_range CHECK (end_time > start_time),
    CONSTRAINT future_expiry CHECK (qr_expires_at > qr_generated_at OR qr_expires_at IS NULL)
);

-- 4. Create attendance_records table (using TEXT IDs)
CREATE TABLE IF NOT EXISTS attendance_records (
    id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
    session_id TEXT NOT NULL REFERENCES class_sessions(id) ON DELETE CASCADE,
    student_id TEXT NOT NULL REFERENCES students(id) ON DELETE CASCADE,
    
    -- Attendance details
    scan_time TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    status VARCHAR(20) DEFAULT 'present' CHECK (status IN ('present', 'late', 'absent', 'excused')),
    
    -- QR validation data
    student_qr_code TEXT, -- Student's QR code used
    class_qr_signature VARCHAR(255), -- Class QR signature used
    
    -- Security & tracking
    ip_address INET,
    user_agent TEXT,
    location_data JSONB, -- GPS coordinates if available
    is_manual_entry BOOLEAN DEFAULT false, -- If manually entered by teacher
    
    -- Metadata
    notes TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    
    -- Prevent duplicate attendance for same session
    UNIQUE(session_id, student_id)
);

-- 5. Create student_grades table (using TEXT IDs)
CREATE TABLE IF NOT EXISTS student_grades (
    id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
    student_id TEXT NOT NULL REFERENCES students(id) ON DELETE CASCADE,
    subject_id TEXT NOT NULL REFERENCES subjects(id) ON DELETE CASCADE,
    teacher_id TEXT NOT NULL REFERENCES teachers(id) ON DELETE CASCADE,
    
    -- Grade details
    grade_type VARCHAR(50) NOT NULL CHECK (grade_type IN ('midterm', 'final', 'assignment', 'quiz', 'project', 'participation', 'homework')),
    grade_name VARCHAR(255) NOT NULL, -- e.g., "Midterm Exam 1", "Assignment 3"
    grade_value DECIMAL(5,2) NOT NULL,
    max_grade DECIMAL(5,2) NOT NULL DEFAULT 100,
    weight DECIMAL(3,2) DEFAULT 1.0, -- Weight in final grade calculation
    
    -- Timing
    grade_date DATE DEFAULT CURRENT_DATE,
    due_date DATE,
    
    -- Metadata
    description TEXT,
    feedback TEXT, -- Teacher feedback
    is_published BOOLEAN DEFAULT false, -- Whether students can see this grade
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    
    -- Constraints
    CONSTRAINT valid_grade_range CHECK (grade_value >= 0 AND grade_value <= max_grade),
    CONSTRAINT valid_weight CHECK (weight > 0 AND weight <= 1.0)
);

-- 6. Update existing teacher_subjects table or create if it doesn't exist with proper structure
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

-- 7. Create class_schedules template table (using TEXT IDs)
CREATE TABLE IF NOT EXISTS class_schedules (
    id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
    teacher_id TEXT NOT NULL REFERENCES teachers(id) ON DELETE CASCADE,
    subject_id TEXT NOT NULL REFERENCES subjects(id) ON DELETE CASCADE,
    department_id TEXT NOT NULL REFERENCES departments(id) ON DELETE CASCADE,
    
    -- Schedule details
    day_of_week INTEGER NOT NULL CHECK (day_of_week >= 0 AND day_of_week <= 6), -- 0=Sunday, 6=Saturday
    start_time TIME NOT NULL,
    end_time TIME NOT NULL,
    room VARCHAR(100),
    
    -- Academic period
    academic_year VARCHAR(20) NOT NULL,
    semester VARCHAR(20) NOT NULL CHECK (semester IN ('fall', 'spring', 'summer')),
    
    -- Schedule metadata
    class_type VARCHAR(50) DEFAULT 'lecture' CHECK (class_type IN ('lecture', 'lab', 'tutorial', 'seminar')),
    max_students INTEGER DEFAULT 50,
    is_recurring BOOLEAN DEFAULT true,
    
    -- Status
    is_active BOOLEAN DEFAULT true,
    effective_from DATE DEFAULT CURRENT_DATE,
    effective_to DATE,
    
    -- Metadata
    notes TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    
    -- Constraints
    CONSTRAINT valid_time_range CHECK (end_time > start_time)
);

-- 8. Create attendance_summary view for quick stats
CREATE OR REPLACE VIEW attendance_summary AS
SELECT 
    cs.id as session_id,
    cs.teacher_id,
    cs.subject_id,
    cs.session_name,
    cs.session_date,
    COUNT(ar.id) as total_attendees,
    COUNT(CASE WHEN ar.status = 'present' THEN 1 END) as present_count,
    COUNT(CASE WHEN ar.status = 'late' THEN 1 END) as late_count,
    COUNT(CASE WHEN ar.status = 'absent' THEN 1 END) as absent_count,
    ROUND(
        (COUNT(CASE WHEN ar.status IN ('present', 'late') THEN 1 END)::DECIMAL / 
         NULLIF(COUNT(ar.id), 0)) * 100, 2
    ) as attendance_percentage
FROM class_sessions cs
LEFT JOIN attendance_records ar ON cs.id = ar.session_id
GROUP BY cs.id, cs.teacher_id, cs.subject_id, cs.session_name, cs.session_date;

-- 9. Create grade_summary view for quick grade stats
CREATE OR REPLACE VIEW grade_summary AS
SELECT 
    sg.student_id,
    sg.subject_id,
    sg.teacher_id,
    COUNT(sg.id) as total_grades,
    AVG(sg.grade_value) as average_grade,
    MAX(sg.grade_value) as highest_grade,
    MIN(sg.grade_value) as lowest_grade,
    SUM(CASE WHEN sg.is_published THEN 1 ELSE 0 END) as published_grades
FROM student_grades sg
GROUP BY sg.student_id, sg.subject_id, sg.teacher_id;

-- 10. Create useful functions (updated for TEXT IDs)
CREATE OR REPLACE FUNCTION generate_session_qr_data(session_id TEXT)
RETURNS TEXT AS $$
DECLARE
    session_data RECORD;
    qr_payload JSONB;
BEGIN
    SELECT * INTO session_data FROM class_sessions WHERE id = session_id;
    
    IF NOT FOUND THEN
        RAISE EXCEPTION 'Session not found';
    END IF;
    
    qr_payload := jsonb_build_object(
        'sessionId', session_id,
        'teacherId', session_data.teacher_id,
        'subjectId', session_data.subject_id,
        'timestamp', EXTRACT(EPOCH FROM NOW()),
        'expiresAt', EXTRACT(EPOCH FROM session_data.qr_expires_at)
    );
    
    RETURN qr_payload::TEXT;
END;
$$ LANGUAGE plpgsql;

-- 11. Create trigger functions
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Add triggers to all tables with updated_at
DROP TRIGGER IF EXISTS update_class_sessions_updated_at ON class_sessions;
DROP TRIGGER IF EXISTS update_attendance_records_updated_at ON attendance_records;
DROP TRIGGER IF EXISTS update_student_grades_updated_at ON student_grades;
DROP TRIGGER IF EXISTS update_teacher_subjects_updated_at ON teacher_subjects;
DROP TRIGGER IF EXISTS update_class_schedules_updated_at ON class_schedules;

CREATE TRIGGER update_class_sessions_updated_at BEFORE UPDATE ON class_sessions FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_attendance_records_updated_at BEFORE UPDATE ON attendance_records FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_student_grades_updated_at BEFORE UPDATE ON student_grades FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_teacher_subjects_updated_at BEFORE UPDATE ON teacher_subjects FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_class_schedules_updated_at BEFORE UPDATE ON class_schedules FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- 12. Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_class_sessions_teacher_id ON class_sessions(teacher_id);
CREATE INDEX IF NOT EXISTS idx_class_sessions_subject_id ON class_sessions(subject_id);
CREATE INDEX IF NOT EXISTS idx_class_sessions_date ON class_sessions(session_date);
CREATE INDEX IF NOT EXISTS idx_class_sessions_status ON class_sessions(status);

CREATE INDEX IF NOT EXISTS idx_attendance_records_session_id ON attendance_records(session_id);
CREATE INDEX IF NOT EXISTS idx_attendance_records_student_id ON attendance_records(student_id);
CREATE INDEX IF NOT EXISTS idx_attendance_records_scan_time ON attendance_records(scan_time);

CREATE INDEX IF NOT EXISTS idx_student_grades_student_id ON student_grades(student_id);
CREATE INDEX IF NOT EXISTS idx_student_grades_subject_id ON student_grades(subject_id);
CREATE INDEX IF NOT EXISTS idx_student_grades_teacher_id ON student_grades(teacher_id);
CREATE INDEX IF NOT EXISTS idx_student_grades_type ON student_grades(grade_type);

CREATE INDEX IF NOT EXISTS idx_teacher_subjects_teacher_id ON teacher_subjects(teacher_id);
CREATE INDEX IF NOT EXISTS idx_teacher_subjects_subject_id ON teacher_subjects(subject_id);
CREATE INDEX IF NOT EXISTS idx_teacher_subjects_active ON teacher_subjects(is_active);

CREATE INDEX IF NOT EXISTS idx_class_schedules_teacher_id ON class_schedules(teacher_id);
CREATE INDEX IF NOT EXISTS idx_class_schedules_day_time ON class_schedules(day_of_week, start_time);

-- 13. Enable Row Level Security
ALTER TABLE class_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE attendance_records ENABLE ROW LEVEL SECURITY;
ALTER TABLE student_grades ENABLE ROW LEVEL SECURITY;
ALTER TABLE teacher_subjects ENABLE ROW LEVEL SECURITY;
ALTER TABLE class_schedules ENABLE ROW LEVEL SECURITY;

-- 14. Create RLS policies for teachers
-- Teachers can only see their own data
DROP POLICY IF EXISTS "Teachers can manage their own sessions" ON class_sessions;
DROP POLICY IF EXISTS "Teachers can manage their own attendance records" ON attendance_records;
DROP POLICY IF EXISTS "Teachers can manage their own grades" ON student_grades;
DROP POLICY IF EXISTS "Teachers can see their subject assignments" ON teacher_subjects;
DROP POLICY IF EXISTS "Teachers can manage their schedules" ON class_schedules;

CREATE POLICY "Teachers can manage their own sessions" ON class_sessions
    FOR ALL USING (
        teacher_id IN (
            SELECT id FROM teachers WHERE auth_user_id = auth.uid()
        )
    );

CREATE POLICY "Teachers can manage their own attendance records" ON attendance_records
    FOR ALL USING (
        session_id IN (
            SELECT id FROM class_sessions WHERE teacher_id IN (
                SELECT id FROM teachers WHERE auth_user_id = auth.uid()
            )
        )
    );

CREATE POLICY "Teachers can manage their own grades" ON student_grades
    FOR ALL USING (
        teacher_id IN (
            SELECT id FROM teachers WHERE auth_user_id = auth.uid()
        )
    );

CREATE POLICY "Teachers can see their subject assignments" ON teacher_subjects
    FOR ALL USING (
        teacher_id IN (
            SELECT id FROM teachers WHERE auth_user_id = auth.uid()
        )
    );

CREATE POLICY "Teachers can manage their schedules" ON class_schedules
    FOR ALL USING (
        teacher_id IN (
            SELECT id FROM teachers WHERE auth_user_id = auth.uid()
        )
    );

-- 15. Add teacher permissions to permissions table
INSERT INTO permissions (role, resource, actions) VALUES
('teacher', 'sessions', ARRAY['view', 'create', 'edit', 'delete']),
('teacher', 'attendance', ARRAY['view', 'create', 'edit']),
('teacher', 'grades', ARRAY['view', 'create', 'edit', 'delete']),
('teacher', 'students', ARRAY['view']), -- Teachers can view their students
('teacher', 'subjects', ARRAY['view']), -- Teachers can view their subjects
('teacher', 'schedule', ARRAY['view', 'edit'])
ON CONFLICT DO NOTHING;

-- 16. Create function to auto-generate teacher username
CREATE OR REPLACE FUNCTION generate_teacher_username(teacher_name TEXT)
RETURNS TEXT AS $$
DECLARE
    base_username TEXT;
    final_username TEXT;
    counter INTEGER := 1;
BEGIN
    -- Create base username from name (remove spaces, convert to lowercase)
    base_username := lower(regexp_replace(teacher_name, '\s+', '.', 'g'));
    final_username := base_username;
    
    -- Check if username exists and increment if needed
    WHILE EXISTS (SELECT 1 FROM teachers WHERE username = final_username) LOOP
        final_username := base_username || counter;
        counter := counter + 1;
    END LOOP;
    
    RETURN final_username;
END;
$$ LANGUAGE plpgsql;

-- 17. Create function to auto-generate secure password
CREATE OR REPLACE FUNCTION generate_teacher_password()
RETURNS TEXT AS $$
DECLARE
    chars TEXT := 'ABCDEFGHJKMNPQRSTUVWXYZabcdefghjkmnpqrstuvwxyz23456789';
    result TEXT := '';
    i INTEGER;
BEGIN
    FOR i IN 1..12 LOOP
        result := result || substr(chars, floor(random() * length(chars) + 1)::INTEGER, 1);
    END LOOP;
    RETURN result;
END;
$$ LANGUAGE plpgsql;

-- 18. Show completion message and next steps
SELECT 'Teacher system database migration completed successfully!' as status;
SELECT 'Next steps:' as info, 'Update teacher creation logic to generate user accounts' as action;
SELECT 'Tables created:' as info, 'class_sessions, attendance_records, student_grades, teacher_subjects, class_schedules' as tables;

-- 19. Show sample data structure
SELECT 'Sample teacher username generation:' as demo;
SELECT generate_teacher_username('أحمد محمد علي') as sample_username;
SELECT 'Sample password:' as demo, generate_teacher_password() as sample_password;

-- 20. Verify foreign key relationships
SELECT 'Verifying foreign key relationships...' as verification;
SELECT 
    tc.table_name, 
    kcu.column_name, 
    ccu.table_name AS foreign_table_name,
    ccu.column_name AS foreign_column_name 
FROM 
    information_schema.table_constraints AS tc 
    JOIN information_schema.key_column_usage AS kcu
      ON tc.constraint_name = kcu.constraint_name
      AND tc.table_schema = kcu.table_schema
    JOIN information_schema.constraint_column_usage AS ccu
      ON ccu.constraint_name = tc.constraint_name
      AND ccu.table_schema = tc.table_schema
WHERE tc.constraint_type = 'FOREIGN KEY' 
    AND tc.table_name IN ('class_sessions', 'attendance_records', 'student_grades', 'teacher_subjects', 'class_schedules')
ORDER BY tc.table_name, kcu.column_name;
