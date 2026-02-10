import { NextRequest, NextResponse } from "next/server";
import Replicate from "replicate";
import { createAdminClient } from "@/lib/supabase/admin";
import { getCurrentUserFromSession } from "@/lib/session";

const BUCKET = "images";

/** 429 レスポンス本文から retry_after（秒）を取得。無い場合はデフォルトを返す */
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

/** replicate.run を 429 時に retry_after 待機してリトライ（最大 maxRetries 回） */
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
// easel/advanced-face-swap は Firestore 依存で失敗するため代替。Replicate API はバージョン指定が必要な場合あり
const FACE_SWAP_MODEL = "cdingram/face-swap:d1d6ea8c8be89d664a07a457526f7128109dee7030fdac424788d762c71ed111";
const KONTEXT_MODEL = "black-forest-labs/flux-kontext-pro";

type CharacterToolsMode = "face-swap" | "character-scene" | "multi-pose";

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
      console.error("Supabase upload error:", uploadError);
      return { url: "", error: "画像のアップロードに失敗しました" };
    }
    const { data: { publicUrl } } = supabase.storage.from(BUCKET).getPublicUrl(path);
    return { url: publicUrl };
  }
  return { url: "", error: "画像を指定してください" };
}

export async function POST(request: NextRequest) {
  const user = await getCurrentUserFromSession();
  if (!user) {
    return NextResponse.json({ error: "認証が必要です" }, { status: 401 });
  }
  const supabase = createAdminClient();

  if (!process.env.REPLICATE_API_TOKEN) {
    return NextResponse.json({ error: "REPLICATE_API_TOKEN が未設定です。" }, { status: 500 });
  }

  let formData: FormData;
  try {
    formData = await request.formData();
  } catch {
    return NextResponse.json({ error: "リクエストの解析に失敗しました" }, { status: 400 });
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
    if (target.error) {
      return NextResponse.json({ error: target.error }, { status: 400 });
    }

    const swap = await resolveImageToPublicUrl(
      supabase,
      user.id,
      formData,
      "swapImage",
      "swapImageUrl"
    );
    if (swap.error) {
      return NextResponse.json({ error: swap.error }, { status: 400 });
    }

    // cdingram/face-swap: input_image=土台, swap_image=差し替える顔
    const input = {
      input_image: target.url,
      swap_image: swap.url,
    };

    try {
      const out = await runWithRetry(replicate, FACE_SWAP_MODEL as `${string}/${string}`, { input });
      const url = extractUrl(out);
      if (!url) {
        return NextResponse.json({ error: "生成画像のURLを取得できませんでした。" }, { status: 500 });
      }
      return NextResponse.json({ outputImageUrl: url });
    } catch (e) {
      const msg = e instanceof Error ? e.message : String(e);
      return NextResponse.json({ error: `フェイススワップ失敗: ${msg}` }, { status: 500 });
    }
  }

  if (mode === "character-scene") {
    const image = await resolveImageToPublicUrl(
      supabase,
      user.id,
      formData,
      "characterImage",
      "characterImageUrl"
    );
    if (image.error) {
      return NextResponse.json({ error: image.error }, { status: 400 });
    }

    const prompt = (formData.get("prompt") as string)?.trim();
    if (!prompt) {
      return NextResponse.json({ error: "シーンの説明を入力してください。" }, { status: 400 });
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
      if (!url) {
        return NextResponse.json({ error: "生成画像のURLを取得できませんでした。" }, { status: 500 });
      }
      return NextResponse.json({ outputImageUrl: url });
    } catch (e) {
      const msg = e instanceof Error ? e.message : String(e);
      return NextResponse.json({ error: `生成失敗: ${msg}` }, { status: 500 });
    }
  }

  if (mode === "multi-pose") {
    const image = await resolveImageToPublicUrl(
      supabase,
      user.id,
      formData,
      "characterImage",
      "characterImageUrl"
    );
    if (image.error) {
      return NextResponse.json({ error: image.error }, { status: 400 });
    }

    // マルチポーズ用: 4枚で表情・構図・ポーズがはっきり違うよう指定
    const baseStyle =
      "The same character, manga or cartoon style, consistent character design. Plain white background.";
    const multiPosePrompts = [
      `${baseStyle} Front view, face the viewer. Big bright smile, eyes curved with joy, cheerful and energetic. Relaxed shoulders.`,
      `${baseStyle} Turned slightly to one side, three-quarter angle. Shocked surprise: eyes very wide, mouth open in a gasp, hands or one hand raised near face. Dynamic pose.`,
      `${baseStyle} Facing forward, aggressive pose. Clearly angry: deep frown, shouting with mouth wide open, furrowed brows, tense expression. Fists clenched or arms in an angry gesture.`,
      `${baseStyle} Profile or three-quarter view, looking down or to the side. Thoughtful, pensive: hand on chin or touching cheek, slight frown, eyes half-closed or distant. Calm, introspective pose.`,
    ];

    const countStr = (formData.get("count") as string) || "4";
    const count = Math.min(4, Math.max(1, parseInt(countStr, 10) || 4));

    // レート制限対策: 6回/分・バースト1のため、リクエスト間に待機する
    const INTERVAL_MS = 11 * 1000; // 約6回/分に収める
    const urls: string[] = [];
    try {
      for (let i = 0; i < count; i++) {
        if (i > 0) await sleep(INTERVAL_MS);
        const seed = Math.floor(Math.random() * 2147483647);
        const prompt = multiPosePrompts[i % multiPosePrompts.length];
        const out = await runWithRetry(replicate, KONTEXT_MODEL as `${string}/${string}`, {
          input: {
            input_image: image.url,
            prompt,
            aspect_ratio: "match_input_image",
            seed,
          },
        });
        const url = extractUrl(out);
        if (url) urls.push(url);
      }
      if (urls.length === 0) {
        return NextResponse.json({ error: "生成画像のURLを取得できませんでした。" }, { status: 500 });
      }
      return NextResponse.json({ outputImageUrls: urls });
    } catch (e) {
      const msg = e instanceof Error ? e.message : String(e);
      return NextResponse.json({ error: `生成失敗: ${msg}` }, { status: 500 });
    }
  }

  return NextResponse.json({ error: "不明なモードです。" }, { status: 400 });
}
