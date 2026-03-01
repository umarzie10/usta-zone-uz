
-- Create portfolio storage bucket
INSERT INTO storage.buckets (id, name, public) VALUES ('portfolio', 'portfolio', true)
ON CONFLICT (id) DO NOTHING;

-- Allow authenticated users to upload to portfolio bucket
CREATE POLICY "Users can upload portfolio images"
ON storage.objects FOR INSERT
WITH CHECK (bucket_id = 'portfolio' AND auth.uid()::text = (storage.foldername(name))[1]);

-- Allow public read access to portfolio images
CREATE POLICY "Portfolio images are publicly accessible"
ON storage.objects FOR SELECT
USING (bucket_id = 'portfolio');

-- Allow users to delete their own portfolio images
CREATE POLICY "Users can delete their own portfolio images"
ON storage.objects FOR DELETE
USING (bucket_id = 'portfolio' AND auth.uid()::text = (storage.foldername(name))[1]);
