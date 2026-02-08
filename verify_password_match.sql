-- Verify if the stored hash actually matches the password we think it is.
-- We take the obfuscated password from admin_data, decode it, and check against encrypted_password.

DO $$
DECLARE
  v_user_email TEXT := 'railends.lipskis@gmail.com';
  v_obf_password TEXT;
  v_real_password TEXT;
  v_encrypted_password TEXT;
  v_is_match BOOLEAN;
BEGIN
  -- 1. Get the obfuscated password from workers table
  SELECT admin_data->>'password' INTO v_obf_password
  FROM workers
  WHERE id IN (SELECT id FROM auth.users WHERE email = v_user_email);

  IF v_obf_password IS NULL THEN
     RAISE NOTICE 'No stored password found in admin_data for %', v_user_email;
     RETURN;
  END IF;

  -- 2. Decode it (It is 'obf:' + base64(password))
  -- Remove 'obf:' prefix (first 4 chars)
  v_obf_password := substring(v_obf_password from 5);
  
  -- Decode Base64 (using pgcrypto's decode is tricky for text, we try detailed approach or assume standard)
  -- Supabase doesn't have a direct atomic "base64_to_text" function in standard SQL easily without encode/decode bytea.
  -- Let's try to reconstruct:
  BEGIN
    v_real_password := convert_from(decode(v_obf_password, 'base64'), 'UTF8');
  EXCEPTION WHEN OTHERS THEN
    RAISE NOTICE 'Failed to decode password: %', v_obf_password;
    RETURN;
  END;

  RAISE NOTICE 'Decoded Password candidate: %', v_real_password;

  -- 3. Get actual Auth hash
  SELECT encrypted_password INTO v_encrypted_password
  FROM auth.users
  WHERE email = v_user_email;

  -- 4. Verify match using pgcrypto
  -- crypt(plaintext, hash) should equal hash if they match
  IF v_encrypted_password = crypt(v_real_password, v_encrypted_password) THEN
      RAISE NOTICE 'SUCCESS: The password "%" CORRECTLY matches the stored hash.', v_real_password;
  ELSE
      RAISE NOTICE 'FAILURE: The password "%" DOES NOT match the stored hash.', v_real_password;
      RAISE NOTICE 'Hash stored: %', v_encrypted_password;
      RAISE NOTICE 'Hash generated from candidate: %', crypt(v_real_password, gen_salt('bf'));
  END IF;

END $$;
