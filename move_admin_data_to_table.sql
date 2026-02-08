-- Migration script to move sensitive worker data to a separate table
-- This allows for better security using RLS, restricted to admins only

-- 1. Create the new table
CREATE TABLE IF NOT EXISTS public.worker_admin_info (
    id UUID PRIMARY KEY REFERENCES public.workers(id) ON DELETE CASCADE,
    personal_id TEXT,
    bank_account TEXT,
    bic_code TEXT,
    tax_number TEXT,
    finnish_id TEXT,
    hourly_rate NUMERIC,
    has_per_diem BOOLEAN DEFAULT false,
    address TEXT,
    driving_licence TEXT,
    has_green_card BOOLEAN DEFAULT false,
    green_card_show BOOLEAN DEFAULT false,
    green_card_expiry DATE,
    has_vas BOOLEAN DEFAULT false,
    has_hotworks BOOLEAN DEFAULT false,
    hotworks_type TEXT,
    hotworks_expiry DATE,
    clothing_sizes JSONB DEFAULT '{}'::jsonb,
    internal_notes TEXT,
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.worker_admin_info ENABLE ROW LEVEL SECURITY;

-- 2. Migrate existing data from workers.admin_data
INSERT INTO public.worker_admin_info (
    id,
    personal_id,
    bank_account,
    bic_code,
    tax_number,
    finnish_id,
    hourly_rate,
    has_per_diem,
    address,
    driving_licence,
    has_green_card,
    green_card_show,
    green_card_expiry,
    has_vas,
    has_hotworks,
    hotworks_type,
    hotworks_expiry,
    clothing_sizes
)
SELECT
    id,
    admin_data->>'personalId',
    admin_data->>'bankAccount',
    admin_data->>'bicCode',
    admin_data->>'taxNumber',
    admin_data->>'finnishId',
    (admin_data->>'hourlyRate')::NUMERIC,
    (admin_data->>'hasPerDiem')::BOOLEAN,
    admin_data->>'address',
    admin_data->>'drivingLicence',
    (admin_data->>'hasGreenCard')::BOOLEAN,
    (admin_data->>'greenCardShow')::BOOLEAN,
    (admin_data->>'greenCardExpiry')::DATE,
    (admin_data->>'hasVas')::BOOLEAN,
    (admin_data->>'hasHotworks')::BOOLEAN,
    admin_data->>'hotworksType',
    (admin_data->>'hotworksExpiry')::DATE,
    jsonb_build_object(
        'bootSize', admin_data->'bootSize',
        'jacketSize', admin_data->'jacketSize',
        'trouserSize', admin_data->'trouserSize'
    )
FROM public.workers
ON CONFLICT (id) DO NOTHING;

-- 3. Create RLS Policies
-- Only admins and superadmins can see/edit this table
CREATE POLICY "Admins can manage worker admin info" ON public.worker_admin_info
    FOR ALL
    USING (
        (auth.jwt() ->> 'user_metadata')::jsonb ->> 'role' IN ('admin', 'superadmin')
    )
    WITH CHECK (
        (auth.jwt() ->> 'user_metadata')::jsonb ->> 'role' IN ('admin', 'superadmin')
    );

-- 4. Clean up workers table (optional: keep admin_data for now to avoid breaking existing code until store is updated)
-- COMMENTED OUT: ALTER TABLE public.workers DROP COLUMN admin_data;
