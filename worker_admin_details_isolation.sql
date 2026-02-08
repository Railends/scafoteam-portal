-- SECURITY FIX: Isolate sensitive worker data
-- This script creates a separate table for admin-only worker data.

-- 1. Create the table
CREATE TABLE IF NOT EXISTS public.worker_admin_details (
    worker_id UUID PRIMARY KEY REFERENCES public.workers(id) ON DELETE CASCADE,
    salary_data JSONB DEFAULT '{}'::jsonb,
    private_notes TEXT,
    bank_account TEXT,
    internal_status TEXT,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL,
    updated_by UUID REFERENCES auth.users(id)
);

-- 2. Enable RLS
ALTER TABLE public.worker_admin_details ENABLE ROW LEVEL SECURITY;

-- 3. Define Admin-Only Access
-- We use the same is_admin() function defined earlier
CREATE POLICY admin_manage_details ON public.worker_admin_details
    FOR ALL 
    TO authenticated
    USING ((auth.jwt() -> 'user_metadata' ->> 'role') IN ('admin', 'superadmin'))
    WITH CHECK ((auth.jwt() -> 'user_metadata' ->> 'role') IN ('admin', 'superadmin'));

-- 4. Initial Migration: Move data from workers.admin_data to new table
-- We extract common sensitive fields
INSERT INTO public.worker_admin_details (worker_id, salary_data, bank_account, internal_status)
SELECT 
    id, 
    jsonb_build_object('hourly_rate', admin_data->>'hourlyRate', 'has_per_diem', admin_data->>'hasPerDiem'),
    admin_data->>'bankAccount',
    admin_data->>'status'
FROM public.workers
ON CONFLICT (worker_id) DO NOTHING;

-- 5. Note: We keep administrative flags in workers.admin_data for UI (like projects), 
-- but move the 'PII/Financial' stuff here.
