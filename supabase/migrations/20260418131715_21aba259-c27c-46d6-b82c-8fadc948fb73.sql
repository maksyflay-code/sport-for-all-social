-- ============================================
-- 1. EVENT RSVPs
-- ============================================
CREATE TABLE public.event_rsvps (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  event_id uuid NOT NULL REFERENCES public.events(id) ON DELETE CASCADE,
  user_id uuid NOT NULL,
  status text NOT NULL DEFAULT 'going' CHECK (status IN ('going','maybe','not_going')),
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (event_id, user_id)
);

ALTER TABLE public.event_rsvps ENABLE ROW LEVEL SECURITY;

CREATE POLICY "RSVPs viewable by everyone"
  ON public.event_rsvps FOR SELECT USING (true);

CREATE POLICY "Users can create own RSVP"
  ON public.event_rsvps FOR INSERT TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own RSVP"
  ON public.event_rsvps FOR UPDATE TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own RSVP"
  ON public.event_rsvps FOR DELETE TO authenticated
  USING (auth.uid() = user_id);

CREATE TRIGGER update_event_rsvps_updated_at
  BEFORE UPDATE ON public.event_rsvps
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE INDEX idx_event_rsvps_event ON public.event_rsvps(event_id);
CREATE INDEX idx_event_rsvps_user ON public.event_rsvps(user_id);

