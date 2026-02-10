"use client";

import { useState } from "react";
import { Loader2 } from "lucide-react";
import { StepSectionHeader } from "./StepSectionHeader";

export interface Step3FormValues {
  emphasis_points: string;
  slide_count: number | null;
}

interface Step3SupplementProps {
  initialEmphasisPoints: string;
  initialSlideCount: number | null;
  onNext: (values: Step3FormValues) => void;
  onBack: () => void;
  /** スライド構成生成中（次へ押下後） */
  isSubmitting?: boolean;
  /** 他ユーザーによる閲覧時（入力・ボタン無効） */
  readOnly?: boolean;
}

const SLIDE_COUNT_OPTIONS: { value: number | null; label: string }[] = [
  { value: null, label: "指定しない（6〜8枚で提案）" },
  { value: 6, label: "6枚" },
  { value: 7, label: "7枚" },
  { value: 8, label: "8枚" },
];

const inputBase =
  "w-full border border-neutral-200 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-neutral-400 focus:border-transparent disabled:opacity-60 disabled:bg-neutral-50";
const labelBase =
  "block text-[11px] font-semibold uppercase tracking-wider text-neutral-500 mb-1.5";

export function Step3Supplement({
  initialEmphasisPoints,
  initialSlideCount,
  onNext,
  onBack,
  isSubmitting = false,
  readOnly = false,
}: Step3SupplementProps) {
  const [emphasisPoints, setEmphasisPoints] = useState(initialEmphasisPoints);
  const [slideCount, setSlideCount] = useState<number | null>(initialSlideCount);

  const handleSubmit = () => {
    onNext({
      emphasis_points: emphasisPoints,
      slide_count: slideCount,
    });
  };

  return (
    <div className="space-y-6">
      <StepSectionHeader
        step={3}
        title="スライドテキストの設定"
        subtitle="強調点・枚数を指定できます"
      />

      <div className="rounded-lg border border-neutral-200 bg-white overflow-hidden">
        <div className="px-4 py-2.5 bg-neutral-50 border-b border-neutral-200">
          <span className="text-[11px] font-semibold uppercase tracking-wider text-neutral-500">
            設定項目
          </span>
        </div>
        <div className="p-4 space-y-4">
          <label className="block">
            <span className={labelBase}>特に強調したい点</span>
            <textarea
              value={emphasisPoints}
              onChange={(e) => setEmphasisPoints(e.target.value)}
              rows={2}
              placeholder="料金の安さ、即日対応、実績の多さ..."
              className={`${inputBase} resize-none`}
              disabled={isSubmitting || readOnly}
            />
          </label>

          <label className="block">
            <span className={labelBase}>スライド枚数</span>
            <select
              value={slideCount ?? ""}
              onChange={(e) =>
                setSlideCount(e.target.value === "" ? null : Number(e.target.value))
              }
              className={`${inputBase} bg-white`}
              disabled={isSubmitting || readOnly}
            >
              {SLIDE_COUNT_OPTIONS.map((opt) => (
                <option key={opt.value ?? "any"} value={opt.value ?? ""}>
                  {opt.label}
                </option>
              ))}
            </select>
          </label>
        </div>
      </div>

      {!readOnly && (
        <div className="flex gap-3">
          <button
            type="button"
            onClick={onBack}
            disabled={isSubmitting}
            className="flex-1 border border-neutral-200 text-neutral-700 py-3 rounded-lg text-sm font-semibold hover:bg-neutral-50 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            戻る
          </button>
          <button
            type="button"
            onClick={handleSubmit}
            disabled={isSubmitting}
            className="flex-1 bg-neutral-900 text-white py-3 rounded-lg text-sm font-semibold hover:bg-neutral-800 disabled:opacity-70 disabled:cursor-not-allowed flex items-center justify-center gap-2"
          >
            {isSubmitting ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                生成中…
              </>
            ) : (
              "次へ：スライドテキストを作成"
            )}
          </button>
        </div>
      )}
    </div>
  );
}
