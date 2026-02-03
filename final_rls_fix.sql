-- Disable and Re-Enable RLS to ensure clean state
ALTER TABLE public.residences DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.residences ENABLE ROW LEVEL SECURITY;

ALTER TABLE public.residence_occupants DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.residence_occupants ENABLE ROW LEVEL SECURITY;

ALTER TABLE public.project_participants DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.project_participants ENABLE ROW LEVEL SECURITY;

-- Drop ALL existing policies to avoid any conflicts (even ones with different names)
DROP POLICY IF EXISTS "Allow authenticated read access" ON public.residences;
DROP POLICY IF EXISTS "Allow authenticated write access" ON public.residences;
DROP POLICY IF EXISTS "Allow authenticated insert access" ON public.residences;
DROP POLICY IF EXISTS "Allow authenticated update access" ON public.residences;
DROP POLICY IF EXISTS "Allow authenticated delete access" ON public.residences;
DROP POLICY IF EXISTS "Enable all for authenticated" ON public.residences;

DROP POLICY IF EXISTS "Allow authenticated read access" ON public.residence_occupants;
DROP POLICY IF EXISTS "Allow authenticated write access" ON public.residence_occupants;
DROP POLICY IF EXISTS "Allow authenticated insert access" ON public.residence_occupants;
DROP POLICY IF EXISTS "Allow authenticated update access" ON public.residence_occupants;
DROP POLICY IF EXISTS "Allow authenticated delete access" ON public.residence_occupants;
DROP POLICY IF EXISTS "Enable all for authenticated" ON public.residence_occupants;

DROP POLICY IF EXISTS "Allow authenticated read access" ON public.project_participants;
DROP POLICY IF EXISTS "Allow authenticated write access" ON public.project_participants;
DROP POLICY IF EXISTS "Allow authenticated insert access" ON public.project_participants;
DROP POLICY IF EXISTS "Allow authenticated update access" ON public.project_participants;
DROP POLICY IF EXISTS "Allow authenticated delete access" ON public.project_participants;
DROP POLICY IF EXISTS "Enable all for authenticated" ON public.project_participants;

-- Create ONE comprehensive policy for each table
CREATE POLICY "Enable all for authenticated" ON public.residences
    FOR ALL TO authenticated
    USING (true)
    WITH CHECK (true);

CREATE POLICY "Enable all for authenticated" ON public.residence_occupants
    FOR ALL TO authenticated
    USING (true)
    WITH CHECK (true);

CREATE POLICY "Enable all for authenticated" ON public.project_participants
    FOR ALL TO authenticated
    USING (true)
    WITH CHECK (true);
