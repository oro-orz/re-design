"use client";

import { Check } from "lucide-react";
import type { SwipeLPv3Status } from "@/types/swipe-lp-v3";

const STEPS = [
  { label: "URL" },
  { label: "分析" },
  { label: "補足" },
  { label: "スライド" },
];

export function getStepIndex(status: SwipeLPv3Status): number {
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
      return 3;
    default:
      return 1;
  }
}

export function StepProgressBar({ status }: { status: SwipeLPv3Status }) {
  const currentIndex = getStepIndex(status);

  return (
    <nav className="flex items-center gap-1.5 py-2">
      {STEPS.map((step, i) => {
        const isComplete = i < currentIndex;
        const isCurrent = i === currentIndex;
        return (
          <div
            key={step.label}
            className="flex items-center gap-1 flex-shrink-0"
          >
            <div
              className={`flex-shrink-0 w-6 h-6 rounded-full flex items-center justify-center text-[10px] font-bold transition-colors ${
                isComplete
                  ? "bg-green-500 text-white"
                  : isCurrent
                    ? "bg-neutral-900 text-white ring-1 ring-neutral-900 ring-offset-1"
                    : "bg-neutral-200 text-neutral-500"
              }`}
              title={step.label}
            >
              {isComplete ? <Check className="w-3 h-3" /> : i + 1}
            </div>
            <span
              className={`text-[10px] font-medium hidden sm:inline ${
                isCurrent ? "text-neutral-900" : "text-neutral-500"
              }`}
            >
              {step.label}
            </span>
            {i < STEPS.length - 1 && (
              <div
                className={`w-3 h-px mx-0.5 flex-shrink-0 ${
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
