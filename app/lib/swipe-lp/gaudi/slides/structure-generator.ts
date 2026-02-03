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

以下の役割のいずれかを使用。構成は柔軟に（理想先行 or 問題提起先行）。1スライド1メッセージを徹底。

### 1. 理想の姿（アフターイメージ）（0-1枚・ファーストビュー向け）
- サービス利用後の解放感・理想の未来を提示
- 感情: 自由、安堵、再出発、ワクワク

### 2. 共感・問題提起（1-2枚）
- ターゲットの痛みを言語化。「分かってくれる」と感じさせる
- 感情: 共感、焦り、不安

### 3. 課題の背景・現状の苦しさ（0-1枚）
- 行動しないリスクを可視化
- 感情: 危機感、もどかしさ

### 4. ソリューション提示（1-2枚）
- 解決策・解放される手段を明確化
- 感情: 期待、驚き、興味

### 5. ベネフィット（1-2枚）
- 得られる価値を具体化。数字・シーンがあるとよい
- 感情: 希望、安心、満足

### 6. 社会的証明（0-1枚）
- 実績・口コミ・権威
- 感情: 信頼、安心

### 7. 比較・差別化（0-1枚）
- 他社との違いを明示

### 8. 具体的な流れ（0-1枚）
- 申込みが簡単・安心と示す

### 9. 口コミ・利用者の声（0-1枚）
- 第三者のリアルな安心

### 10. クロージング・CTA（1枚）
- 明確な次のアクション。FAQ・返金保証・限定オファーで不安払拭
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

## 各スライドの設計要素（すべて生成すること）

- **number**: スライド番号（1から開始）
- **purpose**: 上記の役割のいずれか（理想の姿 / 共感・問題提起 / 課題の背景 / ソリューション提示 / ベネフィット / 社会的証明 / 比較・差別化 / 具体的な流れ / 口コミ・利用者の声 / クロージング・CTA）
- **message**: メインメッセージ（20-50文字、インパクト重視）
- **subMessage**: サブメッセージ（50-120文字、補足・訴求の具体化）
- **additionalText**: 追加テキスト配列（0-4要素。チェックリスト・タグライン等）
- **emotion**: 狙い（心理トリガー）。例: 自由・安堵 / 共感・焦り / 期待・驚き / 希望・安心 / 信頼 / 行動意欲
- **visualHint**: ビジュアル方向性（1-2文）。人物/商品/空間、撮影イメージのヒント。例: 暗いオフィスを離れ青空の下で笑顔の男性
- **storyNote**: 前スライドとの接続・ストーリー上の役割（1文）
- **keyTakeaway**: このスライドで伝えたい1行サマリー
- **messageAlternatives**: 代替キャッチコピー案（最大2要素、A/Bテスト用）
- **narration**: ナレーション原稿（50-100文字、話し言葉。messageの繰り返しではなく補足・感情の深掘り。15-30秒読み上げ想定）
- **ctaButtonText**: purpose が クロージング・CTA の場合のみ。ボタン文言。例: LINEで無料相談
- **ctaUrgency**: purpose が クロージング・CTA の場合のみ。緊急性・限定感。例: 24時間受付 / 今だけ

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
      "purpose": "理想の姿",
      "message": "メインメッセージ",
      "subMessage": "サブメッセージ",
      "additionalText": ["項目1", "項目2"],
      "emotion": "自由・安堵",
      "visualHint": "青空の下で笑顔の男性。解放感を演出",
      "storyNote": "ファーストビュー。理想の姿で引き込み",
      "keyTakeaway": "退職後の穏やかな生活をイメージさせる",
      "messageAlternatives": ["代替案1"],
      "narration": "毎朝あの人の顔を思い出して憂うつになる。そんな日々、もう終わりにしませんか？",
      "ctaButtonText": null,
      "ctaUrgency": null
    }
  ],
  "totalSlides": 6,
  "reasoning": "設計の理由を簡潔に"
}

**必ずJSON形式で回答してください。すべてのスライドに visualHint, storyNote, keyTakeaway, narration を含めること。CTAスライドのみ ctaButtonText, ctaUrgency を埋めること。${slideCount != null && slideCount >= 6 && slideCount <= 8 ? `スライドは必ず ${slideCount} 枚で生成してください。` : "6-8枚のスライドを生成してください。"}**`,
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
      visualHint?: string;
      storyNote?: string;
      keyTakeaway?: string;
      messageAlternatives?: string[];
      narration?: string;
      ctaButtonText?: string | null;
      ctaUrgency?: string | null;
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
    visualHint: slide.visualHint,
    storyNote: slide.storyNote,
    keyTakeaway: slide.keyTakeaway,
    messageAlternatives: slide.messageAlternatives,
    narration: slide.narration,
    ctaButtonText: slide.ctaButtonText ?? undefined,
    ctaUrgency: slide.ctaUrgency ?? undefined,
    prompt: "",
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
    visualHint: s.visualHint,
    storyNote: s.storyNote,
    keyTakeaway: s.keyTakeaway,
    messageAlternatives: s.messageAlternatives,
    narration: s.narration,
    ctaButtonText: s.ctaButtonText,
    ctaUrgency: s.ctaUrgency,
  }));
}
