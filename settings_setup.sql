-- Create settings table
CREATE TABLE IF NOT EXISTS public.settings (
    id TEXT PRIMARY KEY,
    value JSONB NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL,
    updated_by UUID REFERENCES auth.users(id)
);

-- Enable RLS
ALTER TABLE public.settings ENABLE ROW LEVEL SECURITY;

-- Policies for settings
CREATE POLICY "Allow public read-access to settings"
    ON public.settings FOR SELECT
    USING (true);

CREATE POLICY "Allow admins to manage settings"
    ON public.settings FOR ALL
    USING (
        EXISTS (
            SELECT 1 FROM public.workers
            WHERE id = auth.uid() AND role = 'admin'
        )
    );

-- Insert initial announcement setting
INSERT INTO public.settings (id, value)
VALUES ('announcement', '{"text": "SCAFOTEAM MEKLĒ PIEREDZĒJUŠUS SASTATŅU MONTĒTĀJUS UN IZOLĒTĀJUS! PIESAKIES TŪLĪT."}')
ON CONFLICT (id) DO NOTHING;
