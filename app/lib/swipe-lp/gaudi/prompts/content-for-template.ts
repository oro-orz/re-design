/**
 * スライドとマーケティング分析から、テンプレート用の被写体・シーン・テキストを生成
 * 5 Golden Rules準拠の詳細な記述
 */

import { openai, OPENAI_CHAT_MODEL } from "@/lib/openai";
import type { MarketingAnalysis } from "@/types/swipe-lp";
import type { SwipeLPv3Slide, TemplateSlots, TemplateStyle } from "@/types/swipe-lp-v3";

export interface GeneratedContent {
  subject: string;
  scene: string;
  texts: Record<string, string>;
}

export async function generateContentForTemplate(
  slide: SwipeLPv3Slide,
  analysis: MarketingAnalysis | null | undefined,
  slots: TemplateSlots,
  templateStyle: TemplateStyle | null | undefined,
  excludePerson: boolean = false
): Promise<GeneratedContent> {
  const businessType = analysis?.businessType ?? "";
  const target = analysis?.target ?? "";
  const emotionalTrigger = analysis?.emotionalTrigger ?? "";

  const slotsDescription = slots.textSlots
    .map((slot) => `- ${slot.id}: ${slot.description}`)
    .join("\n");

  // テンプレートスタイル情報を抽出（参照用）
  const styleContext = templateStyle
    ? `
## テンプレートスタイル参照（デザイン要素は既定義済み、被写体・シーンの方向性の参考に）
- 撮影スタイル: ${templateStyle.photography || "指定なし"}
- ライティング: ${templateStyle.lighting || "指定なし"}
- 配色・ムード: ${templateStyle.colors || "指定なし"}
- 全体の雰囲気: ${templateStyle.mood || "指定なし"}

**注意**: これらはデザイン要素として既にテンプレートで定義済み。被写体・シーンはこのスタイルに合う内容を生成すること。
`
    : "";

  const response = await openai.chat.completions.create({
    model: OPENAI_CHAT_MODEL,
    messages: [
      {
        role: "system",
        content: `あなたは広告ビジュアルのコンテンツディレクターです。

**重要な役割分担**:
- [OK] あなたが生成: 被写体（人物・商品）、シーン（撮影場所・状況）、テキスト内容
- [X] 生成禁止: 配色、レイアウト、装飾、ライティング、タイポグラフィ（これらは既定義）

## マーケティング分析
- ビジネスタイプ: ${businessType}
- ターゲット: ${target}
- 感情トリガー: ${emotionalTrigger}

## スライド内容
- 目的: ${slide.purpose}
- メインメッセージ: ${slide.message}
- サブメッセージ: ${slide.subMessage || "なし"}
- 追加テキスト: ${slide.additionalText?.join(", ") || "なし"}
- 感情: ${slide.emotion || "なし"}

${styleContext}

## 人物表示設定
${excludePerson ? "[X] 人物なし（オーバーレイモード・テキストのみ）" : "[OK] 人物あり"}

## テキストスロット
${slotsDescription}

---

## 出力指針（5 Golden Rules準拠の詳細度）

### 1. subject（被写体）- 英語で詳細に記述

${
  excludePerson
    ? `
**人物なしモード**: 人物を含めず、象徴的なオブジェクト・空間・抽象的要素を記述

必須要素:
- メインオブジェクト（商品、道具、象徴物など）の詳細
- 配置・角度・サイズ感
- 質感・素材・状態
- 補助的な小物・装飾要素

例（ビジネス系）:
"Clean modern workspace surface with elegant notebook and pen, minimalist design objects, subtle product placement on right side, empty chair suggesting presence, professional corporate aesthetic"

例（ヘルスケア系）:
"Close-up of natural wellness products on white marble surface, green leaves and botanical elements, soft organic textures, minimalist arrangement with breathing room"

例（教育系）:
"Open textbook with highlighted notes, colorful sticky notes, coffee cup and laptop in background, study materials arranged naturally, inspiring learning atmosphere"

**重要**: 150文字以上の詳細な英語記述。配置・質感・雰囲気まで含める。
`
    : `
**人物ありモード**: ターゲット層を視覚的に表現する人物を詳細に記述

**重要 - ターゲット層の性別に合わせること**:
ターゲット: ${target}

${target.includes('男性') || target.includes('ビジネスマン') || target.includes('サラリーマン') 
  ? '→ **必ず男性を記述すること**（A Japanese man / A Caucasian man / A businessman 等）' 
  : target.includes('女性') || target.includes('主婦') || target.includes('OL')
  ? '→ **必ず女性を記述すること**（A Japanese woman / A young woman 等）'
  : '→ ターゲット層に最も適した性別を選択'}

必須要素（すべて英語で詳細に）:
1. **基本属性**: 年齢（具体的に）、**性別（ターゲットに合わせる）**、人種
2. **外見**: 髪型・髪色、肌の質感、体型
3. **表情**: 具体的な感情表現（smiling confidently / looking concerned / thoughtful gaze等）
4. **服装**: 色・スタイル・素材・ブランド感
5. **ポーズ**: 姿勢・手の位置・視線の方向・動作

**[X] 配置指示は含めない（重要）**:
- 「positioned right」「left-aligned」「occupying X%」等の配置表現は含めないこと
- これらはテンプレートのレイアウトで既に定義されているため
- 人物の外見・表情・服装・ポーズのみを記述すること

ターゲット: ${target}
感情トリガー: ${emotionalTrigger}

良い例（男性ターゲットの場合）:
"A Japanese man in his late 30s with short dark hair showing early signs of thinning, wearing a sharp navy business suit with white dress shirt and dark tie, standing with arms crossed showing subtle concern and stress in his expression, slight furrow in brow, professional corporate demeanor, natural skin texture with slight fatigue visible, confident posture despite worried look"

良い例（女性ターゲットの場合）:
"A Japanese woman in her early 30s with shoulder-length brown hair styled naturally, wearing a soft beige cashmere sweater and minimal jewelry, sitting relaxed at a modern wooden table, gazing thoughtfully at her smartphone with a gentle satisfied smile, natural warm lighting highlighting her face, calm and content expression showing relief and confidence"

悪い例（NG）:
"A woman using a phone" ← 詳細不足
"A person positioned right 60%" ← 配置指示は不要

**重要**: 200文字以上の詳細な英語記述。ターゲット層の共感を得る具体性を持たせる。配置指示は含めない。
`
}

### 2. scene（シーン）- 英語で撮影環境を詳細に記述

必須要素:
1. **場所の種類**: 具体的な空間タイプ（modern café / cozy living room / corporate office等）
2. **空間の特徴**: 広さ・天井高・壁の色・床材・家具配置
3. **照明環境**: 自然光/人工光の割合・窓の有無・光の質感
4. **雰囲気要素**: 小物・装飾・植物・背景の人物等
5. **ビジネス適合性**: ${businessType} のサービス・商品に合った場所

テンプレートムード: ${templateStyle?.mood || "指定なし"}

良い例:
"Modern minimalist café interior with floor-to-ceiling windows on left side allowing soft natural afternoon light, white walls with warm wooden accent panels, light oak tables and comfortable fabric chairs, small potted plants on windowsill, one or two blurred customers in far background creating lived-in atmosphere, clean and spacious feel with 3-meter ceiling height, calm professional environment perfect for focused work"

悪い例（NG）:
"In a café" ← 詳細不足

**重要**: 150文字以上の詳細な英語記述。撮影場所として再現可能な具体性を持たせる。

### 3. texts（テキスト）- 日本語で各スロットに対応

各テキストスロットの説明を読み、以下を考慮して日本語テキストを生成:
- スライドの message / subMessage / additionalText を活用
- ターゲット層に響く言葉選び
- 感情トリガー（${emotionalTrigger}）を反映
- 各スロットの役割（見出し/本文/強調/補足等）に応じた文体

**文字数ガイドライン**:
- 見出し系スロット: 15-30文字
- 本文系スロット: 30-60文字
- リスト項目系: 5-15文字 × 複数
- 強調系: 10-25文字

**重要**: 広告コピーとして自然で説得力のある日本語表現。

---

## 出力形式（JSON）

必ず以下の形式で出力してください:

\`\`\`json
{
  "subject": "被写体の詳細な英語記述（150-250文字）",
  "scene": "シーンの詳細な英語記述（150-250文字）",
  "texts": {
    "スロットID1": "日本語テキスト",
    "スロットID2": "日本語テキスト",
    ...
  }
}
\`\`\`

---

## 最終チェックリスト

出力前に以下を確認:
- [ ] subject は150文字以上の詳細な英語記述
- [ ] scene は150文字以上の詳細な英語記述
- [ ] 配色・レイアウト・ライティング等のデザイン要素を含んでいない
- [ ] ターゲット層とビジネスタイプに合致している
- [ ] 感情トリガーが視覚的に表現されている
- [ ] すべてのテキストスロットに日本語テキストが入っている

必ずJSON形式のみで回答してください。`,
      },
    ],
    response_format: { type: "json_object" },
    temperature: 0.7,
    max_tokens: 2000, // 詳細な記述のためトークン増量
  });

  const text = response.choices[0]?.message?.content;
  if (!text) throw new Error("コンテンツの生成に失敗しました");

  const result = JSON.parse(text) as GeneratedContent;
  
  // バリデーション
  if (!result.texts) result.texts = {};
  if (!result.subject) result.subject = "";
  if (!result.scene) result.scene = "";

  // 詳細度のチェック（警告のみ）
  if (result.subject && result.subject.length < 100) {
    console.warn(`[generateContentForTemplate] subject が短すぎます (${result.subject.length}文字): ${result.subject.substring(0, 50)}...`);
  }
  if (result.scene && result.scene.length < 100) {
    console.warn(`[generateContentForTemplate] scene が短すぎます (${result.scene.length}文字): ${result.scene.substring(0, 50)}...`);
  }

  return result;
}

