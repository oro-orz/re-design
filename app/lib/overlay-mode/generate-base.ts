// lib/overlay-mode/generate-base.ts

import {
  type TargetPerson,
  type TextRemovalMode,
  TARGET_PERSON_DESCRIPTIONS,
} from "@/types/overlay-mode";

const GEMINI_API_KEY = process.env.GEMINI_API_KEY;
const GEMINI_MODEL = "gemini-2.5-flash-image";

interface GenerateOptions {
  changePerson?: boolean;
  targetPerson?: TargetPerson;
  /** テキスト削除の強度（未指定時は preserve） */
  textRemovalMode?: TextRemovalMode;
}

/**
 * 参考画像からテキストを除去したベース画像を生成
 * オプションで人物も変更可能
 * @param imageBase64 - 画像のBase64文字列（data URL のプレフィックスなし）
 * @param mimeType - 画像のMIMEタイプ（例: image/jpeg, image/png）
 */
export async function generateBaseImage(
  imageBase64: string,
  mimeType: string,
  options?: GenerateOptions
): Promise<string> {
  if (!GEMINI_API_KEY) {
    throw new Error("GEMINI_API_KEY is not set");
  }

  const normalizedMime = mimeType?.startsWith("image/") ? mimeType : "image/jpeg";

  // プロンプト生成
  let prompt: string;

  if (options?.changePerson && options?.targetPerson) {
    // 人物変更 + テキスト除去 → 2段階で実行（指示が明確になり認識が安定する）
    const personDescription = TARGET_PERSON_DESCRIPTIONS[options.targetPerson];

    // Step 1: テキストのみ除去
    const textRemovalPrompt = buildTextRemovalPrompt(
      options.textRemovalMode ?? "preserve"
    );
    const imageAfterTextRemoval = await callGeminiImageEdit(
      imageBase64,
      normalizedMime,
      textRemovalPrompt
    );

    // Step 2: 人物を指定ターゲットに置き換え（受け取った画像は data URL なので base64 を抽出）
    const base64Only = imageAfterTextRemoval.replace(/^data:image\/\w+;base64,/, "");
    prompt = `Edit this image. REPLACE the person in the image with a new person who looks like this: ${personDescription}.

You MUST:
- Keep the same pose, position (e.g. person on the right), and scene (laptop, coffee, room)
- Keep all decorative elements (boxes, banners, badges, sparkles) exactly as they are
- Do not change aspect ratio or layout`;
    return callGeminiImageEdit(base64Only, "image/png", prompt);
  }

  // テキスト除去のみ
  prompt = buildTextRemovalPrompt(options?.textRemovalMode ?? "preserve");
  return callGeminiImageEdit(imageBase64, normalizedMime, prompt);
}

function buildTextRemovalPrompt(mode: TextRemovalMode): string {
  if (mode === "preserve") {
    return `Edit this image: remove ONLY the text (letters, numbers, symbols). Do NOT remove or alter any decorative elements.

CRITICAL - DO NOT REMOVE THESE (keep every one exactly as a shape, only clear the text inside):
- Rounded white boxes / rectangles (keep the box and its shadow; fill the inside with solid white where text was)
- Colored banners (light blue, blue, etc.) (keep the banner shape and color; fill with solid color where text was)
- Circular badges / rosettes / medals at the bottom (keep the circle shape and the ribbon; remove only any text on them)
- Ribbons, stars, sparkles (✨), and all small decorations
- All borders, frames, shadows, and drop shadows
- Background, person, objects, furniture

WHAT TO REMOVE: Only the characters and words (Japanese, English, numbers). Where each character was, paint that small area with the same color as the background of that box/banner (e.g. white inside white boxes, blue inside blue banner).

Rule: If it is a shape or decoration → KEEP IT. If it is a letter or character → remove it by filling with the shape’s background color. Do not change aspect ratio.`;
  }

  // aggressive: テキストを完全に削除。複雑な装飾は背景ごと削除。リボン・枠などは残す
  return `Edit this image so that ZERO text remains. You have two strategies:

STRATEGY A - SIMPLE ELEMENTS (always keep these, just remove text by filling):
- Simple ribbons, simple frames/boxes, rounded rectangles, colored banners: KEEP the shape. Remove text by filling that area with the same solid color (white in white boxes, banner color in banners).
- These are easy to fill: keep the shape and only erase the text.

STRATEGY B - COMPLEX ELEMENTS (where text is hard to remove cleanly):
- If a decorative element has complex text (e.g. detailed badges, intricate patterns with text) and you cannot cleanly remove only the text: REMOVE THE ENTIRE ELEMENT (the whole badge, the whole complex block). Replace it with the surrounding background color or leave that area blank/simple so that no text remains.
- Goal: the final image must have absolutely no visible text anywhere. If filling would leave traces of text, remove the whole decoration instead.

ALWAYS KEEP: Simple ribbons, simple frames, simple boxes (filled with solid color), background, person, objects, furniture. Only remove or simplify complex decorations when needed to achieve zero text.

Do not change aspect ratio. Output one image with no text remaining.`;
}

