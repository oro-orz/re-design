"use server";

import Replicate from "replicate";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { hasSupabase } from "@/lib/supabase/env";
import type { ModeId } from "@/lib/constants";

const BUCKET = "images";
const FLUX_MODEL = "black-forest-labs/flux-2-pro";

function extractUrl(v: unknown): string | null {
  if (typeof v === "string" && v.startsWith("http")) return v;
  if (Array.isArray(v)) {
    // 配列の最初のURL文字列を返す
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

export async function generateImage(params: {
  projectId: string;
  imageUrl: string;
  fluxPrompt: string;
  mode: ModeId;
  feedbackText: string;
  intensity?: number;
}) {
  if (!process.env.REPLICATE_API_TOKEN) {
    return { error: "REPLICATE_API_TOKEN が未設定です。" };
  }

  const replicate = new Replicate({
    auth: process.env.REPLICATE_API_TOKEN!,
    useFileOutput: false,
  });

  let output: string;
  try {
    const out = await replicate.run(FLUX_MODEL as `${string}/${string}`, {
      input: {
        prompt: params.fluxPrompt,
        input_images: [params.imageUrl],
        aspect_ratio: "match_input_image",
        output_format: "webp",
        output_quality: 80,
        safety_tolerance: 2,
      },
    });
    const url = extractUrl(out);
    if (!url) {
      return { error: "生成画像のURLを取得できませんでした。" };
    }
    output = url;
  } catch (e) {
    const msg = e instanceof Error ? e.message : String(e);
    return { error: `画像生成失敗: ${msg}` };
  }

  const isDev = process.env.NODE_ENV === "development";
  if (isDev) {
    return { generatedImageUrl: output };
  }

  if (!hasSupabase()) {
    return { error: "Supabase が未設定です。" };
  }

  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) {
    return { error: "ログインしてください。" };
  }

  const res = await fetch(output);
  if (!res.ok) {
    return { error: "生成画像の取得に失敗しました。" };
  }
  const buf = Buffer.from(await res.arrayBuffer());
  const path = `generated/${user.id}/${params.projectId}/output.webp`;

  const admin = createAdminClient();
  const { error: uploadErr } = await admin.storage
    .from(BUCKET)
    .upload(path, buf, { contentType: "image/webp", upsert: true });

  if (uploadErr) {
    return { error: `Storage 保存失敗: ${uploadErr.message}` };
  }

  const { data: urlData } = admin.storage.from(BUCKET).getPublicUrl(path);
  const generatedImageUrl = urlData.publicUrl;

  const { error: insertErr } = await admin.from("generations").insert({
    project_id: params.projectId,
    selected_mode: params.mode,
    feedback_text: params.feedbackText,
    generated_image_url: generatedImageUrl,
    used_prompt: params.fluxPrompt,
  });

  if (insertErr) {
    return { error: `履歴保存失敗: ${insertErr.message}` };
  }

  return { generatedImageUrl };
}
