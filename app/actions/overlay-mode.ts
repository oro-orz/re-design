// actions/overlay-mode.ts
"use server";

import { createAdminClient } from "@/lib/supabase/admin";
import { getCurrentUserFromSession } from "@/lib/session";
import {
  generateBaseImage,
  rebuildBaseImage,
} from "@/lib/overlay-mode/generate-base";
import type {
  BaseImageMode,
  TargetPerson,
  TextRemovalMode,
} from "@/types/overlay-mode";

/**
 * URL から画像を取得して Base64 化（ライブラリ画像用）
 */
async function fetchImageAsBase64(
  imageUrl: string
): Promise<{ base64: string; mimeType: string }> {
  const res = await fetch(imageUrl, { cache: "no-store" });
  if (!res.ok) throw new Error("画像の取得に失敗しました");
  const arrayBuffer = await res.arrayBuffer();
  const base64 = Buffer.from(arrayBuffer).toString("base64");
  const contentType = res.headers.get("content-type") || "image/jpeg";
  const mimeType = contentType.startsWith("image/") ? contentType : "image/jpeg";
  return { base64, mimeType };
}

/**
 * 参考画像（アップロード or ライブラリURL）でベース画像を生成
 */
export async function uploadAndGenerateBase(formData: FormData) {
  try {
    const user = await getCurrentUserFromSession();
    if (!user) return { error: "認証が必要です" };
    const supabase = createAdminClient();

    const mode = (formData.get("mode") as BaseImageMode) || "text-removal";
    const changePersonStr = formData.get("changePerson") as string;
    const changePerson = changePersonStr === "true";
    const targetPerson = formData.get("targetPerson") as TargetPerson | null;
    const textRemovalMode = (formData.get("textRemovalMode") as TextRemovalMode) || "preserve";

    const imageUrl = formData.get("imageUrl") as string | null;
    const imageFile = formData.get("image") as File | null;

    let referenceImageUrl: string;
    let imageBase64: string;
    let mimeType: string;

    if (imageUrl?.trim()) {
      const fetched = await fetchImageAsBase64(imageUrl.trim());
      referenceImageUrl = imageUrl.trim();
      imageBase64 = fetched.base64;
      mimeType = fetched.mimeType;
    } else if (imageFile && imageFile.size > 0) {
      const timestamp = Date.now();
      const filename = `${user.id}/${timestamp}-${imageFile.name}`;
      const { error: uploadError } = await supabase.storage
        .from("images")
        .upload(`overlay-mode/references/${filename}`, imageFile, {
          contentType: imageFile.type,
          upsert: false,
        });
      if (uploadError) {
        console.error("Upload error:", uploadError);
        return { error: "画像のアップロードに失敗しました" };
      }
      const { data: { publicUrl } } = supabase.storage
        .from("images")
        .getPublicUrl(`overlay-mode/references/${filename}`);
      referenceImageUrl = publicUrl;
      const arrayBuffer = await imageFile.arrayBuffer();
      imageBase64 = Buffer.from(arrayBuffer).toString("base64");
      mimeType = imageFile.type || "image/jpeg";
    } else {
      return { error: "画像をアップロードするか、ライブラリから画像を選択してください" };
    }

    const baseImageUrl =
      mode === "rebuild"
        ? await rebuildBaseImage(imageBase64, mimeType, {
            targetPerson: targetPerson || undefined,
          })
        : await generateBaseImage(imageBase64, mimeType, {
            changePerson,
            targetPerson: targetPerson || undefined,
            textRemovalMode,
          });

    return {
      success: true,
      referenceImageUrl,
      baseImageUrl,
    };
  } catch (error) {
    console.error("Generate base error:", error);
    return {
      error: error instanceof Error ? error.message : "生成に失敗しました",
    };
  }
}
