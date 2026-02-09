/**
 * Stage1: マーケティング分析からスライド用の具体的なコピー要素を生成
 * 2段階パイプラインの前半。抽象的な分析を「スワイプLPで使える具体的なフレーズ」に変換する。
 */

import { openai, OPENAI_CHAT_MODEL } from "@/lib/openai";
import type { MarketingAnalysis } from "@/types/swipe-lp";
import type { SlideReadyCopy } from "@/types/swipe-lp-v3";

export async function runSlideCopyEnricher(
  analysis: MarketingAnalysis
): Promise<SlideReadyCopy> {
  console.log("[CopyEnricher] Generating slide-ready copy from analysis...");

  const response = await openai.chat.completions.create({
    model: OPENAI_CHAT_MODEL,
    messages: [
      {
        role: "system",
        content: `あなたはSNS広告・スワイプLPのコピーライターです。
**エッジの効いた、スクロールを止める**コピーを出力してください。インスタ・TikTok・Xのフィードで「これは何？」と拇指が止まる強さが目標です。

## 重要なルール
- **抽象的・ありがち禁止**: 「お悩みありませんか」「お気軽に」「ぜひ」は絶対NG
- **具体的・刺さる必須**: ターゲットの本音・シーン・数字をストレートに
- **エッジ**: 当たり障りのない表現より、少し挑発的・本音寄りでOK。ただし誇大表現や虚偽は禁止

## 禁止パターン
「〜でお悩みではありませんか」「お気軽に」「ぜひ」「多くのお客様に」「充実した」「高品質な」「丁寧な」「あなたの理想の〜を」「〜を実現」

## 参考: エッジの効いた具体性
- NG: 「退職に不安がある」→ OK: 「上司に話しても引き止められるのが怖い。」「職場の人間関係が最悪で顔も見たくない。」
- NG: 「当社がサポートします」→ OK: 「明日、会社に行かなくて大丈夫。」
- NG: 「実績多数」→ OK: 「退職成功率100%。累計6万件。弁護士監修でトラブルゼロ。」
- NG: 「簡単3ステップ」→ OK: 「LINEで相談 → 担当が対応 → 出社せずに退職完了」

## マーケティング分析データ

**ビジネスタイプ**: ${analysis.businessType}

**ターゲット**: ${analysis.target}

**痛み（解決すべき課題）**:
${analysis.painPoints.map((p, i) => `${i + 1}. ${p}`).join("\n")}

**ソリューション**: ${analysis.solution}

**感情トリガー**: ${analysis.emotionalTrigger}

**ポジショニング**: ${analysis.positioning ?? "（自社の強みを参照）"}

**訴求の軸**: ${analysis.benefitAngle ?? "（solution を参照）"}

**3C**:
- 顧客: ${analysis.framework.threeC.customer}
- 競合: ${analysis.framework.threeC.competitor}
- 自社: ${analysis.framework.threeC.company}

## 出力形式（JSON）

必ず以下の形式で出力してください。各要素はスライドにそのまま貼れる具体的な文にすること。

{
  "painPhrases": ["具体的な悩み文1", "具体的な悩み文2", "具体的な悩み文3"],
  "riskPhrases": ["行動しないリスクを可視化する文1", "行動しないリスクを可視化する文2"],
  "solutionHeadline": "解決策の見出し（インパクトのある一言）",
  "solutionCatch": "解決策のキャッチ（例: 明日、会社に行かなくて大丈夫。）",
  "benefitBullets": ["メリット1（数字・具体性あり）", "メリット2", "メリット3"],
  "trustPoints": ["信頼ポイント1（数字付き）", "信頼ポイント2", "信頼ポイント3"],
  "flowSteps": ["ステップ1", "ステップ2", "ステップ3"],
  "testimonialTemplates": [""○○という声" 20代 男性", ""△△という声" 30代 女性"],
  "ctaVariants": {
    "headline": "CTA見出し（例: もう我慢しないでください。）",
    "buttonText": "ボタン文言（例: LINEで無料相談）",
    "supplement": "補足（料金・緊急性など。例: 24時間受付・相談無料）"
  }
}

必ずJSON形式のみで回答してください。`,
      },
    ],
    response_format: { type: "json_object" },
    temperature: 0.5,
  });

  const rawContent = response.choices[0]?.message?.content;
  if (!rawContent?.trim()) {
    throw new Error("コピー要素の生成に失敗しました。もう一度お試しください。");
  }

  try {
    const parsed = JSON.parse(rawContent) as SlideReadyCopy;

    // バリデーション・フォールバック
    return {
      painPhrases: Array.isArray(parsed.painPhrases) ? parsed.painPhrases : [],
      riskPhrases: Array.isArray(parsed.riskPhrases) ? parsed.riskPhrases : [],
      solutionHeadline: typeof parsed.solutionHeadline === "string" ? parsed.solutionHeadline : analysis.solution,
      solutionCatch: typeof parsed.solutionCatch === "string" ? parsed.solutionCatch : analysis.solution,
      benefitBullets: Array.isArray(parsed.benefitBullets) ? parsed.benefitBullets : [],
      trustPoints: Array.isArray(parsed.trustPoints) ? parsed.trustPoints : [],
      flowSteps: Array.isArray(parsed.flowSteps) ? parsed.flowSteps : [],
      testimonialTemplates: Array.isArray(parsed.testimonialTemplates) ? parsed.testimonialTemplates : [],
      ctaVariants:
        parsed.ctaVariants && typeof parsed.ctaVariants === "object"
          ? {
              headline: parsed.ctaVariants.headline ?? "",
              buttonText: parsed.ctaVariants.buttonText ?? "",
              supplement: parsed.ctaVariants.supplement ?? "",
            }
          : { headline: "", buttonText: "", supplement: "" },
    };
  } catch (e) {
    console.error("[CopyEnricher] Invalid JSON:", rawContent.slice(0, 200));
    throw new Error("コピー要素の形式が不正でした。もう一度お試しください。");
  }
}
