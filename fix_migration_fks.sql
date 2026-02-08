-- FIX: Allow worker ID updates (migration) by adding ON UPDATE CASCADE to all Foreign Keys
-- This script finds all tables that reference workers(id) and ensures that
-- when we update a worker's ID (to match Supabase Auth UID), the references update automatically.

DO $$
DECLARE
    r RECORD;
    delete_action TEXT;
BEGIN
    FOR r IN (
        SELECT 
            tc.table_name, 
            kcu.column_name, 
            tc.constraint_name
        FROM 
            information_schema.table_constraints AS tc 
            JOIN information_schema.key_column_usage AS kcu
              ON tc.constraint_name = kcu.constraint_name
              AND tc.table_schema = kcu.table_schema
            JOIN information_schema.constraint_column_usage AS ccu
              ON ccu.constraint_name = tc.constraint_name
              AND ccu.table_schema = tc.table_schema
        WHERE tc.constraint_type = 'FOREIGN KEY' 
          AND ccu.table_name = 'workers'
          AND ccu.column_name = 'id'
          AND tc.table_schema = 'public'
    ) LOOP
        -- Decide on delete action
        IF r.table_name = 'vehicles' THEN
            delete_action := 'SET NULL';
        ELSE
            delete_action := 'CASCADE';
        END IF;

        RAISE NOTICE 'Updating constraint % on table % (Delete action: %)', r.constraint_name, r.table_name, delete_action;
        EXECUTE format('ALTER TABLE public.%I DROP CONSTRAINT %I', r.table_name, r.constraint_name);
        EXECUTE format('ALTER TABLE public.%I ADD CONSTRAINT %I FOREIGN KEY (%I) REFERENCES public.workers(id) ON UPDATE CASCADE ON DELETE %s', r.table_name, r.constraint_name, r.column_name, delete_action);
    END LOOP;
END $$;
