
-- Create notifications table
CREATE TABLE public.notifications (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  type text NOT NULL DEFAULT 'follow',
  actor_id uuid NOT NULL,
  message text NOT NULL,
  read boolean NOT NULL DEFAULT false,
  created_at timestamp with time zone NOT NULL DEFAULT now()
);

ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;

-- Users can only see their own notifications
CREATE POLICY "Users can view own notifications"
  ON public.notifications FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

-- System/triggers can insert (via security definer function)
CREATE POLICY "System can insert notifications"
  ON public.notifications FOR INSERT
  TO authenticated
  WITH CHECK (true);

-- Users can update (mark as read) their own notifications
CREATE POLICY "Users can update own notifications"
  ON public.notifications FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id);

-- Users can delete their own notifications
CREATE POLICY "Users can delete own notifications"
  ON public.notifications FOR DELETE
  TO authenticated
  USING (auth.uid() = user_id);

-- Function to create notification on new follow
CREATE OR REPLACE FUNCTION public.notify_new_follower()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  follower_name text;
BEGIN
  SELECT display_name INTO follower_name
  FROM public.profiles
  WHERE user_id = NEW.follower_id;

  INSERT INTO public.notifications (user_id, type, actor_id, message)
  VALUES (
    NEW.following_id,
    'follow',
    NEW.follower_id,
    COALESCE(follower_name, 'Alguém') || ' começou a te seguir'
  );

  RETURN NEW;
END;
$$;

-- Trigger on follows table
CREATE TRIGGER on_new_follow
  AFTER INSERT ON public.follows
  FOR EACH ROW
  EXECUTE FUNCTION public.notify_new_follower();
