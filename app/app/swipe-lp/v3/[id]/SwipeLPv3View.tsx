"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { ArrowLeft, Loader2 } from "lucide-react";
import { StepProgressBar } from "./components/StepProgressBar";
import { Step2Analysis } from "./components/Step2Analysis";
import { Step3Supplement } from "./components/Step3Supplement";
import { Step4SlideEdit } from "./components/Step4SlideEdit";
import {
  updateUserSupplement,
  updateStep3Settings,
  proposeSlidesForV3,
  revertToAnalysisStep,
  revertToSupplementStep,
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

  const handleStep2Next = async () => {
    await updateUserSupplement(project.id, "");
    router.refresh();
  };

  const handleStep3Next = async (values: Step3FormValues) => {
    setStep3Error(null);
    setStep3Submitting(true);
    try {
      const updateResult = await updateStep3Settings(project.id, {
        user_supplement: values.user_supplement,
        emphasis_points: values.emphasis_points,
        output_tone: values.output_tone || null,
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

  if (status === "analyzing") {
    return (
      <div className="min-h-screen bg-gradient-to-b from-neutral-50 to-white">
        <div className="max-w-2xl mx-auto p-6">
          <div className="bg-white border-2 border-neutral-200 rounded-2xl p-12 text-center">
            <Loader2 className="w-12 h-12 animate-spin text-neutral-400 mx-auto mb-4" />
            <p className="text-neutral-600">AI分析中...</p>
            <p className="text-sm text-neutral-500 mt-2">
              完了までお待ちください
            </p>
            <button
              type="button"
              onClick={() => router.refresh()}
              className="mt-6 text-sm text-blue-600 hover:underline"
            >
              更新する
            </button>
          </div>
        </div>
      </div>
    );
  }

  const displayStatus: SwipeLPv3Status =
    status === "url_input" ? "analysis_done" : status;

  return (
    <div className="min-h-screen bg-gradient-to-b from-neutral-50 to-white">
      <div className="max-w-3xl mx-auto p-6 space-y-6">
        <div className="flex items-center gap-4">
          <Link
            href="/swipe-lp/v3/new"
            className="p-2 hover:bg-neutral-100 rounded-lg transition-colors"
          >
            <ArrowLeft className="w-5 h-5 text-neutral-600" />
          </Link>
          <div>
            <h1 className="text-xl font-bold text-neutral-900">SwipeLP v3</h1>
            <p className="text-sm text-neutral-500 truncate max-w-[200px]">
              {project.input_url}
            </p>
          </div>
        </div>

        <StepProgressBar status={displayStatus} />

        <div className="bg-white border-2 border-neutral-200 rounded-2xl p-8 shadow-sm">
          {status === "analysis_done" && project.marketing_analysis && (
            <Step2Analysis
              marketingAnalysis={project.marketing_analysis}
              onNext={handleStep2Next}
            />
          )}

          {status === "supplement_input" && (
            <>
              {step3Error && (
                <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-xl text-red-800 text-sm">
                  <p className="font-medium">スライド構成の生成に失敗しました</p>
                  <p className="mt-1">{step3Error}</p>
                </div>
              )}
              <Step3Supplement
                initialSupplement={project.user_supplement ?? ""}
                initialEmphasisPoints={project.emphasis_points ?? ""}
                initialOutputTone={project.output_tone ?? null}
                initialSlideCount={project.slide_count ?? null}
                onNext={handleStep3Next}
                onBack={handleStep3Back}
                isSubmitting={step3Submitting}
              />
            </>
          )}

          {(status === "slides_ready" || status === "prompts_ready") && (
            <>
              <div className="mb-6 flex justify-end">
                <button
                  type="button"
                  onClick={handleBackToStep3}
                  className="text-sm text-neutral-600 hover:text-neutral-900 underline"
                >
                  Step 3 に戻って設定を変更・スライドを再生成
                </button>
              </div>
              {project.slides && project.slides.length > 0 ? (
                <Step4SlideEdit
                  projectId={project.id}
                  slides={project.slides}
                  onUpdate={() => router.refresh()}
                />
              ) : (
                <div className="text-center py-8 text-neutral-600">
                  <p>スライドがありません。</p>
                  <p className="text-sm mt-2">
                    Step 3 から「次へ」を押してスライドを生成してください。
                  </p>
                  <button
                    type="button"
                    onClick={() => router.refresh()}
                    className="mt-4 text-blue-600 hover:underline"
                  >
                    更新する
                  </button>
                </div>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
}
