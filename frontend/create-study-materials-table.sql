-- ==============================================
-- CREATE STUDY_MATERIALS TABLE
-- This creates the missing study_materials table
-- ==============================================

CREATE TABLE IF NOT EXISTS study_materials (
  id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::TEXT,
  title TEXT NOT NULL,
  title_en TEXT,
  description TEXT,
  material_type TEXT DEFAULT 'document',
  author TEXT,
  department_id TEXT REFERENCES departments(id) ON DELETE CASCADE,
  semester TEXT,
  is_required BOOLEAN DEFAULT false,
  is_active BOOLEAN DEFAULT true,
  file_url TEXT,
  file_name TEXT,
  file_size INTEGER,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_study_materials_department ON study_materials(department_id);
CREATE INDEX IF NOT EXISTS idx_study_materials_active ON study_materials(is_active);
CREATE INDEX IF NOT EXISTS idx_study_materials_type ON study_materials(material_type);

-- Enable RLS
ALTER TABLE study_materials ENABLE ROW LEVEL SECURITY;

-- Create RLS policies
CREATE POLICY "Anyone can view study materials" ON study_materials FOR SELECT USING (true);
CREATE POLICY "Authenticated users can manage study materials" ON study_materials FOR ALL USING (auth.role() = 'authenticated');

-- Add some sample data
INSERT INTO study_materials (title, title_en, material_type, author, department_id, semester, is_required) VALUES
('دليل الطالب', 'Student Guide', 'document', 'إدارة الجامعة', 'DEPT_MANAGEMENT', '1', true),
('قوانين الجامعة', 'University Rules', 'document', 'إدارة الجامعة', 'DEPT_MANAGEMENT', '1', true),
('دليل التخرج', 'Graduation Guide', 'document', 'إدارة الجامعة', 'DEPT_MANAGEMENT', '8', true);

-- ==============================================
-- SUCCESS MESSAGE
-- ==============================================

DO $$
BEGIN
    RAISE NOTICE '==============================================';
    RAISE NOTICE 'STUDY_MATERIALS TABLE CREATED!';
    RAISE NOTICE '==============================================';
    RAISE NOTICE 'Table created with:';
    RAISE NOTICE '✅ Basic fields (title, description, etc.)';
    RAISE NOTICE '✅ Department relationship';
    RAISE NOTICE '✅ File upload support';
    RAISE NOTICE '✅ Sample data inserted';
    RAISE NOTICE '';
    RAISE NOTICE 'The 404 error should now be resolved!';
    RAISE NOTICE '==============================================';
END $$;







