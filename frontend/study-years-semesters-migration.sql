-- Migration: Create study_years and semesters tables
-- This migration creates tables for managing academic years and semesters

-- Create study_years table
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

-- Create semesters table
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

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_study_years_current ON study_years(is_current) WHERE is_current = true;
CREATE INDEX IF NOT EXISTS idx_study_years_active ON study_years(is_active) WHERE is_active = true;
CREATE INDEX IF NOT EXISTS idx_semesters_study_year ON semesters(study_year_id);
CREATE INDEX IF NOT EXISTS idx_semesters_current ON semesters(is_current) WHERE is_current = true;
CREATE INDEX IF NOT EXISTS idx_semesters_active ON semesters(is_active) WHERE is_active = true;

-- Create updated_at trigger function if it doesn't exist
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Create triggers for updated_at
CREATE TRIGGER update_study_years_updated_at 
    BEFORE UPDATE ON study_years 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_semesters_updated_at 
    BEFORE UPDATE ON semesters 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Enable Row Level Security
ALTER TABLE study_years ENABLE ROW LEVEL SECURITY;
ALTER TABLE semesters ENABLE ROW LEVEL SECURITY;

-- Create RLS policies
-- Study Years policies
CREATE POLICY "Anyone can view study years" ON study_years
    FOR SELECT USING (true);

CREATE POLICY "Authenticated users can insert study years" ON study_years
    FOR INSERT WITH CHECK (auth.role() = 'authenticated');

CREATE POLICY "Authenticated users can update study years" ON study_years
    FOR UPDATE USING (auth.role() = 'authenticated');

CREATE POLICY "Authenticated users can delete study years" ON study_years
    FOR DELETE USING (auth.role() = 'authenticated');

-- Semesters policies
CREATE POLICY "Anyone can view semesters" ON semesters
    FOR SELECT USING (true);

CREATE POLICY "Authenticated users can insert semesters" ON semesters
    FOR INSERT WITH CHECK (auth.role() = 'authenticated');

CREATE POLICY "Authenticated users can update semesters" ON semesters
    FOR UPDATE USING (auth.role() = 'authenticated');

CREATE POLICY "Authenticated users can delete semesters" ON semesters
    FOR DELETE USING (auth.role() = 'authenticated');

-- Insert default data
INSERT INTO study_years (id, name, name_en, start_date, end_date, is_current, is_active, description) VALUES
('default-year', '2024-2025', '2024-2025', '2024-09-01', '2025-08-31', true, true, 'السنة الأكاديمية الحالية')
ON CONFLICT (id) DO NOTHING;

INSERT INTO semesters (id, name, name_en, code, study_year_id, start_date, end_date, is_current, is_active, description) VALUES
('fall-2024', 'الفصل الأول', 'Fall Semester', 'F24', 'default-year', '2024-09-01', '2025-01-15', true, true, 'الفصل الدراسي الأول'),
('spring-2025', 'الفصل الثاني', 'Spring Semester', 'S25', 'default-year', '2025-02-01', '2025-06-15', false, true, 'الفصل الدراسي الثاني')
ON CONFLICT (id) DO NOTHING;

-- Create a function to ensure only one current study year
CREATE OR REPLACE FUNCTION ensure_single_current_study_year()
RETURNS TRIGGER AS $$
BEGIN
    -- If setting is_current to true, set all others to false
    IF NEW.is_current = true THEN
        UPDATE study_years 
        SET is_current = false 
        WHERE id != NEW.id AND is_current = true;
    END IF;
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Create a function to ensure only one current semester
CREATE OR REPLACE FUNCTION ensure_single_current_semester()
RETURNS TRIGGER AS $$
BEGIN
    -- If setting is_current to true, set all others to false
    IF NEW.is_current = true THEN
        UPDATE semesters 
        SET is_current = false 
        WHERE id != NEW.id AND is_current = true;
    END IF;
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Create a function to validate semester dates are within study year dates
CREATE OR REPLACE FUNCTION validate_semester_dates()
RETURNS TRIGGER AS $$
DECLARE
    year_start_date DATE;
    year_end_date DATE;
BEGIN
    -- Get the study year dates
    SELECT start_date, end_date 
    INTO year_start_date, year_end_date
    FROM study_years 
    WHERE id = NEW.study_year_id;
    
    -- Check if semester dates are within study year dates
    IF NEW.start_date < year_start_date OR NEW.end_date > year_end_date THEN
        RAISE EXCEPTION 'Semester dates must be within the study year dates (%, %)', year_start_date, year_end_date;
    END IF;
    
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Create triggers to ensure single current records
CREATE TRIGGER ensure_single_current_study_year_trigger
    BEFORE INSERT OR UPDATE ON study_years
    FOR EACH ROW EXECUTE FUNCTION ensure_single_current_study_year();

CREATE TRIGGER ensure_single_current_semester_trigger
    BEFORE INSERT OR UPDATE ON semesters
    FOR EACH ROW EXECUTE FUNCTION ensure_single_current_semester();

CREATE TRIGGER validate_semester_dates_trigger
    BEFORE INSERT OR UPDATE ON semesters
    FOR EACH ROW EXECUTE FUNCTION validate_semester_dates();

-- Verify the tables were created successfully
SELECT 'Study years and semesters tables created successfully' as status;
SELECT table_name FROM information_schema.tables WHERE table_name IN ('study_years', 'semesters');
