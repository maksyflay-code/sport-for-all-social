
-- 1) notifications: remover INSERT público; triggers SECURITY DEFINER continuam funcionando
DROP POLICY IF EXISTS "Users can create notifications as actor" ON public.notifications;

CREATE POLICY "Admins can create notifications"
ON public.notifications
FOR INSERT
TO authenticated
WITH CHECK (public.has_role(auth.uid(), 'admin'));

-- 2) ad_events: validar que ad_id existe em ad_slots
DROP POLICY IF EXISTS "Anyone can log ad events" ON public.ad_events;

CREATE POLICY "Anyone can log ad events"
ON public.ad_events
FOR INSERT
TO public
WITH CHECK (
  event_type IN ('impression', 'click')
  AND EXISTS (SELECT 1 FROM public.ad_slots s WHERE s.id = ad_id)
  AND (user_id IS NULL OR user_id = auth.uid())
);

-- 3) user_roles: restringir SELECT ao próprio usuário ou admins
DROP POLICY IF EXISTS "Roles viewable by authenticated users" ON public.user_roles;

CREATE POLICY "Users can view own role"
ON public.user_roles
FOR SELECT
TO authenticated
USING (auth.uid() = user_id OR public.has_role(auth.uid(), 'admin'));
