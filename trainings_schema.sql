-- Create trainings table
CREATE TABLE IF NOT EXISTS public.trainings (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    title TEXT NOT NULL,
    date DATE NOT NULL,
    duration TEXT,
    instructor TEXT,
    status TEXT CHECK (status IN ('upcoming', 'completed', 'cancelled')) DEFAULT 'upcoming',
    description TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Create training_participants table linked to workers
CREATE TABLE IF NOT EXISTS public.training_participants (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    training_id UUID REFERENCES public.trainings(id) ON DELETE CASCADE,
    worker_id UUID REFERENCES public.workers(id) ON DELETE CASCADE,
    status TEXT CHECK (status IN ('registered', 'attended', 'failed', 'cancelled')) DEFAULT 'registered',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    UNIQUE(training_id, worker_id)
);

-- Enable RLS
ALTER TABLE public.trainings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.training_participants ENABLE ROW LEVEL SECURITY;

-- Policies (Adjust based on your actual requirement, assuming authenticated users can read/write for now)
CREATE POLICY "Allow authenticated read access" ON public.trainings FOR SELECT TO authenticated USING (true);
CREATE POLICY "Allow authenticated insert access" ON public.trainings FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY "Allow authenticated update access" ON public.trainings FOR UPDATE TO authenticated USING (true);
CREATE POLICY "Allow authenticated delete access" ON public.trainings FOR DELETE TO authenticated USING (true);

CREATE POLICY "Allow authenticated read access" ON public.training_participants FOR SELECT TO authenticated USING (true);
CREATE POLICY "Allow authenticated insert access" ON public.training_participants FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY "Allow authenticated update access" ON public.training_participants FOR UPDATE TO authenticated USING (true);
CREATE POLICY "Allow authenticated delete access" ON public.training_participants FOR DELETE TO authenticated USING (true);
