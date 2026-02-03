-- Add project_id column to residences table if it doesn't exist
ALTER TABLE public.residences 
ADD COLUMN IF NOT EXISTS project_id UUID REFERENCES public.projects(id) ON DELETE SET NULL;

-- Verify it exists
SELECT column_name 
FROM information_schema.columns 
WHERE table_name = 'residences' AND column_name = 'project_id';
