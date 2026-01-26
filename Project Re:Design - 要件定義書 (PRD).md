# 🎨 Project Re:Design - 要件定義書 (PRD)

## 1. プロジェクト概要

**Project Name:** Re:Design (リデザイン)
**Overview:** 社内マーケター向けの「デザインフィードバック & リファレンス生成ツール」。
アップロードされたLPやバナー画像をAIが解析し、「プロ視点の改善フィードバック（Re:）」と「修正後のビジュアルイメージ（Re-Design）」を即座に提示する。
マーケターの曖昧なイメージを可視化し、デザイナーへの発注精度を劇的に向上させることを目的とする。

## 2. 技術スタック (Tech Stack)

* **Framework:** Next.js 14+ (App Router)
* **Language:** TypeScript
* **Styling:** Tailwind CSS, shadcn/ui (Radix UI)
* **Backend/DB:** Supabase (PostgreSQL, Auth, Storage)
* **AI (Analysis):** OpenAI API (`gpt-4o`) - 視覚解析とプロンプト生成
* **AI (Image Gen):** Replicate API (`black-forest-labs/flux-1-schnell`) - 画像生成 (Img2Img)

## 3. 機能要件 (Functional Requirements)

### 3.1. 画像アップロード & 設定 (Input)

* **UI:** ドラッグ＆ドロップ可能なアップロードエリア。
* **入力項目:**
1. 画像ファイル (PNG/JPG/WEBP)
2. ターゲット/商材メモ (任意入力: 例「30代女性、美容液」)
* **スタイルモード (Mode Selection):**
AI (GPT-4o) は、選択されたモードに基づいて以下のキーワードとルールをFLUX.1用プロンプトに必ず含めること。

#### 1. `polish`: ブラッシュアップ (Refinement)

* **目的:** 元のデザイン・構図・配色を**厳密に維持**しつつ、可読性と品質だけを向上させる。
* **Visual Keywords:** `High legibility`, `Professional layout`, `Clear contrast`, `Sharp details`, `Balanced composition`.
* **ルール:**
* `Strict adherence to original layout` (レイアウト厳守) を指定。
* 背景と文字のコントラスト比を高める処理（例: `Add subtle drop shadow to text`, `Darken background slightly behind text`）を追加する。
* 色味やフォントの大幅な変更は禁止。



#### 2. `style_impact`: インパクト (The "YouTuber" Style)

* **目的:** YouTubeサムネイルのように、一瞬で目を引くクリック重視のデザイン。
* **Visual Keywords:** `YouTube thumbnail aesthetic`, `High saturation`, `Pop art`, `Exciting`, `Energetic`.
* **Design Elements:**
* **Font:** `Extra Bold Sans-serif`, `Thick black outline (stroke) on text`.
* **Color:** `Bright Red`, `Yellow`, `Black`, `Hyper-vibrant`.
* **Decor:** `Concentrated lines (Manga style)`, `Shocked face emoji`, `Big red arrows`.



#### 3. `style_luxury`: リッチ/高級 (The "High-End" Style)

* **目的:** 高価格帯の商品やサービスのブランディング。洗練された高級感。
* **Visual Keywords:** `Luxury advertisement`, `Sophisticated`, `Minimalist`, `Elegant`, `Premium quality`.
* **Design Elements:**
* **Font:** `Mincho (Serif) fonts`, `Wide letter spacing (Tracking)`, `Thin elegant lines`.
* **Color:** `Black & Gold`, `Deep Navy & Silver`, `White & Beige`, `Monotone`.
* **Decor:** `Gold foil textures`, `Marble textures`, `Soft lighting`, `Ample whitespace`.



#### 4. `style_emo`: エモ/Z世代 (The "Gen-Z" Style)

* **目的:** 若年層向けのトレンド感、親近感、ノスタルジー。
* **Visual Keywords:** `Y2K aesthetic`, `Retro pop`, `Vaporwave`, `Lo-fi photography`, `Nostalgic`.
* **Design Elements:**
* **Font:** `Pixel fonts`, `Rounded bubble fonts`, `Handwritten styles`.
* **Color:** `Neon pastel`, `Pink & Purple`, `Faded film colors`.
* **Decor:** `Film grain noise`, `Sparkle stickers (✨)`, `Retro UI elements (Windows 95 windows)`, `Collage style`.



