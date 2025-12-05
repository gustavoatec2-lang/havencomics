-- Create storage bucket for manga content as fallback
INSERT INTO storage.buckets (id, name, public)
VALUES ('manga-content', 'manga-content', true)
ON CONFLICT (id) DO NOTHING;

-- Allow public read access to manga-content bucket
CREATE POLICY "Public read access for manga-content"
ON storage.objects FOR SELECT
USING (bucket_id = 'manga-content');

-- Allow admins to upload to manga-content bucket
CREATE POLICY "Admins can upload to manga-content"
ON storage.objects FOR INSERT
WITH CHECK (
  bucket_id = 'manga-content' 
  AND EXISTS (
    SELECT 1 FROM public.user_roles 
    WHERE user_id = auth.uid() 
    AND role = 'admin'
  )
);

-- Allow admins to update files in manga-content bucket
CREATE POLICY "Admins can update manga-content"
ON storage.objects FOR UPDATE
USING (
  bucket_id = 'manga-content'
  AND EXISTS (
    SELECT 1 FROM public.user_roles 
    WHERE user_id = auth.uid() 
    AND role = 'admin'
  )
);

-- Allow admins to delete files in manga-content bucket
CREATE POLICY "Admins can delete from manga-content"
ON storage.objects FOR DELETE
USING (
  bucket_id = 'manga-content'
  AND EXISTS (
    SELECT 1 FROM public.user_roles 
    WHERE user_id = auth.uid() 
    AND role = 'admin'
  )
);