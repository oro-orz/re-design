import { NextRequest, NextResponse } from "next/server";
import Replicate from "replicate";
import { createClient } from "@/lib/supabase/server";

const BUCKET = "images";
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
  supabase: Awaited<ReturnType<typeof createClient>>,
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
  const supabase = await createClient();
  const { data: { user }, error: authError } = await supabase.auth.getUser();
  if (authError || !user) {
    return NextResponse.json({ error: "認証が必要です" }, { status: 401 });
  }

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
      const out = await replicate.run(FACE_SWAP_MODEL as `${string}/${string}`, { input });
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
      const out = await replicate.run(KONTEXT_MODEL as `${string}/${string}`, {
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

    // マルチポーズ用の固定プロンプト（ユーザー入力不要・白背景）
    const multiPosePrompt =
      "The same character in various poses and expressions, different angles and emotions, each image different. Manga or cartoon style, consistent character design. Plain white background.";

    const countStr = (formData.get("count") as string) || "6";
    const count = Math.min(12, Math.max(1, parseInt(countStr, 10) || 6));

    const urls: string[] = [];
    try {
      for (let i = 0; i < count; i++) {
        const seed = Math.floor(Math.random() * 2147483647);
        const out = await replicate.run(KONTEXT_MODEL as `${string}/${string}`, {
          input: {
            input_image: image.url,
            prompt: multiPosePrompt,
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