-- ============================================
-- 2. BADGES
-- ============================================
CREATE TABLE public.badges (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  code text NOT NULL UNIQUE,
  category text NOT NULL CHECK (category IN ('posts','social','sports','events')),
  threshold integer NOT NULL,
  title text NOT NULL,
  description text NOT NULL,
  emoji text NOT NULL DEFAULT '🏆',
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.badges ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Badges viewable by everyone"
  ON public.badges FOR SELECT USING (true);

CREATE POLICY "Admins can manage badges"
  ON public.badges FOR ALL TO authenticated
  USING (has_role(auth.uid(), 'admin'::app_role))
  WITH CHECK (has_role(auth.uid(), 'admin'::app_role));

CREATE TABLE public.user_badges (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  badge_id uuid NOT NULL REFERENCES public.badges(id) ON DELETE CASCADE,
  earned_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (user_id, badge_id)
);

ALTER TABLE public.user_badges ENABLE ROW LEVEL SECURITY;

CREATE POLICY "User badges viewable by everyone"
  ON public.user_badges FOR SELECT USING (true);

CREATE INDEX idx_user_badges_user ON public.user_badges(user_id);

INSERT INTO public.badges (code, category, threshold, title, description, emoji) VALUES
  ('posts_1',   'posts',  1,   'Primeira publicação', 'Você publicou seu primeiro post!', '✍️'),
  ('posts_10',  'posts',  10,  'Comunicador',         'Publicou 10 posts',                '📝'),
  ('posts_50',  'posts',  50,  'Influenciador',       'Publicou 50 posts',                '📣'),
  ('posts_100', 'posts',  100, 'Voz da comunidade',   'Publicou 100 posts',               '🎙️'),
  ('social_10',  'social', 10,  'Conectado',     'Alcançou 10 seguidores',  '🤝'),
  ('social_50',  'social', 50,  'Popular',       'Alcançou 50 seguidores',  '⭐'),
  ('social_100', 'social', 100, 'Referência',    'Alcançou 100 seguidores', '🌟'),
  ('sports_10',  'sports', 10,  'Em movimento',  '10 km acumulados no Strava',  '🏃'),
  ('sports_50',  'sports', 50,  'Resistente',    '50 km acumulados no Strava',  '💪'),
  ('sports_100', 'sports', 100, 'Atleta',        '100 km acumulados no Strava', '🏅');

-- ============================================
-- 3. BADGE TRIGGERS
-- ============================================
CREATE OR REPLACE FUNCTION public.grant_badge(_user_id uuid, _code text)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  _badge_id uuid;
  _title text;
BEGIN
  SELECT id, title INTO _badge_id, _title FROM public.badges WHERE code = _code;
  IF _badge_id IS NULL THEN RETURN; END IF;

  INSERT INTO public.user_badges (user_id, badge_id)
  VALUES (_user_id, _badge_id)
  ON CONFLICT (user_id, badge_id) DO NOTHING;

  IF FOUND THEN
    INSERT INTO public.notifications (user_id, type, actor_id, message)
    VALUES (_user_id, 'badge', _user_id, '🏆 Nova conquista: ' || _title);
  END IF;
END;
$$;

CREATE OR REPLACE FUNCTION public.check_post_badges()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  _count integer;
BEGIN
  SELECT count(*) INTO _count FROM public.posts WHERE user_id = NEW.user_id;
  IF _count = 1   THEN PERFORM public.grant_badge(NEW.user_id, 'posts_1');   END IF;
  IF _count = 10  THEN PERFORM public.grant_badge(NEW.user_id, 'posts_10');  END IF;
  IF _count = 50  THEN PERFORM public.grant_badge(NEW.user_id, 'posts_50');  END IF;
  IF _count = 100 THEN PERFORM public.grant_badge(NEW.user_id, 'posts_100'); END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_check_post_badges ON public.posts;
CREATE TRIGGER trg_check_post_badges
  AFTER INSERT ON public.posts
  FOR EACH ROW EXECUTE FUNCTION public.check_post_badges();

CREATE OR REPLACE FUNCTION public.check_follow_badges()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  _count integer;
BEGIN
  SELECT count(*) INTO _count FROM public.follows WHERE following_id = NEW.following_id;
  IF _count = 10  THEN PERFORM public.grant_badge(NEW.following_id, 'social_10');  END IF;
  IF _count = 50  THEN PERFORM public.grant_badge(NEW.following_id, 'social_50');  END IF;
  IF _count = 100 THEN PERFORM public.grant_badge(NEW.following_id, 'social_100'); END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_check_follow_badges ON public.follows;
CREATE TRIGGER trg_check_follow_badges
  AFTER INSERT ON public.follows
  FOR EACH ROW EXECUTE FUNCTION public.check_follow_badges();

CREATE OR REPLACE FUNCTION public.notify_event_rsvp()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  _creator uuid;
  _title text;
  _name text;
BEGIN
  IF NEW.status <> 'going' THEN RETURN NEW; END IF;
  SELECT created_by, title INTO _creator, _title FROM public.events WHERE id = NEW.event_id;
  IF _creator IS NULL OR _creator = NEW.user_id THEN RETURN NEW; END IF;
  SELECT display_name INTO _name FROM public.profiles WHERE user_id = NEW.user_id;
  INSERT INTO public.notifications (user_id, type, actor_id, message)
  VALUES (_creator, 'rsvp', NEW.user_id, COALESCE(_name,'Alguém') || ' confirmou presença em "' || _title || '"');
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_notify_event_rsvp ON public.event_rsvps;
CREATE TRIGGER trg_notify_event_rsvp
  AFTER INSERT ON public.event_rsvps
  FOR EACH ROW EXECUTE FUNCTION public.notify_event_rsvp();

-- ============================================
-- 4. STORIES (24h)
-- ============================================
CREATE TABLE public.stories (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  media_url text NOT NULL,
  media_type text NOT NULL CHECK (media_type IN ('image','video')),
  caption text,
  created_at timestamptz NOT NULL DEFAULT now(),
  expires_at timestamptz NOT NULL DEFAULT (now() + interval '24 hours')
);

ALTER TABLE public.stories ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Active stories viewable by everyone"
  ON public.stories FOR SELECT
  USING (expires_at > now());

CREATE POLICY "Users can create own stories"
  ON public.stories FOR INSERT TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete own stories"
  ON public.stories FOR DELETE TO authenticated
  USING (auth.uid() = user_id);

CREATE INDEX idx_stories_expires ON public.stories(expires_at);
CREATE INDEX idx_stories_user ON public.stories(user_id);

CREATE TABLE public.story_views (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  story_id uuid NOT NULL REFERENCES public.stories(id) ON DELETE CASCADE,
  viewer_id uuid NOT NULL,
  viewed_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (story_id, viewer_id)
);

ALTER TABLE public.story_views ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Story owner or viewer can read views"
  ON public.story_views FOR SELECT TO authenticated
  USING (
    auth.uid() = viewer_id
    OR EXISTS (SELECT 1 FROM public.stories s WHERE s.id = story_id AND s.user_id = auth.uid())
  );

CREATE POLICY "Users can record own story views"
  ON public.story_views FOR INSERT TO authenticated
  WITH CHECK (auth.uid() = viewer_id);

-- ============================================
-- 5. STORAGE BUCKET
-- ============================================
INSERT INTO storage.buckets (id, name, public)
VALUES ('stories', 'stories', true)
ON CONFLICT (id) DO NOTHING;

CREATE POLICY "Stories media public read"
  ON storage.objects FOR SELECT
  USING (bucket_id = 'stories');

CREATE POLICY "Authenticated upload to own stories folder"
  ON storage.objects FOR INSERT TO authenticated
  WITH CHECK (bucket_id = 'stories' AND auth.uid()::text = (storage.foldername(name))[1]);

CREATE POLICY "Users can delete own stories media"
  ON storage.objects FOR DELETE TO authenticated
  USING (bucket_id = 'stories' AND auth.uid()::text = (storage.foldername(name))[1]);

-- Realtime
ALTER PUBLICATION supabase_realtime ADD TABLE public.stories;
ALTER PUBLICATION supabase_realtime ADD TABLE public.event_rsvps;
ALTER PUBLICATION supabase_realtime ADD TABLE public.user_badges;