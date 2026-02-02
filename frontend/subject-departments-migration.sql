-- Migration: Allow subjects to be associated with multiple departments
-- This creates a many-to-many relationship between subjects and departments

-- 1. Create the junction table for subject-department relationships
CREATE TABLE IF NOT EXISTS subject_departments (
    id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
    subject_id TEXT NOT NULL REFERENCES subjects(id) ON DELETE CASCADE,
    department_id TEXT NOT NULL REFERENCES departments(id) ON DELETE CASCADE,
    
    -- Additional metadata for the relationship
    is_primary_department BOOLEAN DEFAULT false, -- Primary department for this subject
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    
    -- Prevent duplicate relationships
    UNIQUE(subject_id, department_id)
);

-- 2. Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_subject_departments_subject_id ON subject_departments(subject_id);
CREATE INDEX IF NOT EXISTS idx_subject_departments_department_id ON subject_departments(department_id);
CREATE INDEX IF NOT EXISTS idx_subject_departments_primary ON subject_departments(subject_id, is_primary_department);

-- 3. Enable RLS (Row Level Security)
ALTER TABLE subject_departments ENABLE ROW LEVEL SECURITY;

-- 4. Create RLS policies
CREATE POLICY "Users can view subject-department relationships" ON subject_departments FOR SELECT USING (true);

CREATE POLICY "Managers can manage subject-department relationships" ON subject_departments FOR ALL USING (
    EXISTS (SELECT 1 FROM app_users WHERE auth_user_id = auth.uid() AND role = 'manager')
);

CREATE POLICY "Staff can manage subject-department relationships" ON subject_departments FOR ALL USING (
    EXISTS (SELECT 1 FROM app_users WHERE auth_user_id = auth.uid() AND role = 'staff')
);

-- 5. Migrate existing data from subjects.department_id to the new junction table
INSERT INTO subject_departments (subject_id, department_id, is_primary_department, is_active)
SELECT 
    id as subject_id,
    department_id,
    true as is_primary_department, -- All existing relationships are primary
    true as is_active
FROM subjects 
WHERE department_id IS NOT NULL;

-- 6. Add a trigger to automatically update the updated_at timestamp
CREATE OR REPLACE FUNCTION update_subject_departments_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_update_subject_departments_updated_at
    BEFORE UPDATE ON subject_departments
    FOR EACH ROW
    EXECUTE FUNCTION update_subject_departments_updated_at();

-- 7. Create a view for easier querying of subjects with their departments
CREATE OR REPLACE VIEW subjects_with_departments AS
SELECT 
    s.id,
    s.code,
    s.name,
    s.name_en,
    s.credits,
    s.teacher_id,
    s.semester,
    s.max_students,
    s.created_at,
    s.updated_at,
    -- Aggregate department information
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
    ) as primary_department
FROM subjects s
LEFT JOIN subject_departments sd ON s.id = sd.subject_id AND sd.is_active = true
LEFT JOIN departments d ON d.id = sd.department_id
GROUP BY s.id, s.code, s.name, s.name_en, s.credits, s.teacher_id, s.semester, s.max_students, s.created_at, s.updated_at;

-- 8. Grant permissions on the view
GRANT SELECT ON subjects_with_departments TO authenticated;

-- 9. Add comments for documentation
COMMENT ON TABLE subject_departments IS 'Junction table for many-to-many relationship between subjects and departments';
COMMENT ON COLUMN subject_departments.is_primary_department IS 'Indicates if this is the primary department for the subject';
COMMENT ON COLUMN subject_departments.is_active IS 'Indicates if this relationship is currently active';
COMMENT ON VIEW subjects_with_departments IS 'View that provides subjects with their associated departments in JSON format';
