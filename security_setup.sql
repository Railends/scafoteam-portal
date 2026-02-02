-- 1. Create Audit Logs Table
CREATE TABLE IF NOT EXISTS public.audit_logs (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    created_at TIMESTAMPTZ DEFAULT now(),
    user_id UUID REFERENCES auth.users(id),
    action TEXT NOT NULL, -- e.g., 'view_worker_details', 'update_worker', 'delete_document'
    details JSONB,
    ip_address TEXT
);

-- 2. Add user_id to workers table if not exists (for Auth linking)
DO $$ 
BEGIN 
    IF NOT EXISTS (SELECT 1 FROM INFORMATION_SCHEMA.COLUMNS WHERE TABLE_NAME = 'workers' AND COLUMN_NAME = 'user_id') THEN
        ALTER TABLE public.workers ADD COLUMN user_id UUID REFERENCES auth.users(id);
    END IF;
END $$;

-- 3. Enable RLS on all tables
ALTER TABLE public.workers ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.projects ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.clients ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.audit_logs ENABLE ROW LEVEL SECURITY;

-- 4. Create Policies for Workers Table
-- Admin can do everything (assuming admins have 'service_role' or we can check via email if needed, 
-- but usually admin operations are done via service_role in edge functions or we define specific roles).
-- For this setup, we'll allow all authenticated users with 'admin' meta-data OR specific emails to be admins.

-- ADMIN Policy: All access
CREATE POLICY admin_all_access ON public.workers 
    FOR ALL 
    TO authenticated 
    USING (auth.jwt() ->> 'email' IN ('railends@gmail.com', 'admin@scafoteam.fi')); -- Add your admin emails here

-- WORKER Policy: Read and Update ONLY their own data
CREATE POLICY worker_self_access ON public.workers 
    FOR SELECT 
    TO authenticated 
    USING (auth.uid() = user_id);

CREATE POLICY worker_self_update ON public.workers 
    FOR UPDATE 
    TO authenticated 
    USING (auth.uid() = user_id)
    WITH CHECK (auth.uid() = user_id);

-- 5. Policies for Audit Logs
CREATE POLICY admin_view_logs ON public.audit_logs 
    FOR SELECT 
    TO authenticated 
    USING (auth.jwt() ->> 'email' IN ('railends@gmail.com', 'admin@scafoteam.fi'));

CREATE POLICY service_add_logs ON public.audit_logs 
    FOR INSERT 
    TO authenticated 
    WITH CHECK (true); -- Allow insertion of logs during sessions

-- 6. Storage Policies (Run this in the Storage section if possible, or use these SQL commands)
-- Assuming 'documents' bucket exists
-- CREATE POLICY "Owner and Admin can view documents" ON storage.objects
--     FOR SELECT
--     TO authenticated
--     USING (
--         bucket_id = 'documents' AND 
--         (auth.uid()::text = (storage.foldername(name))[1] OR auth.jwt() ->> 'email' IN ('railends@gmail.com', 'admin@scafoteam.fi'))
--     );
