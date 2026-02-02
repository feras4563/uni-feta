-- Create study_years table - Simple version
-- This creates the missing study_years table

-- Create study_years table
CREATE TABLE study_years (
    id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
    name VARCHAR(100) NOT NULL UNIQUE,
    name_en VARCHAR(100),
    start_date DATE NOT NULL,
    end_date DATE NOT NULL,
    is_current BOOLEAN DEFAULT false,
    is_active BOOLEAN DEFAULT true,
    description TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Add sample data
INSERT INTO study_years (name, name_en, start_date, end_date, is_current, is_active, description) VALUES
('2023-2024', '2023-2024', '2023-09-01', '2024-06-30', false, true, 'العام الدراسي 2023-2024'),
('2024-2025', '2024-2025', '2024-09-01', '2025-06-30', true, true, 'العام الدراسي الحالي 2024-2025'),
('2025-2026', '2025-2026', '2025-09-01', '2026-06-30', false, true, 'العام الدراسي 2025-2026');

-- Disable RLS for development
ALTER TABLE study_years DISABLE ROW LEVEL SECURITY;

-- Test the table
SELECT 'Table created successfully!' as result;
SELECT * FROM study_years ORDER BY start_date DESC;
