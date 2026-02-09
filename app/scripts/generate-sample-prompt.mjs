/**
 * 医療従事者転職サイト想定で、5つの黄金法則形式のスライドプロンプトを1件生成するサンプルスクリプト
 * 実行: node scripts/generate-sample-prompt.mjs（app ディレクトリで）
 * .env に OPENAI_API_KEY が必要です
 */

import "dotenv/config";
import OpenAI from "openai";

const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

const SYSTEM_PROMPT = `あなたは**スワイプLP用**の画像生成プロンプトを書く専門家です。
スワイプLPは **Instagram・TikTok・YouTube Shorts** で使う縦型広告なので、**UGCの要素が強い**デザインにしてください。

【前提】
- **CTA（ボタン・申し込み誘導）はプロンプトに含めない**。CTAは後からオーバーレイで付けるため、画像内にボタンやCTAテキストを配置しないでください。
- 含めるのは **ヘッドライン・サブコピー・キャッチ・バッジ等の装飾** まで。最下部にCTA用余白を残すイメージでよい。

【5つの黄金法則】
1. 主題 (Subject): 誰が/何が主役か、外見・服装・ポーズ・表情等を具体的に
2. 媒体・スタイル (Medium & Style): **UGC寄り**（Smartphone-quality, Candid, Dynamic, Vibrant 等）を基本に、業界に合わせて Trust / Pop をブレンド
3. 構図・レイアウト (Composition & Layout): 9:16縦型、Z型/三分割、装飾・テキスト階層（**CTAは含めない**）
4. 照明・色彩 (Lighting & Color): 照明、カラーパレット、ムード、グラデーション/オーバーレイ
5. 技術的な質・除外設定 (Technical & Negative): 解像度・フォーカス指定、Negative Prompt

【UGC・ショート動画向けの作り込み（必須）】
- **UGC感**: スマホで撮ったような親しみやすさ、カジュアル、手書き風アクセント、はっきりした色。ストーリーで流れても違和感ないトーン。
- **装飾**: 角丸枠・リボン・バッジ・細いライン・ドロップシャドウ・グラデーションオーバーレイ（**CTAボタンは含めない**）
- **情報階層**: メインコピー・サブのサイズ差で階層をはっきり（CTAは指定しない）
- **奥行き**: レイヤー・ソフトシャドウで立体感。下部はCTAオーバーレイ用余白。

【出力形式】
必ず以下の構造で出力してください。見出しは英語のままにすること。

1. 主題 (Subject):
[主役の詳細。キャラなしの場合はテキスト・装飾が主役であることを明記]

2. 媒体・スタイル (Medium & Style):
[Instagram/TikTok/YouTube Shorts 向け。UGC寄りのキーワードを含める]

3. 構図・レイアウト (Composition & Layout):
[9:16 vertical]
Primary Focus: [主役の位置と視線誘導]
Information Layer: [ヘッドライン・キャッチ・バッジ等の配置。**CTA・ボタンは含めない**]
Decoration & UI: [枠・リボン・バッジ・オーバーレイ等。ボタンは含めない]
Depth: [レイヤー・奥行き]

Text overlay placement:
- [ヘッドライン・サブ・キャッチ等の位置・サイズ・色。CTAは含めない]

4. 照明・色彩 (Lighting & Color):
[照明・パレット・ムード・グラデーション/オーバーレイ]

5. 技術的な質・除外設定 (Technical & Negative):
[8k, sharp focus, テキストの可読性等]

Negative Prompt: [除外事項をカンマ区切りで英語]

【重要】
- 日本語で表示するテキストはプロンプト内にそのまま明記すること
- **CTA（申し込みボタン等）は画像に含めず、後からオーバーレイで付ける前提で書くこと**
- Instagram・TikTok・Shorts で流れることを想定し、UGC寄りの親しみやすさを出すこと
- 出力はプロンプト本文のみ。前置き・説明は不要
`;

// 医療従事者転職サイト・1枚目（フック）想定の入力
const USER_PROMPT = `
【Phase 1: ビジネス情報】
ターゲット: 28-45歳, 看護師・理学療法士・薬剤師等の医療従事者
悩み: 給与が上がらない, 夜勤がきつい, キャリアの見通しが不安
訴求: より良い条件で働きたい, ワークライフバランス, 専門性を活かした転職
懸念: 転職しても同じでは？, ブランクが不安

【Phase 2: スライド情報】
役割: hook
メッセージ: 年収アップ実現。医療のプロが選ぶ転職
感情: 興味
ビジュアル重視度: visual-heavy
証拠を含む: false
CTA含む: false
トーン変化: —

【Phase 3: デザイン設定】
テンプレート: hero
デザイントーン: professional
訴求パターン: benefit
レイアウト: visual-top
テキスト:
- ヘッドライン: 年収アップ実現。医療のプロが選ぶ転職
- サブヘッドライン: —
- 箇条書き: —
- キャッチコピー: あなたの経験を、次のステージへ
- CTA: 求人を見る
キャラ有無: true
キャラスペース指示: 右側 40%、看護師または医療スタッフの笑顔

【デザインシステム】
Primary色: #2563EB
Secondary色: #0EA5E9
Accent色: #06B6D4
トーン: professional
スタイル: photorealistic

---

上記の情報から、NanoBanana Pro 用の超詳細プロンプトを
5つの黄金法則に従って生成してください。
`.trim();

async function main() {
  if (!process.env.OPENAI_API_KEY) {
    console.error("OPENAI_API_KEY が設定されていません。.env を確認してください。");
    process.exit(1);
  }

  console.log("医療従事者転職サイト（1枚目・フック）のプロンプトを生成中...\n");

  const chatModel = process.env.OPENAI_CHAT_MODEL || "gpt-4o";
  const response = await openai.chat.completions.create({
    model: chatModel,
    messages: [
      { role: "system", content: SYSTEM_PROMPT },
      { role: "user", content: USER_PROMPT },
    ],
    temperature: 0.7,
  });

  const prompt = response.choices[0].message?.content?.trim() ?? "";
  console.log("========== 生成されたスライドプロンプト（5つの黄金法則形式） ==========\n");
  console.log(prompt);
  console.log("\n========== 以上 ==========");
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
