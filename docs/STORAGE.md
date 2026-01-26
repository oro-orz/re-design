# Supabase Storage 設計

## バケット: `images`

| パス | 用途 |
|------|------|
| `originals/{user_id}/{project_id}/` | アップロード元画像 |
| `generated/{user_id}/{project_id}/` | Replicate 生成画像 |

- 認証ユーザーのみアップロード・読み取り可とする Storage ポリシーを設定すること。
