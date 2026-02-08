-- Create a test worker with pending status
-- This simulates a registration so the admin can "Approve" it.

DO $$
DECLARE
  new_user_id UUID := gen_random_uuid();
  email TEXT := 'test.worker@scafoteam.fi';
BEGIN
  -- 1. Create a placeholder in auth.users (so we have a valid ID for foreign keys)
  -- Note: We can't easily create a valid auth user with password hash here without pgcrypto, 
  -- but we can create one with a dummy password hash.
  -- The "Approve" action will OVERWRITE this password anyway using our new RPC!
  
  INSERT INTO auth.users (id, email, encrypted_password, email_confirmed_at, raw_user_meta_data)
  VALUES (
    new_user_id,
    email,
    crypt('temporary123', gen_salt('bf')), -- Temporary dummy password
    now(),
    '{"name": "Test", "surname": "Worker", "role": "worker"}'::jsonb
  );

  -- 2. Create the worker profile
  INSERT INTO public.workers (id, email, username, name, surname, status, created_at)
  VALUES (
    new_user_id,
    email,
    'testworker',
    'Test',
    'Worker',
    'pending',
    now()
  );

END $$;
