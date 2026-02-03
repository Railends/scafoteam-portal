-- Add monthly_rent field to residence_occupants table
ALTER TABLE public.residence_occupants 
ADD COLUMN IF NOT EXISTS monthly_rent DECIMAL(10, 2);

-- Verify the column was added
SELECT column_name, data_type 
FROM information_schema.columns 
WHERE table_name = 'residence_occupants' AND column_name = 'monthly_rent';
