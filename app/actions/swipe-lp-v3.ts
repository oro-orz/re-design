"use server";

import { createAdminClient } from "@/lib/supabase/admin";
import { getCurrentUserFromSession } from "@/lib/session";
import { runSlideCopyEnricher } from "@/lib/swipe-lp/gaudi/copy/slide-copy-enricher";
import { runMarketingAnalysis } from "@/lib/swipe-lp/gaudi/marketing/analyzer";
import {
  generateSlideStructureForV3,
} from "@/lib/swipe-lp/gaudi/slides/structure-generator";
import type { SwipeLPv3Project, SwipeLPv3Slide } from "@/types/swipe-lp-v3";

/**
 * v3プロジェクト作成 + URL分析開始
 */
export async function createV3Project(
  url: string
): Promise<{ project?: SwipeLPv3Project; error?: string }> {
  const user = await getCurrentUserFromSession();
  if (!user) return { error: "認証が必要です" };
  const supabase = createAdminClient();

  const trimmed = url.trim();
  if (!trimmed) return { error: "URLを入力してください" };

  const { data: project, error } = await supabase
    .from("swipe_lp_v3_projects")
    .insert({
      user_id: user.id,
      input_url: trimmed,
      status: "analyzing",
    })
    .select()
    .single();

  if (error) return { error: error.message };
  return { project: project as SwipeLPv3Project };
}

/**
 * URL分析実行（マーケティング分析）
 */
export async function analyzeUrlForV3(
  projectId: string
): Promise<{ error?: string }> {
  const user = await getCurrentUserFromSession();
  if (!user) return { error: "認証が必要です" };
  const supabase = createAdminClient();

  const { data: project } = await supabase
    .from("swipe_lp_v3_projects")
    .select("id, input_url")
    .eq("id", projectId)
    .eq("user_id", user.id)
    .single();

  if (!project) return { error: "プロジェクトが見つかりません" };

  try {
    const marketingAnalysis = await runMarketingAnalysis({
      inputType: "url",
      url: project.input_url,
    });

    await supabase
      .from("swipe_lp_v3_projects")
      .update({
        marketing_analysis: marketingAnalysis,
        status: "analysis_done",
      })
      .eq("id", projectId);

    return {};
  } catch (err) {
    console.error("[analyzeUrlForV3]", err);
    return {
      error: err instanceof Error ? err.message : "分析に失敗しました",
    };
  }
}

/**
 * 画像アップロードでマーケティング分析を実行し、同一プロジェクトを更新
 */
export async function analyzeImageForV3(
  projectId: string,
  formData: FormData
): Promise<{ error?: string }> {
  const user = await getCurrentUserFromSession();
  if (!user) return { error: "認証が必要です" };
  const supabase = createAdminClient();

  const { data: project } = await supabase
    .from("swipe_lp_v3_projects")
    .select("id")
    .eq("id", projectId)
    .eq("user_id", user.id)
    .single();

  if (!project) return { error: "プロジェクトが見つかりません" };

  const file = formData.get("image");
  if (!file || !(file instanceof Blob) || file.size === 0) {
    return { error: "画像を選択してください" };
  }

  try {
    const marketingAnalysis = await runMarketingAnalysis({
      inputType: "image",
      imageBlob: file,
    });

    await supabase
      .from("swipe_lp_v3_projects")
      .update({
        marketing_analysis: marketingAnalysis,
        status: "analysis_done",
      })
      .eq("id", projectId);

    return {};
  } catch (err) {
    console.error("[analyzeImageForV3]", err);
    return {
      error: err instanceof Error ? err.message : "画像の分析に失敗しました",
    };
  }
}

/**
 * v3プロジェクト取得
 */
export async function getV3Project(
  projectId: string
): Promise<{ project?: SwipeLPv3Project; error?: string }> {
  const user = await getCurrentUserFromSession();
  if (!user) return { error: "認証が必要です" };
  const supabase = createAdminClient();

  const { data, error } = await supabase
    .from("swipe_lp_v3_projects")
    .select("*")
    .eq("id", projectId)
    .eq("user_id", user.id)
    .single();

  if (error || !data) return { error: "プロジェクトが見つかりません" };
  return { project: data as SwipeLPv3Project };
}

