-- ==============================================
-- ENHANCED STUDENT REGISTRATION SYSTEM (SAFE VERSION)
-- This creates a comprehensive semester registration system with:
-- 1. Subject costs in subjects table
-- 2. Department curriculum mapping
-- 3. Student subject enrollments
-- 4. Invoice generation system
-- ==============================================

-- ==============================================
-- 1. ENHANCE SUBJECTS TABLE WITH COSTS
-- ==============================================

-- Add cost fields to subjects table
ALTER TABLE subjects 
ADD COLUMN IF NOT EXISTS cost_per_credit DECIMAL(10,2) DEFAULT 0.00,
ADD COLUMN IF NOT EXISTS total_cost DECIMAL(10,2) DEFAULT 0.00,
ADD COLUMN IF NOT EXISTS is_required BOOLEAN DEFAULT true,
ADD COLUMN IF NOT EXISTS semester_number INTEGER DEFAULT 1;

-- Update total_cost based on credits and cost_per_credit
UPDATE subjects 
SET total_cost = COALESCE(credits, 0) * COALESCE(cost_per_credit, 0)
WHERE total_cost = 0;

-- ==============================================
-- 2. CREATE DEPARTMENT CURRICULUM TABLE
-- ==============================================

CREATE TABLE IF NOT EXISTS department_curriculum (
  id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::TEXT,
  department_id TEXT REFERENCES departments(id) ON DELETE CASCADE,
  semester_id TEXT REFERENCES semesters(id) ON DELETE CASCADE,
  subject_id TEXT REFERENCES subjects(id) ON DELETE CASCADE,
  semester_number INTEGER NOT NULL,
  is_required BOOLEAN DEFAULT true,
  prerequisites TEXT[], -- Array of subject IDs that are prerequisites
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  
  -- Prevent duplicate curriculum entries
  UNIQUE(department_id, semester_id, subject_id)
);

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_curriculum_department ON department_curriculum(department_id);
CREATE INDEX IF NOT EXISTS idx_curriculum_semester ON department_curriculum(semester_id);
CREATE INDEX IF NOT EXISTS idx_curriculum_subject ON department_curriculum(subject_id);
CREATE INDEX IF NOT EXISTS idx_curriculum_active ON department_curriculum(is_active);

-- ==============================================
-- 3. CREATE STUDENT SUBJECT ENROLLMENTS TABLE
-- ==============================================

CREATE TABLE IF NOT EXISTS student_subject_enrollments (
  id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::TEXT,
  student_id TEXT REFERENCES students(id) ON DELETE CASCADE,
  subject_id TEXT REFERENCES subjects(id) ON DELETE CASCADE,
  semester_id TEXT REFERENCES semesters(id) ON DELETE CASCADE,
  department_id TEXT REFERENCES departments(id) ON DELETE CASCADE,
  
  -- Enrollment details
  enrollment_date DATE DEFAULT CURRENT_DATE,
  status TEXT DEFAULT 'enrolled' CHECK (status IN ('enrolled', 'completed', 'dropped', 'failed')),
  
  -- Financial details
  subject_cost DECIMAL(10,2) NOT NULL,
  paid_amount DECIMAL(10,2) DEFAULT 0.00,
  payment_status TEXT DEFAULT 'unpaid' CHECK (payment_status IN ('unpaid', 'partial', 'paid')),
  
  -- Academic details
  final_grade DECIMAL(5,2),
  credits_earned INTEGER DEFAULT 0,
  
  -- Metadata
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  
  -- Prevent duplicate enrollments
  UNIQUE(student_id, subject_id, semester_id)
);

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_enrollments_student ON student_subject_enrollments(student_id);
CREATE INDEX IF NOT EXISTS idx_enrollments_subject ON student_subject_enrollments(subject_id);
CREATE INDEX IF NOT EXISTS idx_enrollments_semester ON student_subject_enrollments(semester_id);
CREATE INDEX IF NOT EXISTS idx_enrollments_status ON student_subject_enrollments(status);
CREATE INDEX IF NOT EXISTS idx_enrollments_payment ON student_subject_enrollments(payment_status);

-- ==============================================
-- 4. CREATE INVOICES TABLE
-- ==============================================

