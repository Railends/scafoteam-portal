-- Ensure 'username' column exists in workers table
DO $$ 
BEGIN 
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'workers' AND column_name = 'username') THEN
        ALTER TABLE public.workers ADD COLUMN username TEXT;
        -- Create a unique index for fast lookups and to prevent duplicates
        CREATE UNIQUE INDEX IF NOT EXISTS idx_workers_username ON public.workers(username);
    END IF;
END $$;
