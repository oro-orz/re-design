"use server";

import { createAdminClient } from "@/lib/supabase/admin";
import { getCurrentUserFromSession } from "@/lib/session";
import {
  analyzeImageForStructured,
  generateTemplateFromOneImage,
  generateTemplatesFromImages,
} from "@/lib/swipe-lp/gaudi/prompts/image-to-prompt";
import { generateContentForTemplate } from "@/lib/swipe-lp/gaudi/prompts/content-for-template";
import { assembleStructuredPrompt } from "@/lib/swipe-lp/gaudi/prompts/assemble-structured";
import type { PromptTemplate } from "@/types/swipe-lp-v3";

/**
 * プロンプトテンプレート一覧取得
 */
export async function listPromptTemplates(): Promise<{
  templates?: PromptTemplate[];
  error?: string;
}> {
  const user = await getCurrentUserFromSession();
  if (!user) return { error: "認証が必要です" };
  const supabase = createAdminClient();

  const { data, error } = await supabase
    .from("prompt_templates")
    .select("*")
    .order("created_at", { ascending: false });

  if (error) return { error: error.message };
  return { templates: (data ?? []) as PromptTemplate[] };
}

/**
 * 1件取得
 */
export async function getPromptTemplate(
  id: string
): Promise<{ template?: PromptTemplate; error?: string }> {
  const user = await getCurrentUserFromSession();
  if (!user) return { error: "認証が必要です" };
  const supabase = createAdminClient();

  const { data, error } = await supabase
    .from("prompt_templates")
    .select("*")
    .eq("id", id)
    .single();

  if (error || !data) return { error: "テンプレートが見つかりません" };
  return { template: data as PromptTemplate };
}

/**
 * 画像をアップロード → 各1枚ずつAIでテンプレ生成 → DBに一括保存
 * 4枚アップロード → 4件のテンプレができる
 */
export async function uploadAndCreateTemplatesFromImages(
  formData: FormData
): Promise<{ count?: number; error?: string }> {
  const user = await getCurrentUserFromSession();
  if (!user) return { error: "認証が必要です" };
  const supabase = createAdminClient();

  const prefix = `prompt-templates/${user.id}/${Date.now()}`;
  const urls: string[] = [];
  const files = formData.getAll("images") as (File | Blob)[];

  for (let i = 0; i < files.length; i++) {
    const f = files[i];
    if (!f || !("size" in f) || f.size === 0) continue;
    const ext =
      (typeof (f as File).name === "string"
        ? (f as File).name.split(".").pop()
        : null) || "png";
    const path = `${prefix}-${i}.${ext}`;
    const contentType = (f as File).type || "image/png";
    const { error } = await supabase.storage
      .from("images")
      .upload(path, f as Blob, { contentType, upsert: true });
    if (error) return { error: `アップロード失敗: ${error.message}` };
    const { data } = supabase.storage.from("images").getPublicUrl(path);
    urls.push(data.publicUrl);
  }

  if (!urls.length) return { error: "画像を1枚以上選択してください" };

  try {
    const sleep = (ms: number) =>
      new Promise((resolve) => setTimeout(resolve, ms));
    let count = 0;
    for (let i = 0; i < urls.length; i++) {
      if (i > 0) await sleep(1500);
      const g = await analyzeImageForStructured(urls[i]);
      const id = `t-${Date.now()}-${i}-${Math.random().toString(36).slice(2, 7)}`;
      const name = `${g.category} - ${g.memo || "テンプレート"}`.slice(0, 100);

      await supabase.from("prompt_templates").insert({
        id,
        name,
        sample_image_url: urls[i],
        image_urls: [urls[i]],
        memo: g.memo || null,
        category: g.category || null,
        subcategory: null,
        style_json: g.style_json,
        slots_json: g.slots_json,
      });
      count++;
    }

    return { count };
  } catch (err) {
    console.error("[uploadAndCreateTemplatesFromImages]", err);
    return {
      error: err instanceof Error ? err.message : "テンプレ生成に失敗しました",
    };
  }
}

