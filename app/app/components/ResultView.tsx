"use client";

import { useCallback, useState } from "react";
import { Download, Copy, Loader2, RotateCcw, RefreshCw, ExternalLink } from "lucide-react";

type Props = {
  originalUrl: string;
  generatedUrl: string | null;
  feedback: string;
  fluxPrompt: string;
  mode: string;
  loading?: boolean;
  onRetryWithSettings?: () => void;
  onReset?: () => void;
};

function buildDesignerText(feedback: string, fluxPrompt: string, mode: string) {
  return `【フィードバック】\n${feedback}\n\n【モード】${mode}\n【生成プロンプト】\n${fluxPrompt}`;
}

export function ResultView({
  originalUrl,
  generatedUrl,
  feedback,
  fluxPrompt,
  mode,
  loading,
  onRetryWithSettings,
  onReset,
}: Props) {
  const [copied, setCopied] = useState(false);
  const [showLinks, setShowLinks] = useState(false);

  const handleCopy = useCallback(async () => {
    const text = buildDesignerText(feedback, fluxPrompt, mode);
    await navigator.clipboard.writeText(text);
    setCopied(true);
    setShowLinks(true);
    setTimeout(() => setCopied(false), 2000);
  }, [feedback, fluxPrompt, mode]);

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
        <div className="rounded-2xl border border-neutral-200 bg-white p-4">
          <h3 className="mb-2 text-sm font-semibold text-neutral-900">フィードバック</h3>
          <p className="whitespace-pre-wrap text-sm text-neutral-700">
            {feedback}
          </p>
        </div>
      )}

      {fluxPrompt && (
        <div className="rounded-2xl border border-neutral-200 bg-white p-4">
          <div className="mb-2 flex items-center justify-between">
            <h3 className="text-sm font-semibold text-neutral-900">生成プロンプト</h3>
            <button
              type="button"
              onClick={async () => {
                await navigator.clipboard.writeText(fluxPrompt);
                setCopied(true);
                setTimeout(() => setCopied(false), 2000);
              }}
              className="inline-flex items-center gap-1 rounded-lg border border-neutral-200 bg-white px-2 py-1 text-xs text-neutral-600 transition-colors hover:border-neutral-300"
            >
              <Copy className="h-3 w-3" />
              プロンプトのみコピー
            </button>
          </div>
          <textarea
            readOnly
            value={fluxPrompt}
            className="w-full resize-none rounded-xl border border-neutral-200 bg-neutral-50 px-3 py-2 text-xs text-neutral-700 font-mono focus:outline-none"
            rows={8}
            onClick={(e) => (e.target as HTMLTextAreaElement).select()}
          />
        </div>
      )}

      <div className="flex flex-col items-center gap-4">
        <div className="w-full rounded-xl border border-neutral-200 bg-white px-4 py-3 text-center">
          <p className="text-xs leading-relaxed text-neutral-600">
            「元画像」「フィードバック」「プロンプト」をコピーし、NanoBanana などの画像生成AIへ入力すると、より高品質な画像を作成できます。
          </p>
          <p className="mt-2 text-xs leading-relaxed text-neutral-600">
            日本語テキストがうまく生成できない場合はブラウザ版のGemini（NanoBanana）等で再度試してください。
          </p>
          <div className="mt-2 flex flex-wrap items-center justify-center gap-1.5 text-xs">
            <a
              href="https://gemini.google/jp/overview/image-generation/?hl=ja-JP"
              target="_blank"
              rel="noopener noreferrer"
              className="font-medium text-neutral-700 underline decoration-neutral-300 underline-offset-2 hover:text-neutral-900 hover:decoration-neutral-500"
            >
              NanoBanana
            </a>
            <span className="text-neutral-300">/</span>
            <a
              href="https://openai.com/index/dall-e-3/"
              target="_blank"
              rel="noopener noreferrer"
              className="font-medium text-neutral-700 underline decoration-neutral-300 underline-offset-2 hover:text-neutral-900 hover:decoration-neutral-500"
            >
              DALL·E 3
            </a>
            <span className="text-neutral-300">/</span>
            <a
              href="https://www.midjourney.com/"
              target="_blank"
              rel="noopener noreferrer"
              className="font-medium text-neutral-700 underline decoration-neutral-300 underline-offset-2 hover:text-neutral-900 hover:decoration-neutral-500"
            >
              Midjourney
            </a>
          </div>
        </div>
        <button
          type="button"
          onClick={handleCopy}
          disabled={!feedback || loading}
          className="inline-flex items-center gap-2 rounded-xl bg-neutral-900 px-4 py-2.5 text-sm font-medium text-white transition-colors hover:bg-neutral-800 disabled:opacity-50"
        >
          <Copy className="h-4 w-4" />
          {copied ? "コピーしました" : "フィードバック+プロンプトをコピー"}
        </button>
        {showLinks && (
          <div className="flex flex-wrap items-center justify-center gap-3">
            <a
              href="https://gemini.google/jp/overview/image-generation/?hl=ja-JP"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1.5 rounded-lg border border-neutral-200 bg-white px-3 py-2 text-xs font-medium text-neutral-700 transition-colors hover:border-neutral-300 hover:bg-neutral-50"
            >
              <ExternalLink className="h-3.5 w-3.5" />
              NanoBanana
            </a>
            <a
              href="https://openai.com/index/dall-e-3/"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1.5 rounded-lg border border-neutral-200 bg-white px-3 py-2 text-xs font-medium text-neutral-700 transition-colors hover:border-neutral-300 hover:bg-neutral-50"
            >
              <ExternalLink className="h-3.5 w-3.5" />
              DALL·E 3
            </a>
            <a
              href="https://www.midjourney.com/"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1.5 rounded-lg border border-neutral-200 bg-white px-3 py-2 text-xs font-medium text-neutral-700 transition-colors hover:border-neutral-300 hover:bg-neutral-50"
            >
              <ExternalLink className="h-3.5 w-3.5" />
              Midjourney
            </a>
          </div>
        )}
      </div>

      {loading ? (
        <div className="overflow-hidden rounded-2xl border border-neutral-200 bg-white">
          <div className="flex min-h-[320px] items-center justify-center">
            <Loader2 className="h-10 w-10 animate-spin text-neutral-400" />
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

      {(onRetryWithSettings || onReset) && (
        <div className="flex flex-wrap gap-2 border-t border-neutral-200 pt-4">
          {onRetryWithSettings && (
            <button
              type="button"
              onClick={onRetryWithSettings}
              disabled={loading}
              className="inline-flex items-center gap-2 rounded-xl border border-neutral-200 bg-white px-4 py-2.5 text-sm font-medium text-neutral-700 transition-colors hover:border-neutral-300 disabled:opacity-50"
            >
              <RefreshCw className="h-4 w-4" />
              設定を変更してやり直す
            </button>
          )}
          {onReset && (
            <button
              type="button"
              onClick={onReset}
              disabled={loading}
              className="inline-flex items-center gap-2 rounded-xl border border-neutral-200 bg-white px-4 py-2.5 text-sm font-medium text-neutral-700 transition-colors hover:border-neutral-300 disabled:opacity-50"
            >
              <RotateCcw className="h-4 w-4" />
              リセットして別の画像で再生成する
            </button>
          )}
        </div>
      )}
    </div>
  );
}
