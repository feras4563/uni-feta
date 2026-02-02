-- Simple script to ensure semesters exist
-- Run this in your Supabase SQL Editor

-- First, check what study years exist
SELECT 'Existing Study Years:' as info;
SELECT id, name, name_en, is_current FROM study_years ORDER BY name DESC;

-- Check what semesters exist
SELECT 'Existing Semesters:' as info;
SELECT id, name, name_en, code, study_year_id FROM semesters ORDER BY id;

-- Get the first study year ID (or use 'default-year' if it exists)
DO $$
DECLARE
  v_study_year_id TEXT;
BEGIN
  -- Try to get 'default-year' first
  SELECT id INTO v_study_year_id FROM study_years WHERE id = 'default-year' LIMIT 1;
  
  -- If not found, get any active study year
  IF v_study_year_id IS NULL THEN
    SELECT id INTO v_study_year_id FROM study_years WHERE is_active = true ORDER BY is_current DESC, name DESC LIMIT 1;
  END IF;
  
  -- If still no study year found, create one
  IF v_study_year_id IS NULL THEN
    INSERT INTO study_years (id, name, name_en, start_date, end_date, is_current, is_active)
    VALUES ('default-year', '2024-2025', '2024-2025', '2024-09-01', '2025-08-31', true, true)
    ON CONFLICT (id) DO NOTHING
    RETURNING id INTO v_study_year_id;
  END IF;
  
  RAISE NOTICE 'Using study year ID: %', v_study_year_id;
  
  -- Now ensure semesters exist
  INSERT INTO semesters (id, name, name_en, code, study_year_id, start_date, end_date, is_current, is_active, description)
  VALUES 
    ('fall-2024', 'الفصل الأول', 'Fall Semester', 'F24', v_study_year_id, '2024-09-01', '2025-01-15', true, true, 'الفصل الدراسي الأول'),
    ('spring-2025', 'الفصل الثاني', 'Spring Semester', 'S25', v_study_year_id, '2025-02-01', '2025-06-15', false, true, 'الفصل الدراسي الثاني')
  ON CONFLICT (id) DO UPDATE SET
    name = EXCLUDED.name,
    name_en = EXCLUDED.name_en,
    code = EXCLUDED.code,
    study_year_id = EXCLUDED.study_year_id,
    is_current = EXCLUDED.is_current,
    is_active = EXCLUDED.is_active;
    
  RAISE NOTICE 'Semesters created/updated successfully';
END $$;

-- Verify final state
SELECT 'Final Semesters:' as info;
SELECT 
  s.id,
  s.name,
  s.name_en,
  s.code,
  s.is_current,
  sy.name as study_year
FROM semesters s
LEFT JOIN study_years sy ON s.study_year_id = sy.id
ORDER BY s.id;

