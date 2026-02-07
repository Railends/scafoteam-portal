-- Add geolocation columns to projects table
ALTER TABLE public.projects 
ADD COLUMN IF NOT EXISTS site_address TEXT,
ADD COLUMN IF NOT EXISTS lat DECIMAL(10, 8),
ADD COLUMN IF NOT EXISTS lng DECIMAL(11, 8);

-- Add geolocation columns to residences table
ALTER TABLE public.residences 
ADD COLUMN IF NOT EXISTS lat DECIMAL(10, 8),
ADD COLUMN IF NOT EXISTS lng DECIMAL(11, 8);

-- Comment for clarity
COMMENT ON COLUMN public.projects.site_address IS 'Main site address for distance calculations';
COMMENT ON COLUMN public.projects.lat IS 'Latitude of the main site';
COMMENT ON COLUMN public.projects.lng IS 'Longitude of the main site';
COMMENT ON COLUMN public.residences.lat IS 'Latitude of the residence';
COMMENT ON COLUMN public.residences.lng IS 'Longitude of the residence';
