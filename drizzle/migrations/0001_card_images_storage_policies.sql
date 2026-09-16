CREATE POLICY "card images readable by authenticated"
ON storage.objects FOR SELECT TO authenticated
USING (bucket_id = 'card-images');

CREATE POLICY "card images insert own folder"
ON storage.objects FOR INSERT TO authenticated
WITH CHECK (bucket_id = 'card-images' AND (storage.foldername(name))[1] = auth.uid()::text);

CREATE POLICY "card images update own folder"
ON storage.objects FOR UPDATE TO authenticated
USING (bucket_id = 'card-images' AND (storage.foldername(name))[1] = auth.uid()::text);

CREATE POLICY "card images delete own folder"
ON storage.objects FOR DELETE TO authenticated
USING (bucket_id = 'card-images' AND (storage.foldername(name))[1] = auth.uid()::text);