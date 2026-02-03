-- Alternative: Allow anon users (less secure, but works with current setup)
-- Only use this if you DON'T want to use Service Role Key

DROP POLICY IF EXISTS "admin_full_access_policy" ON public.residences;
DROP POLICY IF EXISTS "admin_full_access_policy" ON public.residence_occupants;

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
