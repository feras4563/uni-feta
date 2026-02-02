-- ==============================================
-- FINAL CORRECT ACADEMIC MANAGEMENT SYSTEM MIGRATION
-- This version uses TEXT IDs to match your existing schema
-- Run this script in your Supabase SQL Editor
-- ==============================================

-- First, ensure semester_id column is nullable (you may have already run this)
ALTER TABLE department_semester_subjects 
ALTER COLUMN semester_id DROP NOT NULL;

-- ==============================================
-- 1. ROOM MANAGEMENT (Using TEXT IDs to match existing schema)
-- ==============================================

DROP TABLE IF EXISTS rooms CASCADE;

CREATE TABLE rooms (
  id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::TEXT,
  room_number TEXT NOT NULL UNIQUE,
  name TEXT NOT NULL,
  name_en TEXT,
  room_type TEXT NOT NULL CHECK (room_type IN ('lecture', 'lab', 'seminar', 'conference')),
  capacity INTEGER NOT NULL,
  floor INTEGER,
  building TEXT,
  equipment TEXT[],
  is_active BOOLEAN DEFAULT true,
  description TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ==============================================
-- 2. STUDENT GROUPS/CLASSES (Using TEXT IDs to match existing schema)
-- ==============================================

DROP TABLE IF EXISTS student_groups CASCADE;

CREATE TABLE student_groups (
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

-- ==============================================
-- 3. STUDENT REGISTRATION (Using TEXT IDs to match existing schema)
-- ==============================================

DROP TABLE IF EXISTS student_semester_registrations CASCADE;

CREATE TABLE student_semester_registrations (
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

-- ==============================================
-- 4. TIME SLOTS (Using TEXT IDs to match existing schema)
-- ==============================================

DROP TABLE IF EXISTS time_slots CASCADE;

CREATE TABLE time_slots (
  id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::TEXT,
  name TEXT NOT NULL,
  start_time TIME NOT NULL,
  end_time TIME NOT NULL,
  day_of_week INTEGER NOT NULL CHECK (day_of_week >= 1 AND day_of_week <= 7),
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ==============================================
-- 5. ENHANCED TIMETABLE (Using TEXT IDs to match existing schema)
-- ==============================================

DROP TABLE IF EXISTS timetable_entries CASCADE;

CREATE TABLE timetable_entries (
  id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::TEXT,
  semester_id TEXT REFERENCES semesters(id) ON DELETE CASCADE,
  department_id TEXT REFERENCES departments(id) ON DELETE CASCADE,
  group_id TEXT REFERENCES student_groups(id) ON DELETE CASCADE,
  subject_id TEXT REFERENCES subjects(id) ON DELETE CASCADE,
  teacher_id TEXT REFERENCES teachers(id) ON DELETE CASCADE,
  room_id TEXT REFERENCES rooms(id) ON DELETE CASCADE,
  time_slot_id TEXT REFERENCES time_slots(id) ON DELETE CASCADE,
  day_of_week INTEGER NOT NULL CHECK (day_of_week >= 1 AND day_of_week <= 7),
  start_time TIME NOT NULL,
  end_time TIME NOT NULL,
  is_active BOOLEAN DEFAULT true,
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ==============================================
-- 6. STUDENT ACADEMIC PROGRESSION (Using TEXT IDs to match existing schema)
-- ==============================================

DROP TABLE IF EXISTS student_academic_progress CASCADE;

CREATE TABLE student_academic_progress (
  id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::TEXT,
  student_id TEXT REFERENCES students(id) ON DELETE CASCADE,
  department_id TEXT REFERENCES departments(id) ON DELETE CASCADE,
  current_semester INTEGER NOT NULL,
  current_study_year_id TEXT REFERENCES study_years(id) ON DELETE CASCADE,
  total_credits_earned INTEGER DEFAULT 0,
  gpa DECIMAL(3,2),
  status TEXT DEFAULT 'active' CHECK (status IN ('active', 'graduated', 'suspended', 'dropped')),
  graduation_date DATE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ==============================================
-- 7. ROW LEVEL SECURITY
-- ==============================================

ALTER TABLE rooms ENABLE ROW LEVEL SECURITY;
ALTER TABLE student_groups ENABLE ROW LEVEL SECURITY;
ALTER TABLE student_semester_registrations ENABLE ROW LEVEL SECURITY;
ALTER TABLE time_slots ENABLE ROW LEVEL SECURITY;
ALTER TABLE timetable_entries ENABLE ROW LEVEL SECURITY;
ALTER TABLE student_academic_progress ENABLE ROW LEVEL SECURITY;

-- Create permissive policies for authenticated users
CREATE POLICY "Allow all operations for authenticated users" ON rooms
FOR ALL USING (auth.role() = 'authenticated') WITH CHECK (auth.role() = 'authenticated');

CREATE POLICY "Allow all operations for authenticated users" ON student_groups
FOR ALL USING (auth.role() = 'authenticated') WITH CHECK (auth.role() = 'authenticated');

CREATE POLICY "Allow all operations for authenticated users" ON student_semester_registrations
FOR ALL USING (auth.role() = 'authenticated') WITH CHECK (auth.role() = 'authenticated');

CREATE POLICY "Allow all operations for authenticated users" ON time_slots
FOR ALL USING (auth.role() = 'authenticated') WITH CHECK (auth.role() = 'authenticated');

CREATE POLICY "Allow all operations for authenticated users" ON timetable_entries
FOR ALL USING (auth.role() = 'authenticated') WITH CHECK (auth.role() = 'authenticated');

CREATE POLICY "Allow all operations for authenticated users" ON student_academic_progress
FOR ALL USING (auth.role() = 'authenticated') WITH CHECK (auth.role() = 'authenticated');

-- ==============================================
-- 8. INDEXES FOR PERFORMANCE
-- ==============================================

CREATE INDEX IF NOT EXISTS idx_rooms_active ON rooms(is_active);
CREATE INDEX IF NOT EXISTS idx_rooms_type ON rooms(room_type);
CREATE INDEX IF NOT EXISTS idx_rooms_building ON rooms(building);

CREATE INDEX IF NOT EXISTS idx_student_groups_department_semester ON student_groups(department_id, semester_id);
CREATE INDEX IF NOT EXISTS idx_student_groups_active ON student_groups(is_active);

CREATE INDEX IF NOT EXISTS idx_student_registrations_student_semester ON student_semester_registrations(student_id, semester_id);
CREATE INDEX IF NOT EXISTS idx_student_registrations_status ON student_semester_registrations(status);
CREATE INDEX IF NOT EXISTS idx_student_registrations_group ON student_semester_registrations(group_id);

CREATE INDEX IF NOT EXISTS idx_time_slots_active ON time_slots(is_active);
CREATE INDEX IF NOT EXISTS idx_time_slots_day ON time_slots(day_of_week);

CREATE INDEX IF NOT EXISTS idx_timetable_semester_department ON timetable_entries(semester_id, department_id);
CREATE INDEX IF NOT EXISTS idx_timetable_group ON timetable_entries(group_id);
CREATE INDEX IF NOT EXISTS idx_timetable_teacher ON timetable_entries(teacher_id);
CREATE INDEX IF NOT EXISTS idx_timetable_room ON timetable_entries(room_id);
CREATE INDEX IF NOT EXISTS idx_timetable_day ON timetable_entries(day_of_week);
CREATE INDEX IF NOT EXISTS idx_timetable_active ON timetable_entries(is_active);

CREATE INDEX IF NOT EXISTS idx_academic_progress_student ON student_academic_progress(student_id);
CREATE INDEX IF NOT EXISTS idx_academic_progress_department ON student_academic_progress(department_id);
CREATE INDEX IF NOT EXISTS idx_academic_progress_status ON student_academic_progress(status);

-- ==============================================
-- 9. TRIGGERS FOR DATA CONSISTENCY
-- ==============================================

-- Function to update student count in groups
CREATE OR REPLACE FUNCTION update_group_student_count()
RETURNS TRIGGER AS $$
BEGIN
  IF TG_OP = 'INSERT' AND NEW.group_id IS NOT NULL THEN
    UPDATE student_groups SET current_students = current_students + 1 WHERE id = NEW.group_id;
    RETURN NEW;
  ELSIF TG_OP = 'DELETE' AND OLD.group_id IS NOT NULL THEN
    UPDATE student_groups SET current_students = current_students - 1 WHERE id = OLD.group_id;
    RETURN OLD;
  ELSIF TG_OP = 'UPDATE' THEN
    IF OLD.group_id != NEW.group_id THEN
      IF OLD.group_id IS NOT NULL THEN
        UPDATE student_groups SET current_students = current_students - 1 WHERE id = OLD.group_id;
      END IF;
      IF NEW.group_id IS NOT NULL THEN
        UPDATE student_groups SET current_students = current_students + 1 WHERE id = NEW.group_id;
      END IF;
    END IF;
    RETURN NEW;
  END IF;
  RETURN NULL;
END;
$$ LANGUAGE plpgsql;

-- Drop existing trigger if it exists
DROP TRIGGER IF EXISTS update_group_student_count_trigger ON student_semester_registrations;

-- Create trigger for student group count updates
CREATE TRIGGER update_group_student_count_trigger
  AFTER INSERT OR UPDATE OR DELETE ON student_semester_registrations
  FOR EACH ROW EXECUTE FUNCTION update_group_student_count();

-- Function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Drop existing triggers if they exist
DROP TRIGGER IF EXISTS update_rooms_updated_at ON rooms;
DROP TRIGGER IF EXISTS update_student_groups_updated_at ON student_groups;
DROP TRIGGER IF EXISTS update_student_registrations_updated_at ON student_semester_registrations;
DROP TRIGGER IF EXISTS update_timetable_entries_updated_at ON timetable_entries;
DROP TRIGGER IF EXISTS update_academic_progress_updated_at ON student_academic_progress;

-- Create updated_at triggers
CREATE TRIGGER update_rooms_updated_at BEFORE UPDATE ON rooms
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_student_groups_updated_at BEFORE UPDATE ON student_groups
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_student_registrations_updated_at BEFORE UPDATE ON student_semester_registrations
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_timetable_entries_updated_at BEFORE UPDATE ON timetable_entries
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_academic_progress_updated_at BEFORE UPDATE ON student_academic_progress
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- ==============================================
-- 10. INSERT SAMPLE DATA
-- ==============================================

-- Insert default time slots (one for each day of the week)
INSERT INTO time_slots (name, start_time, end_time, day_of_week) VALUES
('الحصة الأولى - الأحد', '08:00:00', '09:30:00', 1),
('الحصة الثانية - الأحد', '09:30:00', '11:00:00', 1),
('الحصة الثالثة - الأحد', '11:00:00', '12:30:00', 1),
('الحصة الرابعة - الأحد', '12:30:00', '14:00:00', 1),
('الحصة الخامسة - الأحد', '14:00:00', '15:30:00', 1),
('الحصة السادسة - الأحد', '15:30:00', '17:00:00', 1),

('الحصة الأولى - الاثنين', '08:00:00', '09:30:00', 2),
('الحصة الثانية - الاثنين', '09:30:00', '11:00:00', 2),
('الحصة الثالثة - الاثنين', '11:00:00', '12:30:00', 2),
('الحصة الرابعة - الاثنين', '12:30:00', '14:00:00', 2),
('الحصة الخامسة - الاثنين', '14:00:00', '15:30:00', 2),
('الحصة السادسة - الاثنين', '15:30:00', '17:00:00', 2),

('الحصة الأولى - الثلاثاء', '08:00:00', '09:30:00', 3),
('الحصة الثانية - الثلاثاء', '09:30:00', '11:00:00', 3),
('الحصة الثالثة - الثلاثاء', '11:00:00', '12:30:00', 3),
('الحصة الرابعة - الثلاثاء', '12:30:00', '14:00:00', 3),
('الحصة الخامسة - الثلاثاء', '14:00:00', '15:30:00', 3),
('الحصة السادسة - الثلاثاء', '15:30:00', '17:00:00', 3),

('الحصة الأولى - الأربعاء', '08:00:00', '09:30:00', 4),
('الحصة الثانية - الأربعاء', '09:30:00', '11:00:00', 4),
('الحصة الثالثة - الأربعاء', '11:00:00', '12:30:00', 4),
('الحصة الرابعة - الأربعاء', '12:30:00', '14:00:00', 4),
('الحصة الخامسة - الأربعاء', '14:00:00', '15:30:00', 4),
('الحصة السادسة - الأربعاء', '15:30:00', '17:00:00', 4),

('الحصة الأولى - الخميس', '08:00:00', '09:30:00', 5),
('الحصة الثانية - الخميس', '09:30:00', '11:00:00', 5),
('الحصة الثالثة - الخميس', '11:00:00', '12:30:00', 5),
('الحصة الرابعة - الخميس', '12:30:00', '14:00:00', 5),
('الحصة الخامسة - الخميس', '14:00:00', '15:30:00', 5),
('الحصة السادسة - الخميس', '15:30:00', '17:00:00', 5);

-- Insert sample rooms
INSERT INTO rooms (room_number, name, name_en, room_type, capacity, floor, building) VALUES
('A101', 'قاعة المحاضرات الرئيسية', 'Main Lecture Hall', 'lecture', 100, 1, 'مبنى أ'),
('A102', 'قاعة المحاضرات الثانوية', 'Secondary Lecture Hall', 'lecture', 50, 1, 'مبنى أ'),
('A201', 'قاعة المحاضرات الكبيرة', 'Large Lecture Hall', 'lecture', 80, 2, 'مبنى أ'),
('B101', 'مختبر الحاسوب الأول', 'Computer Lab 1', 'lab', 30, 1, 'مبنى ب'),
('B102', 'مختبر الحاسوب الثاني', 'Computer Lab 2', 'lab', 30, 1, 'مبنى ب'),
('B201', 'مختبر الشبكات', 'Networks Lab', 'lab', 25, 2, 'مبنى ب'),
('C101', 'قاعة الندوات', 'Seminar Room', 'seminar', 20, 1, 'مبنى ج'),
('C201', 'قاعة المؤتمرات', 'Conference Room', 'conference', 40, 2, 'مبنى ج'),
('D101', 'مختبر الفيزياء', 'Physics Lab', 'lab', 25, 1, 'مبنى د'),
('D102', 'مختبر الكيمياء', 'Chemistry Lab', 'lab', 25, 1, 'مبنى د');

-- ==============================================
-- VERIFICATION QUERIES
-- ==============================================

-- Verify table creation
SELECT 
  table_name,
  table_type
FROM information_schema.tables 
WHERE table_schema = 'public' 
  AND table_name IN (
    'rooms', 
    'student_groups', 
    'student_semester_registrations', 
    'time_slots', 
    'timetable_entries', 
    'student_academic_progress'
  )
ORDER BY table_name;

-- Count records in new tables
SELECT 
  'rooms' as table_name, COUNT(*) as record_count FROM rooms
UNION ALL
SELECT 
  'student_groups' as table_name, COUNT(*) as record_count FROM student_groups
UNION ALL
SELECT 
  'student_semester_registrations' as table_name, COUNT(*) as record_count FROM student_semester_registrations
UNION ALL
SELECT 
  'time_slots' as table_name, COUNT(*) as record_count FROM time_slots
UNION ALL
SELECT 
  'timetable_entries' as table_name, COUNT(*) as record_count FROM timetable_entries
UNION ALL
SELECT 
  'student_academic_progress' as table_name, COUNT(*) as record_count FROM student_academic_progress;

-- ==============================================
-- COMPLETION MESSAGE
-- ==============================================

-- This will show as a notice in the results
DO $$ 
BEGIN
    RAISE NOTICE '==============================================';
    RAISE NOTICE 'FINAL CORRECT ACADEMIC MANAGEMENT SYSTEM MIGRATION COMPLETE!';
    RAISE NOTICE '==============================================';
    RAISE NOTICE 'Tables created with TEXT IDs: rooms, student_groups, student_semester_registrations,';
    RAISE NOTICE '                               time_slots, timetable_entries, student_academic_progress';
    RAISE NOTICE 'Features added: RLS policies, indexes, triggers, sample data';
    RAISE NOTICE 'Foreign key constraints: Now perfectly compatible with your TEXT-based schema';
    RAISE NOTICE 'Next steps: 1. Verify your frontend can access new tables';
    RAISE NOTICE '           2. Test API functions with new endpoints';
    RAISE NOTICE '           3. Start using the academic management features!';
    RAISE NOTICE '==============================================';
END $$;
