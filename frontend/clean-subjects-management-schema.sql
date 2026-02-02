-- ==============================================
-- CLEAN SUBJECTS MANAGEMENT DATABASE SCHEMA
-- ==============================================
-- This creates a minimal, clean schema specifically for subjects management

-- ==============================================
-- 1. DROP EXISTING TABLES (Clean Slate)
-- ==============================================

DROP TABLE IF EXISTS subjects CASCADE;
DROP VIEW IF EXISTS subjects_with_departments CASCADE;

-- ==============================================
-- 2. CREATE SUBJECTS TABLE
-- ==============================================

CREATE TABLE subjects (
  id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::TEXT,
  name TEXT NOT NULL,
  name_en TEXT,
  code TEXT UNIQUE NOT NULL,
  description TEXT,
  credits INTEGER NOT NULL DEFAULT 3,
  department_id TEXT REFERENCES departments(id) ON DELETE SET NULL,
  
  -- Cost Information
  cost_per_credit DECIMAL(10,2) DEFAULT 0.00,
  total_cost DECIMAL(10,2) GENERATED ALWAYS AS (credits * cost_per_credit) STORED,
  
  -- Academic Information
  is_required BOOLEAN DEFAULT false,
  semester_number INTEGER DEFAULT 1,
  semester TEXT,
  prerequisites TEXT[],
  teacher_id TEXT,
  
  -- Capacity Information
  max_students INTEGER DEFAULT 30,
  
  -- Status
  is_active BOOLEAN DEFAULT true,
  
  -- Metadata
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ==============================================
-- 3. CREATE INDEXES
-- ==============================================

-- Subjects indexes
CREATE INDEX idx_subjects_name ON subjects(name);
CREATE INDEX idx_subjects_code ON subjects(code);
CREATE INDEX idx_subjects_department ON subjects(department_id);
CREATE INDEX idx_subjects_active ON subjects(is_active);
CREATE INDEX idx_subjects_semester ON subjects(semester_number);
CREATE INDEX idx_subjects_required ON subjects(is_required);

-- ==============================================
-- 4. CREATE TRIGGERS FOR UPDATED_AT
-- ==============================================

CREATE TRIGGER update_subjects_updated_at BEFORE UPDATE ON subjects FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- ==============================================
-- 5. CREATE VIEW FOR ENHANCED QUERIES
-- ==============================================

CREATE VIEW subjects_with_departments AS
SELECT 
    s.id,
    s.name,
    s.name_en,
    s.code,
    s.description,
    s.credits,
    s.department_id,
    s.cost_per_credit,
    s.total_cost,
    s.is_required,
    s.semester_number,
    s.semester,
    s.prerequisites,
    s.teacher_id,
    s.max_students,
    s.is_active,
    s.created_at,
    s.updated_at,
    
    -- Aggregate department information as JSON array
    COALESCE(
        json_agg(
            json_build_object(
                'id', d.id,
                'name', d.name,
                'name_en', d.name_en,
                'is_primary', sd.is_primary_department,
                'is_active', sd.is_active
            ) ORDER BY sd.is_primary_department DESC, d.name
        ) FILTER (WHERE d.id IS NOT NULL),
        '[]'::json
    ) as departments,
    
    -- Primary department for backward compatibility
    (
        SELECT json_build_object('id', d.id, 'name', d.name, 'name_en', d.name_en)
        FROM subject_departments sd
        JOIN departments d ON d.id = sd.department_id
        WHERE sd.subject_id = s.id AND sd.is_primary_department = true AND sd.is_active = true
        LIMIT 1
    ) as primary_department,
    
    -- Legacy fields for backward compatibility
    (
        SELECT d.name
        FROM subject_departments sd
        JOIN departments d ON d.id = sd.department_id
        WHERE sd.subject_id = s.id AND sd.is_primary_department = true AND sd.is_active = true
        LIMIT 1
    ) as department_name,
    
    (
        SELECT d.name_en
        FROM subject_departments sd
        JOIN departments d ON d.id = sd.department_id
        WHERE sd.subject_id = s.id AND sd.is_primary_department = true AND sd.is_active = true
        LIMIT 1
    ) as department_name_en,
    
    (
        SELECT d.head
        FROM subject_departments sd
        JOIN departments d ON d.id = sd.department_id
        WHERE sd.subject_id = s.id AND sd.is_primary_department = true AND sd.is_active = true
        LIMIT 1
    ) as department_head

FROM subjects s
LEFT JOIN subject_departments sd ON s.id = sd.subject_id AND sd.is_active = true
LEFT JOIN departments d ON d.id = sd.department_id
GROUP BY s.id, s.name, s.name_en, s.code, s.description, s.credits, s.department_id, s.cost_per_credit, s.total_cost, s.is_required, s.semester_number, s.semester, s.prerequisites, s.teacher_id, s.max_students, s.is_active, s.created_at, s.updated_at;

-- ==============================================
-- 6. CREATE SUBJECT-DEPARTMENT JUNCTION TABLE
-- ==============================================

-- Create the junction table for subject-department relationships
CREATE TABLE subject_departments (
    id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
    subject_id TEXT NOT NULL REFERENCES subjects(id) ON DELETE CASCADE,
    department_id TEXT NOT NULL REFERENCES departments(id) ON DELETE CASCADE,
    
    -- Additional metadata for the relationship
    is_primary_department BOOLEAN DEFAULT false,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    
    -- Prevent duplicate relationships
    UNIQUE(subject_id, department_id)
);

-- ==============================================
-- 7. CREATE ADDITIONAL INDEXES
-- ==============================================

-- Subject-Department junction table indexes
CREATE INDEX idx_subject_departments_subject_id ON subject_departments(subject_id);
CREATE INDEX idx_subject_departments_department_id ON subject_departments(department_id);
CREATE INDEX idx_subject_departments_primary ON subject_departments(subject_id, is_primary_department);

-- ==============================================
-- 8. CREATE ADDITIONAL TRIGGERS
-- ==============================================

CREATE TRIGGER update_subject_departments_updated_at BEFORE UPDATE ON subject_departments FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- ==============================================
-- 9. DISABLE RLS FOR DEVELOPMENT
-- ==============================================

ALTER TABLE subjects DISABLE ROW LEVEL SECURITY;
ALTER TABLE subject_departments DISABLE ROW LEVEL SECURITY;

-- ==============================================
-- SCHEMA CREATION COMPLETE
-- ==============================================

DO $$
BEGIN
    RAISE NOTICE '✅ Clean subjects management database schema created successfully!';
    RAISE NOTICE '📊 Tables created: subjects';
    RAISE NOTICE '👁️ Views created: subjects_with_departments';
    RAISE NOTICE '🔍 Indexes created for optimal performance';
    RAISE NOTICE '🔒 RLS disabled for development';
    RAISE NOTICE '👁️ Ready for subjects management functionality';
END $$;
