-- Forcefully Apply Policies
-- 1. Ensure RLS is ON
ALTER TABLE public.residences ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.residence_occupants ENABLE ROW LEVEL SECURITY;

-- 2. Drop the policy if it exists (to prevent "already exists" error)
DROP POLICY IF EXISTS "admin_full_access_policy" ON public.residences;
DROP POLICY IF EXISTS "admin_full_access_policy" ON public.residence_occupants;

-- 3. Create the policy explicitly
CREATE POLICY "admin_full_access_policy" 
ON public.residences 
FOR ALL 
TO authenticated 
USING (true) 
WITH CHECK (true);

CREATE POLICY "admin_full_access_policy" 
ON public.residence_occupants 
FOR ALL 
TO authenticated 
USING (true) 
WITH CHECK (true);

-- 4. Verify policies immediately
SELECT table_name, policy_name, cmd 
FROM information_schema.policies 
WHERE table_name IN ('residences', 'residence_occupants');
