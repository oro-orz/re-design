"use client";

import { Download } from "lucide-react";

export interface BaseImageResultProps {
  result: {
    referenceImageUrl: string;
    baseImageUrl: string;
  };
  onDownload: () => void;
  onReset: () => void;
}

export function BaseImageResult({
  result,
  onDownload,
  onReset,
}: BaseImageResultProps) {
  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="rounded-xl border border-neutral-200 bg-white p-4">
          <h3 className="text-sm font-semibold text-neutral-700 mb-3">参考画像</h3>
          <img
            src={result.referenceImageUrl}
            alt="参考画像"
            className="w-full rounded-lg"
          />
        </div>
        <div className="rounded-xl border border-neutral-200 bg-white p-4">
          <h3 className="text-sm font-semibold text-neutral-700 mb-3">
            ベース画像（テキストなし）
          </h3>
          <img
            src={result.baseImageUrl}
            alt="ベース画像"
            className="w-full rounded-lg"
          />
        </div>
      </div>
      <div className="flex flex-wrap items-center gap-2">
        <button
          type="button"
          onClick={onDownload}
          className="inline-flex items-center gap-1.5 rounded-lg bg-neutral-900 px-3 py-2 text-sm font-medium text-white transition-colors hover:bg-neutral-800"
        >
          <Download className="h-3.5 w-3.5" />
          ダウンロード
        </button>
        <button
          type="button"
          onClick={onReset}
          className="inline-flex items-center gap-1.5 rounded-lg border border-neutral-200 bg-white px-3 py-2 text-sm font-medium text-neutral-700 transition-colors hover:border-neutral-300 hover:bg-neutral-50"
        >
          別の画像で生成
        </button>
      </div>
    </div>
  );
}
