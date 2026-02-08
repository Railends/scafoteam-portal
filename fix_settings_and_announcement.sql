-- FIX: Settings table and Announcement Bar policies
-- This script ensures the settings table exists and has proper RLS using the new is_admin() function.

-- 1. Create table if missing
CREATE TABLE IF NOT EXISTS public.settings (
    id TEXT PRIMARY KEY,
    value JSONB NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL,
    updated_by UUID REFERENCES auth.users(id)
);

-- 2. Enable RLS
ALTER TABLE public.settings ENABLE ROW LEVEL SECURITY;

-- 3. Drop old policies
DROP POLICY IF EXISTS "Allow public read-access to settings" ON public.settings;
DROP POLICY IF EXISTS "Allow admins to manage settings" ON public.settings;
DROP POLICY IF EXISTS "admin_all" ON public.settings;

-- 4. Create new policies based on the unified is_admin() helper
-- (Assuming is_admin() is already defined in the database by update_security_policies.sql)

CREATE POLICY "Allow public read-access to settings"
    ON public.settings FOR SELECT
    TO public
    USING (true);

-- Use the same naming convention as other tables
CREATE POLICY admin_all ON public.settings 
    FOR ALL 
    TO authenticated 
    USING (
        (auth.jwt() -> 'user_metadata' ->> 'role') IN ('admin', 'superadmin')
    )
    WITH CHECK (
        (auth.jwt() -> 'user_metadata' ->> 'role') IN ('admin', 'superadmin')
    );

-- 5. Ensure initial record exists
INSERT INTO public.settings (id, value)
VALUES ('announcement', '{"text": "SCAFOTEAM MEKLĒ PIEREDZĒJUŠUS SASTATŅU MONTĒTĀJUS UN IZOLĒTĀJUS! PIESAKIES TŪLĪT."}')
ON CONFLICT (id) DO NOTHING;
