-- ==============================================
-- CREATE INVOICE TABLES FOR STUDENT REGISTRATIONS
-- This script creates the necessary tables for invoice management
-- ==============================================

-- Check if tables exist first
SELECT 'Checking existing tables...' as info;

-- ==============================================
-- 1. CREATE STUDENT_INVOICES TABLE
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

-- Create indexes for student_invoices
CREATE INDEX IF NOT EXISTS idx_invoices_student ON student_invoices(student_id);
CREATE INDEX IF NOT EXISTS idx_invoices_semester ON student_invoices(semester_id);
CREATE INDEX IF NOT EXISTS idx_invoices_status ON student_invoices(status);
CREATE INDEX IF NOT EXISTS idx_invoices_number ON student_invoices(invoice_number);

-- ==============================================
-- 2. CREATE INVOICE_ITEMS TABLE
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

-- Create indexes for invoice_items
CREATE INDEX IF NOT EXISTS idx_invoice_items_invoice ON invoice_items(invoice_id);
CREATE INDEX IF NOT EXISTS idx_invoice_items_subject ON invoice_items(subject_id);

-- ==============================================
-- 3. ENABLE ROW LEVEL SECURITY
-- ==============================================

ALTER TABLE student_invoices ENABLE ROW LEVEL SECURITY;
ALTER TABLE invoice_items ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if they exist
DROP POLICY IF EXISTS "Anyone can view invoices" ON student_invoices;
DROP POLICY IF EXISTS "Authenticated users can manage invoices" ON student_invoices;
DROP POLICY IF EXISTS "Anyone can view invoice items" ON invoice_items;
DROP POLICY IF EXISTS "Authenticated users can manage invoice items" ON invoice_items;

-- Create RLS policies
CREATE POLICY "Anyone can view invoices" ON student_invoices FOR SELECT USING (true);
CREATE POLICY "Authenticated users can manage invoices" ON student_invoices FOR ALL USING (auth.role() = 'authenticated');

CREATE POLICY "Anyone can view invoice items" ON invoice_items FOR SELECT USING (true);
CREATE POLICY "Authenticated users can manage invoice items" ON invoice_items FOR ALL USING (auth.role() = 'authenticated');

-- ==============================================
-- 4. CREATE HELPER FUNCTIONS
-- ==============================================

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

-- Create trigger for invoice number generation
DROP TRIGGER IF EXISTS generate_invoice_number_trigger ON student_invoices;
CREATE TRIGGER generate_invoice_number_trigger
  BEFORE INSERT ON student_invoices
  FOR EACH ROW EXECUTE FUNCTION generate_invoice_number();

-- ==============================================
-- 5. VERIFICATION
-- ==============================================

-- Check if tables were created successfully
SELECT 'Tables created successfully!' as info;

-- Show table structure
SELECT 
  table_name,
  column_name,
  data_type,
  is_nullable
FROM information_schema.columns 
WHERE table_name IN ('student_invoices', 'invoice_items')
ORDER BY table_name, ordinal_position;

-- Check if we have any existing data
SELECT 
  'student_invoices' as table_name,
  COUNT(*) as record_count 
FROM student_invoices
UNION ALL
SELECT 
  'invoice_items' as table_name,
  COUNT(*) as record_count 
FROM invoice_items;

-- ==============================================
-- 6. SUCCESS MESSAGE
-- ==============================================

DO $$
BEGIN
    RAISE NOTICE '==============================================';
    RAISE NOTICE 'INVOICE TABLES CREATED SUCCESSFULLY!';
    RAISE NOTICE '==============================================';
    RAISE NOTICE 'Tables created:';
    RAISE NOTICE '- student_invoices';
    RAISE NOTICE '- invoice_items';
    RAISE NOTICE '==============================================';
    RAISE NOTICE 'You can now use the invoice management system!';
    RAISE NOTICE '==============================================';
END $$;





