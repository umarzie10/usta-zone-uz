CREATE POLICY "Verification docs owner read"
ON storage.objects FOR SELECT
USING (bucket_id = 'verification-docs' AND (auth.uid()::text = (storage.foldername(name))[1] OR has_role(auth.uid(), 'admin'::app_role)));

CREATE POLICY "Verification docs owner upload"
ON storage.objects FOR INSERT
WITH CHECK (bucket_id = 'verification-docs' AND auth.uid()::text = (storage.foldername(name))[1]);

CREATE POLICY "Verification docs owner update"
ON storage.objects FOR UPDATE
USING (bucket_id = 'verification-docs' AND auth.uid()::text = (storage.foldername(name))[1]);

CREATE POLICY "Verification docs owner delete"
ON storage.objects FOR DELETE
USING (bucket_id = 'verification-docs' AND (auth.uid()::text = (storage.foldername(name))[1] OR has_role(auth.uid(), 'admin'::app_role)));