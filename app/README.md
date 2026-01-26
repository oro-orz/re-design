# Re:Design

デザインフィードバック & リファレンス生成ツール。

## 開発

```bash
npm install
npm run dev
```

`http://localhost:3000` で開く。

## 環境変数

`.env.local` に以下を用意する。`.env.example` をコピーして編集可。

| 変数 | 用途 |
|------|------|
| `NEXT_PUBLIC_SUPABASE_URL` | Supabase プロジェクト URL |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Supabase 匿名キー |
| `SUPABASE_SERVICE_ROLE_KEY` | Supabase サービスロールキー（Server Actions 用） |
| `AUTH_USERS` | ログイン用ユーザー一覧。`社員番号:氏名:メール:パスワード` をカンマ区切り。`npm run seed` で `auth.users` と `app_users`（社員番号・氏名・メール）に登録。ログインはメール＋パスワード。 |
| `OPENAI_API_KEY` | OpenAI API（分析・プロンプト生成） |
| `REPLICATE_API_TOKEN` | Replicate（画像生成）**有料** |

**注意:**
- **Replicate**: 無料トライアルあり（限定的）。その後は有料（FLUX画像モデルは約 $0.025–$0.04/画像、約3–6円/画像）。[アカウント作成](https://replicate.com)後、APIトークンを取得。
- **OpenAI**: 有料（GPT-4o Vision は従量課金）。[APIキー](https://platform.openai.com/api-keys)を取得。
- 未設定の間はログイン不要でトップは表示されるが、アップロード・分析・生成は利用不可。

---

## 次の一手：Supabase・Git・Vercel 連携

ここまでで **Supabase / Git / Vercel 連携の手前** まで実装済み。

### 1. Supabase

1. [Supabase](https://supabase.com) でプロジェクト作成。
2. **SQL Editor** で [001_initial.sql](../supabase/migrations/001_initial.sql) を実行（`projects` / `generations` / RLS）。続けて [002_app_users.sql](../supabase/migrations/002_app_users.sql) を実行（`app_users` テーブル作成）。
3. **Storage** で `images` バケット作成。`originals/*`, `generated/*` 用ポリシーを設定（[docs/STORAGE.md](../docs/STORAGE.md) 参照）。
4. **Authentication** を有効化（メール/パスワードなど）。
5. `.env.local` に `NEXT_PUBLIC_SUPABASE_URL` / `NEXT_PUBLIC_SUPABASE_ANON_KEY` / `SUPABASE_SERVICE_ROLE_KEY` を設定。
6. `.env.local` に `AUTH_USERS=社員番号:氏名:メール:パスワード` をカンマ区切りで設定し、**`npm run seed`** を実行。`auth.users`（パスワード）と `app_users`（社員番号・氏名・メール）に登録される。ログインはメールアドレス＋パスワード。

### 2. Git

```bash
git init
git add .
git commit -m "Re:Design initial"
git remote add origin <your-repo-url>
git push -u origin main
```

### 3. Vercel

1. [Vercel](https://vercel.com) でプロジェクトをインポート（Git リポジトリ連携）。
2. **Root Directory** を `app` に設定。
3. 環境変数（上記すべて）を Vercel の Environment Variables に追加。
4. デプロイ。

---

- Node.js 20+ 推奨（Next.js 16 要件）。
