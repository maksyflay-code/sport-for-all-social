
-- Fix post-media INSERT policy to require ownership in path
DROP POLICY IF EXISTS "Authenticated users can upload post media" ON storage.objects;
CREATE POLICY "Authenticated users can upload post media"
ON storage.objects FOR INSERT TO authenticated
WITH CHECK (
  bucket_id = 'post-media'
  AND (auth.uid())::text = (storage.foldername(name))[1]
);

-- Add UPDATE policy for post-media (owner only)
CREATE POLICY "Users can update own post media"
ON storage.objects FOR UPDATE TO authenticated
USING (
  bucket_id = 'post-media'
  AND (auth.uid())::text = (storage.foldername(name))[1]
)
WITH CHECK (
  bucket_id = 'post-media'
  AND (auth.uid())::text = (storage.foldername(name))[1]
);

-- Add UPDATE policy for stories (owner only)
CREATE POLICY "Users can update own stories media"
ON storage.objects FOR UPDATE TO authenticated
USING (
  bucket_id = 'stories'
  AND (auth.uid())::text = (storage.foldername(name))[1]
)
WITH CHECK (
  bucket_id = 'stories'
  AND (auth.uid())::text = (storage.foldername(name))[1]
);
