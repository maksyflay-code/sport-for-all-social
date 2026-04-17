-- Enable realtime for notifications
ALTER TABLE public.notifications REPLICA IDENTITY FULL;
ALTER PUBLICATION supabase_realtime ADD TABLE public.notifications;

-- Index for fast mention lookups (case insensitive)
CREATE INDEX IF NOT EXISTS idx_profiles_display_name_lower ON public.profiles (lower(display_name));

-- Function to notify mentioned users in posts
CREATE OR REPLACE FUNCTION public.notify_mentions_in_post()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  mention_match text;
  mentioned_user_id uuid;
  actor_name text;
  mentioned_names text[];
BEGIN
  -- Extract @mentions (alphanumeric, _ and . allowed, min 2 chars)
  SELECT ARRAY(
    SELECT DISTINCT lower(substring(m FROM 2))
    FROM regexp_matches(NEW.content, '@([A-Za-zÀ-ÿ0-9_\.]{2,40})', 'g') AS t(m_arr),
    LATERAL unnest(m_arr) AS m
  ) INTO mentioned_names;

  IF mentioned_names IS NULL OR array_length(mentioned_names, 1) IS NULL THEN
    RETURN NEW;
  END IF;

  SELECT display_name INTO actor_name FROM public.profiles WHERE user_id = NEW.user_id;

  -- Find users by display_name (case insensitive, with spaces removed)
  FOR mentioned_user_id IN
    SELECT user_id FROM public.profiles
    WHERE lower(replace(display_name, ' ', '')) = ANY(mentioned_names)
       OR lower(display_name) = ANY(mentioned_names)
  LOOP
    -- Don't notify self
    IF mentioned_user_id <> NEW.user_id THEN
      INSERT INTO public.notifications (user_id, type, actor_id, message)
      VALUES (
        mentioned_user_id,
        'mention',
        NEW.user_id,
        COALESCE(actor_name, 'Alguém') || ' mencionou você em uma publicação'
      );
    END IF;
  END LOOP;

  RETURN NEW;
END;
$$;

-- Function to notify mentioned users in comments
CREATE OR REPLACE FUNCTION public.notify_mentions_in_comment()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  mentioned_user_id uuid;
  actor_name text;
  mentioned_names text[];
BEGIN
  SELECT ARRAY(
    SELECT DISTINCT lower(substring(m FROM 2))
    FROM regexp_matches(NEW.content, '@([A-Za-zÀ-ÿ0-9_\.]{2,40})', 'g') AS t(m_arr),
    LATERAL unnest(m_arr) AS m
  ) INTO mentioned_names;

  IF mentioned_names IS NULL OR array_length(mentioned_names, 1) IS NULL THEN
    RETURN NEW;
  END IF;

  SELECT display_name INTO actor_name FROM public.profiles WHERE user_id = NEW.user_id;

  FOR mentioned_user_id IN
    SELECT user_id FROM public.profiles
    WHERE lower(replace(display_name, ' ', '')) = ANY(mentioned_names)
       OR lower(display_name) = ANY(mentioned_names)
  LOOP
    IF mentioned_user_id <> NEW.user_id THEN
      INSERT INTO public.notifications (user_id, type, actor_id, message)
      VALUES (
        mentioned_user_id,
        'mention',
        NEW.user_id,
        COALESCE(actor_name, 'Alguém') || ' mencionou você em um comentário'
      );
    END IF;
  END LOOP;

  RETURN NEW;
END;
$$;

CREATE TRIGGER trigger_notify_mentions_in_post
AFTER INSERT ON public.posts
FOR EACH ROW
EXECUTE FUNCTION public.notify_mentions_in_post();

CREATE TRIGGER trigger_notify_mentions_in_comment
AFTER INSERT ON public.comments
FOR EACH ROW
EXECUTE FUNCTION public.notify_mentions_in_comment();