-- Check status of the specific user
DO $$
DECLARE
  v_email TEXT := 'railends.lipskis@gmail.com';
  v_auth_user auth.users%ROWTYPE;
  v_worker public.workers%ROWTYPE;
BEGIN
  RAISE NOTICE 'Checking user: %', v_email;

  -- 1. Check Auth User
  SELECT * INTO v_auth_user FROM auth.users WHERE email = v_email;
  
  IF FOUND THEN
    RAISE NOTICE 'Auth User FOUND via email. ID: %, Confirmed: %, Last Sign In: %', 
      v_auth_user.id, v_auth_user.email_confirmed_at, v_auth_user.last_sign_in_at;
  ELSE
    RAISE NOTICE 'Auth User NOT FOUND via email.';
  END IF;

  -- 2. Check Worker Profile
  SELECT * INTO v_worker FROM public.workers WHERE email = v_email;
  
  IF FOUND THEN
    RAISE NOTICE 'Worker Profile FOUND. ID: %, Status: %, Username: %', 
      v_worker.id, v_worker.status, v_worker.username;
  ELSE
    RAISE NOTICE 'Worker Profile NOT FOUND.';
  END IF;

  -- 3. Mismatch check
  IF v_auth_user.id IS DISTINCT FROM v_worker.id THEN
      RAISE NOTICE 'WARNING: Auth ID (%) and Worker ID (%) DO NOT MATCH!', v_auth_user.id, v_worker.id;
  END IF;

END $$;
