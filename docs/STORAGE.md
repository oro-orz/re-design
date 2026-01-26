# Supabase Storage 設計

## バケット: `images`

| パス | 用途 |
|------|------|
| `originals/{user_id}/{project_id}/` | アップロード元画像 |
| `generated/{user_id}/{project_id}/` | Replicate 生成画像 |

- 認証ユーザーのみアップロード・読み取り可とする Storage ポリシーを設定すること。

## 本番で「Bucket not found」が出る場合

本番用 Supabase に `images` バケットがまだないときに発生します。

**対処:** 本番 Supabase で `images` バケットとポリシーを作成する。

1. [Supabase](https://supabase.com) で**本番プロジェクト**を開く。
2. 左メニュー **SQL Editor** → **New query**。
3. [`supabase/migrations/003_storage_images_bucket.sql`](../supabase/migrations/003_storage_images_bucket.sql) の内容をコピーして貼り付け、**Run** する。
4. 成功したら、アプリから再度アップロードを試す。