/**
 * 既存デザイン（テンプレート）を選択し、任意のテキストでプロンプトを生成
 */
export async function generatePromptFromTemplateAndText(
  templateId: string,
  params: {
    message: string;
    subMessage?: string;
    additionalText?: string[];
    excludePerson?: boolean;
    overlayMode?: boolean;
    aspectRatio?: string;
  }
): Promise<{ prompt?: string; error?: string }> {
  const user = await getCurrentUserFromSession();
  if (!user) return { error: "認証が必要です" };
  const supabase = createAdminClient();

  const { data: template, error: fetchErr } = await supabase
    .from("prompt_templates")
    .select("*")
    .eq("id", templateId)
    .single();

  if (fetchErr || !template) return { error: "テンプレートが見つかりません" };
  const tmpl = template as PromptTemplate;

  if (!tmpl.style_json || !tmpl.slots_json?.textSlots?.length) {
    return { error: "このテンプレートは構造化型ではありません。画像から生成したテンプレートを選択してください。" };
  }

  const message = params.message.trim();
  if (!params.overlayMode && !message) return { error: "メインコピーを入力してください" };

  try {
    const slide = {
      id: "",
      order: 1,
      purpose: "補足",
      message: params.overlayMode ? "" : message,
      subMessage: params.overlayMode ? "" : (params.subMessage ?? ""),
      additionalText: params.overlayMode ? [] : (params.additionalText ?? []),
    };
    const content = await generateContentForTemplate(
      slide,
      null,
      tmpl.slots_json,
      tmpl.style_json ?? null,
      params.excludePerson ?? false
    );
    const contentForOverlay = params.overlayMode
      ? { ...content, texts: {} as Record<string, string> }
      : content;
    const prompt = assembleStructuredPrompt(
      tmpl,
      contentForOverlay,
      params.excludePerson ?? false,
      params.aspectRatio ?? "9:16"
    );
    return { prompt };
  } catch (err) {
    console.error("[generatePromptFromTemplateAndText]", err);
    return {
      error: err instanceof Error ? err.message : "プロンプトの生成に失敗しました",
    };
  }
}

/**
 * 新規作成（画像URLs + AI生成prompt_text + memo）
 * base_prompt は prompt_text をコピー（Step5互換）
 */
export async function createPromptTemplate(
  formData: FormData
): Promise<{ template?: PromptTemplate; error?: string }> {
  const user = await getCurrentUserFromSession();
  if (!user) return { error: "認証が必要です" };
  const supabase = createAdminClient();

  const prompt_text = (formData.get("prompt_text") as string) || null;
  const memo = (formData.get("memo") as string) || null;
  const category = (formData.get("category") as string) || null;
  const image_urls_str = formData.get("image_urls") as string;
  const image_urls: string[] = image_urls_str
    ? (JSON.parse(image_urls_str) as string[])
    : [];

  if (!prompt_text?.trim()) return { error: "プロンプト（AI生成）が必須です" };

  const id = `t-${Date.now()}-${Math.random().toString(36).slice(2, 9)}`;
  const name = `テンプレート ${new Date().toLocaleDateString("ja-JP")}`;
  const sample_image_url = image_urls[0] || null;

  const { data, error } = await supabase
    .from("prompt_templates")
    .insert({
      id,
      name,
      base_prompt: prompt_text,
      prompt_text,
      sample_image_url,
      image_urls: image_urls.length ? image_urls : null,
      memo: memo?.trim() || null,
      category: category?.trim() || null,
    })
    .select()
    .single();

  if (error) return { error: error.message };
  return { template: data as PromptTemplate };
}

/**
 * 画像をアップロードしてURL一覧を返す
 */
