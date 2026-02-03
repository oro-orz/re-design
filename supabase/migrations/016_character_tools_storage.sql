-- キャラ生成: 認証ユーザーは character-tools/{自分のuser_id}/* にのみアップロード可
-- 読取は既存の "Public read images" でカバー済み
create policy "Authenticated users can upload to character-tools"
  on storage.objects for insert
  to authenticated
  with check (
    bucket_id = 'images'
    and (storage.foldername(name))[1] = 'character-tools'
    and (storage.foldername(name))[2] = auth.uid()::text
  );
