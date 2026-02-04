# Re:Design

デザインフィードバック & リファレンス生成ツール。**Gaudí（スワイプLP自動生成）** を内包した 2.0 構成。

- **トップ（既存）:** 画像アップロード → AI 分析 → フィードバック & FLUX リファレンス生成
- **Gaudí:** WebページURL または 画像 → AI 分析 → 6〜8 枚のスワイプLP構成 & NanoBanana 用プロンプト生成

**本番:** [https://tmg-re-design.vercel.app/](https://tmg-re-design.vercel.app/)  
本番で「アップロード失敗: Bucket not found」→ [docs/STORAGE.md](../docs/STORAGE.md) の手順で `images` バケット作成。

---

## Gaudí（スワイプLP）

| 項目 | 内容 |
|------|------|
| **入力** | `/swipe-lp/` で **URL**（Webページ）を入力 |
| **処理** | HTML 取得 → 画像・テキスト抽出（cheerio）→ 主要画像の OCR（Google Vision、並列）→ GPT-4o で統合分析 → スライド構成 & 各スライドの NanoBanana 用プロンプト（9:16）生成 |
| **結果** | `/swipe-lp/[id]` で AI 分析・スライド編集・デザイン選択・プロンプト生成・コピー |

**WebページURL対応:** 画像直リンク（`.png` 等）は従来どおり Vision 1 枚で分析。`http(s)://` の URL は **fetchHtml → extractImages / extractTextFromHtml → OCR（MAX_OCR_IMAGES 枚、並列）→ GPT-4o** で分析する。

**DB:**  
1. `supabase/migrations/006_swipe_lp_projects.sql` で `swipe_lp_projects` テーブルを作成  
2. **4フェーズUI 利用時は** `supabase/migrations/007_swipe_lp_phases.sql` を実行（`phase1`〜`phase4`・`overall_status` カラム追加）。未実行だと「Could not find the 'overall_status' column」でプロジェクト作成に失敗します。

---

## 開発

```bash
npm install
npm run dev
```

`http://localhost:3000` で開く。

**推奨:** Node.js 18+（Next.js 14 要件）。Node 18 では Server Action まわりの `File` 参照を避けるため、`lib/polyfill-file.ts` をルート layout で読み込み済み（Node 20+ では不要な場合あり）。

---

## 認証の二系統

Re:Design は **TMG Portal SSO** と **Supabase 単体ログイン** のどちらかで動作します。環境変数で切り替わります。

| モード | 条件 | ログイン方法 | 保護 |
|--------|------|--------------|------|
| **TMG Portal SSO** | `NEXT_PUBLIC_FIREBASE_PROJECT_ID` と `NEXT_PUBLIC_TMG_PORTAL_URL` が設定されている | ポータルから `?token=...` 付きでリダイレクト → Firebase カスタムトークン + BigQuery 社員マスタ照合 | AuthContext（Firebase） |
| **Supabase 単体** | 上記が未設定 | `/login` でメール＋パスワード | middleware（Supabase セッション） |

- **SSO 時:** middleware は Supabase のリダイレクトを行わず、トップページ側で Firebase 認証・社員マスタ照合を行う。
- **Supabase 単体時:** 開発モードでは認証チェックをスキップ。本番では未ログインなら `/login` へリダイレクト。

---

## 環境変数

`.env.local` に用意する。`.env.example` をコピーして編集可。

### 共通（Supabase・AI）

| 変数 | 用途 |
|------|------|
| `NEXT_PUBLIC_SUPABASE_URL` | Supabase プロジェクト URL |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Supabase 匿名キー |
| `SUPABASE_SERVICE_ROLE_KEY` | Supabase サービスロールキー（Server Actions・ストレージ等） |
| `OPENAI_API_KEY` | OpenAI API（分析・プロンプト生成） |
| `REPLICATE_API_TOKEN` | Replicate（画像生成）**有料** |
| `GOOGLE_VISION_API_KEY` | **Gaudí用** Google Vision API（Webページ内画像の OCR）。未設定時は OCR なしで HTML テキスト＋画像のみで分析 |
| `MAX_OCR_IMAGES` | **Gaudí用**（任意）OCR する画像の上限。未設定時は 5。Vision 無料枠 1,000 リクエスト/月 を考慮 |

**AI 利用について:**
- **Replicate**: 無料トライアルあり（限定的）。その後は有料（FLUX 画像モデルは約 $0.025–$0.04/画像、約 3–6 円/画像）。[アカウント作成](https://replicate.com) 後、API トークンを取得。
- **OpenAI**: 有料（GPT-4o Vision は従量課金）。[API キー](https://platform.openai.com/api-keys) を取得。
- 未設定の間はログイン不要でトップは表示されるが、アップロード・分析・生成は利用不可。

### Supabase 単体ログイン用

TMG Portal SSO を使わず、メール＋パスワードでログインする場合のみ必要。

| 変数 | 用途 |
|------|------|
| `AUTH_USERS` | ログイン用ユーザー一覧。`社員番号:氏名:メール:パスワード` をカンマ区切り。`npm run seed` で `auth.users` と `app_users` に登録。 |

### TMG Portal SSO 用

TMG Portal のログインを引き継ぐ（子サイト連携）場合は、上記に加えて以下を Vercel / `.env.local` に設定する。

| 変数 | 用途 |
|------|------|
| `NEXT_PUBLIC_FIREBASE_*` | Firebase 設定（ポータルと同じプロジェクト `tmg-portal-45216`） |
| `NEXT_PUBLIC_TMG_PORTAL_URL` | ポータル URL（未認証時にリダイレクト） |
| `GOOGLE_CLOUD_PROJECT` | BigQuery プロジェクト ID（社員マスタ照合） |
| `GOOGLE_APPLICATION_CREDENTIALS_JSON` | GCP サービスアカウント JSON |

**Firebase Console の事前設定（必須）**

1. プロジェクト `tmg-portal-45216` を選択
2. **Authentication** > **設定** > **認証ドメイン**
3. **ドメインを追加** で Re:Design の本番ドメインを追加（例: `tmg-re-design.vercel.app`）

この設定がないと本番で `signInWithCustomToken` がブロックされる。

---

## SSO 動作（TMG Portal 子サイト）

- ポータルから子サイトへのリンクで、URL に `?token=...`（Firebase カスタムトークン）が付与されてリダイレクトされる。
- クライアント（AuthContext）が `token` を検出し、`signInWithCustomToken` で Firebase にログイン。
- ログイン後、`/api/employees/check-email` に Google メールを送り、BigQuery の社員マスタ（`tmg_portal.employees`）で照合。
- **アクセス許可:** 部門が「システム課」**または** 役割が「役員」「M」「PM」のユーザーのみダッシュボード表示。それ以外は「アクセス権限がありません」。
- 社員マスタにいないメールの場合は「社員マスタに登録されていないアカウントです」。
- セッション有効時間は 24 時間（localStorage）。未認証・タイムアウト時はポータルへリダイレクト。

### SSO 動作確認チェックリスト（手順書準拠）

- [ ] 子サイトに直接アクセス → ポータルのログイン画面にリダイレクトされる
- [ ] ポータルでログイン → 子サイトのダッシュボードが表示される
- [ ] ポータルからのリンク → 子サイトのダッシュボードが表示される
- [ ] ログアウト → 再アクセス時はポータルへリダイレクトされる
- [ ] 権限のないユーザー → 「アクセス権限がありません」が表示される
- [ ] 社員マスタに未登録のメール → 「社員マスタに登録されていないアカウントです」が表示される
- [ ] デバッグ: `NEXT_PUBLIC_DEBUG_SSO=1` でブラウザ Console に `[SSO]` ログが出る

---

## API

| パス | メソッド | 用途 |
|------|----------|------|
| `/api/employees/check-email` | POST | SSO 時、Google メールで社員マスタ照合・権限判定。body: `{ "email": "..." }` |
| `/api/proxy` | GET | **Gaudí用** HTML 取得。`?url=...` で指定 URL の HTML を返す（直接取得＋プロキシ fallback） |
| `/api/ocr/google` | POST | **Gaudí用** Google Vision OCR。body: `{ "imageUrl" }` または `{ "imageContent" }`（base64）。`{ "text" }` を返す |

---

## スクリプト

| コマンド | 用途 |
|----------|------|
| `npm run dev` | 開発サーバー起動 |
| `npm run build` | 本番ビルド |
| `npm run start` | 本番サーバー起動 |
| `npm run seed` | `AUTH_USERS` を元に `auth.users` と `app_users` を登録（Supabase 単体ログイン用） |
| `npm run seed:csv` | CSV から同様にユーザー登録（`scripts/seed-from-csv.mjs` 参照） |

---

## 次の一手：Supabase・Git・Vercel 連携

ここまでで **Supabase / Git / Vercel 連携の手前** まで実装済み。

### 1. Supabase

1. [Supabase](https://supabase.com) でプロジェクト作成。
2. **SQL Editor** で [001_initial.sql](../supabase/migrations/001_initial.sql) を実行（`projects` / `generations` / RLS）。続けて [002_app_users.sql](../supabase/migrations/002_app_users.sql)（`app_users`）、[003_storage_images_bucket.sql](../supabase/migrations/003_storage_images_bucket.sql)（Storage）、[006_swipe_lp_projects.sql](../supabase/migrations/006_swipe_lp_projects.sql)（Gaudí 用 `swipe_lp_projects`）を実行。
3. **Storage** で `images` バケット作成。`originals/*`, `generated/*` 用ポリシーを設定（[docs/STORAGE.md](../docs/STORAGE.md) 参照）。
4. **Authentication** を有効化（メール/パスワードなど）。
5. `.env.local` に `NEXT_PUBLIC_SUPABASE_URL` / `NEXT_PUBLIC_SUPABASE_ANON_KEY` / `SUPABASE_SERVICE_ROLE_KEY` を設定。
6. **Supabase 単体ログイン** を使う場合のみ、`.env.local` に `AUTH_USERS=社員番号:氏名:メール:パスワード` をカンマ区切りで設定し、**`npm run seed`** を実行。`auth.users`（パスワード）と `app_users`（社員番号・氏名・メール）に登録される。

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
3. 環境変数（共通・SSO 用または Supabase 単体用）を Vercel の Environment Variables に追加。
4. デプロイ。