/**
 * ステータスを analysis_done に戻す（Step3 の戻る用）
 */
export async function revertToAnalysisStep(
  projectId: string
): Promise<{ error?: string }> {
  const user = await getCurrentUserFromSession();
  if (!user) return { error: "認証が必要です" };
  const supabase = createAdminClient();

  const { error } = await supabase
    .from("swipe_lp_v3_projects")
    .update({ status: "analysis_done" })
    .eq("id", projectId)
    .eq("user_id", user.id);

  if (error) return { error: error.message };
  return {};
}

/**
 * ステータスを supplement_input に戻す（Step4 から Step3 に戻って設定をやり直す用）
 */
export async function revertToSupplementStep(
  projectId: string
): Promise<{ error?: string }> {
  const user = await getCurrentUserFromSession();
  if (!user) return { error: "認証が必要です" };
  const supabase = createAdminClient();

  const { error } = await supabase
    .from("swipe_lp_v3_projects")
    .update({ status: "supplement_input" })
    .eq("id", projectId)
    .eq("user_id", user.id);

  if (error) return { error: error.message };
  return {};
}

/**
 * 補足情報を更新し、ステータスを supplement_input に
 */
export async function updateUserSupplement(
  projectId: string,
  supplement: string
): Promise<{ error?: string }> {
  const user = await getCurrentUserFromSession();
  if (!user) return { error: "認証が必要です" };
  const supabase = createAdminClient();

  const { error } = await supabase
    .from("swipe_lp_v3_projects")
    .update({
      user_supplement: supplement,
      status: "supplement_input",
    })
    .eq("id", projectId)
    .eq("user_id", user.id);

  if (error) return { error: error.message };
  return {};
}

/** Step 3 で設定するスライドテキスト設定の型 */
export interface Step3Settings {
  emphasis_points: string;
  slide_count: number | null;
}

/**
 * Step 3: スライドテキストの設定を保存
 */
export async function updateStep3Settings(
  projectId: string,
  settings: Step3Settings
): Promise<{ error?: string }> {
  const user = await getCurrentUserFromSession();
  if (!user) return { error: "認証が必要です" };
  const supabase = createAdminClient();

  const { error } = await supabase
    .from("swipe_lp_v3_projects")
    .update({
      emphasis_points: settings.emphasis_points || null,
      slide_count: settings.slide_count ?? null,
      status: "supplement_input",
    })
    .eq("id", projectId)
    .eq("user_id", user.id);

  if (error) return { error: error.message };
  return {};
}

/**
 * スライドテキストを作成（AI生成）
 */
export async function proposeSlidesForV3(
  projectId: string
): Promise<{ error?: string }> {
  const user = await getCurrentUserFromSession();
  if (!user) return { error: "認証が必要です" };
  const supabase = createAdminClient();

  const { data: project, error: fetchError } = await supabase
    .from("swipe_lp_v3_projects")
    .select("marketing_analysis, emphasis_points, slide_count")
    .eq("id", projectId)
    .eq("user_id", user.id)
    .single();

  if (fetchError) return { error: fetchError.message || "プロジェクトの取得に失敗しました" };
  if (!project?.marketing_analysis) return { error: "分析結果がありません" };

  const rawAnalysis = project.marketing_analysis as { analysisUnavailable?: boolean };
  if (rawAnalysis.analysisUnavailable) {
    return {
      error:
        "URLから十分な分析ができていません。Step2で「画像で分析する」からスクリーンショットやLP画像をアップロードしてください。",
    };
  }

  const analysis = project.marketing_analysis as Parameters<
    typeof generateSlideStructureForV3
  >[0];

  const baseOptions = {
    emphasisPoints: project.emphasis_points ?? undefined,
    slideCount: project.slide_count ?? undefined,
  };

  try {
    let slideReadyCopy: Awaited<ReturnType<typeof runSlideCopyEnricher>> | null = null;
    try {
      slideReadyCopy = await runSlideCopyEnricher(analysis);
    } catch (enricherErr) {
      console.warn("[proposeSlidesForV3] CopyEnricher failed, continuing without:", enricherErr);
    }

    const slides = await generateSlideStructureForV3(analysis, {
      ...baseOptions,
      slideReadyCopy: slideReadyCopy ?? undefined,
    });

    await supabase
      .from("swipe_lp_v3_projects")
      .update({ slides, status: "slides_ready" })
      .eq("id", projectId)
      .eq("user_id", user.id);

    return {};
  } catch (err) {
    console.error("[proposeSlidesForV3]", err);
    return {
      error: err instanceof Error ? err.message : "スライド生成に失敗しました",
    };
  }
}

