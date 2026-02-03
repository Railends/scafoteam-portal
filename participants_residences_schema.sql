-- Create residences table
CREATE TABLE IF NOT EXISTS public.residences (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    address TEXT NOT NULL,
    city TEXT,
    landlord TEXT,
    capacity INTEGER DEFAULT 0,
    cost DECIMAL(10, 2),
    description TEXT,
    project_id UUID REFERENCES public.projects(id) ON DELETE SET NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Create residence_occupants junction table (history of who lived where)
CREATE TABLE IF NOT EXISTS public.residence_occupants (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    residence_id UUID REFERENCES public.residences(id) ON DELETE CASCADE,
    worker_id UUID REFERENCES public.workers(id) ON DELETE CASCADE,
    start_date DATE NOT NULL,
    end_date DATE,
    notes TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Create project_participants junction table (history of who worked where)
CREATE TABLE IF NOT EXISTS public.project_participants (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    project_id UUID REFERENCES public.projects(id) ON DELETE CASCADE,
    worker_id UUID REFERENCES public.workers(id) ON DELETE CASCADE,
    role TEXT, -- e.g. 'installer', 'foreman'
    start_date DATE NOT NULL,
    end_date DATE,
    status TEXT CHECK (status IN ('active', 'ended')) DEFAULT 'active',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Policies
ALTER TABLE public.residences ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.residence_occupants ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.project_participants ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Allow authenticated read access" ON public.residences FOR SELECT TO authenticated USING (true);
CREATE POLICY "Allow authenticated write access" ON public.residences FOR ALL TO authenticated USING (true);

CREATE POLICY "Allow authenticated read access" ON public.residence_occupants FOR SELECT TO authenticated USING (true);
CREATE POLICY "Allow authenticated write access" ON public.residence_occupants FOR ALL TO authenticated USING (true);

CREATE POLICY "Allow authenticated read access" ON public.project_participants FOR SELECT TO authenticated USING (true);
CREATE POLICY "Allow authenticated write access" ON public.project_participants FOR ALL TO authenticated USING (true);
