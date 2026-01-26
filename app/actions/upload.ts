"use server";

import { createClient } from "@/lib/supabase/server";
import { hasSupabase } from "@/lib/supabase/env";
import { ACCEPT_IMAGE } from "@/lib/constants";

const BUCKET = "images";
const MAX_SIZE = 10 * 1024 * 1024; // 10MB

export async function uploadProject(formData: FormData) {
  const file = formData.get("file") as File | null;

  if (!file?.size) {
    return { error: "画像を選択してください。" };
  }
  const type = file.type as string;
  if (!["image/png", "image/jpeg", "image/webp"].includes(type)) {
    return { error: "PNG / JPG / WEBP のみ対応しています。" };
  }
  if (file.size > MAX_SIZE) {
    return { error: "10MB 以下にしてください。" };
  }

  // 開発モード: 認証をスキップしてローカルプレビュー URL を返す
  const DEV_MODE = process.env.NODE_ENV === "development";
  if (DEV_MODE) {
    const arrayBuffer = await file.arrayBuffer();
    const base64 = Buffer.from(arrayBuffer).toString("base64");
    const dataUrl = `data:${type};base64,${base64}`;
    const projectId = crypto.randomUUID();
    return { projectId, originalImageUrl: dataUrl };
  }

  if (!hasSupabase()) {
    return { error: "Supabase が未設定です。.env.local を確認してください。" };
  }

  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) {
    return { error: "ログインしてください。" };
  }

  const projectId = crypto.randomUUID();
  const ext = file.name.split(".").pop() || "png";
  const path = `originals/${user.id}/${projectId}/image.${ext}`;

  const { error: uploadError } = await supabase.storage
    .from(BUCKET)
    .upload(path, file, { contentType: type, upsert: true });

  if (uploadError) {
    return { error: `アップロード失敗: ${uploadError.message}` };
  }

  const { data: urlData } = supabase.storage.from(BUCKET).getPublicUrl(path);
  const originalImageUrl = urlData.publicUrl;

  const { error: insertError } = await supabase.from("projects").insert({
    id: projectId,
    user_id: user.id,
    original_image_url: originalImageUrl,
  });

  if (insertError) {
    return { error: `保存失敗: ${insertError.message}` };
  }

  return { projectId, originalImageUrl };
}
