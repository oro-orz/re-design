"use client";

import { Check } from "lucide-react";
import type { SwipeLPv3Status } from "@/types/swipe-lp-v3";

const STEPS = [
  { label: "URL入力" },
  { label: "分析結果" },
  { label: "補足入力" },
  { label: "スライド構成" },
];

function getStepIndex(status: SwipeLPv3Status): number {
  switch (status) {
    case "url_input":
    case "analyzing":
      return 1;
    case "analysis_done":
      return 1;
    case "supplement_input":
      return 2;
    case "slides_ready":
    case "prompts_ready":
      return 3; // Step4 スライド構成（prompts_ready は既存データ互換）
    default:
      return 1;
  }
}

export function StepProgressBar({ status }: { status: SwipeLPv3Status }) {
  const currentIndex = getStepIndex(status);

  return (
    <nav className="flex items-center justify-between gap-2 py-4">
      {STEPS.map((step, i) => {
        const isComplete = i < currentIndex;
        const isCurrent = i === currentIndex;
        return (
          <div
            key={step.label}
            className={`flex items-center gap-2 flex-1 ${
              i < STEPS.length - 1 ? "min-w-0" : ""
            }`}
          >
            <div
              className={`flex-shrink-0 w-10 h-10 rounded-full flex items-center justify-center text-sm font-bold transition-colors ${
                isComplete
                  ? "bg-green-500 text-white"
                  : isCurrent
                    ? "bg-neutral-900 text-white ring-2 ring-neutral-900 ring-offset-2"
                    : "bg-neutral-200 text-neutral-500"
              }`}
            >
              {isComplete ? <Check className="w-5 h-5" /> : i + 1}
            </div>
            <span
              className={`text-xs font-medium truncate hidden sm:inline ${
                isCurrent ? "text-neutral-900" : "text-neutral-600"
              }`}
            >
              {step.label}
            </span>
            {i < STEPS.length - 1 && (
              <div
                className={`flex-1 h-0.5 mx-1 ${
                  isComplete ? "bg-green-500" : "bg-neutral-200"
                }`}
              />
            )}
          </div>
        );
      })}
    </nav>
  );
}
