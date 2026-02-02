-- ==============================================
-- CLEAN STUDENT REGISTRATION DATABASE SCHEMA
-- ==============================================
-- This script creates a clean, focused database schema
-- specifically for student registration functionality

-- ==============================================
-- 1. DROP EXISTING TABLES (Clean Slate)
-- ==============================================

-- Drop tables in reverse dependency order
DROP TABLE IF EXISTS student_subject_enrollments CASCADE;
DROP TABLE IF EXISTS student_semester_registrations CASCADE;
DROP TABLE IF EXISTS student_invoices CASCADE;
DROP TABLE IF EXISTS student_groups CASCADE;
DROP TABLE IF EXISTS department_curriculum CASCADE;
DROP TABLE IF EXISTS subjects CASCADE;
DROP TABLE IF EXISTS semesters CASCADE;
DROP TABLE IF EXISTS study_years CASCADE;
DROP TABLE IF EXISTS departments CASCADE;
DROP TABLE IF EXISTS students CASCADE;

-- ==============================================
-- 2. CREATE SEQUENCES FIRST
-- ==============================================

-- Create sequence for student IDs
CREATE SEQUENCE IF NOT EXISTS student_id_seq START 100000;

-- Create sequence for invoice numbers
CREATE SEQUENCE IF NOT EXISTS invoice_number_seq START 100000;

-- ==============================================
-- 3. CREATE CORE TABLES
-- ==============================================

