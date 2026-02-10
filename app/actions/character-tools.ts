// actions/character-tools.ts
"use server";

import Replicate from "replicate";
import { createAdminClient } from "@/lib/supabase/admin";
import { getCurrentUserFromSession } from "@/lib/session";

const BUCKET = "images";

/** 429 レスポンス本文から retry_after（秒）を取得 */
function getRetryAfterSeconds(error: unknown, defaultSeconds = 10): number {
  const msg = error instanceof Error ? error.message : String(error);
  const match = msg.match(/\{"detail".*?"retry_after"\s*:\s*(\d+)/);
  if (match) {
    const n = parseInt(match[1], 10);
    if (Number.isFinite(n) && n >= 0) return Math.min(n, 60);
  }
  return defaultSeconds;
}

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

async function runWithRetry<T>(
  replicate: Replicate,
  model: `${string}/${string}`,
  options: { input: Record<string, unknown> },
  maxRetries = 3
): Promise<T> {
  let lastError: unknown;
  for (let attempt = 0; attempt <= maxRetries; attempt++) {
    try {
      return (await replicate.run(model, options)) as T;
    } catch (e) {
      lastError = e;
      const msg = e instanceof Error ? e.message : String(e);
      if (msg.includes("429") && attempt < maxRetries) {
        const waitSec = getRetryAfterSeconds(e);
        await sleep(waitSec * 1000);
        continue;
      }
      throw e;
    }
  }
  throw lastError;
}

const FACE_SWAP_MODEL = "cdingram/face-swap:d1d6ea8c8be89d664a07a457526f7128109dee7030fdac424788d762c71ed111";
const KONTEXT_MODEL = "black-forest-labs/flux-kontext-pro";

export type CharacterToolsMode = "face-swap" | "character-scene" | "multi-pose";

function extractUrl(v: unknown): string | null {
  if (typeof v === "string" && v.startsWith("http")) return v;
  if (Array.isArray(v)) {
    for (const x of v) {
      if (typeof x === "string" && x.startsWith("http")) return x;
      const u = extractUrl(x);
      if (u) return u;
    }
    return null;
  }
  if (v && typeof v === "object") {
    if ("url" in v && typeof (v as { url: unknown }).url === "function") {
      const u = (v as { url: () => URL }).url();
      return typeof u === "string" ? u : u?.href ?? null;
    }
    if ("output" in v) return extractUrl((v as { output: unknown }).output);
    if ("urls" in v && typeof (v as { urls: unknown }).urls === "object") {
      const u = (v as { urls: { get?: string } }).urls?.get;
      if (typeof u === "string" && u.startsWith("http")) return u;
    }
  }
  return null;
}

/**
 * 画像を file または imageUrl から解決し、公開URLを返す。
 * ファイルの場合は Storage にアップロードする。
 */
async function resolveImageToPublicUrl(
  supabase: ReturnType<typeof createAdminClient>,
  userId: string,
  formData: FormData,
  fieldFile: string,
  fieldUrl: string
): Promise<{ url: string; error?: string }> {
  const imageUrl = (formData.get(fieldUrl) as string | null)?.trim();
  const imageFile = formData.get(fieldFile) as File | null;

  if (imageUrl) {
    return { url: imageUrl };
  }
  if (imageFile && imageFile.size > 0) {
    const timestamp = Date.now();
    const filename = `${userId}/${timestamp}-${imageFile.name || "image"}`;
    const path = `character-tools/${filename}`;
    const { error: uploadError } = await supabase.storage
      .from(BUCKET)
      .upload(path, imageFile, {
        contentType: imageFile.type || "image/jpeg",
        upsert: false,
      });
    if (uploadError) {
      return { url: "", error: "画像のアップロードに失敗しました" };
    }
    const { data: { publicUrl } } = supabase.storage.from(BUCKET).getPublicUrl(path);
    return { url: publicUrl };
  }
  return { url: "", error: "画像を指定してください" };
}

/**
 * キャラ生成（フェイススワップ / キャラ別シーン / マルチポーズ）の Server Action
 */
export async function runCharacterTool(formData: FormData): Promise<{
  outputImageUrl?: string;
  error?: string;
}> {
  const user = await getCurrentUserFromSession();
  if (!user) return { error: "認証が必要です" };
  const supabase = createAdminClient();

  if (!process.env.REPLICATE_API_TOKEN) {
    return { error: "REPLICATE_API_TOKEN が未設定です。" };
  }

  const mode = (formData.get("mode") as CharacterToolsMode) || "face-swap";
  const replicate = new Replicate({
    auth: process.env.REPLICATE_API_TOKEN,
    useFileOutput: false,
  });

  if (mode === "face-swap") {
    const target = await resolveImageToPublicUrl(
      supabase,
      user.id,
      formData,
      "targetImage",
      "targetImageUrl"
    );
    if (target.error) return { error: target.error };

    const swap = await resolveImageToPublicUrl(
      supabase,
      user.id,
      formData,
      "swapImage",
      "swapImageUrl"
    );
    if (swap.error) return { error: swap.error };

    const input = {
      input_image: target.url,
      swap_image: swap.url,
    };

    try {
      const out = await runWithRetry(replicate, FACE_SWAP_MODEL as `${string}/${string}`, { input });
      const url = extractUrl(out);
      if (!url) return { error: "生成画像のURLを取得できませんでした。" };
      return { outputImageUrl: url };
    } catch (e) {
      const msg = e instanceof Error ? e.message : String(e);
      return { error: `フェイススワップ失敗: ${msg}` };
    }
  }

  if (mode === "character-scene" || mode === "multi-pose") {
    const image = await resolveImageToPublicUrl(
      supabase,
      user.id,
      formData,
      "characterImage",
      "characterImageUrl"
    );
    if (image.error) return { error: image.error };

    const prompt = (formData.get("prompt") as string)?.trim();
    if (!prompt) {
      return { error: mode === "character-scene" ? "シーンの説明を入力してください。" : "ポーズの説明を入力してください。" };
    }

    try {
      const out = await runWithRetry(replicate, KONTEXT_MODEL as `${string}/${string}`, {
        input: {
          input_image: image.url,
          prompt,
          aspect_ratio: "match_input_image",
        },
      });
      const url = extractUrl(out);
      if (!url) return { error: "生成画像のURLを取得できませんでした。" };
      return { outputImageUrl: url };
    } catch (e) {
      const msg = e instanceof Error ? e.message : String(e);
      return { error: `生成失敗: ${msg}` };
    }
  }

  return { error: "不明なモードです。" };
}