export async function uploadImagesForLibrary(
  formData: FormData
): Promise<{ imageUrls?: string[]; error?: string }> {
  const user = await getCurrentUserFromSession();
  if (!user) return { error: "認証が必要です" };
  const supabase = createAdminClient();

  const prefix = `prompt-templates/temp-${Date.now()}`;
  const urls: string[] = [];
  const files = formData.getAll("images") as (File | Blob)[];

  for (let i = 0; i < Math.min(files.length, 4); i++) {
    const f = files[i];
    if (!f || !("size" in f) || f.size === 0) continue;
    const ext =
      (typeof (f as File).name === "string"
        ? (f as File).name.split(".").pop()
        : null) || "png";
    const path = `${prefix}-${i}.${ext}`;
    const contentType = (f as File).type || "image/png";
    const { error } = await supabase.storage
      .from("images")
      .upload(path, f as Blob, { contentType, upsert: true });
    if (error) return { error: `アップロード失敗: ${error.message}` };
    const { data } = supabase.storage.from("images").getPublicUrl(path);
    urls.push(data.publicUrl);
  }

  if (!urls.length) return { error: "画像を1枚以上アップロードしてください" };
  return { imageUrls: urls };
}

/**
 * 更新（拡張版：category, memo, display_nameも更新可能）
 */
export async function updatePromptTemplate(
  id: string,
  updates: Partial<
    Pick<
      PromptTemplate,
      "name" | "category" | "subcategory" | "memo" | "base_prompt" | "style_json" | "slots_json"
    >
  >
): Promise<{ template?: PromptTemplate; error?: string }> {
  const user = await getCurrentUserFromSession();
  if (!user) return { error: "認証が必要です" };
  const supabase = createAdminClient();

  // 更新可能なフィールドのみを抽出
  const updateData: Record<string, unknown> = {};
  if (updates.name !== undefined) updateData.name = updates.name;
  if (updates.category !== undefined) updateData.category = updates.category;
  if (updates.subcategory !== undefined) updateData.subcategory = updates.subcategory;
  if (updates.memo !== undefined) updateData.memo = updates.memo;
  if (updates.base_prompt !== undefined) updateData.base_prompt = updates.base_prompt;
  if (updates.style_json !== undefined) updateData.style_json = updates.style_json;
  if (updates.slots_json !== undefined) updateData.slots_json = updates.slots_json;

  // 更新するデータがない場合
  if (Object.keys(updateData).length === 0) {
    return { error: "更新するデータがありません" };
  }

  const { data, error } = await supabase
    .from("prompt_templates")
    .update(updateData)
    .eq("id", id)
    .select()
    .single();

  if (error) return { error: error.message };
  return { template: data as PromptTemplate };
}

/**
 * 画像を更新
 */
export async function updatePromptTemplateImage(
  id: string,
  formData: FormData
): Promise<{ error?: string }> {
  const user = await getCurrentUserFromSession();
  if (!user) return { error: "認証が必要です" };
  const supabase = createAdminClient();

  const imageFile = formData.get("image") as File | null;
  if (!imageFile?.size) return { error: "画像を選択してください" };

  const ext = imageFile.name.split(".").pop() || "png";
  const path = `prompt-templates/${id}.${ext}`;

  const { error: uploadError } = await supabase.storage
    .from("images")
    .upload(path, imageFile, {
      contentType: imageFile.type,
      upsert: true,
    });

  if (uploadError) return { error: uploadError.message };

  const { data: urlData } = supabase.storage.from("images").getPublicUrl(path);

  const { error } = await supabase
    .from("prompt_templates")
    .update({ sample_image_url: urlData.publicUrl })
    .eq("id", id);

  if (error) return { error: error.message };
  return {};
}

/**
 * プロンプトを再生成（参照画像からAIで再解析）
 */
