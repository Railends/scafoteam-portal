-- SECURITY AND GDPR POLICY UPDATE
-- This script hardens the database by enforcing strict RLS and RBAC.

-- 1. Ensure RLS is enabled on all tables
ALTER TABLE public.workers ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.audit_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.projects ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.clients ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.residences ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.residence_occupants ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.project_participants ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.templates ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.trainings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.training_participants ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.vehicles ENABLE ROW LEVEL SECURITY;

-- 2. Drop all overly permissive policies (Cleanup)
DROP POLICY IF EXISTS "Enable all for authenticated" ON public.residences;
DROP POLICY IF EXISTS "Enable all for authenticated" ON public.residence_occupants;
DROP POLICY IF EXISTS "Enable all for authenticated" ON public.project_participants;
DROP POLICY IF EXISTS "admin_full_access_policy" ON public.residences;
DROP POLICY IF EXISTS "admin_full_access_policy" ON public.residence_occupants;
DROP POLICY IF EXISTS "admin_full_access_policy" ON public.project_participants;
DROP POLICY IF EXISTS "admin_all_access" ON public.workers;

-- 3. Define ADMIN Access (Unified Policy)
-- We check for 'admin' or 'superadmin' role in JWT metadata
CREATE OR REPLACE FUNCTION is_admin() RETURNS BOOLEAN AS $$
BEGIN
    RETURN (auth.jwt() -> 'user_metadata' ->> 'role') IN ('admin', 'superadmin');
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 4. Apply Admin Policies to all tables
DO $$
DECLARE
    t TEXT;
BEGIN
    FOR t IN SELECT tablename FROM pg_tables WHERE schemaname = 'public' 
    LOOP
        EXECUTE format('DROP POLICY IF EXISTS admin_all ON public.%I', t);
        EXECUTE format('CREATE POLICY admin_all ON public.%I FOR ALL TO authenticated USING (is_admin()) WITH CHECK (is_admin())', t);
    END LOOP;
END $$;

-- 5. Define WORKER Access (Self-service per GDPR)
-- Workers can view and edit their OWN data in the workers table
DROP POLICY IF EXISTS worker_self_access ON public.workers;
CREATE POLICY worker_self_access ON public.workers 
    FOR SELECT TO authenticated 
    USING (auth.uid() = id);

DROP POLICY IF EXISTS worker_self_update ON public.workers;
CREATE POLICY worker_self_update ON public.workers 
    FOR UPDATE TO authenticated 
    USING (auth.uid() = id)
    WITH CHECK (auth.uid() = id);

-- Workers can view their own assignments
DROP POLICY IF EXISTS worker_participant_access ON public.project_participants;
CREATE POLICY worker_participant_access ON public.project_participants 
    FOR SELECT TO authenticated 
    USING (auth.uid() = worker_id);

-- Workers can view their own training records
DROP POLICY IF EXISTS worker_training_access ON public.training_participants;
CREATE POLICY worker_training_access ON public.training_participants 
    FOR SELECT TO authenticated 
    USING (auth.uid() = worker_id);

-- 6. PUBLIC/ANON access for registration
-- Only allow INSERT to workers for new registrations
DROP POLICY IF EXISTS allow_anon_registration ON public.workers;
CREATE POLICY allow_anon_registration ON public.workers 
    FOR INSERT TO anon, authenticated 
    WITH CHECK (true);

-- 7. Private Storage for sensitive documents
-- Ensure a bucket named 'worker-docs' exists and is set to PRIVATE in Supabase.
-- Policy: Only owner (worker) or admin can view/manage.

DROP POLICY IF EXISTS "Owner and Admin can manage documents" ON storage.objects;
CREATE POLICY "Owner and Admin can manage documents" ON storage.objects
    FOR ALL TO authenticated
    USING (
        bucket_id = 'worker-docs' AND 
        (auth.uid()::text = (storage.foldername(name))[1] OR is_admin())
    )
    WITH CHECK (
        bucket_id = 'worker-docs' AND 
        (auth.uid()::text = (storage.foldername(name))[1] OR is_admin())
    );

-- 8. Audit Logging (Service Side)
DROP POLICY IF EXISTS worker_add_logs ON public.audit_logs;
CREATE POLICY worker_add_logs ON public.audit_logs 
    FOR INSERT TO authenticated 
    WITH CHECK (auth.uid() = user_id OR user_id IS NULL);
