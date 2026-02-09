"use client";

import { useEffect } from "react";

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error(error);
  }, [error]);

  return (
    <div className="flex min-h-[50vh] flex-col items-center justify-center gap-4 p-6">
      <h2 className="text-lg font-semibold text-neutral-900">問題が発生しました</h2>
      <p className="text-sm text-neutral-600 text-center max-w-md">
        {error.message || "予期しないエラーが発生しました。"}
      </p>
      <button
        type="button"
        onClick={() => reset()}
        className="rounded-xl bg-neutral-900 px-4 py-2.5 text-sm font-medium text-white hover:bg-neutral-800 transition-colors"
      >
        再試行
      </button>
    </div>
  );
}
