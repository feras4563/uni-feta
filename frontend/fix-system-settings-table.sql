-- Fix System Settings Table
-- This script ensures the system_settings table exists with the correct structure

-- 1. Drop the table if it exists (to start fresh)
DROP TABLE IF EXISTS system_settings CASCADE;

-- 2. Create the system_settings table with correct structure
CREATE TABLE system_settings (
    id TEXT PRIMARY KEY DEFAULT 'main',
    app_logo_url TEXT,
    app_logo_name TEXT,
    app_name TEXT DEFAULT 'UniERP Horizon',
    app_version TEXT DEFAULT '1.0.0',
    theme_color TEXT DEFAULT '#059669',
    language TEXT DEFAULT 'ar',
    timezone TEXT DEFAULT 'Asia/Riyadh',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 3. Create storage bucket for system assets (if it doesn't exist)
INSERT INTO storage.buckets (id, name, public)
VALUES ('system-assets', 'system-assets', true)
ON CONFLICT (id) DO NOTHING;

-- 4. Enable RLS on system_settings
ALTER TABLE system_settings ENABLE ROW LEVEL SECURITY;

-- 5. Create simple RLS policies
DROP POLICY IF EXISTS "Anyone can view system settings" ON system_settings;
CREATE POLICY "Anyone can view system settings" ON system_settings
    FOR SELECT USING (true);

DROP POLICY IF EXISTS "Authenticated users can update system settings" ON system_settings;
CREATE POLICY "Authenticated users can update system settings" ON system_settings
    FOR UPDATE USING (true);

DROP POLICY IF EXISTS "Authenticated users can insert system settings" ON system_settings;
CREATE POLICY "Authenticated users can insert system settings" ON system_settings
    FOR INSERT WITH CHECK (true);

-- 6. Create RLS policies for storage
DROP POLICY IF EXISTS "Anyone can view system assets" ON storage.objects;
CREATE POLICY "Anyone can view system assets" ON storage.objects
    FOR SELECT USING (bucket_id = 'system-assets');

DROP POLICY IF EXISTS "Authenticated users can upload system assets" ON storage.objects;
CREATE POLICY "Authenticated users can upload system assets" ON storage.objects
    FOR INSERT WITH CHECK (
        bucket_id = 'system-assets' 
        AND auth.role() = 'authenticated'
    );

DROP POLICY IF EXISTS "Authenticated users can update system assets" ON storage.objects;
CREATE POLICY "Authenticated users can update system assets" ON storage.objects
    FOR UPDATE USING (
        bucket_id = 'system-assets' 
        AND auth.role() = 'authenticated'
    );

DROP POLICY IF EXISTS "Authenticated users can delete system assets" ON storage.objects;
CREATE POLICY "Authenticated users can delete system assets" ON storage.objects
    FOR DELETE USING (
        bucket_id = 'system-assets' 
        AND auth.role() = 'authenticated'
    );

-- 7. Create trigger for updated_at
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

DROP TRIGGER IF EXISTS update_system_settings_updated_at ON system_settings;
CREATE TRIGGER update_system_settings_updated_at 
    BEFORE UPDATE ON system_settings 
    FOR EACH ROW 
    EXECUTE FUNCTION update_updated_at_column();

-- 8. Insert default settings
INSERT INTO system_settings (id, app_name, app_version, theme_color, language, timezone)
VALUES ('main', 'UniERP Horizon', '1.0.0', '#059669', 'ar', 'Asia/Riyadh');

-- 9. Verify table structure
SELECT column_name, data_type, is_nullable, column_default
FROM information_schema.columns 
WHERE table_name = 'system_settings'
ORDER BY ordinal_position;

-- 10. Verify data was inserted
SELECT * FROM system_settings;

SELECT 'system_settings table created and populated successfully!' as status;
