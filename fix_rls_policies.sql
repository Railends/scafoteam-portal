-- Drop existing policies to avoid conflicts
DROP POLICY IF EXISTS "Allow authenticated read access" ON public.residences;
DROP POLICY IF EXISTS "Allow authenticated write access" ON public.residences;
DROP POLICY IF EXISTS "Allow authenticated read access" ON public.residence_occupants;
DROP POLICY IF EXISTS "Allow authenticated write access" ON public.residence_occupants;
DROP POLICY IF EXISTS "Allow authenticated read access" ON public.project_participants;
DROP POLICY IF EXISTS "Allow authenticated write access" ON public.project_participants;

-- Re-create policies with explicit WITH CHECK for inserts
-- Residences
CREATE POLICY "Allow authenticated read access" ON public.residences 
    FOR SELECT TO authenticated USING (true);

CREATE POLICY "Allow authenticated insert access" ON public.residences 
    FOR INSERT TO authenticated WITH CHECK (true);

CREATE POLICY "Allow authenticated update access" ON public.residences 
    FOR UPDATE TO authenticated USING (true) WITH CHECK (true);

CREATE POLICY "Allow authenticated delete access" ON public.residences 
    FOR DELETE TO authenticated USING (true);

-- Residence Occupants
CREATE POLICY "Allow authenticated read access" ON public.residence_occupants 
    FOR SELECT TO authenticated USING (true);

CREATE POLICY "Allow authenticated insert access" ON public.residence_occupants 
    FOR INSERT TO authenticated WITH CHECK (true);

CREATE POLICY "Allow authenticated update access" ON public.residence_occupants 
    FOR UPDATE TO authenticated USING (true) WITH CHECK (true);

CREATE POLICY "Allow authenticated delete access" ON public.residence_occupants 
    FOR DELETE TO authenticated USING (true);

-- Project Participants
CREATE POLICY "Allow authenticated read access" ON public.project_participants 
    FOR SELECT TO authenticated USING (true);

CREATE POLICY "Allow authenticated insert access" ON public.project_participants 
    FOR INSERT TO authenticated WITH CHECK (true);

CREATE POLICY "Allow authenticated update access" ON public.project_participants 
    FOR UPDATE TO authenticated USING (true) WITH CHECK (true);

CREATE POLICY "Allow authenticated delete access" ON public.project_participants 
    FOR DELETE TO authenticated USING (true);
