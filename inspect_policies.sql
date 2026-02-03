-- Inspect Active RLS Policies
SELECT 
    schemaname, 
    tablename, 
    policyname, 
    permissive, 
    roles, 
    cmd, 
    qual, 
    with_check 
FROM pg_policies 
WHERE tablename IN ('residences', 'residence_occupants');

-- Check if RLS is actually enabled
SELECT relname, relrowsecurity 
FROM pg_class 
WHERE relname IN ('residences', 'residence_occupants');