async function callGeminiImageEdit(
  imageBase64: string,
  mimeType: string,
  prompt: string
): Promise<string> {
  const GEMINI_API_KEY = process.env.GEMINI_API_KEY;
  const GEMINI_MODEL = "gemini-2.5-flash-image";
  if (!GEMINI_API_KEY) throw new Error("GEMINI_API_KEY is not set");

  // Gemini API 呼び出し
  const response = await fetch(
    `https://generativelanguage.googleapis.com/v1beta/models/${GEMINI_MODEL}:generateContent`,
    {
      method: "POST",
      headers: {
        "x-goog-api-key": GEMINI_API_KEY,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        contents: [
          {
            parts: [
              {
                inline_data: {
                  mime_type: mimeType,
                  data: imageBase64,
                },
              },
              { text: prompt },
            ],
          },
        ],
        generationConfig: {
          responseModalities: ["TEXT", "IMAGE"],
        },
      }),
    }
  );

  if (!response.ok) {
    const errorText = await response.text();
    console.error("Gemini API error:", errorText);
    throw new Error(`Gemini API error: ${response.status}`);
  }

  const result = await response.json();

  // 生成された画像を取得（API は snake_case で返す場合あり）
  const parts = result.candidates?.[0]?.content?.parts ?? [];
  const imagePart = parts.find(
    (part: { inlineData?: { data?: string }; inline_data?: { data?: string } }) =>
      part.inlineData ?? part.inline_data
  );
  const imageData =
    imagePart?.inlineData?.data ?? imagePart?.inline_data?.data;

  if (!imageData) {
    const errMsg =
      result.error?.message ?? "No image in response";
    console.error("Gemini response:", JSON.stringify(result).slice(0, 500));
    throw new Error(`No image generated: ${errMsg}`);
  }

  // Base64画像をData URLとして返す
  return `data:image/png;base64,${imageData}`;
}

/** ベース再構築用オプション */
export interface RebuildBaseOptions {
  /** 生成する人物のタイプ（未指定時は汎用の「人物」） */
  targetPerson?: TargetPerson;
}

/**
 * ベース再構築：元画像のレイアウト・トンマナのみ維持し、背景・人物・装飾を新規生成（1回のAPI呼び出し）
 */
export async function rebuildBaseImage(
  imageBase64: string,
  mimeType: string,
  options?: RebuildBaseOptions
): Promise<string> {
  if (!GEMINI_API_KEY) {
    throw new Error("GEMINI_API_KEY is not set");
  }
  const normalizedMime = mimeType?.startsWith("image/") ? mimeType : "image/jpeg";

  const personDescription = options?.targetPerson
    ? TARGET_PERSON_DESCRIPTIONS[options.targetPerson]
    : "a person matching the general pose and position in the reference (e.g. sitting with laptop, holding coffee), natural and professional appearance";

  const prompt = `Use this image as reference for LAYOUT and TONE/MANNER (トンマナ). Do NOT copy any text. Generate a NEW image with ONLY the person and the background.

TONMANA (you MUST match these from the reference):
- COLOR PALETTE: Copy the reference's background color and overall color temperature (e.g. soft pink, cream, light blue, teal). Same hues and saturation so it feels like the same design.
- MOOD: Same atmosphere - if the reference is warm and professional, keep it warm and professional; if it's bright and casual, keep it that way. Same lighting feel (soft, natural).

LAYOUT (match the reference):
- Person position and pose (e.g. right side, at laptop, holding coffee). Keep the same composition.

DO NOT RECONSTRUCT DECORATIONS. Instead:
- Remove ALL decorative elements: text boxes, banners, badges, ribbons, frames, shapes, icons. Do not redraw them.
- Where those elements were, fill with the BACKGROUND only (extend the background color/gradient so there are no holes or shapes).
- Output = PERSON + BACKGROUND only. No boxes, no banners, no badges, no decorative shapes.

Generate:
1. BACKGROUND: New scene with the SAME color temperature and mood as the reference. One continuous background - no decorative shapes on it.
2. PERSON: A new person who looks like this: ${personDescription}. Same position and pose as reference.

Output must have no text and no decorative elements. Same aspect ratio. Result = "same layout and tonmana, person + background only."`;
  return callGeminiImageEdit(imageBase64, normalizedMime, prompt);
}
