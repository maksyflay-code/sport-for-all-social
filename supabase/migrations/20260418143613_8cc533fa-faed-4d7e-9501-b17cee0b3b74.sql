-- ============ STORY REACTIONS ============
CREATE TABLE public.story_reactions (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  story_id uuid NOT NULL REFERENCES public.stories(id) ON DELETE CASCADE,
  user_id uuid NOT NULL,
  emoji text NOT NULL,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  UNIQUE (story_id, user_id)
);

CREATE INDEX idx_story_reactions_story ON public.story_reactions(story_id);

ALTER TABLE public.story_reactions ENABLE ROW LEVEL SECURITY;

-- Dono do story OU quem reagiu pode ler
CREATE POLICY "Story owner or reactor can read reactions"
ON public.story_reactions
FOR SELECT
TO authenticated
USING (
  auth.uid() = user_id
  OR EXISTS (
    SELECT 1 FROM public.stories s
    WHERE s.id = story_reactions.story_id AND s.user_id = auth.uid()
  )
);

CREATE POLICY "Users can react to stories"
ON public.story_reactions
FOR INSERT
TO authenticated
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own reaction"
ON public.story_reactions
FOR UPDATE
TO authenticated
USING (auth.uid() = user_id);

CREATE POLICY "Users can remove own reaction"
ON public.story_reactions
FOR DELETE
TO authenticated
USING (auth.uid() = user_id);

-- Notificar dono do story quando alguém reage
CREATE OR REPLACE FUNCTION public.notify_story_reaction()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  _owner uuid;
  _name text;
BEGIN
  SELECT user_id INTO _owner FROM public.stories WHERE id = NEW.story_id;
  IF _owner IS NULL OR _owner = NEW.user_id THEN RETURN NEW; END IF;
  SELECT display_name INTO _name FROM public.profiles WHERE user_id = NEW.user_id;
  INSERT INTO public.notifications (user_id, type, actor_id, message)
  VALUES (_owner, 'story_reaction', NEW.user_id,
    COALESCE(_name, 'Alguém') || ' reagiu ao seu story ' || NEW.emoji);
  RETURN NEW;
END;
$$;

CREATE TRIGGER trg_notify_story_reaction
AFTER INSERT ON public.story_reactions
FOR EACH ROW
EXECUTE FUNCTION public.notify_story_reaction();

-- ============ AD SLOTS ============
CREATE TABLE public.ad_slots (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  position text NOT NULL CHECK (position IN ('sidebar_left', 'sidebar_right')),
  title text NOT NULL,
  description text,
  image_url text,
  link_url text,
  active boolean NOT NULL DEFAULT true,
  display_order integer NOT NULL DEFAULT 0,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now()
);

CREATE INDEX idx_ad_slots_position_active ON public.ad_slots(position, active, display_order);

ALTER TABLE public.ad_slots ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Active ads viewable by everyone"
ON public.ad_slots
FOR SELECT
USING (active = true OR has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can manage ads"
ON public.ad_slots
FOR ALL
TO authenticated
USING (has_role(auth.uid(), 'admin'))
WITH CHECK (has_role(auth.uid(), 'admin'));

CREATE TRIGGER update_ad_slots_updated_at
BEFORE UPDATE ON public.ad_slots
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();