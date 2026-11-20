-- Create a private bucket only when running inside a Supabase installation.
DO $$ BEGIN
 IF to_regclass('storage.buckets') IS NOT NULL AND to_regclass('storage.objects') IS NOT NULL THEN
  INSERT INTO storage.buckets(id,name,public,file_size_limit,allowed_mime_types)
   VALUES('manual-media','manual-media',false,52428800,ARRAY['image/jpeg','image/png','image/webp','image/gif'])
   ON CONFLICT(id) DO NOTHING;
  EXECUTE 'CREATE POLICY newsroom_media_read ON storage.objects FOR SELECT TO authenticated USING (bucket_id=''manual-media'' AND public.manual_is_owner() AND split_part(name,''/'',1)=auth.uid()::text)';
  EXECUTE 'CREATE POLICY newsroom_media_insert ON storage.objects FOR INSERT TO authenticated WITH CHECK (bucket_id=''manual-media'' AND public.manual_is_owner() AND split_part(name,''/'',1)=auth.uid()::text)';
  EXECUTE 'CREATE POLICY newsroom_media_delete ON storage.objects FOR DELETE TO authenticated USING (bucket_id=''manual-media'' AND public.manual_is_owner() AND split_part(name,''/'',1)=auth.uid()::text)';
 END IF;
END $$;
