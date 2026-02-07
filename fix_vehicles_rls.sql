-- Fix RLS for vehicles table to allow all access during development
DROP POLICY IF EXISTS "Allow authenticated manage vehicles" ON vehicles;

CREATE POLICY "Allow all access to vehicles" ON vehicles
    FOR ALL 
    USING (true)
    WITH CHECK (true);

-- Ensure RLS is still enabled but permissive
ALTER TABLE vehicles ENABLE ROW LEVEL SECURITY;
