-- Verify and create semesters if they don't exist
-- This script checks if the semesters table has data and creates default semesters if needed

-- Check existing semesters
DO $$
BEGIN
  RAISE NOTICE '=== Checking existing semesters ===';
END $$;

SELECT 
  id,
  name,
  name_en,
  code,
  study_year_id,
  is_current,
  is_active
FROM semesters
ORDER BY study_year_id, name;

-- Check existing study years
DO $$
BEGIN
  RAISE NOTICE '=== Checking existing study years ===';
END $$;

SELECT 
  id,
  name,
  name_en,
  is_current,
  is_active
FROM study_years
ORDER BY name DESC;

-- If no study years exist, create a default one
-- Use ON CONFLICT on the name column since it has a unique constraint
INSERT INTO study_years (id, name, name_en, start_date, end_date, is_current, is_active, description)
VALUES ('default-year', '2024-2025', '2024-2025', '2024-09-01', '2025-08-31', true, true, 'السنة الأكاديمية الحالية')
ON CONFLICT (name) DO UPDATE SET
  id = EXCLUDED.id,
  is_current = EXCLUDED.is_current,
  is_active = EXCLUDED.is_active,
  start_date = EXCLUDED.start_date,
  end_date = EXCLUDED.end_date;

-- If no semesters exist, create default ones
INSERT INTO semesters (id, name, name_en, code, study_year_id, start_date, end_date, is_current, is_active, description) 
VALUES 
  ('fall-2024', 'الفصل الأول', 'Fall Semester', 'F24', 'default-year', '2024-09-01', '2025-01-15', true, true, 'الفصل الدراسي الأول'),
  ('spring-2025', 'الفصل الثاني', 'Spring Semester', 'S25', 'default-year', '2025-02-01', '2025-06-15', false, true, 'الفصل الدراسي الثاني')
ON CONFLICT (id) DO UPDATE SET
  is_current = EXCLUDED.is_current,
  is_active = EXCLUDED.is_active,
  name = EXCLUDED.name,
  name_en = EXCLUDED.name_en,
  code = EXCLUDED.code;

-- Verify the data was created
DO $$
BEGIN
  RAISE NOTICE '=== After verification/creation ===';
END $$;

SELECT 
  s.id,
  s.name,
  s.name_en,
  s.code,
  s.is_current,
  s.is_active,
  sy.name as study_year_name
FROM semesters s
LEFT JOIN study_years sy ON s.study_year_id = sy.id
ORDER BY s.study_year_id, s.name;
