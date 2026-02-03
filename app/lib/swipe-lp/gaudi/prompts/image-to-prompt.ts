/**
 * 参考デザイン画像からAIがプロンプトを自動生成（1画像→1テンプレ）
 * GPT-4 Vision を使用
 * 成功プロンプトフォーマット準拠
 */

import { openai, OPENAI_CHAT_MODEL } from "@/lib/openai";
import type { TemplateStyle, TemplateSlots } from "@/types/swipe-lp-v3";

export interface GeneratedTemplate {
  prompt_text: string;
  category: string;
  memo: string;
}

export interface GeneratedStructuredTemplate {
  category: string;
  memo: string;
  style_json: TemplateStyle;
  slots_json: TemplateSlots;
}

/**
 * 成功プロンプトフォーマット準拠のシステムプロンプト
 * 参考画像を詳細に分析し、NanoBanana/DALL-E で再現可能なプロンプトを生成
 */
const PROMPT_SYSTEM = `あなたはデザイン解析の専門家です。
参考デザイン画像を1枚詳細に分析し、画像生成AI（NanoBanana/DALL-E/Flux等）にそのまま渡せる高品質プロンプトを生成してください。

## 成功実績のあるプロンプトフォーマット

以下の構造に従って、英語・具体的・再現可能なプロンプトを出力すること。
**1,200-1,800字を目安に、シンプルかつ詳細に**。

### 基本構造

1. **冒頭**: "A powerful vertical mobile advertisement (9:16), [mood] design."
2. **BACKGROUND**: 背景色・グラデーション・テクスチャ
3. **RIGHT SIDE (60%)**: 被写体の詳細（人物・商品）
4. **LEFT SIDE (40%)**: Clean layout with breathing room.
5. **テキスト配置**: TOP / MIDDLE / CENTER TEXT / BOTTOM（日本語をそのまま「」で記載）
6. **OVERALL STYLE**: 全体のスタイル
7. **TECHNICAL**: 技術仕様
8. **ADDITIONAL SPECIFICATIONS**: 詳細補足（LIGHTING / TEXTURE / TYPOGRAPHY / COLOR / COMPOSITION）

### 詳細指示

**BACKGROUND（必須）:**
- 色: HEXコード付き具体的な色名（Dark blue-grey gradient #2C3E50 to #1A1A2E）
- テクスチャ: Cracked concrete / Grunge / Film grain / Clean digital 等

**RIGHT SIDE（被写体60%）:**
- 人物の場合: 年齢・性別・服装・表情・ポーズ・配置を英語で200文字以上
- 商品の場合: 商品タイプ・配置・撮影アングル・ライティングを英語で150文字以上
- 例: "Professional Japanese businessman (35-40 years old) in sharp navy business suit, face covered with hand in deep distress, positioned far right with dramatic side lighting creating strong shadows"

**LEFT SIDE（テキストエリア40%）:**
- 常に "Clean layout with breathing room."

**TEXT OVERLAY（重要 - 日本語をそのまま記載）:**
- 画像内の日本語テキストは「」で原文のまま含める
- TOP: 「具体的な日本語テキスト」
- MIDDLE: 「具体的な日本語テキスト」
- CENTER TEXT: 「具体的な日本語テキスト」
- BOTTOM: 「具体的な日本語テキスト」
- CTAボタン文言のみ除外（「今すぐ登録」「無料で始める」等）

**OVERALL STYLE:**
- デザインジャンル: Professional corporate / UGC casual / Luxury minimal 等
- 写真スタイル: Professional studio photography / Smartphone snapshot 等
- 一文で簡潔に

**ADDITIONAL SPECIFICATIONS（詳細補足）:**

LIGHTING:
- 陰影の強さ + 色温度 + 光源方向の3要素
- 例: "High contrast with dramatic side lighting from left, creating strong rim light, deep blacks and bright whites"

TEXTURE:
- 背景テクスチャの詳細
- 例: "Heavy grunge texture, cracked wall, weathered concrete"

TYPOGRAPHY:
- フォント種類・ウェイト・サイズ階層
- 例: "Bold gothic typography, headline weight 900, body weight 700"

COLOR DEPTH:
- HEXコード付き詳細な配色
- 例: "Rich saturated navy blues, Gold accent #FFD700 with 20% outer glow"

COMPOSITION:
- 構図理論の適用
- 例: "Rule of thirds: businessman at right third, Z-pattern reading flow"

## 参考例（このフォーマットで出力）

\`\`\`
A powerful vertical mobile advertisement (9:16) for hair loss treatment, dramatic and impactful design.

BACKGROUND: Dark blue-grey gradient (top to bottom: #2C3E50 to #1A1A2E) with heavy cracked concrete wall texture overlay, creating depth and urgency. Subtle vignette effect on edges.

RIGHT SIDE (60% of width): Professional Japanese businessman (35-40 years old) in sharp navy business suit, face covered with hand in deep distress, positioned far right with dramatic side lighting creating strong shadows. High contrast photography, cinematic mood.

LEFT SIDE (40% of width): Clean layout with breathing room.

TOP: Large bold Japanese text "多忙な日常が正しいサイクルの乱れを引き起こす" in white, vertical orientation, heavy gothic font weight 900.

MIDDLE: Six navy blue (#1B3A52) rectangular boxes (with depth/shadow), stacked vertically with generous spacing. Each box: large white checkmark icon + Japanese text in bold gothic font.

CENTER TEXT: "サイクルの乱れを放置することで" in white, then "深刻なダメージ" in bright glowing gold (#FFD700) with outer glow effect, "を与えてしまいます" in white. This text should be large and dramatic.

BOTTOM: Six large black circles (with inner shadow for depth) arranged in a row, each containing white Japanese text for symptoms.

OVERALL STYLE: High-contrast professional healthcare advertising, dramatic lighting, cinematic corporate photography combined with bold graphic design. Deep shadows, strong highlights, premium feel.

TECHNICAL: 9:16 aspect ratio, high resolution, no watermarks, photorealistic businessman integrated with bold graphic elements, corporate luxury aesthetic.

ADDITIONAL SPECIFICATIONS:

LIGHTING: 
- Businessman: dramatic side lighting from left, creating strong rim light on face/hand
- Background: subtle spotlight effect on text areas
- Overall: high contrast ratio, deep blacks, bright whites

TEXTURE:
- Background: heavy grunge texture, cracked wall, weathered concrete
- Depth: multiple layers with subtle parallax effect

TYPOGRAPHY:
- Main headline: 80pt, weight 900, white
- Body text: 48pt, weight 700, white/gold
- Checklist: 36pt, weight 700, white

COLOR DEPTH:
- Rich saturated navy blues
- Gold accent: vibrant #FFD700 with 20% outer glow

COMPOSITION:
- Rule of thirds: businessman at right third
- Z-pattern reading flow: top → checklist → center text → bottom icons
\`\`\`

## 出力形式（JSON）

{
  "prompt_text": "上記フォーマット準拠の完全プロンプト（1,200-1,800字。日本語は「」で含める）",
  "category": "婚活/転職/EC/教育/ヘルスケア/汎用など",
  "memo": "デザインの特徴を短く（UGC感/雑誌風/高級感/問題提起型など）"
}

このフォーマットで、画像の全要素を言語化してください。JSON形式のみで回答。`;