#### 5. `style_official`: 公式/信頼 (The "Corporate" Style)

* **目的:** 官公庁、金融、大手企業の公式サイトのような絶対的な信頼感。
* **Visual Keywords:** `Corporate website hero image`, `Trustworthy`, `Clean flat design`, `Modern UI`.
* **Design Elements:**
* **Font:** `Standard Sans-serif (Helvetica/Roboto)`, `Clean and readable`.
* **Color:** `Trust Blue (#0055AA)`, `Clean White`, `Light Grey`.
* **Decor:** `Grid layout`, `Geometric patterns`, `Infographic icons`, `Business people in suits`.



#### 6. `style_ugc`: UGC/リアル (The "Social Real" Style)

* **目的:** 広告臭を消し、一般ユーザーのSNS投稿（ストーリーズ）に擬態する。
* **Visual Keywords:** `Instagram Story screenshot`, `TikTok viral post`, `Smartphone photography`, `Authentic`, `Amateur vibe`.
* **Design Elements:**
* **Font:** `Default Instagram fonts`, `Typewriter style`.
* **Color:** `Natural lighting (No professional grading)`.
* **Decor:** `Handwritten doodles/arrows`, `Location tags`, `GIPHY style stickers`, `Emojis (🤫, 🚨, 💰)`.





### 3.2. AI分析 & プロンプトエンジニアリング (Analysis Agent)

* **API:** OpenAI `gpt-4o`
* **処理フロー:**
1. 画像をVision機能で解析。
2. デザイン4原則（整列・近接・強弱・反復）に基づき、**改善フィードバックテキスト**を生成。
3. 選択されたモードに基づき、Replicateへ投げる**画像生成プロンプト**を構築。
* *重要:* 元画像のテキスト内容や配置情報をプロンプトに含め、`Keep the text layout and composition` と指示する。





### 3.3. ビジュアル生成 (Generation Agent)

* **API:** Replicate (`flux-1-schnell`)
* **手法:** **Image-to-Image (Img2Img)**
* **パラメータ設定:**
* `image`: ユーザーのアップロード画像を指定。
* `prompt`: GPT-4oが生成した英語プロンプト。
* `prompt_strength`: プロンプトの効き具合 (0.1〜1.0)。
* `polish`モード時は **0.45** (元画像を強く残す)。
* `style_xxx`モード時は **0.75** (スタイル変更を優先)。


* `num_inference_steps`: 4



### 3.4. 結果表示 (Result View)

* **Header:** ロゴ「Re:Design」を表示。
* **Comparison:** 左に元画像、右に生成画像を表示（スライダー比較）。
* **Feedback:** AIからのテキスト指摘事項を表示。
* **Action:**
* 画像ダウンロード。
* 「デザイナーへの指示テキスト」をコピー。



## 4. データモデル (Supabase Schema)

```sql
-- Projects: 1回の診断セッション
create table projects (
  id uuid default gen_random_uuid() primary key,
  user_id uuid references auth.users not null,
  original_image_url text not null,
  target_memo text,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Generations: 生成結果履歴
create table generations (
  id uuid default gen_random_uuid() primary key,
  project_id uuid references projects on delete cascade not null,
  selected_mode text not null, -- 'polish', 'style_impact', etc.
  feedback_text text,
  generated_image_url text,
  used_prompt text,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

```

## 5. API実装仕様 (Backend Logic)

### `/api/analyze` (Next.js Server Action)

1. **Input:** `imageUrl`, `mode`, `targetMemo`
2. **Process (GPT-4o System Prompt):**
> You are "Re:Design", a professional Art Director AI.
> **Task 1: Feedback (Japanese)**
> Critique based on Contrast, Alignment, Readability.
> **Task 2: Flux.1 Prompt Engineering (English)**
> Create a prompt for Image-to-Image generation.


> * `polish`: Focus on readability/contrast, keep layout strictly.
> * `style_impact`: YouTube thumbnail style, high contrast.
> * `style_official`: Corporate trust style, blue/white theme.
> 
> 


> **Output JSON:** `{ "feedback": "...", "flux_prompt": "..." }`



### `/api/generate` (Next.js Server Action)

1. **Input:** `imageUrl`, `fluxPrompt`, `mode`
2. **Process:** Replicate API Call (`black-forest-labs/flux-1-schnell`).
3. **Output:** Save to DB & Return URL.