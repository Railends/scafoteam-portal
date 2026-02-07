-- Add apartment_number column to residences table
ALTER TABLE public.residences ADD COLUMN IF NOT EXISTS apartment_number TEXT;

-- Update RLS if needed (usually not required if already allowing all columns)