/**
 * 構造化テンプレート用のシステムプロンプト（スタイル＋スロット抽出）
 * 成功プロンプトフォーマットに準拠
 */
const STRUCTURED_SYSTEM = `この広告画像を分析し、以下のJSON形式で出力してください。
被写体・文言は含めず、デザイン要素だけを抽出します。

## style_json（成功プロンプトフォーマット準拠）

### photography
撮影スタイルを1文で簡潔に：
- 例: "Professional studio photography, medium close-up, clean digital"
- 例: "Smartphone snapshot, casual UGC style, natural lighting"

### lighting（必須3要素を含める）
陰影の強さ + 色温度 + 光源方向:
- 例: "High contrast with dramatic shadows, warm-to-cool gradient, side lighting creating rim light effect"
- 例: "Flat even lighting, neutral daylight, front light"

### designStyle
デザインジャンルと制作品質を1文で:
- 例: "Professional corporate healthcare, serious problem-statement style"
- 例: "Casual UGC style, bright cheerful tone, smartphone aesthetic"

### layout
構図・配置・視線誘導を1文で:
- 例: "Right-heavy composition, subject at 60% width, left reserved for text, Z-pattern reading flow, rule of thirds"
- 例: "Centered symmetry, balanced layout, generous white space"

### typography
フォント詳細**と装飾要素**を1-2文で:

**記述すべき内容:**
- フォント種類: Bold gothic / Modern sans-serif / Handwritten 等
- ウェイト: headline weight 900, body weight 700 等
- 特殊効果: outer glow / drop shadow / outlined 等
- **テキストボックス**: 背景ボックスの有無・形状・色・影（重要！）

**良い例（明るいトーン - ボックスあり）:**
"Modern sans-serif typography, headline weight 900, body weight 700. Text placed in white rounded rectangle boxes (border-radius: 20px, padding: 15px 30px) with soft drop shadows."

**良い例（暗いトーン - ボックスあり）:**
"Bold gothic typography, headline weight 900, body weight 700. Text on dark blue rectangular boxes with drop shadows and outer glow on accent text."

**良い例（ボックスなし）:**
"Handwritten marker style, medium weight, no background boxes, casual friendly feel."

**重要**: 画像内のテキストに背景ボックスがある場合、必ずその詳細（形状・色・影）を記述すること。"no special effects" と書かないこと。

### colors
HEXコード含む具体的配色:
- 例: "Dark blue-grey gradient (top #2C3E50 to bottom #1A1A2E), accent gold #FFD700 with 20% glow, overall dark serious mood"
- 例: "White background with blue accents, accent yellow #FFD700, overall bright cheerful mood"

### decorations
画像に存在する装飾要素を**具体的に**配列で列挙（必ず画像を詳細に観察すること）:

**テキスト装飾（重要 - 必ずチェック）:**
- "White rounded rectangle boxes" - テキストの背景に白い角丸ボックスがある場合
- "Colored banner boxes" - テキストの背景に色付きバナーがある場合
- "Text boxes with drop shadow" - ボックスに影がある場合
- "Outlined text boxes" - テキストボックスに枠線がある場合
- "Semi-transparent overlay boxes" - 半透明のボックスがある場合

**アイコン・バッジ装飾:**
- "Badge/medal icons with ribbons" - メダル型のアイコン
- "Circular badge decorations" - 円形バッジ
- "Star/sparkle decorations" - キラキラ装飾
- "Checkmark icons in boxes" - チェックマーク付きボックス

**背景装飾:**
- 明るい系: ["Gradient overlay", "Pattern overlays", "Geometric shapes", "Soft shadows", "Pastel accents"]
- 暗い系: ["Grunge texture", "Cracked concrete", "Film grain", "Vignette effect", "Heavy shadows"]

**例（明るいトーン）:**
["White rounded rectangle text boxes", "Soft drop shadows", "Badge icons with ribbons", "Sparkle decorations", "Gradient overlay"]

**例（暗いトーン）:**
["Cracked concrete texture", "Film grain", "Vignette effect", "Drop shadows on boxes", "Grunge overlay"]

**重要**: 画像内のテキストに背景ボックスがある場合、必ず "White rounded rectangle boxes" や "Colored banner boxes" を含めること。

### mood
全体の雰囲気を1フレーズで:
- 例: "Serious and urgent"
- 例: "Bright and cheerful"
- 例: "Dark sophisticated"

## slots_json.textSlots

各テキスト領域の description を詳細に（英語）:

**必須要素:**
1. 配置（position）: top-left / center / bottom-center 等
2. フォント詳細: Bold gothic / Modern sans-serif / Handwritten + weight
3. 文字色: white / black / gold / blue 等
4. **背景ボックス（最重要）**: 
   - 有無: yes/no
   - 形状: rounded rectangle / rectangle / banner / circle / none
   - 色: white / colored / transparent / semi-transparent
   - 装飾: drop shadow / soft shadow / border / outline / none
   - サイズ: padding, border-radius の具体的な値（推定可）
5. 役割: creates [感情] tone（例: creates serious tone / creates friendly feel）

**良い例（明るいトーン - 白いボックス）:**
"Centered bold text in modern sans-serif (weight 700) on white rounded rectangle box (border-radius: 20px, padding: 15px 30px) with soft drop shadow (rgba(0,0,0,0.1)), creates clean modern feel"

**良い例（明るいトーン - 色付きバナー）:**
"Bold text in white on blue banner box (rectangular, padding: 10px 40px) with soft shadow, positioned center, draws attention to key message"

**良い例（明るいトーン - ボックスなし）:**
"Centered medium-weight text in blue, modern sans-serif, no background box, gentle soft appearance"

**良い例（暗いトーン - 暗いボックス）:**
"Bold aggressive text in white on navy blue rectangular box (padding: 20px) with drop shadow and gold outer glow on keywords, positioned top-left, creates serious professional tone"

**悪い例（NG）:**
"Centered text, no background" ← 背景ボックスの詳細が不足
"Bold text" ← フォント・色・装飾の情報が不足

**重要注意事項:**
- 画像内のテキストに白いボックスや色付きボックスがある場合、**必ず** "on white rounded rectangle box" や "on blue banner box" のように具体的に記述すること
- "no background" と書くのは、本当に背景が透明またはベタ塗りの場合のみ
- ボックスがある場合に "no background" と書くのは**間違い**

---

## 全体の重要チェックリスト

出力前に必ず確認:
- [ ] decorations に「テキストボックス」関連の装飾（"White rounded rectangle boxes" 等）が含まれているか？
- [ ] typography に「テキストボックスの詳細」（形状・色・影）が記述されているか？
- [ ] 各 textSlot の description に「背景ボックスの有無・詳細」が明記されているか？
- [ ] "no special effects" や "no background" を不適切に使用していないか？

**出力形式:**
{
  "category": "ヘルスケア/婚活/転職/EC/教育/汎用",
  "memo": "問題提起型/UGC感/雑誌風/高級感",
  "style_json": {
    "photography": "1文で簡潔に",
    "lighting": "3要素（陰影+色温度+方向）",
    "designStyle": "ジャンル+品質",
    "layout": "構図+配置+視線誘導",
    "typography": "フォント詳細",
    "colors": "HEXコード含む配色",
    "decorations": ["装飾要素の配列"],
    "mood": "雰囲気（1フレーズ）"
  },
  "slots_json": {
    "textSlots": [
      {"id": "topHeadline", "description": "配置・フォント・色・装飾・役割を詳細に"},
      {"id": "checklistItems", "description": "同上"},
      {"id": "centerWarning", "description": "同上"},
      {"id": "bottomSymptoms", "description": "同上"}
    ]
  }
}

重要：
- シンプルだが具体的に（1,200-1,800字程度）
- 被写体（人物・商品）とテキスト内容は除外
- デザイン要素のみ抽出
- HEXコード・数値を含める
- 再利用可能なスタイル定義として出力

JSON形式のみで回答してください。`;

