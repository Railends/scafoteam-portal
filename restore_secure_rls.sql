-- 1. Re-enable RLS (Turn the security system back ON)
ALTER TABLE public.residences ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.residence_occupants ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.project_participants ENABLE ROW LEVEL SECURITY;

-- 2. Drop any old/broken policies to start clean
DROP POLICY IF EXISTS "Enable all for authenticated" ON public.residences;
DROP POLICY IF EXISTS "Allow authenticated read access" ON public.residences;
DROP POLICY IF EXISTS "Allow authenticated insert access" ON public.residences;
DROP POLICY IF EXISTS "Allow authenticated update access" ON public.residences;
DROP POLICY IF EXISTS "Allow authenticated delete access" ON public.residences;

DROP POLICY IF EXISTS "Enable all for authenticated" ON public.residence_occupants;
DROP POLICY IF EXISTS "Allow authenticated read access" ON public.residence_occupants;
DROP POLICY IF EXISTS "Allow authenticated insert access" ON public.residence_occupants;

DROP POLICY IF EXISTS "Enable all for authenticated" ON public.project_participants;
DROP POLICY IF EXISTS "Allow authenticated read access" ON public.project_participants;

-- 3. Create the "Golden Key" Policies
-- These policies explicitly tell Supabase: "If the user is logged in (authenticated), allow them to do EVERYTHING (Select, Insert, Update, Delete)"

-- Policy for Residences
CREATE POLICY "admin_full_access_policy" ON public.residences
    FOR ALL
    TO authenticated
    USING (true)
    WITH CHECK (true);

-- Policy for Residence Occupants
CREATE POLICY "admin_full_access_policy" ON public.residence_occupants
    FOR ALL
    TO authenticated
    USING (true)
    WITH CHECK (true);

-- Policy for Project Participants
CREATE POLICY "admin_full_access_policy" ON public.project_participants
    FOR ALL
    TO authenticated
    USING (true)
    WITH CHECK (true);