/**
 * スライドの編集・追加・削除を保存
 */
export async function updateV3Slides(
  projectId: string,
  slides: SwipeLPv3Slide[]
): Promise<{ error?: string }> {
  const user = await getCurrentUserFromSession();
  if (!user) return { error: "認証が必要です" };
  const supabase = createAdminClient();

  const { error } = await supabase
    .from("swipe_lp_v3_projects")
    .update({ slides })
    .eq("id", projectId)
    .eq("user_id", user.id);

  if (error) return { error: error.message };
  return {};
}

/**
 * 選択テンプレートを保存
 */
export async function updateSelectedTemplate(
  projectId: string,
  templateId: string | null
): Promise<{ error?: string }> {
  const user = await getCurrentUserFromSession();
  if (!user) return { error: "認証が必要です" };
  const supabase = createAdminClient();

  const { error } = await supabase
    .from("swipe_lp_v3_projects")
    .update({ selected_template_id: templateId })
    .eq("id", projectId)
    .eq("user_id", user.id);

  if (error) return { error: error.message };
  return {};
}

type TemplateListItem = {
  id: string;
  name: string;
  sample_image_url: string | null;
  image_urls?: string[] | null;
  category: string | null;
};

/**
 * ライブラリのテンプレート一覧取得
 */
export async function listPromptTemplates(): Promise<
  { templates?: TemplateListItem[]; error?: string }
> {
  const user = await getCurrentUserFromSession();
  if (!user) return { error: "認証が必要です" };
  const supabase = createAdminClient();

  const { data, error } = await supabase
    .from("prompt_templates")
    .select("id, name, sample_image_url, image_urls, category")
    .order("created_at", { ascending: false });

  if (error) return { error: error.message };
  return { templates: data ?? [] };
}

/**
 * プロジェクトに合わせたおすすめテンプレート付き一覧取得
 * marketing_analysis の businessType からカテゴリを推定し、おすすめを先頭に
 */
