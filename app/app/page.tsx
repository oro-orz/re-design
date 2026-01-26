"use client";

import { useCallback, useState } from "react";
import { Sparkles, LogOut } from "lucide-react";
import { hasSupabase } from "@/lib/supabase/env";
import { logout } from "@/actions/logout";
import { UploadZone } from "./components/UploadZone";
import { ModeSelect } from "./components/ModeSelect";
import { ResultView } from "./components/ResultView";
import { AspectRatioIcon } from "./components/AspectRatioIcon";
import { uploadProject } from "@/actions/upload";
import { analyze } from "@/actions/analyze";
import { generateImage } from "@/actions/generate";
import {
  MODES,
  ASPECT_RATIOS,
  COMPOSITION_SLIDER_MIN,
  COMPOSITION_SLIDER_MAX,
  COMPOSITION_SLIDER_DEFAULT,
  type ModeId,
  type AspectRatioId,
} from "@/lib/constants";

export default function HomePage() {
  const [file, setFile] = useState<File | null>(null);
  const [preview, setPreview] = useState<string | null>(null);
  const [mode, setMode] = useState<ModeId | null>(null);
  const [aspectRatio, setAspectRatio] = useState<AspectRatioId | null>(null);
  const [customAspectRatio, setCustomAspectRatio] = useState("");
  const [compositionLevel, setCompositionLevel] = useState(COMPOSITION_SLIDER_DEFAULT);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [projectId, setProjectId] = useState<string | null>(null);
  const [originalUrl, setOriginalUrl] = useState<string | null>(null);
  const [feedback, setFeedback] = useState("");
  const [fluxPrompt, setFluxPrompt] = useState("");
  const [generatedUrl, setGeneratedUrl] = useState<string | null>(null);
  const [generateLoading, setGenerateLoading] = useState(false);

  const handleSelectFile = useCallback((f: File) => {
    setFile(f);
    const u = URL.createObjectURL(f);
    setPreview(u);
    setProjectId(null);
    setOriginalUrl(null);
    setFeedback("");
    setFluxPrompt("");
    setGeneratedUrl(null);
  }, []);

  const handleGenerate = useCallback(async () => {
    if (!file || !mode || !aspectRatio) {
      setError("画像・モード・アスペクト比を選択してください。");
      return;
    }
    setError(null);
    setLoading(true);
    setGenerateLoading(true);

    try {
      const fd = new FormData();
      fd.set("file", file);

      const uploadRes = await uploadProject(fd);
      if ("error" in uploadRes) {
        setError(uploadRes.error ?? "アップロードに失敗しました。");
        return;
      }
      const { projectId: pid, originalImageUrl } = uploadRes;
      setProjectId(pid);
      setOriginalUrl(originalImageUrl);

      // 選択されたアスペクト比を使用
      const selectedAspectRatio = aspectRatio === "custom" ? customAspectRatio.trim() : aspectRatio;
      if (!selectedAspectRatio) {
        setError("アスペクト比を入力してください。");
        return;
      }

      const analyzeRes = await analyze({
        imageUrl: originalImageUrl,
        mode,
        aspectRatio: selectedAspectRatio,
      });
      if ("error" in analyzeRes) {
        setError(analyzeRes.error ?? "分析に失敗しました。");
        return;
      }
      setFeedback(analyzeRes.feedback);
      setFluxPrompt(analyzeRes.flux_prompt);

      const intensity =
        compositionLevel === 0 ? 1 : compositionLevel === 50 ? 2 : 3;
      const genRes = await generateImage({
        projectId: pid,
        imageUrl: originalImageUrl,
        fluxPrompt: analyzeRes.flux_prompt,
        mode,
        feedbackText: analyzeRes.feedback,
        intensity,
      });
      if ("error" in genRes) {
        setError(genRes.error ?? "画像生成に失敗しました。");
        return;
      }
      setGeneratedUrl(genRes.generatedImageUrl);
    } finally {
      setLoading(false);
      setGenerateLoading(false);
    }
  }, [file, mode, aspectRatio, customAspectRatio, compositionLevel]);

  const modeLabel = mode ? MODES.find((m) => m.id === mode)?.label ?? mode : "";

  const handleRetryWithSettings = useCallback(() => {
    setError(null);
    setFeedback("");
    setFluxPrompt("");
    setGeneratedUrl(null);
    setGenerateLoading(false);
  }, []);

  const handleReset = useCallback(() => {
    setFile(null);
    setPreview(null);
    setMode(null);
    setAspectRatio(null);
    setCustomAspectRatio("");
    setCompositionLevel(COMPOSITION_SLIDER_DEFAULT);
    setError(null);
    setProjectId(null);
    setOriginalUrl(null);
    setFeedback("");
    setFluxPrompt("");
    setGeneratedUrl(null);
    setGenerateLoading(false);
  }, []);

  return (
    <div className="min-h-screen bg-neutral-50">
      <header className="sticky top-0 z-10 flex items-center justify-between border-b border-neutral-800 bg-neutral-900 px-4 py-3">
        <h1 className="text-lg font-semibold text-white">Re:Design</h1>
        {hasSupabase() && (
          <form action={logout} className="contents">
            <button
              type="submit"
              className="flex items-center gap-1.5 rounded-lg px-3 py-2 text-sm text-neutral-300 transition-colors hover:bg-neutral-800 hover:text-white"
            >
              <LogOut className="h-4 w-4" />
              ログアウト
            </button>
          </form>
        )}
      </header>

      <main className="grid min-h-[calc(100vh-53px)] grid-cols-1 lg:grid-cols-2">
        <aside className="overflow-y-auto border-r border-neutral-200 bg-white">
          <div className="mx-auto max-w-md space-y-6 p-6" data-settings-section>
            <UploadZone
            onSelect={handleSelectFile}
            preview={preview}
            disabled={loading}
          />
          <div>
            <label className="mb-2 block text-sm font-medium text-neutral-500">
              モード
            </label>
            <ModeSelect
              value={mode}
              onChange={setMode}
              disabled={loading}
            />
            {mode && (
              <p className="mt-2 rounded-lg border border-neutral-100 bg-neutral-50 px-3 py-2 text-xs text-neutral-600">
                {MODES.find((m) => m.id === mode)?.guide}
              </p>
            )}
          </div>
          <div>
            <label className="mb-2 block text-sm font-medium text-neutral-500">
              レイアウト変更
            </label>
            <div className="overflow-hidden rounded-xl border border-neutral-200 bg-white p-5 shadow-sm">
              <div className="relative px-1">
                <div className="flex justify-between">
                  {[
                    { value: 0, label: "元のまま" },
                    { value: 50, label: "少し変更" },
                    { value: 100, label: "大胆に変更" },
                  ].map(({ value, label }) => (
                    <button
                      key={value}
                      type="button"
                      onClick={() => setCompositionLevel(value)}
                      disabled={loading}
                      className="group relative z-10 flex flex-col items-center gap-3 transition-opacity disabled:opacity-50"
                      aria-label={label}
                      aria-pressed={compositionLevel === value}
                    >
                      <span
                        className={`flex h-7 w-7 shrink-0 items-center justify-center rounded-full border-2 shadow-sm transition-all duration-200 focus:outline-none focus-visible:ring-2 focus-visible:ring-neutral-400 focus-visible:ring-offset-2 ${
                          compositionLevel === value
                            ? "border-neutral-900 bg-neutral-900 shadow-md"
                            : "border-neutral-200 bg-white group-hover:border-neutral-400 group-hover:bg-neutral-50"
                        }`}
                      />
                      <span
                        className={`text-xs font-medium transition-colors ${
                          compositionLevel === value ? "text-neutral-900" : "text-neutral-500"
                        }`}
                      >
                        {label}
                      </span>
                    </button>
                  ))}
                </div>
                <div
                  className="pointer-events-none absolute left-[14px] right-[14px] top-3.5 h-0.5 -translate-y-1/2 rounded-full bg-neutral-200"
                  aria-hidden
                />
                <div
                  className="pointer-events-none absolute left-[14px] top-3.5 h-0.5 -translate-y-1/2 rounded-full bg-neutral-900 transition-[width] duration-200 ease-out"
                  style={{
                    width:
                      compositionLevel === 0
                        ? 0
                        : compositionLevel === 50
                          ? "calc(50% - 14px)"
                          : "calc(100% - 28px)",
                  }}
                  aria-hidden
                />
                <input
                  type="range"
                  min={COMPOSITION_SLIDER_MIN}
                  max={COMPOSITION_SLIDER_MAX}
                  step={50}
                  value={compositionLevel}
                  onChange={(e) => setCompositionLevel(Number(e.target.value))}
                  disabled={loading}
                  className="absolute inset-0 h-full w-full cursor-pointer appearance-none bg-transparent opacity-0 disabled:cursor-not-allowed"
                />
              </div>
            </div>
          </div>
          <div>
            <label className="mb-2 block text-sm font-medium text-neutral-500">
              アスペクト比
            </label>
            <div className="grid grid-cols-3 gap-2 sm:grid-cols-6">
              {ASPECT_RATIOS.map((ar) => (
                <button
                  key={ar.id}
                  type="button"
                  onClick={() => !loading && setAspectRatio(ar.id)}
                  disabled={loading}
                  className={`flex flex-col items-center justify-center gap-1.5 rounded-xl border px-3 py-4 transition-colors ${
                    aspectRatio === ar.id
                      ? "border-neutral-900 bg-neutral-900 text-white"
                      : "border-neutral-200 bg-white text-neutral-700 hover:border-neutral-300 disabled:opacity-50"
                  }`}
                  title={ar.label}
                >
                  <AspectRatioIcon
                    ratio={ar.id}
                    className={aspectRatio === ar.id ? "text-white" : "text-neutral-700"}
                  />
                  {ar.id !== "custom" && (
                    <span className="text-[10px] font-medium">{ar.id}</span>
                  )}
                </button>
              ))}
            </div>
            {aspectRatio === "custom" && (
              <input
                type="text"
                value={customAspectRatio}
                onChange={(e) => setCustomAspectRatio(e.target.value)}
                placeholder="例: 3:4, 21:9"
                disabled={loading}
                className="mt-2 w-full rounded-xl border border-neutral-200 bg-white px-4 py-3 text-sm text-neutral-900 placeholder:text-neutral-400 disabled:opacity-60"
              />
            )}
          </div>
          {error && (
            <p className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
              {error}
            </p>
          )}
          <button
            type="button"
            onClick={handleGenerate}
            disabled={loading || !file || !mode || !aspectRatio}
            className="inline-flex w-full items-center justify-center gap-2 rounded-xl bg-neutral-900 px-4 py-3.5 font-medium text-white transition-colors hover:bg-neutral-800 disabled:opacity-50"
          >
            {loading ? (
              <Sparkles className="h-5 w-5 animate-pulse" />
            ) : (
              <Sparkles className="h-5 w-5" />
            )}
            生成
          </button>
          </div>
        </aside>

        <section className="overflow-y-auto bg-neutral-50">
          <div
            className={`mx-auto max-w-lg p-6 ${originalUrl ? "space-y-6" : "flex min-h-[calc(100vh-53px)] flex-col items-center justify-center gap-6"}`}
          >
            {!originalUrl && (
              <h2 className="text-center text-lg font-semibold text-neutral-800">
                デザインにフィードバックします。
              </h2>
            )}
            <div className={`rounded-xl border border-neutral-200 bg-white px-4 py-3 ${originalUrl ? "w-full" : "w-full max-w-md"}`}>
              <p className="text-xs leading-relaxed text-neutral-600">
                「元画像」「フィードバック」「プロンプト」をコピーし、NanoBanana などの画像生成AIへ入力すると、より高品質な画像を作成できます。
              </p>
              <div className="mt-3 flex flex-wrap gap-2">
                <a
                  href="https://gemini.google/jp/overview/image-generation/?hl=ja-JP"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-xs font-medium text-neutral-700 underline decoration-neutral-300 underline-offset-2 transition-colors hover:text-neutral-900 hover:decoration-neutral-500"
                >
                  NanoBanana
                </a>
                <span className="text-neutral-300">/</span>
                <a
                  href="https://openai.com/index/dall-e-3/"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-xs font-medium text-neutral-700 underline decoration-neutral-300 underline-offset-2 transition-colors hover:text-neutral-900 hover:decoration-neutral-500"
                >
                  DALL·E 3
                </a>
                <span className="text-neutral-300">/</span>
                <a
                  href="https://www.midjourney.com/"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-xs font-medium text-neutral-700 underline decoration-neutral-300 underline-offset-2 transition-colors hover:text-neutral-900 hover:decoration-neutral-500"
                >
                  Midjourney
                </a>
              </div>
            </div>
            {originalUrl && (
              <ResultView
                originalUrl={originalUrl}
                generatedUrl={generatedUrl}
                feedback={feedback}
                fluxPrompt={fluxPrompt}
                mode={modeLabel}
                loading={generateLoading}
                onRetryWithSettings={handleRetryWithSettings}
                onReset={handleReset}
              />
            )}
          </div>
        </section>
      </main>
    </div>
  );
}
