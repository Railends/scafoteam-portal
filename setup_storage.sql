-- Enable the storage extension if not already (standard on Supabase)
-- CREATE EXTENSION IF NOT EXISTS "storage";

-- 1. Create Buckets
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES
  ('worker-documents', 'worker-documents', false, 10485760, ARRAY['application/pdf', 'image/jpeg', 'image/png']), -- 10MB
  ('contract-signatures', 'contract-signatures', false, 5242880, ARRAY['image/png']), -- 5MB
  ('worker-avatars', 'worker-avatars', true, 5242880, ARRAY['image/jpeg', 'image/png']) -- 5MB
ON CONFLICT (id) DO UPDATE SET
  public = EXCLUDED.public,
  file_size_limit = EXCLUDED.file_size_limit,
  allowed_mime_types = EXCLUDED.allowed_mime_types;

-- 2. Enable RLS on objects (Already enabled by default in Supabase, running this as non-owner fails)
-- ALTER TABLE storage.objects ENABLE ROW LEVEL SECURITY;

-- 3. Policies for 'worker-avatars' (Public Read, Admin Write, Worker Write Own?)
-- Allow public read
DROP POLICY IF EXISTS "Public Select Avatars" ON storage.objects;
CREATE POLICY "Public Select Avatars" ON storage.objects
  FOR SELECT USING (bucket_id = 'worker-avatars');

-- Allow Admins and Workers to upload avatars (Worker can update own profile)
DROP POLICY IF EXISTS "Auth Upload Avatars" ON storage.objects;
CREATE POLICY "Auth Upload Avatars" ON storage.objects
  FOR INSERT TO authenticated
  WITH CHECK (bucket_id = 'worker-avatars');
  -- Ideally we'd restrict path to user_id, but for avatars loose is okay for now

DROP POLICY IF EXISTS "Auth Update Avatars" ON storage.objects;
CREATE POLICY "Auth Update Avatars" ON storage.objects
  FOR UPDATE TO authenticated
  USING (bucket_id = 'worker-avatars');

DROP POLICY IF EXISTS "Auth Delete Avatars" ON storage.objects;
CREATE POLICY "Auth Delete Avatars" ON storage.objects
  FOR DELETE TO authenticated
  USING (bucket_id = 'worker-avatars');


-- 4. Policies for 'worker-documents'
-- Path structure: `{user_id}/{filename}`
-- Admin: Full Access
-- Worker: Full Access to own folder

DROP POLICY IF EXISTS "Worker Documents Access" ON storage.objects;
CREATE POLICY "Worker Documents Access" ON storage.objects
  FOR ALL TO authenticated
  USING (
    bucket_id = 'worker-documents' AND (
      -- Is Admin
      (select raw_user_meta_data->>'role' from auth.users where id = auth.uid()) IN ('admin', 'superadmin')
      OR
      -- Is Owner (path starts with user_id)
      (storage.foldername(name))[1] = auth.uid()::text
    )
  )
  WITH CHECK (
    bucket_id = 'worker-documents' AND (
      (select raw_user_meta_data->>'role' from auth.users where id = auth.uid()) IN ('admin', 'superadmin')
      OR
      (storage.foldername(name))[1] = auth.uid()::text
    )
  );


-- 5. Policies for 'contract-signatures'
-- Path structure: `{contract_id}.png` or `{user_id}/{contract_id}.png`?
-- Let's use `{user_id}/{contract_id}.png` for easier RLS.

DROP POLICY IF EXISTS "Signature Access" ON storage.objects;
CREATE POLICY "Signature Access" ON storage.objects
  FOR ALL TO authenticated
  USING (
    bucket_id = 'contract-signatures' AND (
      (select raw_user_meta_data->>'role' from auth.users where id = auth.uid()) IN ('admin', 'superadmin')
      OR
      (storage.foldername(name))[1] = auth.uid()::text
    )
  )
  WITH CHECK (
    bucket_id = 'contract-signatures' AND (
      (select raw_user_meta_data->>'role' from auth.users where id = auth.uid()) IN ('admin', 'superadmin')
      OR
      (storage.foldername(name))[1] = auth.uid()::text
    )
  );
