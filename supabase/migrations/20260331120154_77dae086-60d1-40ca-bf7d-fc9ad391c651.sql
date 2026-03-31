
-- Tighten insert policy: only allow inserting where actor_id = current user
DROP POLICY "System can insert notifications" ON public.notifications;
CREATE POLICY "Users can create notifications as actor"
  ON public.notifications FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = actor_id);
