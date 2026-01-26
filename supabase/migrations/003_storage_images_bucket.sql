-- images バケット作成（本番で Bucket not found になる場合は SQL Editor で実行）
insert into storage.buckets (id, name, public)
values ('images', 'images', true)
on conflict (id) do update set public = true;

-- 既存ポリシーがあれば削除（再実行時用）
drop policy if exists "Users can upload originals" on storage.objects;
drop policy if exists "Users can upload generated" on storage.objects;
drop policy if exists "Public read images" on storage.objects;

-- 認証ユーザーは originals/{自分のuser_id}/* にのみアップロード可
create policy "Users can upload originals"
  on storage.objects for insert
  to authenticated
  with check (
    bucket_id = 'images'
    and (storage.foldername(name))[1] = 'originals'
    and (storage.foldername(name))[2] = auth.uid()::text
  );

-- 認証ユーザーは generated/{自分のuser_id}/* にのみアップロード可（generate は service role 使用）
create policy "Users can upload generated"
  on storage.objects for insert
  to authenticated
  with check (
    bucket_id = 'images'
    and (storage.foldername(name))[1] = 'generated'
    and (storage.foldername(name))[2] = auth.uid()::text
  );

-- 公開読取（getPublicUrl 用）
create policy "Public read images"
  on storage.objects for select
  to public
  using (bucket_id = 'images');