export async function regeneratePromptTemplate(
  id: string
): Promise<{ template?: PromptTemplate; error?: string }> {
  const user = await getCurrentUserFromSession();
  if (!user) return { error: "認証が必要です" };
  const supabase = createAdminClient();

  const { data: existing } = await supabase
    .from("prompt_templates")
    .select("sample_image_url, image_urls")
    .eq("id", id)
    .single();

  if (!existing) return { error: "テンプレートが見つかりません" };

  const imageUrl =
    (existing as { sample_image_url?: string; image_urls?: string[] })
      .sample_image_url ||
    (existing as { sample_image_url?: string; image_urls?: string[] })
      .image_urls?.[0];

  if (!imageUrl) return { error: "参照画像がありません" };

  try {
    const generated = await analyzeImageForStructured(imageUrl);

    const name = `${generated.category} - ${generated.memo || "テンプレート"}`.slice(
      0,
      100
    );

    const { error } = await supabase
      .from("prompt_templates")
      .update({
        name,
        category: generated.category || null,
        memo: generated.memo || null,
        style_json: generated.style_json,
        slots_json: generated.slots_json,
      })
      .eq("id", id);

    if (error) return { error: error.message };

    const { data: updated } = await supabase
      .from("prompt_templates")
      .select("*")
      .eq("id", id)
      .single();

    return { template: updated as PromptTemplate };
  } catch (err) {
    console.error("[regeneratePromptTemplate]", err);
    return {
      error:
        err instanceof Error ? err.message : "プロンプトの再生成に失敗しました",
    };
  }
}

/** 一括再生成の1件あたりの間隔（ms） */
const BULK_REGENERATE_DELAY_MS = 1500;

/**
 * baseプロンプトを一括再生成（参照画像からAIで再解析）
 * 各件の間に delay を入れてレート制限を避ける
 */
export async function regeneratePromptTemplatesBulk(
  ids: string[]
): Promise<{
  successCount?: number;
  failCount?: number;
  results?: { id: string; error?: string }[];
  error?: string;
}> {
  const user = await getCurrentUserFromSession();
  if (!user) return { error: "認証が必要です" };
  const supabase = createAdminClient();
  if (!ids.length) return { successCount: 0, failCount: 0, results: [] };

  const sleep = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));
  const results: { id: string; error?: string }[] = [];
  let successCount = 0;
  let failCount = 0;

  for (let i = 0; i < ids.length; i++) {
    const id = ids[i];
    if (i > 0) await sleep(BULK_REGENERATE_DELAY_MS);

    const { data: existing } = await supabase
      .from("prompt_templates")
      .select("sample_image_url, image_urls")
      .eq("id", id)
      .single();

    if (!existing) {
      results.push({ id, error: "テンプレートが見つかりません" });
      failCount++;
      continue;
    }

    const imageUrl =
      (existing as { sample_image_url?: string; image_urls?: string[] }).sample_image_url ||
      (existing as { sample_image_url?: string; image_urls?: string[] }).image_urls?.[0];

    if (!imageUrl) {
      results.push({ id, error: "参照画像がありません" });
      failCount++;
      continue;
    }

    try {
      const generated = await analyzeImageForStructured(imageUrl);
      const name = `${generated.category} - ${generated.memo || "テンプレート"}`.slice(0, 100);

      const { error } = await supabase
        .from("prompt_templates")
        .update({
          name,
          category: generated.category || null,
          memo: generated.memo || null,
          style_json: generated.style_json,
          slots_json: generated.slots_json,
        })
        .eq("id", id);

      if (error) {
        results.push({ id, error: error.message });
        failCount++;
      } else {
        results.push({ id });
        successCount++;
      }
    } catch (err) {
      const msg = err instanceof Error ? err.message : "プロンプトの再生成に失敗しました";
      results.push({ id, error: msg });
      failCount++;
    }
  }

  return { successCount, failCount, results };
}

/**
 * 削除
 */
export async function deletePromptTemplate(
  id: string
): Promise<{ error?: string }> {
  const user = await getCurrentUserFromSession();
  if (!user) return { error: "認証が必要です" };
  const supabase = createAdminClient();

  const { error } = await supabase
    .from("prompt_templates")
    .delete()
    .eq("id", id);

  if (error) return { error: error.message };
  return {};
}