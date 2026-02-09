import OpenAI from "openai";

if (!process.env.OPENAI_API_KEY) {
  throw new Error("OPENAI_API_KEY is not set in environment variables");
}

export const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

/**
 * Chat Completions で使用するモデル（環境変数 OPENAI_CHAT_MODEL で上書き可能）
 * デフォルト: gpt-5.2（画像入力 image_url 対応。Verification 完了組織向け）
 * - gpt-5.2: 画像・テキスト対応、400K コンテキスト（5系推奨）
 * - gpt-4o: 画像対応・認証不要。4系に戻す場合は OPENAI_CHAT_MODEL=gpt-4o
 */
export const OPENAI_CHAT_MODEL =
  process.env.OPENAI_CHAT_MODEL || "gpt-5.2";
