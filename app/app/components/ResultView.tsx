"use client";

import { useCallback, useState, useMemo } from "react";
import { Download, Copy, Loader2 } from "lucide-react";

type Props = {
  originalUrl: string;
  generatedUrl: string | null;
  feedback: string;
  loading?: boolean;
};

/** "## 見出し\n本文..." 形式のテキストをセクションに分割。見出しがない場合は全文を1つの本文として返す */
function parseFeedbackSections(text: string): { title: string; body: string }[] {
  if (!text.includes("## ")) return [{ title: "", body: text.trim() }];
  const sections: { title: string; body: string }[] = [];
  const parts = text.split(/(?=##\s)/).filter(Boolean);
  for (const part of parts) {
    const firstLineEnd = part.indexOf("\n");
    const rawFirstLine = firstLineEnd === -1 ? part : part.slice(0, firstLineEnd);
    const title = rawFirstLine.replace(/^##\s*/, "").trim();
    const body = firstLineEnd === -1 ? "" : part.slice(firstLineEnd + 1).trim();
    if (title || body) sections.push({ title, body });
  }
  if (sections.length === 0) return [{ title: "", body: text.trim() }];
  return sections;
}

export function ResultView({
  originalUrl,
  generatedUrl,
  feedback,
  loading,
}: Props) {
  const [copied, setCopied] = useState(false);
  const sections = useMemo(() => parseFeedbackSections(feedback), [feedback]);

  const handleCopy = useCallback(async () => {
    await navigator.clipboard.writeText(feedback);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }, [feedback]);

  const handleDownload = useCallback(() => {
    if (!generatedUrl) return;
    const a = document.createElement("a");
    a.href = generatedUrl;
    a.download = "redesign.webp";
    a.click();
  }, [generatedUrl]);

  return (
    <div className="space-y-6">
      {feedback && (
        <div className="space-y-4">
          <div className="rounded-2xl border border-neutral-200 bg-white p-4">
            <h3 className="mb-3 text-sm font-semibold text-neutral-900">デザインフィードバック</h3>
            <div className="space-y-4">
              {sections.map(({ title, body }, i) => (
                <section key={i} className="border-b border-neutral-100 pb-3 last:border-0 last:pb-0">
                  {title && (
                    <h4 className="mb-1.5 text-xs font-semibold uppercase tracking-wide text-neutral-500">
                      {title}
                    </h4>
                  )}
                  <p className="whitespace-pre-wrap text-sm leading-relaxed text-neutral-700">
                    {body || "—"}
                  </p>
                </section>
              ))}
            </div>
          </div>
          <div className="flex justify-center">
            <button
              type="button"
              onClick={handleCopy}
              disabled={loading}
              className="inline-flex items-center gap-2 rounded-xl bg-neutral-900 px-4 py-2.5 text-sm font-medium text-white transition-colors hover:bg-neutral-800 disabled:opacity-50"
            >
              <Copy className="h-4 w-4" />
              {copied ? "コピーしました" : "フィードバックをコピー"}
            </button>
          </div>
        </div>
      )}

      {loading ? (
        <div className="overflow-hidden rounded-2xl border border-neutral-200 bg-white p-8">
          <div className="flex min-h-[280px] flex-col items-center justify-center gap-6">
            <Loader2 className="h-12 w-12 animate-spin text-neutral-400" />
            <div className="text-center space-y-1">
              <p className="text-sm font-medium text-neutral-700">分析中...</p>
              <p className="text-xs text-neutral-500">デザインフィードバックを生成しています</p>
            </div>
            <div className="flex w-full max-w-xs gap-1">
              {[0, 1, 2, 3, 4].map((i) => (
                <div
                  key={i}
                  className="h-1 flex-1 animate-pulse rounded-full bg-neutral-200"
                  style={{ animationDelay: `${i * 100}ms` }}
                />
              ))}
            </div>
          </div>
        </div>
      ) : generatedUrl ? (
        <div className="space-y-2">
          <p className="text-xs text-neutral-500">参考イメージ（FLUX.2 pro生成）</p>
          <div className="overflow-hidden rounded-2xl border border-neutral-200 bg-white">
            <div className="flex min-h-[320px] items-center justify-center p-4">
              <img
                src={generatedUrl}
                alt="生成画像"
                className="max-h-full max-w-full rounded-lg object-contain"
              />
            </div>
          </div>
        </div>
      ) : null}

      {generatedUrl && (
        <div className="flex flex-wrap gap-2">
          <button
            type="button"
            onClick={handleDownload}
            disabled={!generatedUrl || loading}
            className="inline-flex items-center gap-2 rounded-xl border border-neutral-200 bg-white px-4 py-2.5 text-sm font-medium text-neutral-700 transition-colors hover:border-neutral-300 disabled:opacity-50"
          >
            <Download className="h-4 w-4" />
            ダウンロード
          </button>
        </div>
      )}

    </div>
  );
}