export async function listPromptTemplatesWithRecommendations(
  projectId: string
): Promise<{
  recommended?: TemplateListItem[];
  others?: TemplateListItem[];
  error?: string;
}> {
  const user = await getCurrentUserFromSession();
  if (!user) return { error: "認証が必要です" };
  const supabase = createAdminClient();

  const { data: templates, error } = await supabase
    .from("prompt_templates")
    .select("id, name, sample_image_url, image_urls, category")
    .order("created_at", { ascending: false });

  if (error) return { error: error.message };
  const all = (templates ?? []) as TemplateListItem[];

  // プロジェクトの marketing_analysis からカテゴリヒントを取得
  let categoryHint: string | null = null;
  const { data: project } = await supabase
    .from("swipe_lp_v3_projects")
    .select("marketing_analysis")
    .eq("id", projectId)
    .eq("user_id", user.id)
    .single();

  const ma = project?.marketing_analysis as { businessType?: string } | null;
  const bt = (ma?.businessType ?? "").toLowerCase();
  if (bt.includes("婚活") || bt.includes("マッチング")) categoryHint = "婚活";
  else if (bt.includes("転職") || bt.includes("就職")) categoryHint = "転職";
  else if (bt.includes("ec") || bt.includes("ショップ") || bt.includes("通販")) categoryHint = "EC";

  const RECOMMEND_COUNT = 6;
  const recommended: TemplateListItem[] = [];
  const used = new Set<string>();

  // 1. カテゴリ一致を優先
  if (categoryHint) {
    for (const t of all) {
      if (recommended.length >= RECOMMEND_COUNT) break;
      const cat = (t.category ?? "").toLowerCase();
      if (cat.includes(categoryHint)) {
        recommended.push(t);
        used.add(t.id);
      }
    }
  }

  // 2. 汎用で補完
  for (const t of all) {
    if (recommended.length >= RECOMMEND_COUNT) break;
    if (used.has(t.id)) continue;
    const cat = (t.category ?? "").toLowerCase();
    if (cat.includes("汎用") || !cat) {
      recommended.push(t);
      used.add(t.id);
    }
  }

  // 3. 残りを新着順で補完
  for (const t of all) {
    if (recommended.length >= RECOMMEND_COUNT) break;
    if (!used.has(t.id)) {
      recommended.push(t);
      used.add(t.id);
    }
  }

  const rec = recommended.slice(0, RECOMMEND_COUNT);
  const restIds = new Set(rec.map((r) => r.id));
  const oth = all.filter((t) => !restIds.has(t.id));

  return { recommended: rec, others: oth };
}

/** スライド用の型（purpose でおすすめを調整） */
type SlideForRecommend = { purpose?: string; message?: string };

/**
 * スライドごとのデザイン候補取得
 * offset=0: プロジェクト+スライドに合うおすすめ。offset>0: 別の候補（その他から次を取得）
 */
export async function listPromptTemplatesForSlide(
  projectId: string,
  slide: SlideForRecommend,
  offset = 0
): Promise<{
  recommended?: TemplateListItem[];
  others?: TemplateListItem[];
  error?: string;
}> {
  const base = await listPromptTemplatesWithRecommendations(projectId);
  if (base.error) return { error: base.error };
  const rec = base.recommended ?? [];
  const oth = base.others ?? [];
  const allForSlide = [...rec, ...oth];

  if (offset <= 0) {
    const purposeHint = (slide.purpose ?? "").toLowerCase();
    if (!purposeHint) return { recommended: rec, others: oth };
    const purposeOrder = ["課題提起", "ソリューション", "ベネフィット", "社会的証明", "cta", "補足"];
    const idx = purposeOrder.findIndex((p) => purposeHint.includes(p.toLowerCase()));
    if (idx < 0) return { recommended: rec, others: oth };
    const purposeKeywords: Record<number, string[]> = {
      0: ["課題", "ネガティブ", "問題"],
      1: ["ソリューション", "解決", "ポジティブ"],
      2: ["ベネフィット", "メリット", "ポジティブ"],
      3: ["社会的証明", "実績", "証拠"],
      4: ["cta", "行動"],
      5: ["補足", "汎用"],
    };
    const keywords = purposeKeywords[idx] ?? ["汎用"];
    const matched: TemplateListItem[] = [];
    const unmatched: TemplateListItem[] = [];
    for (const t of allForSlide) {
      const cat = (t.category ?? "").toLowerCase();
      const memo = (t.name ?? "").toLowerCase();
      const match = keywords.some((k) => cat.includes(k) || memo.includes(k));
      if (match) matched.push(t);
      else unmatched.push(t);
    }
    const slideRec = matched.length > 0 ? matched.slice(0, 6) : rec.slice(0, 6);
    const slideOth = matched.length > 0
      ? [...matched.slice(6), ...unmatched]
      : [...rec.slice(6), ...oth];
    return { recommended: slideRec, others: slideOth };
  }

  const RECOMMEND_COUNT = 6;
  const start = offset * RECOMMEND_COUNT;
  const nextRec = oth.slice(start, start + RECOMMEND_COUNT);
  const nextRecIds = new Set(nextRec.map((r) => r.id));
  const nextOth = allForSlide.filter((t) => !nextRecIds.has(t.id));
  return { recommended: nextRec, others: nextOth };
}
