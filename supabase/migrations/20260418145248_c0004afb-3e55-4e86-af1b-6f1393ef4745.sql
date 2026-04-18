-- Create public bucket for ad images
INSERT INTO storage.buckets (id, name, public)
VALUES ('ads', 'ads', true)
ON CONFLICT (id) DO NOTHING;

-- Public can read ad images
CREATE POLICY "Ad images are publicly accessible"
ON storage.objects FOR SELECT
USING (bucket_id = 'ads');

-- Only admins can upload
CREATE POLICY "Admins can upload ad images"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (bucket_id = 'ads' AND public.has_role(auth.uid(), 'admin'));

-- Only admins can update
CREATE POLICY "Admins can update ad images"
ON storage.objects FOR UPDATE
TO authenticated
USING (bucket_id = 'ads' AND public.has_role(auth.uid(), 'admin'));

-- Only admins can delete
CREATE POLICY "Admins can delete ad images"
ON storage.objects FOR DELETE
TO authenticated
USING (bucket_id = 'ads' AND public.has_role(auth.uid(), 'admin'));