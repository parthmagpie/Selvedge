-- Create storage bucket for fabric images
-- Note: You need to create the bucket in Supabase Dashboard first:
-- 1. Go to Storage in Supabase Dashboard
-- 2. Click "Create a new bucket"
-- 3. Name it "fabric-images"
-- 4. Make it PUBLIC (toggle on)
-- 5. Click "Save"

-- Then run these policies:

-- Allow authenticated users to upload images
CREATE POLICY "Users can upload fabric images"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (bucket_id = 'fabric-images');

-- Allow anyone to view fabric images (public bucket)
CREATE POLICY "Anyone can view fabric images"
ON storage.objects FOR SELECT
TO public
USING (bucket_id = 'fabric-images');

-- Allow users to delete their own uploaded images
CREATE POLICY "Users can delete own fabric images"
ON storage.objects FOR DELETE
TO authenticated
USING (bucket_id = 'fabric-images' AND auth.uid()::text = (storage.foldername(name))[1]);
