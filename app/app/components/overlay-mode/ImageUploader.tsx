"use client";

import { Upload, Loader2 } from "lucide-react";

export interface ImageUploaderProps {
  preview: string | null;
  loading: boolean;
  onFileChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  onSubmit: () => void;
  disabled: boolean;
  /** アップロードエリアと生成ボタンの間に表示するオプション（例: 人物変更） */
  optionsSection?: React.ReactNode;
  /** 生成ボタンのラベル（未指定時は「ベース画像を生成」） */
  submitLabel?: string;
  /** ローディング時のメッセージ（未指定時は「AI生成中...」） */
  loadingMessage?: string;
}

export function ImageUploader({
  preview,
  loading,
  onFileChange,
  onSubmit,
  disabled,
  optionsSection,
  submitLabel = "ベース画像を生成",
  loadingMessage = "AI生成中...",
}: ImageUploaderProps) {
  return (
    <div className="space-y-6">
      <label className="flex flex-col items-center justify-center min-h-[200px] border-2 border-dashed border-neutral-300 rounded-xl cursor-pointer hover:border-neutral-400 transition-colors p-4">
        <input
          type="file"
          accept="image/*"
          onChange={onFileChange}
          className="hidden"
        />
        {preview ? (
          <img
            src={preview}
            alt="プレビュー"
            className="max-h-[180px] rounded-lg object-contain"
          />
        ) : (
          <div className="text-center space-y-2">
            <Upload className="h-10 w-10 text-neutral-400 mx-auto" />
            <p className="text-sm text-neutral-600">クリックして参考画像を選択</p>
            <p className="text-xs text-neutral-500">PNG / JPG / WEBP</p>
          </div>
        )}
      </label>

      {optionsSection}

      {!loading && (
        <button
          type="button"
          onClick={onSubmit}
          disabled={disabled}
          className="inline-flex w-full items-center justify-center gap-2 rounded-xl bg-neutral-900 px-4 py-3.5 font-medium text-white transition-colors hover:bg-neutral-800 disabled:opacity-50"
        >
          {submitLabel}
        </button>
      )}

      {loading && (
        <div className="flex items-center justify-center gap-2 text-neutral-600">
          <Loader2 className="h-5 w-5 animate-spin" />
          <span className="text-sm">{loadingMessage}</span>
        </div>
      )}
    </div>
  );
}