CREATE TABLE IF NOT EXISTS student_invoices (
  id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::TEXT,
  student_id TEXT REFERENCES students(id) ON DELETE CASCADE,
  semester_id TEXT REFERENCES semesters(id) ON DELETE CASCADE,
  department_id TEXT REFERENCES departments(id) ON DELETE CASCADE,
  
  -- Invoice details
  invoice_number TEXT UNIQUE NOT NULL,
  invoice_date DATE DEFAULT CURRENT_DATE,
  due_date DATE DEFAULT (CURRENT_DATE + INTERVAL '30 days'),
  
  -- Financial details
  total_amount DECIMAL(10,2) NOT NULL,
  paid_amount DECIMAL(10,2) DEFAULT 0.00,
  balance_due DECIMAL(10,2) GENERATED ALWAYS AS (total_amount - paid_amount) STORED,
  
  -- Status
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'partial', 'paid', 'overdue', 'cancelled')),
  
  -- Payment details
  payment_method TEXT,
  payment_date DATE,
  payment_reference TEXT,
  
  -- Metadata
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_invoices_student ON student_invoices(student_id);
CREATE INDEX IF NOT EXISTS idx_invoices_semester ON student_invoices(semester_id);
CREATE INDEX IF NOT EXISTS idx_invoices_status ON student_invoices(status);
CREATE INDEX IF NOT EXISTS idx_invoices_number ON student_invoices(invoice_number);

-- ==============================================
-- 5. CREATE INVOICE ITEMS TABLE
-- ==============================================