async function imageToBase64(
  urlOrBase64: string
): Promise<{ type: string; data: string }> {
  if (urlOrBase64.startsWith("data:image")) {
    const [header, data] = urlOrBase64.split(",");
    const type = header.replace("data:", "").replace(";base64", "") || "image/png";
    return { type, data };
  }
  const res = await fetch(urlOrBase64);
  if (!res.ok) throw new Error(`画像取得失敗: ${res.status}`);
  const buf = await res.arrayBuffer();
  const base64 = Buffer.from(buf).toString("base64");
  const contentType = res.headers.get("content-type") || "image/png";
  return { type: contentType, data: base64 };
}

/**
 * 1枚の画像から詳細プロンプトを生成（成功フォーマット準拠）
 */
export async function generateTemplateFromOneImage(
  imageUrl: string
): Promise<GeneratedTemplate> {
  const content: Array<
    { type: "text"; text: string } | { type: "image_url"; image_url: { url: string } }
  > = [
    {
      type: "text",
      text: `${PROMPT_SYSTEM}

この画像を分析し、JSON形式のみで回答してください。`,
    },
  ];

  try {
    const { type, data } = await imageToBase64(imageUrl);
    content.push({
      type: "image_url",
      image_url: { url: `data:${type};base64,${data}` },
    });
  } catch (err) {
    throw new Error(`画像取得失敗: ${(err as Error).message}`);
  }

  const response = await openai.chat.completions.create({
    model: OPENAI_CHAT_MODEL,
    messages: [{ role: "user", content }],
    max_tokens: 3000,
    temperature: 0.7,
    response_format: { type: "json_object" },
  });

  const text = response.choices[0]?.message?.content;
  if (!text) throw new Error("プロンプトの生成に失敗しました");

  const parsed = JSON.parse(text) as {
    prompt_text?: string;
    category?: string;
    memo?: string;
  };
  return {
    prompt_text: parsed.prompt_text?.trim() || "",
    category: parsed.category?.trim() || "汎用",
    memo: parsed.memo?.trim() || "",
  };
}

