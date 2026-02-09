-- Overlay Mode: 認証ユーザーは overlay-mode/references/{自分のuser_id}/* にのみアップロード可
-- 読取は既存の "Public read images" でカバー済み
create policy "Authenticated users can upload to overlay-mode"
  on storage.objects for insert
  to authenticated
  with check (
    bucket_id = 'images'
    and (storage.foldername(name))[1] = 'overlay-mode'
    and (storage.foldername(name))[2] = 'references'
    and (storage.foldername(name))[3] = auth.uid()::text
  );
