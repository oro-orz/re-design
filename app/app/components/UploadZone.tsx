"use client";

import { useCallback, useState } from "react";
import { Upload } from "lucide-react";
import { ACCEPT_IMAGE } from "@/lib/constants";

type Props = {
  onSelect: (file: File) => void;
  preview?: string | null;
  disabled?: boolean;
};

export function UploadZone({ onSelect, preview, disabled }: Props) {
  const [drag, setDrag] = useState(false);

  const handleDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      setDrag(false);
      if (disabled) return;
      const f = e.dataTransfer.files[0];
      if (f && /^image\/(png|jpeg|webp)$/i.test(f.type)) {
        onSelect(f);
      }
    },
    [onSelect, disabled]
  );

  const handleChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const f = e.target.files?.[0];
      if (f) onSelect(f);
    },
    [onSelect]
  );

  return (
    <label
      onDragOver={(e) => {
        e.preventDefault();
        if (!disabled) setDrag(true);
      }}
      onDragLeave={() => setDrag(false)}
      onDrop={handleDrop}
      className={`flex min-h-[200px] cursor-pointer flex-col items-center justify-center gap-2 rounded-2xl border-2 border-dashed transition-colors ${
        disabled
          ? "cursor-not-allowed border-neutral-200 bg-neutral-50"
          : drag
            ? "border-neutral-400 bg-neutral-100"
            : "border-neutral-200 bg-white hover:border-neutral-300"
      }`}
    >
      <input
        type="file"
        accept={ACCEPT_IMAGE}
        onChange={handleChange}
        disabled={disabled}
        className="hidden"
      />
      {preview ? (
        <img
          src={preview}
          alt="プレビュー"
          className="max-h-[180px] max-w-full rounded-xl object-contain"
        />
      ) : (
        <>
          <Upload className="h-10 w-10 text-neutral-400" />
          <span className="text-sm text-neutral-500">
            PNG / JPG / WEBP をドロップ
          </span>
        </>
      )}
    </label>
  );
}
