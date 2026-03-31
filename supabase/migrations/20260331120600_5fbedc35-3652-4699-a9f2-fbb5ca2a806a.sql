
-- Trigger function for new likes
CREATE OR REPLACE FUNCTION public.notify_new_like()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  liker_name text;
  post_owner_id uuid;
BEGIN
  -- Get post owner
  SELECT user_id INTO post_owner_id FROM public.posts WHERE id = NEW.post_id;
  
  -- Don't notify if liking own post
  IF post_owner_id = NEW.user_id THEN RETURN NEW; END IF;

  SELECT display_name INTO liker_name FROM public.profiles WHERE user_id = NEW.user_id;

  INSERT INTO public.notifications (user_id, type, actor_id, message)
  VALUES (
    post_owner_id,
    'like',
    NEW.user_id,
    COALESCE(liker_name, 'Alguém') || ' curtiu sua publicação'
  );

  RETURN NEW;
END;
$$;

-- Trigger function for new comments
CREATE OR REPLACE FUNCTION public.notify_new_comment()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  commenter_name text;
  post_owner_id uuid;
BEGIN
  SELECT user_id INTO post_owner_id FROM public.posts WHERE id = NEW.post_id;
  
  IF post_owner_id = NEW.user_id THEN RETURN NEW; END IF;

  SELECT display_name INTO commenter_name FROM public.profiles WHERE user_id = NEW.user_id;

  INSERT INTO public.notifications (user_id, type, actor_id, message)
  VALUES (
    post_owner_id,
    'comment',
    NEW.user_id,
    COALESCE(commenter_name, 'Alguém') || ' comentou na sua publicação'
  );

  RETURN NEW;
END;
$$;

-- Create triggers
CREATE TRIGGER on_new_like
  AFTER INSERT ON public.likes
  FOR EACH ROW
  EXECUTE FUNCTION public.notify_new_like();

CREATE TRIGGER on_new_comment
  AFTER INSERT ON public.comments
  FOR EACH ROW
  EXECUTE FUNCTION public.notify_new_comment();
