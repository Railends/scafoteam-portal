-- Test pgcrypto functionality
-- This checks if we can generate a hash and verify it within the same block.
-- If this fails, pgcrypto is broken or not installed correctly in the search path.

DO $$
DECLARE
  v_plain TEXT := '387242';
  v_hash TEXT;
BEGIN
  RAISE NOTICE 'Testing pgcrypto with password: %', v_plain;

  -- 1. Generate Hash
  v_hash := crypt(v_plain, gen_salt('bf'));
  RAISE NOTICE 'Generated Hash: %', v_hash;

  -- 2. Verify Match
  IF v_hash = crypt(v_plain, v_hash) THEN
      RAISE NOTICE 'SUCCESS: pgcrypto works correctly. Hash verifies.';
  ELSE
      RAISE NOTICE 'FAILURE: pgcrypto failed. Hash does not verify against itself.';
  END IF;

  -- 3. Verify Mismatch (sanity check)
  IF v_hash = crypt('wrongpassword', v_hash) THEN
      RAISE NOTICE 'FAILURE: Verified wrong password incorrectly!';
  ELSE
      RAISE NOTICE 'SUCCESS: Wrong password correctly rejected.';
  END IF;

END $$;
