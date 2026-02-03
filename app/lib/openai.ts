import OpenAI from "openai";

if (!process.env.OPENAI_API_KEY) {
  throw new Error("OPENAI_API_KEY is not set in environment variables");
}

export const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

/**
 * Chat Completions で使用するモデル（環境変数 OPENAI_CHAT_MODEL で上書き可能）
 * デフォルト: gpt-4o（画像入力 image_url 対応のため。認証不要）
 * - gpt-4o: 画像・テキスト対応、高速・汎用（認証不要）※画像分析で必須
 * - gpt-4-turbo: 画像非対応のため image_url 使用箇所でエラーになる
 * - gpt-5.2: 画像対応。組織本人確認完了後に OPENAI_CHAT_MODEL=gpt-5.2 で利用可能
 */
export const OPENAI_CHAT_MODEL =
  process.env.OPENAI_CHAT_MODEL || "gpt-4o";