-- Students Table
CREATE TABLE students (
  id TEXT PRIMARY KEY DEFAULT 'ST' || LPAD(nextval('student_id_seq')::TEXT, 6, '0'),
  name TEXT NOT NULL,
  name_en TEXT,
  email TEXT UNIQUE NOT NULL,
  national_id_passport TEXT UNIQUE NOT NULL,
  phone TEXT,
  address TEXT,
  department_id TEXT,
  year INTEGER,
  gender TEXT CHECK (gender IN ('male', 'female')),
  nationality TEXT,
  birth_date DATE,
  enrollment_date DATE DEFAULT CURRENT_DATE,
  sponsor_name TEXT,
  sponsor_contact TEXT,
  academic_history TEXT,
  academic_score DECIMAL(5,2),
  transcript_file TEXT,
  qr_code TEXT,
  status TEXT DEFAULT 'active' CHECK (status IN ('active', 'inactive', 'graduated', 'suspended')),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Departments Table
CREATE TABLE departments (
  id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::TEXT,
  name TEXT NOT NULL,
  name_en TEXT,
  description TEXT,
  head TEXT,
  head_teacher_id TEXT,
  is_locked BOOLEAN DEFAULT false,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Study Years Table
CREATE TABLE study_years (
  id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::TEXT,
  name TEXT NOT NULL,
  name_en TEXT,
  start_date DATE NOT NULL,
  end_date DATE NOT NULL,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Semesters Table
CREATE TABLE semesters (
  id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::TEXT,
  name TEXT NOT NULL,
  name_en TEXT,
  study_year_id TEXT REFERENCES study_years(id) ON DELETE CASCADE,
  start_date DATE NOT NULL,
  end_date DATE NOT NULL,
  registration_start_date DATE,
  registration_end_date DATE,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Subjects Table
CREATE TABLE subjects (
  id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::TEXT,
  code TEXT UNIQUE NOT NULL,
  name TEXT NOT NULL,
  name_en TEXT,
  credits INTEGER NOT NULL DEFAULT 3,
  cost_per_credit DECIMAL(10,2) DEFAULT 0.00,
  total_cost DECIMAL(10,2) GENERATED ALWAYS AS (credits * cost_per_credit) STORED,
  department_id TEXT REFERENCES departments(id) ON DELETE CASCADE,
  is_required BOOLEAN DEFAULT false,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ==============================================
-- 4. CREATE REGISTRATION TABLES
-- ==============================================

-- Student Semester Registrations Table
CREATE TABLE student_semester_registrations (
  id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::TEXT,
  student_id TEXT REFERENCES students(id) ON DELETE CASCADE,
  semester_id TEXT REFERENCES semesters(id) ON DELETE CASCADE,
  department_id TEXT REFERENCES departments(id) ON DELETE CASCADE,
  semester_number INTEGER NOT NULL,
  registration_date DATE DEFAULT CURRENT_DATE,
  status TEXT DEFAULT 'active' CHECK (status IN ('active', 'suspended', 'completed', 'dropped')),
  tuition_paid BOOLEAN DEFAULT false,
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(student_id, semester_id)
);

-- Student Subject Enrollments Table
CREATE TABLE student_subject_enrollments (
  id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::TEXT,
  student_id TEXT REFERENCES students(id) ON DELETE CASCADE,
  subject_id TEXT REFERENCES subjects(id) ON DELETE CASCADE,
  semester_id TEXT REFERENCES semesters(id) ON DELETE CASCADE,
  department_id TEXT REFERENCES departments(id) ON DELETE CASCADE,
  enrollment_date DATE DEFAULT CURRENT_DATE,
  status TEXT DEFAULT 'enrolled' CHECK (status IN ('enrolled', 'completed', 'dropped', 'failed')),
  subject_cost DECIMAL(10,2) NOT NULL,
  paid_amount DECIMAL(10,2) DEFAULT 0.00,
  payment_status TEXT DEFAULT 'unpaid' CHECK (payment_status IN ('unpaid', 'partial', 'paid')),
  final_grade DECIMAL(5,2),
  credits_earned INTEGER DEFAULT 0,
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(student_id, subject_id, semester_id)
);

-- Student Invoices Table
CREATE TABLE student_invoices (
  id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::TEXT,
  invoice_number TEXT UNIQUE NOT NULL DEFAULT 'INV-' || LPAD(nextval('invoice_number_seq')::TEXT, 6, '0'),
  student_id TEXT REFERENCES students(id) ON DELETE CASCADE,
  semester_id TEXT REFERENCES semesters(id) ON DELETE CASCADE,
  department_id TEXT REFERENCES departments(id) ON DELETE CASCADE,
  total_amount DECIMAL(10,2) NOT NULL,
  paid_amount DECIMAL(10,2) DEFAULT 0.00,
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'paid', 'overdue', 'cancelled')),
  due_date DATE,
  issued_date DATE DEFAULT CURRENT_DATE,
  paid_date DATE,
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ==============================================
-- 5. CREATE INDEXES FOR PERFORMANCE
-- ==============================================

-- Students indexes
CREATE INDEX idx_students_email ON students(email);
CREATE INDEX idx_students_national_id ON students(national_id_passport);
CREATE INDEX idx_students_department ON students(department_id);
CREATE INDEX idx_students_status ON students(status);

-- Semesters indexes
CREATE INDEX idx_semesters_study_year ON semesters(study_year_id);
CREATE INDEX idx_semesters_active ON semesters(is_active);

-- Subjects indexes
CREATE INDEX idx_subjects_code ON subjects(code);
CREATE INDEX idx_subjects_department ON subjects(department_id);
CREATE INDEX idx_subjects_active ON subjects(is_active);

-- Registration indexes
CREATE INDEX idx_registrations_student ON student_semester_registrations(student_id);
CREATE INDEX idx_registrations_semester ON student_semester_registrations(semester_id);
CREATE INDEX idx_registrations_department ON student_semester_registrations(department_id);
CREATE INDEX idx_registrations_status ON student_semester_registrations(status);

-- Enrollment indexes
CREATE INDEX idx_enrollments_student ON student_subject_enrollments(student_id);
CREATE INDEX idx_enrollments_subject ON student_subject_enrollments(subject_id);
CREATE INDEX idx_enrollments_semester ON student_subject_enrollments(semester_id);
CREATE INDEX idx_enrollments_status ON student_subject_enrollments(status);
CREATE INDEX idx_enrollments_payment ON student_subject_enrollments(payment_status);

-- Invoice indexes
CREATE INDEX idx_invoices_student ON student_invoices(student_id);
CREATE INDEX idx_invoices_semester ON student_invoices(semester_id);
CREATE INDEX idx_invoices_status ON student_invoices(status);
CREATE INDEX idx_invoices_number ON student_invoices(invoice_number);

-- ==============================================
-- 6. CREATE TRIGGERS FOR UPDATED_AT
-- ==============================================

-- Function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Apply triggers to all tables
CREATE TRIGGER update_students_updated_at BEFORE UPDATE ON students FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_departments_updated_at BEFORE UPDATE ON departments FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_study_years_updated_at BEFORE UPDATE ON study_years FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_semesters_updated_at BEFORE UPDATE ON semesters FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_subjects_updated_at BEFORE UPDATE ON subjects FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_registrations_updated_at BEFORE UPDATE ON student_semester_registrations FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_enrollments_updated_at BEFORE UPDATE ON student_subject_enrollments FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_invoices_updated_at BEFORE UPDATE ON student_invoices FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- ==============================================
-- 7. CREATE ROW LEVEL SECURITY (RLS) POLICIES
-- ==============================================

-- Enable RLS on all tables
ALTER TABLE students ENABLE ROW LEVEL SECURITY;
ALTER TABLE departments ENABLE ROW LEVEL SECURITY;
ALTER TABLE study_years ENABLE ROW LEVEL SECURITY;
ALTER TABLE semesters ENABLE ROW LEVEL SECURITY;
ALTER TABLE subjects ENABLE ROW LEVEL SECURITY;
ALTER TABLE student_semester_registrations ENABLE ROW LEVEL SECURITY;
ALTER TABLE student_subject_enrollments ENABLE ROW LEVEL SECURITY;
ALTER TABLE student_invoices ENABLE ROW LEVEL SECURITY;

-- Create policies for authenticated users (allow all operations for now)
CREATE POLICY "Allow all operations for authenticated users" ON students FOR ALL USING (auth.role() = 'authenticated');
CREATE POLICY "Allow all operations for authenticated users" ON departments FOR ALL USING (auth.role() = 'authenticated');
CREATE POLICY "Allow all operations for authenticated users" ON study_years FOR ALL USING (auth.role() = 'authenticated');
CREATE POLICY "Allow all operations for authenticated users" ON semesters FOR ALL USING (auth.role() = 'authenticated');
CREATE POLICY "Allow all operations for authenticated users" ON subjects FOR ALL USING (auth.role() = 'authenticated');
CREATE POLICY "Allow all operations for authenticated users" ON student_semester_registrations FOR ALL USING (auth.role() = 'authenticated');
CREATE POLICY "Allow all operations for authenticated users" ON student_subject_enrollments FOR ALL USING (auth.role() = 'authenticated');
CREATE POLICY "Allow all operations for authenticated users" ON student_invoices FOR ALL USING (auth.role() = 'authenticated');

-- ==============================================
-- 8. CREATE HELPFUL VIEWS
-- ==============================================

-- View for student registration details
CREATE VIEW student_registration_details AS
SELECT 
  ssr.id as registration_id,
  ssr.student_id,
  ssr.semester_id,
  ssr.department_id,
  ssr.semester_number,
  ssr.registration_date,
  ssr.status as registration_status,
  ssr.tuition_paid,
  ssr.notes as registration_notes,
  s.name as student_name,
  s.email as student_email,
  s.national_id_passport as student_id_number,
  s.phone as student_phone,
  d.name as department_name,
  sem.name as semester_name,
  sem.name_en as semester_name_en,
  sy.name as study_year_name,
  sem.start_date as semester_start_date,
  sem.end_date as semester_end_date
FROM student_semester_registrations ssr
JOIN students s ON ssr.student_id = s.id
JOIN departments d ON ssr.department_id = d.id
JOIN semesters sem ON ssr.semester_id = sem.id
JOIN study_years sy ON sem.study_year_id = sy.id;

-- View for student enrollment details
CREATE VIEW student_enrollment_details AS
SELECT 
  sse.id as enrollment_id,
  sse.student_id,
  sse.subject_id,
  sse.semester_id,
  sse.department_id,
  sse.enrollment_date,
  sse.status as enrollment_status,
  sse.subject_cost,
  sse.paid_amount,
  sse.payment_status,
  sse.final_grade,
  sse.credits_earned,
  sse.notes as enrollment_notes,
  s.name as student_name,
  s.email as student_email,
  sub.code as subject_code,
  sub.name as subject_name,
  sub.credits as subject_credits,
  sub.total_cost as subject_total_cost,
  d.name as department_name,
  sem.name as semester_name,
  sem.name_en as semester_name_en
FROM student_subject_enrollments sse
JOIN students s ON sse.student_id = s.id
JOIN subjects sub ON sse.subject_id = sub.id
JOIN departments d ON sse.department_id = d.id
JOIN semesters sem ON sse.semester_id = sem.id;

-- ==============================================
-- SCHEMA CREATION COMPLETE
-- ==============================================

-- Success message
DO $$
BEGIN
    RAISE NOTICE '✅ Clean student registration database schema created successfully!';
    RAISE NOTICE '📊 Tables created: students, departments, study_years, semesters, subjects, student_semester_registrations, student_subject_enrollments, student_invoices';
    RAISE NOTICE '🔍 Indexes created for optimal performance';
    RAISE NOTICE '🔒 RLS policies enabled for security';
    RAISE NOTICE '👁️ Views created for easy data access';
END $$;
