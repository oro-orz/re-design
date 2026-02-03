"use client";

import { useState } from "react";
import { Loader2 } from "lucide-react";
import type { OutputTone } from "@/types/swipe-lp-v3";

export interface Step3FormValues {
  user_supplement: string;
  emphasis_points: string;
  output_tone: OutputTone | "";
  slide_count: number | null;
}

interface Step3SupplementProps {
  initialSupplement: string;
  initialEmphasisPoints: string;
  initialOutputTone: string | null;
  initialSlideCount: number | null;
  onNext: (values: Step3FormValues) => void;
  onBack: () => void;
  /** スライド構成生成中（次へ押下後） */
  isSubmitting?: boolean;
}

const TONE_OPTIONS: { value: OutputTone | ""; label: string }[] = [
  { value: "", label: "指定しない" },
  { value: "neutral", label: "中立的・バランスの取れた" },
  { value: "casual", label: "カジュアル・親しみやすい" },
  { value: "professional", label: "プロフェッショナル・信頼感" },
  { value: "playful", label: "遊び心・軽やか" },
];

const SLIDE_COUNT_OPTIONS: { value: number | null; label: string }[] = [
  { value: null, label: "指定しない（6〜8枚で提案）" },
  { value: 6, label: "6枚" },
  { value: 7, label: "7枚" },
  { value: 8, label: "8枚" },
];

export function Step3Supplement({
  initialSupplement,
  initialEmphasisPoints,
  initialOutputTone,
  initialSlideCount,
  onNext,
  onBack,
  isSubmitting = false,
}: Step3SupplementProps) {
  const [supplement, setSupplement] = useState(initialSupplement);
  const [emphasisPoints, setEmphasisPoints] = useState(initialEmphasisPoints);
  const [outputTone, setOutputTone] = useState<OutputTone | "">(
    (initialOutputTone as OutputTone) || ""
  );
  const [slideCount, setSlideCount] = useState<number | null>(initialSlideCount);

  const handleSubmit = () => {
    onNext({
      user_supplement: supplement,
      emphasis_points: emphasisPoints,
      output_tone: outputTone || "",
      slide_count: slideCount,
    });
  };

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-lg font-bold mb-2">Step 3: スライドテキストの設定</h2>
        <p className="text-sm text-neutral-600 mb-6">
          生成するスライドのトーンや強調したい点、枚数を指定できます。任意項目は空欄のまま次へ進めます。
        </p>
      </div>

      <div className="space-y-4">
        <label className="block">
          <span className="block text-sm font-medium text-neutral-700 mb-1">
            特に強調したい点
          </span>
          <textarea
            value={emphasisPoints}
            onChange={(e) => setEmphasisPoints(e.target.value)}
            rows={3}
            placeholder="例：料金の安さ、即日対応、実績の多さ、サポート体制"
            className="w-full border-2 border-neutral-200 rounded-xl px-4 py-3 focus:outline-none focus:border-neutral-900 resize-none disabled:opacity-60 disabled:bg-neutral-50"
            disabled={isSubmitting}
          />
        </label>

        <label className="block">
          <span className="block text-sm font-medium text-neutral-700 mb-1">
            テキストのトーン
          </span>
          <select
            value={outputTone}
            onChange={(e) => setOutputTone((e.target.value || "") as OutputTone | "")}
            className="w-full border-2 border-neutral-200 rounded-xl px-4 py-3 focus:outline-none focus:border-neutral-900 bg-white disabled:opacity-60 disabled:bg-neutral-50"
            disabled={isSubmitting}
          >
            {TONE_OPTIONS.map((opt) => (
              <option key={opt.value || "none"} value={opt.value}>
                {opt.label}
              </option>
            ))}
          </select>
        </label>

        <label className="block">
          <span className="block text-sm font-medium text-neutral-700 mb-1">
            スライドの枚数指定
          </span>
          <select
            value={slideCount ?? ""}
            onChange={(e) =>
              setSlideCount(e.target.value === "" ? null : Number(e.target.value))
            }
            className="w-full border-2 border-neutral-200 rounded-xl px-4 py-3 focus:outline-none focus:border-neutral-900 bg-white disabled:opacity-60 disabled:bg-neutral-50"
            disabled={isSubmitting}
          >
            {SLIDE_COUNT_OPTIONS.map((opt) => (
              <option key={opt.value ?? "any"} value={opt.value ?? ""}>
                {opt.label}
              </option>
            ))}
          </select>
        </label>

        <label className="block">
          <span className="block text-sm font-medium text-neutral-700 mb-1">
            補足情報（任意）
          </span>
          <textarea
            value={supplement}
            onChange={(e) => setSupplement(e.target.value)}
            rows={3}
            placeholder="例：ターゲット層は20代女性。競合の〇〇との差別化を意識してほしい。"
            className="w-full border-2 border-neutral-200 rounded-xl px-4 py-3 focus:outline-none focus:border-neutral-900 resize-none disabled:opacity-60 disabled:bg-neutral-50"
            disabled={isSubmitting}
          />
        </label>
      </div>

      {isSubmitting && (
        <div className="flex items-center gap-3 py-3 px-4 bg-neutral-100 rounded-xl text-neutral-700">
          <Loader2 className="w-5 h-5 animate-spin flex-shrink-0" />
          <p className="text-sm">
            スライド構成を生成しています。しばらくお待ちください…
          </p>
        </div>
      )}

      <div className="flex gap-3">
        <button
          type="button"
          onClick={onBack}
          disabled={isSubmitting}
          className="flex-1 border-2 border-neutral-300 text-neutral-700 py-4 rounded-xl font-bold hover:bg-neutral-50 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          戻る
        </button>
        <button
          type="button"
          onClick={handleSubmit}
          disabled={isSubmitting}
          className="flex-1 bg-neutral-900 text-white py-4 rounded-xl font-bold hover:bg-neutral-800 disabled:opacity-70 disabled:cursor-not-allowed flex items-center justify-center gap-2"
        >
          {isSubmitting ? (
            <>
              <Loader2 className="w-5 h-5 animate-spin" />
              生成中…
            </>
          ) : (
            "次へ：スライド構成を提案"
          )}
        </button>
      </div>
    </div>
  );
}
