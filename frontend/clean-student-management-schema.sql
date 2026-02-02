-- ==============================================
-- CLEAN STUDENT MANAGEMENT DATABASE SCHEMA
-- ==============================================
-- This creates a minimal, clean schema specifically for student management

-- ==============================================
-- 1. DROP EXISTING TABLES (Clean Slate)
-- ==============================================

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
-- 2. CREATE SEQUENCES
-- ==============================================

CREATE SEQUENCE IF NOT EXISTS student_id_seq START 100000;
CREATE SEQUENCE IF NOT EXISTS invoice_number_seq START 100000;

-- ==============================================
-- 3. CREATE CORE TABLES
-- ==============================================

-- Departments Table (Minimal)
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

-- Students Table (Complete with all frontend-required columns)
CREATE TABLE students (
  id TEXT PRIMARY KEY DEFAULT 'ST' || LPAD(nextval('student_id_seq')::TEXT, 6, '0'),
  name TEXT NOT NULL,
  name_en TEXT,
  email TEXT UNIQUE NOT NULL,
  national_id_passport TEXT UNIQUE NOT NULL,
  phone TEXT,
  address TEXT,
  department_id TEXT REFERENCES departments(id) ON DELETE SET NULL,
  
  -- Academic Information
  year INTEGER DEFAULT 1,
  status TEXT DEFAULT 'active' CHECK (status IN ('active', 'inactive', 'graduated', 'suspended')),
  
  -- Personal Information
  gender TEXT CHECK (gender IN ('male', 'female')),
  nationality TEXT DEFAULT 'سعودي',
  birth_date DATE,
  enrollment_date DATE DEFAULT CURRENT_DATE,
  
  -- Sponsor Information
  sponsor_name TEXT,
  sponsor_contact TEXT,
  
  -- Academic Records
  academic_history TEXT,
  academic_score DECIMAL(5,2),
  transcript_file TEXT,
  qr_code TEXT,
  
  -- Metadata
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ==============================================
-- 4. CREATE INDEXES
-- ==============================================

-- Students indexes
CREATE INDEX idx_students_email ON students(email);
CREATE INDEX idx_students_national_id ON students(national_id_passport);
CREATE INDEX idx_students_department ON students(department_id);
CREATE INDEX idx_students_status ON students(status);
CREATE INDEX idx_students_year ON students(year);

-- Departments indexes
CREATE INDEX idx_departments_name ON departments(name);
CREATE INDEX idx_departments_active ON departments(is_active);

-- ==============================================
-- 5. CREATE TRIGGERS FOR UPDATED_AT
-- ==============================================

CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_students_updated_at BEFORE UPDATE ON students FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_departments_updated_at BEFORE UPDATE ON departments FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- ==============================================
-- 6. DISABLE RLS FOR DEVELOPMENT
-- ==============================================

-- Disable RLS for easy development
ALTER TABLE students DISABLE ROW LEVEL SECURITY;
ALTER TABLE departments DISABLE ROW LEVEL SECURITY;

-- ==============================================
-- SCHEMA CREATION COMPLETE
-- ==============================================

DO $$
BEGIN
    RAISE NOTICE '✅ Clean student management database schema created successfully!';
    RAISE NOTICE '📊 Tables created: students, departments';
    RAISE NOTICE '🔍 Indexes created for optimal performance';
    RAISE NOTICE '🔒 RLS disabled for development';
    RAISE NOTICE '👁️ Ready for student management functionality';
END $$;

