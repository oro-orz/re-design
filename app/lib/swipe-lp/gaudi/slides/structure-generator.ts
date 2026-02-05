/**
 * Gaudí 2.0 Phase 2: マーケティング分析からスライド構成を生成
 */

import { openai, OPENAI_CHAT_MODEL } from "@/lib/openai";
import type { MarketingAnalysis, Slide } from "@/types/swipe-lp";
import type { SlideReadyCopy, SwipeLPv3Slide } from "@/types/swipe-lp-v3";

function uuid() {
  return "xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx".replace(/[xy]/g, (c) => {
    const r = (Math.random() * 16) | 0;
    const v = c === "x" ? r : (r & 0x3) | 0x8;
    return v.toString(16);
  });
}

/** スライド構成生成時のオプション（Step 3 でユーザーが指定） */
export interface SlideStructureOptions {
  emphasisPoints?: string | null;
  slideCount?: number | null;
  /** 2段階パイプライン: Stage1 で生成された具体的なコピー要素（ある場合は優先使用） */
  slideReadyCopy?: SlideReadyCopy | null;
}

/**
 * マーケティング分析から6-8枚（または指定枚数）のスライド構成を生成
 */
export async function generateSlideStructure(
  analysis: MarketingAnalysis,
  options?: SlideStructureOptions | string | null
): Promise<Slide[]> {
  const opts: SlideStructureOptions =
    typeof options === "string" || options == null ? {} : options;

  const emphasisPoints = opts.emphasisPoints;
  const slideCount = opts.slideCount;
  const slideReadyCopy = opts.slideReadyCopy;

  const slideCountInstruction =
    slideCount != null && slideCount >= 6 && slideCount <= 8
      ? `**必ず ${slideCount} 枚**のスワイプLP構成を設計してください。`
      : "6-8枚のスワイプLP構成を設計してください。";

  console.log("[Gaudí Slides] Generating structure from analysis...", { slideCount, emphasisPoints: !!emphasisPoints, hasSlideReadyCopy: !!slideReadyCopy });

  const response = await openai.chat.completions.create({
    model: OPENAI_CHAT_MODEL,
    messages: [
      {
        role: "system",
        content: `マーケティング分析に基づき、${slideCountInstruction}

**前提**: 出力はSNS広告（インスタ・TikTok・X）向け。スクロールを止める、エッジの効いたコピーを目指す。抽象的・ありがちな表現は禁止。

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
${slideReadyCopy ? `
## スライド用の具体的なコピー要素（必ず優先して使用すること）

以下は事前に生成された、スワイプLPでそのまま使える具体的なフレーズです。
**message / subMessage / additionalText には、これらのフレーズを選び・組み合わせ・補足して使用してください。** ゼロから書くのではなく、これらの具体性を活かしてスライドを組み立てること。

- **共感・悩み用**: ${slideReadyCopy.painPhrases.join(" / ")}
- **リスク可視化用**: ${slideReadyCopy.riskPhrases.join(" / ")}
- **解決策見出し**: ${slideReadyCopy.solutionHeadline}
- **解決策キャッチ**: ${slideReadyCopy.solutionCatch}
- **メリット**: ${slideReadyCopy.benefitBullets.join(" / ")}
- **信頼・実績**: ${slideReadyCopy.trustPoints.join(" / ")}
- **申込みの流れ**: ${slideReadyCopy.flowSteps.join(" → ")}
- **口コミ例**: ${slideReadyCopy.testimonialTemplates.join(" / ")}
- **CTA見出し**: ${slideReadyCopy.ctaVariants.headline ?? ""}
- **CTAボタン**: ${slideReadyCopy.ctaVariants.buttonText ?? ""}
- **CTA補足**: ${slideReadyCopy.ctaVariants.supplement ?? ""}
` : ""}
${emphasisPoints ? `\n## 特に強調したい点（必ずスライドに反映すること）\n${emphasisPoints}\n` : ""}

## 禁止パターン（絶対に使わないこと）
「〜でお悩みではありませんか」「お気軽に」「ぜひ」「多くのお客様に」「充実した」「高品質な」「丁寧な」「あなたの理想の〜を」「〜を実現」。当たり障りのない一般論はNG。

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
- **narration**: ナレーション原稿（50-100文字・15-30秒想定）。**SNSインフルエンサー風に、視聴者に直接語りかける口調で書くこと**。一人称は「私」または省略し、「ねえ」「みんな」「あなた」など相手を意識した呼びかけを入れる。messageの棒読みではなく、友達に話すように親しみやすく・本音っぽく。例:「ねえ、これ知ってる？ 私も昔そうだったんだけど」「みんなにも伝えたくて」「あなたなら分かってくれると思う」
- **ctaButtonText**: purpose が クロージング・CTA の場合のみ。ボタン文言。例: LINEで無料相談
- **ctaUrgency**: purpose が クロージング・CTA の場合のみ。緊急性・限定感。例: 24時間受付 / 今だけ

## 重要な指針

1. **SNS広告・エッジ**: フィードで拇指が止まる強さ。当たり障りのない表現より、本音寄り・挑発的でOK（誇大・虚偽は除く）
2. **テキストは多めに**: デザインテンプレートの複数テキストエリアを埋めるため、message・subMessage・additionalText を十分に生成する
3. **メッセージは具体的に**: 抽象的な言葉を禁止。数字・シーン・ターゲットの心の声のいずれかを必ず含める
4. **ストーリーの流れ**: 痛み → 解決策 → 理想の未来 → 行動 という自然な流れを作る
5. **感情の変化**: ネガティブ（不安・焦り）→ ポジティブ（期待・安心）→ アクション（決断）
6. **CTA は明確に**: 「今すぐ」「無料で」「簡単に」など、行動のハードルを下げる言葉を使う
7. **ナレーションは広告・インフルエンサー寄りに**: 視聴者に向かって語りかける。SNSの動画で「ねえ、みんな」「あなたに伝えたい」のように話しかけるトーン。堅い説明調・アナウンス調は避け、親しみやすく本音っぽく。

### ポジショニング・ベネフィット（必須）

8. **ポジショニングに合わせた共感**: 上記「ポジショニング・訴求軸」を必ず参照する。業界の「あるある」痛みだけでなく、**このサービスの立ち位置に合った**課題・共感で書く。例: 即時性が強みのサービスなら「時間が足りない」より「今すぐ誰かと話したい」に寄せる。
9. **ベネフィットを具体化**: 共感・課題提起だけで終わらせない。**このサービスを使うとどう変わるか**を必ず含める（例: 5分で相手が見つかる、隙間時間で完結、今夜会える）。数字・シーンがあるとよい。
10. **欲求の時間軸を合わせる**: 「欲求の時間軸」が**短期的**なら「人生のチャンスを逃したくない」のような長期的な不安を主軸にしない。「今日誰かと話したい」「今週会いたい」など短期的な欲求にフォーカスする。逆に**長期的**なら将来の安心・人生の選択を前面に出す。

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
      "narration": "ねえ、毎朝あの人のこと考えちゃって憂うつになるの、私だけ？ そんな日々、もう終わりにしない？",
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
    temperature: 0.5,
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
      "AIの応答形式が不正でした。もう一度「スライドテキストを作成」を押して再試行してください。"
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
