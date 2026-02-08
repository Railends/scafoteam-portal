-- SECURITY UPDATE: STORAGE & FIELD-LEVEL PROTECTION
-- Run this in Supabase SQL Editor

-- 1. SECURE STORAGE BUCKET 'documents'
-- Ensure the bucket exists and is private (public=false)
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES ('documents', 'documents', false, 52428800, ARRAY['application/pdf', 'image/jpeg', 'image/png']) -- 50MB limit
ON CONFLICT (id) DO UPDATE SET public = false;

-- Policies for 'documents' bucket
DROP POLICY IF EXISTS "Admin Full Access Documents" ON storage.objects;
CREATE POLICY "Admin Full Access Documents" ON storage.objects
    FOR ALL TO authenticated
    USING (
        bucket_id = 'documents' AND 
        (auth.jwt() -> 'user_metadata' ->> 'role') IN ('admin', 'superadmin')
    )
    WITH CHECK (
        bucket_id = 'documents' AND 
        (auth.jwt() -> 'user_metadata' ->> 'role') IN ('admin', 'superadmin')
    );

DROP POLICY IF EXISTS "Worker Own Documents Access" ON storage.objects;
CREATE POLICY "Worker Own Documents Access" ON storage.objects
    FOR SELECT TO authenticated
    USING (
        bucket_id = 'documents' AND 
        (storage.foldername(name))[1] = auth.uid()::text
    );

-- 2. ENHANCE SENSITIVE DATA ISOLATION
-- Ensure the table for sensitive details has all required fields
ALTER TABLE public.worker_admin_details 
ADD COLUMN IF NOT EXISTS personal_id TEXT,
ADD COLUMN IF NOT EXISTS finnish_id TEXT,
ADD COLUMN IF NOT EXISTS tax_number TEXT,
ADD COLUMN IF NOT EXISTS bank_account TEXT,
ADD COLUMN IF NOT EXISTS bic_code TEXT;

-- Migrate data from 'workers' table to 'worker_admin_details'
-- (Only for rows that don't already have details)
INSERT INTO public.worker_admin_details (worker_id, personal_id, finnish_id, tax_number, bank_account, bic_code)
SELECT id, personal_id, finnish_id, tax_number, bank_account, bic_code
FROM public.workers
ON CONFLICT (worker_id) DO UPDATE SET
    personal_id = EXCLUDED.personal_id,
    finnish_id = EXCLUDED.finnish_id,
    tax_number = EXCLUDED.tax_number,
    bank_account = EXCLUDED.bank_account,
    bic_code = EXCLUDED.bic_code;

-- 3. CREATE SECURE VIEW
-- This view should be used in the UI for non-admin contexts (if any)
-- or even for admins to reduce exposure.
CREATE OR REPLACE VIEW public.workers_safe AS
SELECT 
    id, name, surname, email, phone, status, 
    address, nationality, experience_type, 
    experience_duration, has_green_card, green_card_expiry,
    has_vas, has_hotworks, driving_licence,
    jacket_size, pants_size, waist_size, boots_size,
    created_at
FROM public.workers;

-- 4. SETTINGS FOR NOTIFICATIONS
-- Used to track if daily email was sent
INSERT INTO public.settings (id, value)
VALUES ('last_alert_email_date', '"2000-01-01"')
ON CONFLICT (id) DO NOTHING;

-- Policy to allow admins to read/write settings
DROP POLICY IF EXISTS "Admins manage settings" ON public.settings;
CREATE POLICY "Admins manage settings" ON public.settings
    FOR ALL TO authenticated
    USING ((auth.jwt() -> 'user_metadata' ->> 'role') IN ('admin', 'superadmin'));
