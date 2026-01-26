# Supabase Storage 設計

## バケット: `images`

| パス | 用途 |
|------|------|
| `originals/{user_id}/{project_id}/` | アップロード元画像 |
| `generated/{user_id}/{project_id}/` | Replicate 生成画像 |

- 認証ユーザーのみアップロード・読み取り可とする Storage ポリシーを設定すること。

## 本番で「Bucket not found」が出る場合

**Vercel の環境変数で指定している Supabase プロジェクト**に `images` バケットがありません。

### 方法 A: SQL Editor で一括実行（推奨）

1. [Supabase](https://supabase.com) で **本番プロジェクト**（Vercel の `NEXT_PUBLIC_SUPABASE_URL` と同じプロジェクト）を開く。
2. 左メニュー **SQL Editor** → **New query**。
3. [`supabase/migrations/003_storage_images_bucket.sql`](../supabase/migrations/003_storage_images_bucket.sql) の**全文**をコピーして貼り付け、**Run** する。
4. エラーなく完了したら、[本番アプリ](https://tmg-re-design.vercel.app/)でアップロードを再試行する。

### 方法 B: ダッシュボードでバケットだけ作成してから SQL

1. 上記と同じ本番プロジェクトで **Storage** → **New bucket**。
2. **Name:** `images`（そのまま）  
   **Public bucket:** オン → **Create bucket**。
3. 続けて **SQL Editor** で `003_storage_images_bucket.sql` を実行する（バケットはスキップされ、ポリシーだけ追加される）。
4. アップロードを再試行する。

### 注意

- 本番と開発で **別の Supabase プロジェクト** を使っている場合は、**本番側** で上記を実行すること。
- 実行後も「Bucket not found」が続くときは、Vercel の環境変数（`NEXT_PUBLIC_SUPABASE_URL` など）が本番 Supabase を指しているか確認すること。
