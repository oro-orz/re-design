"use client";

import { useState, useRef } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Loader2, Sparkles, ImagePlus, UsersRound, MessageSquare, ExternalLink, LayoutList } from "lucide-react";
import { StepProgressBar } from "./components/StepProgressBar";
import { Step2AnalysisLeft, Step2AnalysisRight, FrameworkCard, AIDMA_SEARCH_URL } from "./components/Step2Analysis";
import { Step3Supplement } from "./components/Step3Supplement";
import { Step4SlideEdit } from "./components/Step4SlideEdit";
import {
  updateUserSupplement,
  updateStep3Settings,
  proposeSlidesForV3,
  revertToAnalysisStep,
  revertToSupplementStep,
  analyzeImageForV3,
} from "@/actions/swipe-lp-v3";
import type { Step3FormValues } from "./components/Step3Supplement";
import type { SwipeLPv3Project, SwipeLPv3Status } from "@/types/swipe-lp-v3";

interface SwipeLPv3ViewProps {
  project: SwipeLPv3Project;
}

export default function SwipeLPv3View({ project }: SwipeLPv3ViewProps) {
  const router = useRouter();
  const status = project.status;
  const [step3Submitting, setStep3Submitting] = useState(false);
  const [step3Error, setStep3Error] = useState<string | null>(null);
  const [imageAnalyzing, setImageAnalyzing] = useState(false);
  const [imageAnalysisError, setImageAnalysisError] = useState<string | null>(null);
  const imageInputRef = useRef<HTMLInputElement>(null);

  const handleStep2Next = async () => {
    await updateUserSupplement(project.id, "");
    router.refresh();
  };

  const handleStep3Next = async (values: Step3FormValues) => {
    setStep3Error(null);
    setStep3Submitting(true);
    try {
      const updateResult = await updateStep3Settings(project.id, {
        emphasis_points: values.emphasis_points,
        slide_count: values.slide_count,
      });
      if (updateResult.error) {
        setStep3Error(updateResult.error);
        return;
      }
      const proposeResult = await proposeSlidesForV3(project.id);
      if (proposeResult.error) {
        setStep3Error(proposeResult.error);
        return;
      }
      router.refresh();
    } finally {
      setStep3Submitting(false);
    }
  };

  const handleStep3Back = async () => {
    await revertToAnalysisStep(project.id);
    router.refresh();
  };

  const handleBackToStep3 = async () => {
    await revertToSupplementStep(project.id);
    router.refresh();
  };

  const handleImageAnalyzeClick = () => {
    setImageAnalysisError(null);
    imageInputRef.current?.click();
  };

  const handleImageFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !file.type.startsWith("image/")) return;
    e.target.value = "";
    setImageAnalyzing(true);
    setImageAnalysisError(null);
    try {
      const formData = new FormData();
      formData.set("image", file);
      const result = await analyzeImageForV3(project.id, formData);
      if (result.error) {
        setImageAnalysisError(result.error);
      } else {
        router.refresh();
      }
    } finally {
      setImageAnalyzing(false);
    }
  };

  const header = (
    <header className="sticky top-0 z-10 shrink-0 flex items-center justify-between min-h-[52px] px-4 py-2 bg-white border-b border-neutral-200">
      <div className="flex items-center gap-2 min-w-0">
        <div className="min-w-0">
          <h1 className="text-sm font-bold text-neutral-900 leading-tight">Re:Design</h1>
          <p className="text-[10px] text-neutral-500 leading-tight truncate max-w-[280px]">
            {status === "analyzing" ? "AI分析中..." : project.input_url}
          </p>
        </div>
      </div>
      <div className="flex items-center gap-1.5 shrink-0">
        <Link
          href="/"
          className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-md bg-white border border-neutral-200 text-xs font-medium text-neutral-700 hover:bg-neutral-50 hover:border-neutral-300 transition-colors"
        >
          <Sparkles className="w-3 h-3 shrink-0" />
          プロンプト生成
        </Link>
        <Link
          href="/overlay-mode/new"
          className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-md bg-white border border-neutral-200 text-xs font-medium text-neutral-700 hover:bg-neutral-50 hover:border-neutral-300 transition-colors"
        >
          <ImagePlus className="w-3 h-3 shrink-0" />
          ベース生成
        </Link>
        <Link
          href="/character-tools"
          className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-md bg-white border border-neutral-200 text-xs font-medium text-neutral-700 hover:bg-neutral-50 hover:border-neutral-300 transition-colors"
        >
          <UsersRound className="w-3 h-3 shrink-0" />
          キャラ生成
        </Link>
        <span className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-md bg-neutral-100 border border-neutral-200 text-xs font-medium text-neutral-600">
          <LayoutList className="w-3 h-3 shrink-0" />
          スライド生成
        </span>
        <Link
          href="/feedback"
          className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-md bg-white border border-neutral-200 text-xs font-medium text-neutral-700 hover:bg-neutral-50 hover:border-neutral-300 transition-colors"
        >
          <MessageSquare className="w-3 h-3 shrink-0" />
          フィードバック
        </Link>
        <a
          href="https://gemini.google.com/app"
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-md bg-white border border-neutral-200 text-xs font-medium text-neutral-700 hover:bg-neutral-50 hover:border-neutral-300 transition-colors"
        >
          NanoBanana
          <ExternalLink className="w-3 h-3 shrink-0" />
        </a>
        <a
          href="https://chatgpt.com/"
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-md bg-white border border-neutral-200 text-xs font-medium text-neutral-700 hover:bg-neutral-50 hover:border-neutral-300 transition-colors"
        >
          DALL·E 3
          <ExternalLink className="w-3 h-3 shrink-0" />
        </a>
      </div>
    </header>
  );

  if (status === "analyzing") {
    return (
      <div className="min-h-screen bg-neutral-50 flex flex-col">
        {header}
        <main className="flex-1 flex items-center justify-center p-6">
          <div className="bg-white border border-neutral-200 rounded-xl p-12 text-center max-w-md w-full">
            <Loader2 className="w-12 h-12 animate-spin text-neutral-400 mx-auto mb-4" />
            <p className="text-neutral-600">AI分析中...</p>
            <p className="text-sm text-neutral-500 mt-2">
              完了までお待ちください
            </p>
            <button
              type="button"
              onClick={() => router.refresh()}
              className="mt-6 text-sm text-neutral-600 hover:text-neutral-900 underline"
            >
              更新する
            </button>
          </div>
        </main>
      </div>
    );
  }

  const displayStatus: SwipeLPv3Status =
    status === "url_input" ? "analysis_done" : status;

  const analysis = project.marketing_analysis;

  return (
    <div className="min-h-screen bg-neutral-50 flex flex-col">
      {header}

      {status === "analysis_done" && analysis && (
        <main className="flex-1 grid min-h-0 grid-cols-1 lg:grid-cols-2">
          <input
            ref={imageInputRef}
            type="file"
            accept="image/*"
            className="hidden"
            aria-hidden
            onChange={handleImageFileChange}
            disabled={imageAnalyzing}
          />
          {/* 左: パンくず + Step1 URL + 主要分析項目 */}
          <aside className="flex flex-col min-h-0 border-r border-neutral-200 bg-white overflow-y-auto">
            <div className="shrink-0 px-6 pt-4 pb-2 border-b border-neutral-100">
              <StepProgressBar status={displayStatus} />
            </div>
            <div className="p-6 flex-1">
              {imageAnalyzing ? (
                <div className="flex flex-col items-center justify-center py-12 text-neutral-500">
                  <Loader2 className="w-10 h-10 animate-spin mb-3" />
                  <p className="text-sm">画像を分析中...</p>
                </div>
              ) : (
                <Step2AnalysisLeft
                  inputUrl={project.input_url}
                  marketingAnalysis={analysis}
                  onImageAnalyzeClick={handleImageAnalyzeClick}
                />
              )}
            </div>
          </aside>
          {/* 右: 3C分析・AIDMA・次へボタン */}
          <section className="overflow-y-auto bg-neutral-50">
            <div className="p-6 space-y-4">
              {imageAnalysisError && (
                <div className="rounded-lg border border-red-200 bg-red-50 p-4 text-sm text-red-800">
                  {imageAnalysisError}
                </div>
              )}
              {imageAnalyzing ? (
                <div className="flex flex-col items-center justify-center py-12 text-neutral-500">
                  <Loader2 className="w-10 h-10 animate-spin mb-3" />
                  <p className="text-sm">画像を分析中...</p>
                </div>
              ) : (
                <Step2AnalysisRight
                  marketingAnalysis={analysis}
                  onNext={handleStep2Next}
                  onImageAnalyzeClick={handleImageAnalyzeClick}
                />
              )}
            </div>
          </section>
        </main>
      )}

      {status === "supplement_input" && (
        <main className="flex-1 grid min-h-0 grid-cols-1 lg:grid-cols-2">
          {/* 左: パンくず + 分析要約 */}
          <aside className="flex flex-col min-h-0 border-r border-neutral-200 bg-white overflow-y-auto">
            <div className="shrink-0 px-6 pt-4 pb-2 border-b border-neutral-100">
              <StepProgressBar status={displayStatus} />
            </div>
            <div className="p-6 flex-1 space-y-6">
              {analysis?.analysisUnavailable ? (
                <div className="rounded-lg border border-amber-200 bg-amber-50 p-4">
                  <p className="text-sm font-medium text-amber-900">分析できませんでした</p>
                  <p className="mt-2 text-sm text-amber-800 whitespace-pre-line">
                    {analysis.unavailableReason}
                  </p>
                  <p className="mt-3 text-xs text-amber-700">
                    左のStep2で「画像で分析する」からスクリーンショットやLP画像をアップロードしてください。
                  </p>
                </div>
              ) : (
                analysis && (
                  <>
                    <FrameworkCard
                      title="分析要約"
                      badge="リサーチ結果"
                      items={[
                        { label: "ビジネスタイプ", value: analysis.businessType },
                        { label: "ターゲット", value: analysis.target },
                        { label: "感情トリガー", value: analysis.emotionalTrigger },
                        {
                          label: "解決すべき痛み",
                          value: analysis.painPoints.map((p) => `・ ${p}`).join("\n"),
                        },
                      ]}
                    />
                    <FrameworkCard
                      title="AIDMA"
                      badge="認知〜行動の流れ"
                      items={[
                        { label: "注目（Attention）", value: analysis.framework.aidma.attention },
                        { label: "興味（Interest）", value: analysis.framework.aidma.interest },
                        { label: "欲求（Desire）", value: analysis.framework.aidma.desire },
                        { label: "記憶（Memory）", value: analysis.framework.aidma.memory },
                        { label: "行動（Action）", value: analysis.framework.aidma.action },
                      ]}
                      headerLink={{
                        href: AIDMA_SEARCH_URL,
                        label: "AIDMAとは？",
                      }}
                    />
                  </>
                )
              )}
            </div>
          </aside>
          {/* 右: Step3 設定フォーム */}
          <section className="overflow-y-auto bg-neutral-50">
            <div className="p-6">
              {step3Error && (
                <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg text-red-800 text-sm">
                  <p className="font-medium">スライド構成の生成に失敗しました</p>
                  <p className="mt-1">{step3Error}</p>
                </div>
              )}
              <Step3Supplement
                initialEmphasisPoints={project.emphasis_points ?? ""}
                initialSlideCount={project.slide_count ?? null}
                onNext={handleStep3Next}
                onBack={handleStep3Back}
                isSubmitting={step3Submitting}
              />
            </div>
          </section>
        </main>
      )}

      {(status === "slides_ready" || status === "prompts_ready") &&
        (project.slides && project.slides.length > 0 ? (
          <Step4SlideEdit
            projectId={project.id}
            slides={project.slides}
            onUpdate={() => router.refresh()}
            onBackToStep3={handleBackToStep3}
            displayStatus={displayStatus}
          />
        ) : (
          <main className="flex-1 min-h-0 flex flex-col overflow-hidden">
            <div className="shrink-0 px-6 py-3 border-b border-neutral-200 bg-white">
              <StepProgressBar status={displayStatus} />
            </div>
            <div className="flex-1 min-h-0 overflow-y-auto p-6 flex items-center justify-center">
              <div className="max-w-2xl mx-auto text-center py-16 text-neutral-600">
                <p>スライドがありません。</p>
                <p className="text-sm mt-2">
                  Step 3 から「次へ」を押してスライドを生成してください。
                </p>
                <button
                  type="button"
                  onClick={() => router.refresh()}
                  className="mt-4 text-neutral-600 hover:text-neutral-900 underline"
                >
                  更新する
                </button>
              </div>
            </div>
          </main>
        ))}
    </div>
  );
}
