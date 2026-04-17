CREATE OR REPLACE FUNCTION public.notify_mentions_in_post()
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
    SELECT DISTINCT lower(m[1])
    FROM regexp_matches(NEW.content, '@([A-Za-z0-9_\.\u00C0-\u00FF]{2,40})', 'g') AS m
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
        COALESCE(actor_name, 'Alguém') || ' mencionou você em uma publicação'
      );
    END IF;
  END LOOP;

  RETURN NEW;
END;
$$;

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
    SELECT DISTINCT lower(m[1])
    FROM regexp_matches(NEW.content, '@([A-Za-z0-9_\.\u00C0-\u00FF]{2,40})', 'g') AS m
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