/**
 * 生成されたコンテンツのバリデーション
 */
export function validateGeneratedContent(
  content: GeneratedContent,
  slots: TemplateSlots
): { valid: boolean; errors: string[]; warnings: string[] } {
  const errors: string[] = [];
  const warnings: string[] = [];

  // subject のチェック
  if (!content.subject || content.subject.trim().length === 0) {
    errors.push("subject が空です");
  } else if (content.subject.length < 100) {
    warnings.push(`subject が短すぎます（推奨: 150文字以上、現在: ${content.subject.length}文字）`);
  }

  // scene のチェック
  if (!content.scene || content.scene.trim().length === 0) {
    errors.push("scene が空です");
  } else if (content.scene.length < 100) {
    warnings.push(`scene が短すぎます（推奨: 150文字以上、現在: ${content.scene.length}文字）`);
  }

  // texts のチェック
  if (!content.texts || Object.keys(content.texts).length === 0) {
    errors.push("texts が空です");
  } else {
    // すべてのスロットにテキストが入っているかチェック
    slots.textSlots.forEach((slot) => {
      if (!content.texts[slot.id] || content.texts[slot.id].trim().length === 0) {
        warnings.push(`スロット "${slot.id}" のテキストが空です`);
      }
    });
  }

  // デザイン要素が含まれていないかチェック（簡易）
  const designKeywords = [
    'gradient', 'color:', 'background:', 'font-weight', 'layout', 
    'typography', 'decoration', 'border', 'shadow'
  ];
  const combinedText = `${content.subject} ${content.scene}`.toLowerCase();
  designKeywords.forEach((keyword) => {
    if (combinedText.includes(keyword)) {
      warnings.push(`デザイン要素キーワード "${keyword}" が含まれている可能性があります`);
    }
  });

  return {
    valid: errors.length === 0,
    errors,
    warnings,
  };
}