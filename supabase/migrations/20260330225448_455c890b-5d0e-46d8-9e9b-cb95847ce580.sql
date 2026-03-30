
CREATE TABLE public.events (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    title text NOT NULL,
    description text,
    emoji text DEFAULT '🏅',
    event_date date NOT NULL,
    location text,
    created_at timestamptz NOT NULL DEFAULT now(),
    updated_at timestamptz NOT NULL DEFAULT now(),
    created_by uuid REFERENCES auth.users(id) ON DELETE SET NULL
);

ALTER TABLE public.events ENABLE ROW LEVEL SECURITY;

-- Everyone can view events
CREATE POLICY "Events are viewable by everyone"
ON public.events FOR SELECT
USING (true);

-- Only admins can insert events
CREATE POLICY "Admins can create events"
ON public.events FOR INSERT
TO authenticated
WITH CHECK (public.has_role(auth.uid(), 'admin'));

-- Only admins can update events
CREATE POLICY "Admins can update events"
ON public.events FOR UPDATE
TO authenticated
USING (public.has_role(auth.uid(), 'admin'));

-- Only admins can delete events
CREATE POLICY "Admins can delete events"
ON public.events FOR DELETE
TO authenticated
USING (public.has_role(auth.uid(), 'admin'));

-- Insert some initial events
INSERT INTO public.events (title, emoji, event_date, location) VALUES
('Maratona Inclusiva SP', '🏅', '2026-04-15', 'São Paulo, SP'),
('Torneio de Futebol Society', '⚽', '2026-04-20', 'Rio de Janeiro, RJ'),
('Campeonato de Natação', '🏊', '2026-04-22', 'Belo Horizonte, MG'),
('Copa de Vôlei Misto', '🏐', '2026-04-28', 'Curitiba, PR'),
('Corrida de Rua 10km', '🏃', '2026-05-05', 'Brasília, DF');
