/**
 * Gaudí 2.0 Phase 2: マーケティング分析からスライド構成を生成
 */

import { openai, OPENAI_CHAT_MODEL } from "@/lib/openai";
import type { MarketingAnalysis, Slide } from "@/types/swipe-lp";
import type { SwipeLPv3Slide } from "@/types/swipe-lp-v3";

function uuid() {
  return "xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx".replace(/[xy]/g, (c) => {
    const r = (Math.random() * 16) | 0;
    const v = c === "x" ? r : (r & 0x3) | 0x8;
    return v.toString(16);
  });
}

/** スライド構成生成時のオプション（Step 3 でユーザーが指定） */
export interface SlideStructureOptions {
  userSupplement?: string | null;
  emphasisPoints?: string | null;
  outputTone?: string | null;
  slideCount?: number | null;
}

/**
 * マーケティング分析から6-8枚（または指定枚数）のスライド構成を生成
 */
export async function generateSlideStructure(
  analysis: MarketingAnalysis,
  options?: SlideStructureOptions | string | null
): Promise<Slide[]> {
  const opts: SlideStructureOptions =
    typeof options === "string" || options == null
      ? { userSupplement: options ?? undefined }
      : options;

  const userSupplement = opts.userSupplement;
  const emphasisPoints = opts.emphasisPoints;
  const outputTone = opts.outputTone;
  const slideCount = opts.slideCount;

  const slideCountInstruction =
    slideCount != null && slideCount >= 6 && slideCount <= 8
      ? `**必ず ${slideCount} 枚**のスワイプLP構成を設計してください。`
      : "6-8枚のスワイプLP構成を設計してください。";

  console.log("[Gaudí Slides] Generating structure from analysis...", { slideCount, outputTone: !!outputTone, emphasisPoints: !!emphasisPoints });

  const response = await openai.chat.completions.create({
    model: OPENAI_CHAT_MODEL,
    messages: [
      {
        role: "system",
        content: `マーケティング分析に基づき、${slideCountInstruction}

## ストーリーテリングの原則

### 1. 課題提起（1-2枚）
- ターゲットの痛みを想起させる
- 共感を得る
- 感情: 共感、焦り、不安

### 2. ソリューション提示（2-3枚）
- 解決策を示す
- 独自性を強調
- 感情: 期待、驚き、興味

### 3. ベネフィット（1-2枚）
- 得られる価値を具体化
- 変化後の理想を描く
- 感情: 希望、安心、満足

### 4. 社会的証明（0-1枚）
- 実績、口コミ、権威（任意）
- 信頼性を高める
- 感情: 信頼、安心

### 5. CTA（1枚）
- 明確な次のアクション
- 今すぐ行動する理由
- 感情: 行動意欲、決断

## マーケティング分析データ

**ビジネスタイプ**: ${analysis.businessType}

**ターゲット**: ${analysis.target}

**痛み（解決すべき課題）**:
${analysis.painPoints.map((p, i) => `${i + 1}. ${p}`).join("\n")}

**ソリューション**: ${analysis.solution}

**感情トリガー**: ${analysis.emotionalTrigger}

### ポジショニング・訴求軸（必ずスライドに反映すること）
- **ポジショニング**: ${analysis.positioning ?? "（自社の強みを参照）"}
- **訴求の軸**: ${analysis.benefitAngle ?? "（solution を参照）"}
- **欲求の時間軸**: ${analysis.desireTimeHorizon ?? "（ターゲットに合わせて判断）"}

### 3C分析
- **Customer（顧客）**: ${analysis.framework.threeC.customer}
- **Competitor（競合）**: ${analysis.framework.threeC.competitor}
- **Company（自社）**: ${analysis.framework.threeC.company}

### AIDMA
- **Attention（注意）**: ${analysis.framework.aidma.attention}
- **Interest（興味）**: ${analysis.framework.aidma.interest}
- **Desire（欲求）**: ${analysis.framework.aidma.desire}
- **Memory（記憶）**: ${analysis.framework.aidma.memory}
- **Action（行動）**: ${analysis.framework.aidma.action}
${userSupplement ? `\n## ユーザーからの追加情報\n${userSupplement}\n` : ""}
${emphasisPoints ? `\n## 特に強調したい点（必ずスライドに反映すること）\n${emphasisPoints}\n` : ""}
${outputTone ? `\n## テキストのトーン（全体で統一すること）\n- **${outputTone}**: ${outputTone === "neutral" ? "中立的・バランスの取れた表現" : outputTone === "casual" ? "カジュアル・親しみやすい・話し言葉" : outputTone === "professional" ? "プロフェッショナル・信頼感・丁寧" : outputTone === "playful" ? "遊び心・軽やか・ポジティブ" : outputTone}\n` : ""}

## 各スライドの設計要素

- **number**: スライド番号（1から開始）
- **purpose**: このスライドの役割（課題提起 / ソリューション / ベネフィット / 社会的証明 / CTA）
- **message**: メインメッセージ（20-50文字、インパクト重視、キャッチコピー・見出し）
- **subMessage**: サブメッセージ（50-120文字、補足説明・訴求の具体化）
- **additionalText**: 追加テキスト配列（0-4要素、各10-30文字。チェックリスト項目・キャプション・タグライン等。デザインテンプレートの複数テキストエリアを埋めるため多めに生成すること）
- **emotion**: 喚起する感情（共感・焦り / 期待・驚き / 希望・安心 / 信頼 / 行動意欲 など）

## 重要な指針

1. **テキストは多めに**: デザインテンプレートの複数テキストエリア（見出し・サブ・チェックリスト・キャプション等）を埋めるため、message・subMessage・additionalText を十分に生成する。1-2行では足りない。
2. **メッセージは具体的に**: 抽象的な言葉を避け、ターゲットが「自分のこと」と思える表現にする
3. **ストーリーの流れ**: 痛み → 解決策 → 理想の未来 → 行動 という自然な流れを作る
4. **感情の変化**: ネガティブ（不安・焦り）→ ポジティブ（期待・安心）→ アクション（決断）
5. **CTA は明確に**: 「今すぐ」「無料で」「簡単に」など、行動のハードルを下げる言葉を使う

### ポジショニング・ベネフィット・トーン（必須）

6. **ポジショニングに合わせた共感**: 上記「ポジショニング・訴求軸」を必ず参照する。業界の「あるある」痛みだけでなく、**このサービスの立ち位置に合った**課題・共感で書く。例: 即時性が強みのサービスなら「時間が足りない」より「今すぐ誰かと話したい」に寄せる。
7. **ベネフィットを具体化**: 共感・課題提起だけで終わらせない。**このサービスを使うとどう変わるか**を必ず含める（例: 5分で相手が見つかる、隙間時間で完結、今夜会える）。数字・シーンがあるとよい。
8. **トーン＆マナーを合わせる**: サービスの性質（気軽さ / 真剣さ / 遊び心 / ワクワク感）に合わせた文体にする。転職サイトやビジネススクールのような重いトーンにならないよう、自社の強み・ポジショニングに合った表現にする。
9. **欲求の時間軸を合わせる**: 「欲求の時間軸」が**短期的**なら「人生のチャンスを逃したくない」のような長期的な不安を主軸にしない。「今日誰かと話したい」「今週会いたい」など短期的な欲求にフォーカスする。逆に**長期的**なら将来の安心・人生の選択を前面に出す。

## 出力形式（JSON）

{
  "slides": [
    {
      "number": 1,
      "purpose": "課題提起",
      "message": "メインメッセージ（キャッチコピー）",
      "subMessage": "サブメッセージ（補足・具体例）",
      "additionalText": ["チェック項目1", "チェック項目2", "タグラインなど"],
      "emotion": "共感・不安"
    }
  ],
  "totalSlides": 6,
  "reasoning": "設計の理由を簡潔に"
}

**必ずJSON形式で回答してください。${slideCount != null && slideCount >= 6 && slideCount <= 8 ? `スライドは必ず ${slideCount} 枚で生成してください。` : "6-8枚のスライドを生成してください。"}**`,
      },
    ],
    response_format: { type: "json_object" },
    temperature: 0.8,
  });

  const rawContent = response.choices[0]?.message?.content;
  if (!rawContent?.trim()) {
    throw new Error(
      "AIからスライド構成の応答が空でした。もう一度お試しください。"
    );
  }

  let result: {
    slides?: Array<{
      number: number;
      purpose: string;
      message: string;
      subMessage?: string;
      additionalText?: string[];
      emotion?: string;
    }>;
    totalSlides?: number;
    reasoning?: string;
  };
  try {
    result = JSON.parse(rawContent) as typeof result;
  } catch (e) {
    console.error("[Gaudí Slides] Invalid JSON:", rawContent.slice(0, 200));
    throw new Error(
      "AIの応答形式が不正でした。もう一度「スライド構成を提案」を押して再試行してください。"
    );
  }

  console.log("[Gaudí Slides] Generated", result.totalSlides ?? result.slides?.length ?? 0, "slides");
  if (result.reasoning) {
    console.log("[Gaudí Slides] Reasoning:", result.reasoning);
  }

  const slides: Slide[] = (result.slides ?? []).map((slide) => ({
    number: slide.number,
    purpose: slide.purpose,
    message: slide.message,
    subMessage: slide.subMessage,
    additionalText: slide.additionalText,
    emotion: slide.emotion,
    prompt: "", // Phase 3 で生成
    locked: false,
  }));

  return slides;
}

/**
 * v3用: マーケティング分析＋Step3設定からスライド構成を生成（id, order 付き）
 */
export async function generateSlideStructureForV3(
  analysis: MarketingAnalysis,
  options?: SlideStructureOptions | string | null
): Promise<SwipeLPv3Slide[]> {
  const slides = await generateSlideStructure(analysis, options);
  return slides.map((s, i) => ({
    id: uuid(),
    order: i + 1,
    purpose: s.purpose,
    message: s.message,
    subMessage: s.subMessage,
    additionalText: s.additionalText,
    emotion: s.emotion,
  }));
}
