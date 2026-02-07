-- Migration: Add Fleet Management (Vehicles)
-- Description: Creates the vehicles table to store fleet information and link them to workers and residences.

CREATE TABLE IF NOT EXISTS vehicles (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    make TEXT NOT NULL,
    model TEXT NOT NULL,
    plate_number TEXT UNIQUE NOT NULL,
    vin TEXT,
    inspection_expiry DATE,
    owner TEXT,
    holder_id UUID REFERENCES workers(id) ON DELETE SET NULL,
    documents JSONB DEFAULT '[]',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Index for faster holder lookups
CREATE INDEX IF NOT EXISTS idx_vehicles_holder ON vehicles(holder_id);

-- Enable RLS
ALTER TABLE vehicles ENABLE ROW LEVEL SECURITY;

-- Allow authenticated users to manage vehicles (simplified for admin panel)
CREATE POLICY "Allow authenticated manage vehicles" ON vehicles
    FOR ALL USING (auth.role() = 'authenticated');
