"use server";

import OpenAI from "openai";
import { OPENAI_CHAT_MODEL } from "@/lib/openai";
import { type ModeId } from "@/lib/constants";

const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

const SYSTEM_PROMPT = `# Role Definition
You are "Re:Design", an expert AI Art Director and Professional Designer.
Your task is to analyze the uploaded image and provide design feedback in Japanese.
**なるべくわかりやすく、詳しく**解説してください。デザインの原則に沿った見出しで整理し、**どこをどう直せばよくなるか**をテキストで説明します。

# 出力形式：デザインの原則に沿った見出しで整理
analysis_summary には、次の見出しを使って構成したフィードバックを1つにまとめてください。
各見出しの直後に、その原則に照らした「現状の課題」と「どこをどう直すとよいか」を、**わかりやすく・具体的に・2〜4文で**書いてください。
該当する問題がない項目は「問題なし」や「特になし」と短く書くか、省略してもかまいません。

**必須の見出し（## で始める1行）：**
- ## 整列（アライメント）
- ## 近接（プロキシミティ）
- ## コントラスト（強弱）
- ## 反復（一貫性）
- ## 可読性
- ## 視認性

**各セクションの書き方：**
1. まず、その原則から見た「どこに問題があるか」を具体的に指摘する（例：「左上の見出しと中央のテキストの左端が揃っておらず、視線が散らばります」）。
2. 次に、「どう直すとよいか」を具体的に提案する（例：「左マージンを揃えるか、グリッドに合わせて要素を配置し直してください」）。
3. 専門用語を使う場合は、必要に応じて一言補足するとわかりやすいです。
4. 文体はです・ます調で統一。読み手が改善作業にそのまま活かせるように、**詳しく・わかりやすく**書いてください。

**含めないこと：** 全体の雰囲気やスタイルの良し悪し、「全体的に」といった抽象的な表現は避け、原則ごとの具体的な指摘と改善案に絞ってください。

# Output Format
Return valid JSON only (no markdown, no code fence):
{
  "analysis_summary": "上記の見出し（## 整列 など）で区切った、デザインフィードバック全文。各見出しの下に、どこをどう直せばよいかを詳しく解説。改行は\\nで表す。"
}`;

export async function analyze(params: {
  imageUrl: string;
  mode: ModeId;
  aspectRatio: string;
}) {
  const { imageUrl } = params;
  if (!process.env.OPENAI_API_KEY) {
    return { error: "OPENAI_API_KEY が未設定です。" };
  }

  const userMessage = "画像を分析し、上記の形式でデザインフィードバック（analysis_summary）のJSONのみを返してください。";

  const res = await openai.chat.completions.create({
    model: OPENAI_CHAT_MODEL,
    messages: [
      { role: "system", content: SYSTEM_PROMPT },
      {
        role: "user",
        content: [
          { type: "text", text: userMessage },
          { type: "image_url", image_url: { url: imageUrl } },
        ],
      },
    ],
    max_tokens: 2048,
  });

  const raw = res.choices[0]?.message?.content?.trim();
  if (!raw) {
    return { error: "分析結果を取得できませんでした。" };
  }

  const cleaned = raw.replace(/^```json\s*|\s*```$/g, "").trim();
  let parsed: { analysis_summary?: string };
  try {
    parsed = JSON.parse(cleaned) as { analysis_summary?: string };
  } catch {
    return { error: "分析結果の形式が不正です。" };
  }
  if (!parsed.analysis_summary) {
    return { error: "analysis_summary がありません。" };
  }

  return {
    feedback: parsed.analysis_summary.trim(),
  };
}