/**
 * 1枚の画像からスタイル＋スロットのみ抽出（構造化用）
 * 成功プロンプトフォーマット準拠
 */
export async function analyzeImageForStructured(
  imageUrl: string
): Promise<GeneratedStructuredTemplate> {
  const content: Array<
    | { type: "text"; text: string }
    | { type: "image_url"; image_url: { url: string } }
  > = [
    {
      type: "text",
      text: STRUCTURED_SYSTEM,
    },
  ];

  try {
    const { type, data } = await imageToBase64(imageUrl);
    content.push({
      type: "image_url",
      image_url: { url: `data:${type};base64,${data}` },
    });
  } catch (err) {
    throw new Error(`画像取得失敗: ${(err as Error).message}`);
  }

  const response = await openai.chat.completions.create({
    model: OPENAI_CHAT_MODEL,
    messages: [{ role: "user", content }],
    max_tokens: 2500,
    temperature: 0.5,
    response_format: { type: "json_object" },
  });

  const text = response.choices[0]?.message?.content;
  if (!text) throw new Error("スタイル解析に失敗しました");

  const parsed = JSON.parse(text) as GeneratedStructuredTemplate;
  if (!parsed.style_json || !parsed.slots_json?.textSlots?.length) {
    throw new Error("style_json または slots_json が取得できませんでした");
  }
  return {
    category: parsed.category?.trim() || "汎用",
    memo: parsed.memo?.trim() || "",
    style_json: parsed.style_json,
    slots_json: parsed.slots_json,
  };
}

const sleep = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

/**
 * 複数画像から各1枚ずつテンプレを生成（4枚→4テンプレ）
 * レート制限対策で各生成の間に1.5秒の待機を挿入
 */
export async function generateTemplatesFromImages(
  imageUrls: string[]
): Promise<GeneratedTemplate[]> {
  const results: GeneratedTemplate[] = [];
  for (let i = 0; i < imageUrls.length; i++) {
    if (i > 0) await sleep(1500);
    const t = await generateTemplateFromOneImage(imageUrls[i]);
    results.push(t);
  }
  return results;
}