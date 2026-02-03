-- Quick Fix: Allow anon users to bypass RLS
-- This works because your app uses the anon key

DROP POLICY IF EXISTS "admin_full_access_policy" ON public.residences;
DROP POLICY IF EXISTS "admin_full_access_policy" ON public.residence_occupants;
DROP POLICY IF EXISTS "admin_full_access_policy" ON public.project_participants;

CREATE POLICY "admin_full_access_policy" 
ON public.residences 
FOR ALL 
TO anon, authenticated 
USING (true) 
WITH CHECK (true);

CREATE POLICY "admin_full_access_policy" 
ON public.residence_occupants 
FOR ALL 
TO anon, authenticated 
USING (true) 
WITH CHECK (true);

CREATE POLICY "admin_full_access_policy" 
ON public.project_participants 
FOR ALL 
TO anon, authenticated 
USING (true) 
WITH CHECK (true);

-- Verify
SELECT tablename, policyname, roles 
FROM pg_policies 
WHERE tablename IN ('residences', 'residence_occupants', 'project_participants');
