
-- Trigger function for new direct messages
CREATE OR REPLACE FUNCTION public.notify_new_message()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  sender_name text;
  recipient_id uuid;
  conv_user1 uuid;
  conv_user2 uuid;
BEGIN
  -- Get conversation participants
  SELECT user1_id, user2_id INTO conv_user1, conv_user2
  FROM public.conversations WHERE id = NEW.conversation_id;

  -- Determine recipient
  IF NEW.sender_id = conv_user1 THEN
    recipient_id := conv_user2;
  ELSE
    recipient_id := conv_user1;
  END IF;

  SELECT display_name INTO sender_name
  FROM public.profiles WHERE user_id = NEW.sender_id;

  INSERT INTO public.notifications (user_id, type, actor_id, message)
  VALUES (
    recipient_id,
    'message',
    NEW.sender_id,
    COALESCE(sender_name, 'Alguém') || ' te enviou uma mensagem'
  );

  RETURN NEW;
END;
$$;

CREATE TRIGGER on_new_message
  AFTER INSERT ON public.messages
  FOR EACH ROW
  EXECUTE FUNCTION public.notify_new_message();