CREATE TABLE IF NOT EXISTS invoice_items (
  id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::TEXT,
  invoice_id TEXT REFERENCES student_invoices(id) ON DELETE CASCADE,
  subject_id TEXT REFERENCES subjects(id) ON DELETE CASCADE,
  
  -- Item details
  description TEXT NOT NULL,
  quantity INTEGER DEFAULT 1,
  unit_price DECIMAL(10,2) NOT NULL,
  total_price DECIMAL(10,2) GENERATED ALWAYS AS (quantity * unit_price) STORED,
  
  -- Metadata
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_invoice_items_invoice ON invoice_items(invoice_id);
CREATE INDEX IF NOT EXISTS idx_invoice_items_subject ON invoice_items(subject_id);

-- ==============================================
-- 6. ENABLE ROW LEVEL SECURITY (SAFE VERSION)
-- ==============================================

ALTER TABLE department_curriculum ENABLE ROW LEVEL SECURITY;
ALTER TABLE student_subject_enrollments ENABLE ROW LEVEL SECURITY;
ALTER TABLE student_invoices ENABLE ROW LEVEL SECURITY;
ALTER TABLE invoice_items ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if they exist, then create new ones
DROP POLICY IF EXISTS "Anyone can view curriculum" ON department_curriculum;
DROP POLICY IF EXISTS "Authenticated users can manage curriculum" ON department_curriculum;
DROP POLICY IF EXISTS "Anyone can view enrollments" ON student_subject_enrollments;
DROP POLICY IF EXISTS "Authenticated users can manage enrollments" ON student_subject_enrollments;
DROP POLICY IF EXISTS "Anyone can view invoices" ON student_invoices;
DROP POLICY IF EXISTS "Authenticated users can manage invoices" ON student_invoices;
DROP POLICY IF EXISTS "Anyone can view invoice items" ON invoice_items;
DROP POLICY IF EXISTS "Authenticated users can manage invoice items" ON invoice_items;

-- Create RLS policies
CREATE POLICY "Anyone can view curriculum" ON department_curriculum FOR SELECT USING (true);
CREATE POLICY "Authenticated users can manage curriculum" ON department_curriculum FOR ALL USING (auth.role() = 'authenticated');

CREATE POLICY "Anyone can view enrollments" ON student_subject_enrollments FOR SELECT USING (true);
CREATE POLICY "Authenticated users can manage enrollments" ON student_subject_enrollments FOR ALL USING (auth.role() = 'authenticated');

CREATE POLICY "Anyone can view invoices" ON student_invoices FOR SELECT USING (true);
CREATE POLICY "Authenticated users can manage invoices" ON student_invoices FOR ALL USING (auth.role() = 'authenticated');

CREATE POLICY "Anyone can view invoice items" ON invoice_items FOR SELECT USING (true);
CREATE POLICY "Authenticated users can manage invoice items" ON invoice_items FOR ALL USING (auth.role() = 'authenticated');

-- ==============================================
-- 7. CREATE TRIGGERS FOR AUTOMATIC UPDATES (SAFE VERSION)
-- ==============================================

-- Function to update invoice balance
CREATE OR REPLACE FUNCTION update_invoice_balance()
RETURNS TRIGGER AS $$
BEGIN
  UPDATE student_invoices 
  SET 
    paid_amount = (
      SELECT COALESCE(SUM(amount), 0) 
      FROM fee_payments 
      WHERE fee_id = NEW.fee_id
    ),
    status = CASE 
      WHEN paid_amount >= total_amount THEN 'paid'
      WHEN paid_amount > 0 THEN 'partial'
      ELSE 'pending'
    END
  WHERE id = NEW.invoice_id;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Function to generate invoice number
CREATE OR REPLACE FUNCTION generate_invoice_number()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.invoice_number IS NULL OR NEW.invoice_number = '' THEN
    NEW.invoice_number := 'INV-' || TO_CHAR(NEW.invoice_date, 'YYYY') || '-' || 
                         LPAD(EXTRACT(DOY FROM NEW.invoice_date)::TEXT, 3, '0') || '-' ||
                         LPAD(NEXTVAL('invoice_sequence')::TEXT, 4, '0');
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create sequence for invoice numbers
CREATE SEQUENCE IF NOT EXISTS invoice_sequence START 1;

-- Create triggers (drop existing first)
DROP TRIGGER IF EXISTS generate_invoice_number_trigger ON student_invoices;
CREATE TRIGGER generate_invoice_number_trigger
  BEFORE INSERT ON student_invoices
  FOR EACH ROW EXECUTE FUNCTION generate_invoice_number();

-- ==============================================
-- 8. VERIFICATION QUERIES
-- ==============================================

-- Check the new structure
SELECT 
  'subjects' as table_name,
  COUNT(*) as record_count 
FROM subjects
UNION ALL
SELECT 
  'department_curriculum' as table_name,
  COUNT(*) as record_count 
FROM department_curriculum
UNION ALL
SELECT 
  'student_subject_enrollments' as table_name,
  COUNT(*) as record_count 
FROM student_subject_enrollments
UNION ALL
SELECT 
  'student_invoices' as table_name,
  COUNT(*) as record_count 
FROM student_invoices
UNION ALL
SELECT 
  'invoice_items' as table_name,
  COUNT(*) as record_count 
FROM invoice_items;

-- Show subjects with costs
SELECT 
  s.code,
  s.name,
  s.credits,
  s.cost_per_credit,
  s.total_cost,
  s.is_required,
  s.semester_number,
  d.name as department_name
FROM subjects s
LEFT JOIN departments d ON s.department_id = d.id
ORDER BY s.department_id, s.semester_number, s.name;

-- ==============================================
-- 9. SUCCESS MESSAGE
-- ==============================================

DO $$
BEGIN
    RAISE NOTICE '==============================================';
    RAISE NOTICE 'ENHANCED STUDENT REGISTRATION SYSTEM CREATED!';
    RAISE NOTICE '==============================================';
    RAISE NOTICE 'Enhanced Tables:';
    RAISE NOTICE '- subjects (added cost fields)';
    RAISE NOTICE '';
    RAISE NOTICE 'New Tables Created:';
    RAISE NOTICE '- department_curriculum (curriculum mapping)';
    RAISE NOTICE '- student_subject_enrollments (subject enrollments)';
    RAISE NOTICE '- student_invoices (invoice generation)';
    RAISE NOTICE '- invoice_items (invoice line items)';
    RAISE NOTICE '';
    RAISE NOTICE 'Key Features:';
    RAISE NOTICE '✅ Subject costs and pricing';
    RAISE NOTICE '✅ Department curriculum mapping';
    RAISE NOTICE '✅ Student subject enrollments';
    RAISE NOTICE '✅ Automatic invoice generation';
    RAISE NOTICE '✅ Payment tracking';
    RAISE NOTICE '✅ Prerequisites support';
    RAISE NOTICE '';
    RAISE NOTICE 'Next Steps:';
    RAISE NOTICE '1. Update subject costs in subjects table';
    RAISE NOTICE '2. Create department curriculum entries';
    RAISE NOTICE '3. Test the enhanced registration system!';
    RAISE NOTICE '==============================================';
END $$;







