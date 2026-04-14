
CREATE TABLE public.post_reports (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  post_id uuid NOT NULL,
  reporter_id uuid NOT NULL,
  reason text NOT NULL DEFAULT 'spam',
  status text NOT NULL DEFAULT 'pending',
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now()
);

ALTER TABLE public.post_reports ENABLE ROW LEVEL SECURITY;

-- Anyone authenticated can report
CREATE POLICY "Users can report posts"
ON public.post_reports
FOR INSERT
TO authenticated
WITH CHECK (auth.uid() = reporter_id);

-- Users can see their own reports
CREATE POLICY "Users can view own reports"
ON public.post_reports
FOR SELECT
TO authenticated
USING (auth.uid() = reporter_id OR public.has_role(auth.uid(), 'admin'));

-- Admins can update reports (change status)
CREATE POLICY "Admins can update reports"
ON public.post_reports
FOR UPDATE
TO authenticated
USING (public.has_role(auth.uid(), 'admin'));

-- Admins can delete reports
CREATE POLICY "Admins can delete reports"
ON public.post_reports
FOR DELETE
TO authenticated
USING (public.has_role(auth.uid(), 'admin'));

CREATE TRIGGER update_post_reports_updated_at
BEFORE UPDATE ON public.post_reports
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();
