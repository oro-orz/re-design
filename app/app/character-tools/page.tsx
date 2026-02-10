"use client";

import { useState, useEffect, useRef } from "react";
import Link from "next/link";
import {
  UsersRound,
  Sparkles,
  ImagePlus,
  MessageSquare,
  ExternalLink,
  Upload,
  Library,
  Loader2,
  Download,
  LayoutList,
} from "lucide-react";
import { listPromptTemplates } from "@/actions/library";
import type { CharacterToolsMode } from "@/actions/character-tools";
import type { PromptTemplate } from "@/types/swipe-lp-v3";

type ImageSource = "upload" | "library";

function CharacterToolsContent() {
  const [mode, setMode] = useState<CharacterToolsMode>("face-swap");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [resultUrl, setResultUrl] = useState<string | null>(null);
  const [resultUrls, setResultUrls] = useState<string[] | null>(null);
  const [downloadingZip, setDownloadingZip] = useState(false);
  const formRef = useRef<HTMLFormElement>(null);
  const targetFileRef = useRef<HTMLInputElement>(null);
  const swapFileRef = useRef<HTMLInputElement>(null);
  const characterFileRef = useRef<HTMLInputElement>(null);

  // フェイススワップ用
  const [targetSource, setTargetSource] = useState<ImageSource>("upload");
  const [targetFile, setTargetFile] = useState<File | null>(null);
  const [targetPreview, setTargetPreview] = useState<string | null>(null);
  const [targetLibraryUrl, setTargetLibraryUrl] = useState<string | null>(null);
  const [swapSource, setSwapSource] = useState<ImageSource>("upload");
  const [swapFile, setSwapFile] = useState<File | null>(null);
  const [swapPreview, setSwapPreview] = useState<string | null>(null);
  const [swapLibraryUrl, setSwapLibraryUrl] = useState<string | null>(null);

  // キャラ別シーン・マルチポーズ用
  const [characterSource, setCharacterSource] = useState<ImageSource>("upload");
  const [characterFile, setCharacterFile] = useState<File | null>(null);
  const [characterPreview, setCharacterPreview] = useState<string | null>(null);
  const [characterLibraryUrl, setCharacterLibraryUrl] = useState<string | null>(null);
  const [prompt, setPrompt] = useState("");

  const [templates, setTemplates] = useState<PromptTemplate[]>([]);
  const [templatesLoading, setTemplatesLoading] = useState(false);

  const hasTarget = !!targetFile || !!targetLibraryUrl;
  const hasSwap = !!swapFile || !!swapLibraryUrl;
  const hasCharacter = !!characterFile || !!characterLibraryUrl;
  const canRunFaceSwap = hasTarget && hasSwap;
  const canRunCharacterScene = hasCharacter && prompt.trim().length > 0;
  const canRunMultiPose = hasCharacter;

  useEffect(() => {
    if (mode === "face-swap") {
      if (targetSource === "library" || swapSource === "library") loadTemplates();
    } else {
      if (characterSource === "library") loadTemplates();
    }
  }, [mode, targetSource, swapSource, characterSource]);

  function loadTemplates() {
    if (templates.length > 0) return;
    setTemplatesLoading(true);
    listPromptTemplates()
      .then(({ templates: t, error: e }) => {
        if (e) setError(e);
        else setTemplates(t ?? []);
      })
      .finally(() => setTemplatesLoading(false));
  }

  const handleTargetFile = (e: React.ChangeEvent<HTMLInputElement>) => {
    const f = e.target.files?.[0];
    if (f) {
      setTargetFile(f);
      setTargetLibraryUrl(null);
      const r = new FileReader();
      r.onload = () => setTargetPreview(r.result as string);
      r.readAsDataURL(f);
      setResultUrl(null);
      setResultUrls(null);
      setError(null);
    }
  };
  const handleSwapFile = (e: React.ChangeEvent<HTMLInputElement>) => {
    const f = e.target.files?.[0];
    if (f) {
      setSwapFile(f);
      setSwapLibraryUrl(null);
      const r = new FileReader();
      r.onload = () => setSwapPreview(r.result as string);
      r.readAsDataURL(f);
      setResultUrl(null);
      setResultUrls(null);
      setError(null);
    }
  };
  const handleCharacterFile = (e: React.ChangeEvent<HTMLInputElement>) => {
    const f = e.target.files?.[0];
    if (f) {
      setCharacterFile(f);
      setCharacterLibraryUrl(null);
      const r = new FileReader();
      r.onload = () => setCharacterPreview(r.result as string);
      r.readAsDataURL(f);
      setResultUrl(null);
      setResultUrls(null);
      setError(null);
    }
  };

  const selectTemplateForTarget = (t: PromptTemplate) => {
    const url = t.sample_image_url || t.image_urls?.[0];
    if (!url) return;
    setTargetLibraryUrl(url);
    setTargetPreview(url);
    setTargetFile(null);
    if (targetFileRef.current) targetFileRef.current.value = "";
    setResultUrl(null);
    setResultUrls(null);
    setError(null);
  };
  const selectTemplateForSwap = (t: PromptTemplate) => {
    const url = t.sample_image_url || t.image_urls?.[0];
    if (!url) return;
    setSwapLibraryUrl(url);
    setSwapPreview(url);
    setSwapFile(null);
    if (swapFileRef.current) swapFileRef.current.value = "";
    setResultUrl(null);
    setResultUrls(null);
    setError(null);
  };
  const selectTemplateForCharacter = (t: PromptTemplate) => {
    const url = t.sample_image_url || t.image_urls?.[0];
    if (!url) return;
    setCharacterLibraryUrl(url);
    setCharacterPreview(url);
    setCharacterFile(null);
    if (characterFileRef.current) characterFileRef.current.value = "";
    setResultUrl(null);
    setResultUrls(null);
    setError(null);
  };

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!formRef.current) return;
    setError(null);
    setLoading(true);
    const formData = new FormData(formRef.current);
    const isFaceSwap = (formData.get("mode") as string) === "face-swap";
    const controller = new AbortController();
    // マルチポーズは枚数分のレート制限待機があるため長め（最大約12分）
    const timeoutMs = (formData.get("mode") as string) === "multi-pose" ? 720000 : 120000;
    const timeoutId = setTimeout(() => controller.abort(), timeoutMs);
    try {
      const res = await fetch("/api/character-tools", {
        method: "POST",
        body: formData,
        signal: controller.signal,
      });
      clearTimeout(timeoutId);
      let data: { error?: string; outputImageUrl?: string; outputImageUrls?: string[] } = {};
      try {
        const text = await res.text();
        if (text) data = JSON.parse(text);
      } catch {
        setLoading(false);
        setError(res.ok ? "レスポンスの形式が不正です。" : "リクエストに失敗しました。");
        return;
      }
      if (!res.ok) {
        throw new Error(data.error || "リクエストに失敗しました");
      }
      if (data.error) throw new Error(data.error);
      if (data.outputImageUrls && Array.isArray(data.outputImageUrls)) {
        setResultUrls(data.outputImageUrls);
        setResultUrl(null);
      } else if (data.outputImageUrl) {
        setResultUrl(data.outputImageUrl);
        setResultUrls(null);
      } else {
        setError("生成結果を取得できませんでした。");
      }
    } catch (err) {
      clearTimeout(timeoutId);
      if (err instanceof Error && err.name === "AbortError") {
        setError("タイムアウトしました（約2分）。しばらくしてからもう一度お試しください。");
      } else {
        setError(err instanceof Error ? err.message : "エラーが発生しました");
      }
    } finally {
      setLoading(false);
    }
  };

  const handleDownload = async () => {
    if (!resultUrl) return;
    try {
      const res = await fetch(`/api/character-tools/download?url=${encodeURIComponent(resultUrl)}`);
      if (!res.ok) throw new Error("ダウンロードに失敗しました");
      const blob = await res.blob();
      const url = URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.download = `character-tool-${Date.now()}.png`;
      link.click();
      URL.revokeObjectURL(url);
    } catch (err) {
      setError(err instanceof Error ? err.message : "ダウンロードに失敗しました");
    }
  };

  const handleDownloadAll = async () => {
    if (!resultUrls?.length) return;
    setError(null);
    setDownloadingZip(true);
    try {
      const res = await fetch("/api/character-tools/download-zip", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ urls: resultUrls }),
      });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.error || "ZIPの作成に失敗しました");
      }
      const blob = await res.blob();
      const url = URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.download = `character-multipose-${Date.now()}.zip`;
      link.click();
      URL.revokeObjectURL(url);
    } catch (err) {
      setError(err instanceof Error ? err.message : "ダウンロードに失敗しました");
    } finally {
      setDownloadingZip(false);
    }
  };

  const handleReset = () => {
    setResultUrl(null);
    setResultUrls(null);
    setError(null);
  };

  const templateGrid = (
    pick: (t: PromptTemplate) => void,
    selectedUrl: string | null
  ) => (
    <div className="flex-1 min-h-0 overflow-y-auto">
      {templatesLoading ? (
        <div className="flex items-center justify-center py-20">
          <Loader2 className="h-10 w-10 animate-spin text-neutral-400" />
        </div>
      ) : templates.length === 0 ? (
        <p className="rounded-xl border border-neutral-200 bg-neutral-50 px-4 py-8 text-center text-sm text-neutral-500">
          ライブラリにテンプレートがありません。
        </p>
      ) : (
        <div
          className="columns-2 sm:columns-3 md:columns-4 gap-3"
          style={{ columnFill: "balance" } as React.CSSProperties}
        >
          {templates.map((t) => {
            const src = t.sample_image_url || t.image_urls?.[0];
            if (!src) return null;
            const isSelected = selectedUrl === src;
            return (
              <button
                key={t.id}
                type="button"
                onClick={() => pick(t)}
                className={`break-inside-avoid mb-3 rounded-xl overflow-hidden border-2 transition-colors w-full bg-neutral-100 ${
                  isSelected ? "border-neutral-900 ring-2 ring-neutral-900 ring-offset-2" : "border-neutral-200 hover:border-neutral-300"
                }`}
              >
                <img src={src} alt="" className="w-full h-auto block" />
              </button>
            );
          })}
        </div>
      )}
    </div>
  );

  return (
    <div className="min-h-screen bg-neutral-50">
      <header className="sticky top-0 z-10 shrink-0 flex items-center justify-between min-h-[52px] px-4 py-2 bg-white border-b border-neutral-200">
        <div className="flex items-center gap-2 min-w-0">
          <div className="min-w-0">
            <h1 className="text-sm font-bold text-neutral-900 leading-tight">Re:Design</h1>
            <p className="text-[10px] text-neutral-500 leading-tight">キャラ生成（フェイススワップ / 別シーン / マルチポーズ）</p>
          </div>
        </div>
        <div className="flex items-center gap-1.5 shrink-0">
          <Link
            href="/"
            className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-md bg-white border border-neutral-200 text-xs font-medium text-neutral-700 hover:bg-neutral-50 hover:border-neutral-300 transition-colors"
          >
            <Sparkles className="w-3 h-3 shrink-0" />
            プロンプト生成
          </Link>
          <Link
            href="/overlay-mode/new"
            className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-md bg-white border border-neutral-200 text-xs font-medium text-neutral-700 hover:bg-neutral-50 hover:border-neutral-300 transition-colors"
          >
            <ImagePlus className="w-3 h-3 shrink-0" />
            ベース生成
          </Link>
          <span className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-md bg-neutral-100 border border-neutral-200 text-xs font-medium text-neutral-600">
            <UsersRound className="w-3 h-3 shrink-0" />
            キャラ生成
          </span>
          <Link
            href="/swipe-lp/"
            className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-md bg-white border border-neutral-200 text-xs font-medium text-neutral-700 hover:bg-neutral-50 hover:border-neutral-300 transition-colors"
          >
            <LayoutList className="w-3 h-3 shrink-0" />
            スライド生成
          </Link>
          <Link
            href="/feedback"
            className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-md bg-white border border-neutral-200 text-xs font-medium text-neutral-700 hover:bg-neutral-50 hover:border-neutral-300 transition-colors"
          >
            <MessageSquare className="w-3 h-3 shrink-0" />
            フィードバック
          </Link>
          <a
            href="https://gemini.google.com/app"
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-md bg-white border border-neutral-200 text-xs font-medium text-neutral-700 hover:bg-neutral-50 hover:border-neutral-300 transition-colors"
          >
            NanoBanana
            <ExternalLink className="w-3 h-3 shrink-0" />
          </a>
          <a
            href="https://chatgpt.com/"
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-md bg-white border border-neutral-200 text-xs font-medium text-neutral-700 hover:bg-neutral-50 hover:border-neutral-300 transition-colors"
          >
            DALL·E 3
            <ExternalLink className="w-3 h-3 shrink-0" />
          </a>
        </div>
      </header>

      <form ref={formRef} onSubmit={handleSubmit} className="grid min-h-[calc(100vh-53px)] grid-cols-1 lg:grid-cols-2">
        <input type="hidden" name="mode" value={mode} />
        <input type="hidden" name="targetImageUrl" value={targetLibraryUrl || ""} />
        <input type="hidden" name="swapImageUrl" value={swapLibraryUrl || ""} />
        <input type="hidden" name="characterImageUrl" value={characterLibraryUrl || ""} />
        {mode === "multi-pose" && <input type="hidden" name="count" value="4" />}
        {/* 左: モード切替 + 画像選択 */}
        <aside className="flex flex-col min-h-0 border-r border-neutral-200 bg-white">
          <div className="shrink-0 p-4 border-b border-neutral-200">
            <div className="flex gap-2">
              {(
                [
                  { id: "face-swap" as const, label: "フェイススワップ" },
                  { id: "character-scene" as const, label: "キャラ別シーン" },
                  { id: "multi-pose" as const, label: "マルチポーズ" },
                ] as const
              ).map(({ id, label }) => (
                <button
                  key={id}
                  type="button"
                  onClick={() => setMode(id)}
                  className={`flex-1 rounded-xl border px-3 py-2.5 text-sm font-medium transition-colors ${
                    mode === id
                      ? "border-neutral-900 bg-neutral-900 text-white"
                      : "border-neutral-200 bg-white text-neutral-700 hover:border-neutral-300"
                  }`}
                >
                  {label}
                </button>
              ))}
            </div>
          </div>

          <div className="flex-1 min-h-0 overflow-y-auto p-4 space-y-6">
            {mode === "face-swap" && (
              <>
                <div className="space-y-3">
                  <h3 className="text-sm font-semibold text-neutral-800">土台画像（顔を差し替えたい画像）</h3>
                  <div className="flex gap-2">
                    <button
                      type="button"
                      onClick={() => {
                        setTargetSource("upload");
                        setTimeout(() => targetFileRef.current?.click(), 50);
                      }}
                      className={`flex-1 inline-flex items-center justify-center gap-1.5 rounded-xl border px-3 py-2 text-sm font-medium ${
                        targetSource === "upload" ? "border-neutral-900 bg-neutral-900 text-white" : "border-neutral-200"
                      }`}
                    >
                      <Upload className="w-4 h-4" /> アップロード
                    </button>
                    <button
                      type="button"
                      onClick={() => { setTargetSource("library"); loadTemplates(); }}
                      className={`flex-1 inline-flex items-center justify-center gap-1.5 rounded-xl border px-3 py-2 text-sm font-medium ${
                        targetSource === "library" ? "border-neutral-900 bg-neutral-900 text-white" : "border-neutral-200"
                      }`}
                    >
                      <Library className="w-4 h-4" /> ライブラリ
                    </button>
                  </div>
                  {targetSource === "upload" && (
                    <label className="flex flex-col items-center justify-center min-h-[160px] border-2 border-dashed border-neutral-300 rounded-xl cursor-pointer hover:border-neutral-400 transition-colors p-4">
                      <input ref={targetFileRef} type="file" accept="image/*" name="targetImage" onChange={handleTargetFile} className="hidden" />
                      {targetPreview ? (
                        <img src={targetPreview} alt="土台" className="max-h-[160px] rounded-lg object-contain" />
                      ) : (
                        <div className="text-center space-y-2">
                          <Upload className="h-10 w-10 text-neutral-400 mx-auto" />
                          <p className="text-sm text-neutral-600">クリックして選択</p>
                        </div>
                      )}
                    </label>
                  )}
                  {targetSource === "library" && (
                    <div className="flex flex-col min-h-[200px]">
                      {targetPreview && (
                        <img src={targetPreview} alt="土台" className="w-full rounded-lg max-h-[140px] object-contain bg-neutral-100 mb-3" />
                      )}
                      {templateGrid(selectTemplateForTarget, targetLibraryUrl)}
                    </div>
                  )}
                </div>

                <div className="space-y-3">
                  <h3 className="text-sm font-semibold text-neutral-800">顔画像（差し込む顔）</h3>
                  <div className="flex gap-2">
                    <button
                      type="button"
                      onClick={() => {
                        setSwapSource("upload");
                        setTimeout(() => swapFileRef.current?.click(), 50);
                      }}
                      className={`flex-1 inline-flex items-center justify-center gap-1.5 rounded-xl border px-3 py-2 text-sm font-medium ${
                        swapSource === "upload" ? "border-neutral-900 bg-neutral-900 text-white" : "border-neutral-200"
                      }`}
                    >
                      <Upload className="w-4 h-4" /> アップロード
                    </button>
                    <button
                      type="button"
                      onClick={() => { setSwapSource("library"); loadTemplates(); }}
                      className={`flex-1 inline-flex items-center justify-center gap-1.5 rounded-xl border px-3 py-2 text-sm font-medium ${
                        swapSource === "library" ? "border-neutral-900 bg-neutral-900 text-white" : "border-neutral-200"
                      }`}
                    >
                      <Library className="w-4 h-4" /> ライブラリ
                    </button>
                  </div>
                  {swapSource === "upload" && (
                    <label className="flex flex-col items-center justify-center min-h-[160px] border-2 border-dashed border-neutral-300 rounded-xl cursor-pointer hover:border-neutral-400 transition-colors p-4">
                      <input ref={swapFileRef} type="file" accept="image/*" name="swapImage" onChange={handleSwapFile} className="hidden" />
                      {swapPreview ? (
                        <img src={swapPreview} alt="顔" className="max-h-[160px] rounded-lg object-contain" />
                      ) : (
                        <div className="text-center space-y-2">
                          <Upload className="h-10 w-10 text-neutral-400 mx-auto" />
                          <p className="text-sm text-neutral-600">クリックして選択</p>
                        </div>
                      )}
                    </label>
                  )}
                  {swapSource === "library" && (
                    <div className="flex flex-col min-h-[200px]">
                      {swapPreview && (
                        <img src={swapPreview} alt="顔" className="w-full rounded-lg max-h-[140px] object-contain bg-neutral-100 mb-3" />
                      )}
                      {templateGrid(selectTemplateForSwap, swapLibraryUrl)}
                    </div>
                  )}
                </div>
              </>
            )}

            {(mode === "character-scene" || mode === "multi-pose") && (
              <div className="space-y-3">
                <h3 className="text-sm font-semibold text-neutral-800">キャラ参照画像</h3>
                <div className="flex gap-2">
                  <button
                    type="button"
                    onClick={() => {
                      setCharacterSource("upload");
                      setTimeout(() => characterFileRef.current?.click(), 50);
                    }}
                    className={`flex-1 inline-flex items-center justify-center gap-1.5 rounded-xl border px-3 py-2 text-sm font-medium ${
                      characterSource === "upload" ? "border-neutral-900 bg-neutral-900 text-white" : "border-neutral-200"
                    }`}
                  >
                    <Upload className="w-4 h-4" /> アップロード
                  </button>
                  <button
                    type="button"
                    onClick={() => { setCharacterSource("library"); loadTemplates(); }}
                    className={`flex-1 inline-flex items-center justify-center gap-1.5 rounded-xl border px-3 py-2 text-sm font-medium ${
                      characterSource === "library" ? "border-neutral-900 bg-neutral-900 text-white" : "border-neutral-200"
                    }`}
                  >
                    <Library className="w-4 h-4" /> ライブラリ
                  </button>
                </div>
                {characterSource === "upload" && (
                  <label className="flex flex-col items-center justify-center min-h-[200px] border-2 border-dashed border-neutral-300 rounded-xl cursor-pointer hover:border-neutral-400 transition-colors p-4">
                    <input ref={characterFileRef} type="file" accept="image/*" name="characterImage" onChange={handleCharacterFile} className="hidden" />
                    {characterPreview ? (
                      <img src={characterPreview} alt="キャラ" className="max-h-[180px] rounded-lg object-contain" />
                    ) : (
                      <div className="text-center space-y-2">
                        <Upload className="h-10 w-10 text-neutral-400 mx-auto" />
                        <p className="text-sm text-neutral-600">クリックしてキャラ画像を選択</p>
                        <p className="text-xs text-neutral-500">PNG / JPG / WEBP</p>
                      </div>
                    )}
                  </label>
                )}
                {characterSource === "library" && (
                  <div className="flex flex-col min-h-[200px]">
                    {characterPreview && (
                      <img src={characterPreview} alt="キャラ" className="w-full rounded-lg max-h-[140px] object-contain bg-neutral-100 mb-3" />
                    )}
                    {templateGrid(selectTemplateForCharacter, characterLibraryUrl)}
                  </div>
                )}
              </div>
            )}

            {mode === "multi-pose" && (
              <div className="pt-2">
                <button
                  type="submit"
                  disabled={!canRunMultiPose || loading}
                  className={`w-full inline-flex items-center justify-center gap-2 rounded-lg px-4 py-2.5 text-sm font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed ${
                    canRunMultiPose && !loading
                      ? "bg-neutral-900 text-white hover:bg-neutral-800"
                      : "bg-neutral-200 text-neutral-500"
                  }`}
                >
                  {loading ? "生成中…（最大2分かかることがあります）" : "マルチポーズを生成"}
                </button>
              </div>
            )}
          </div>
        </aside>

        {/* 右: オプション・実行・結果 */}
        <section className="overflow-y-auto bg-neutral-50">
          <div className="mx-auto max-w-md p-6 space-y-6">
            {mode === "character-scene" && (
              <div className="rounded-xl border border-neutral-200 bg-white p-4">
                <label className="block text-sm font-semibold text-neutral-800 mb-1">シーンの説明</label>
                <p className="text-xs text-neutral-500 mb-2">
                  入力の参考：どこにいるか・何をしているか・どんなポーズ・構図か・画風・トーン
                </p>
                <textarea
                  name="prompt"
                  value={prompt}
                  onChange={(e) => { setPrompt(e.target.value); setError(null); }}
                  placeholder="例：模試の結果が悪く、机でため息をつきながら落ち込んでいる様子。室内は暗めで、窓から少しだけ光が差し込んでいる。どんよりした雰囲気。"
                  rows={4}
                  className="w-full rounded-lg border border-neutral-200 px-3 py-2 text-sm placeholder:text-neutral-400 focus:outline-none focus:ring-2 focus:ring-neutral-400"
                />
              </div>
            )}

            {mode === "face-swap" && canRunFaceSwap && (
              <button
                type="submit"
                disabled={loading}
                className="w-full inline-flex items-center justify-center gap-2 rounded-lg bg-neutral-900 px-4 py-2.5 text-sm font-medium text-white hover:bg-neutral-800 disabled:opacity-50"
              >
                {loading ? "生成中…（1〜2分かかることがあります）" : "フェイススワップ実行"}
              </button>
            )}
            {mode === "character-scene" && (
              <button
                type="submit"
                disabled={!canRunCharacterScene || loading}
                className="w-full inline-flex items-center justify-center gap-2 rounded-lg bg-neutral-900 px-4 py-2.5 text-sm font-medium text-white hover:bg-neutral-800 disabled:opacity-50"
              >
                {loading ? "生成中…（最大2分かかることがあります）" : "別シーンを生成"}
              </button>
            )}
            {error && (
              <p className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
                {error}
              </p>
            )}
            {resultUrl && (
              <div className="rounded-xl border border-neutral-200 bg-white p-4 space-y-4">
                <h3 className="text-sm font-semibold text-neutral-700">結果</h3>
                <img src={resultUrl} alt="結果" className="w-full rounded-lg max-h-[400px] object-contain bg-neutral-100" />
                <div className="flex flex-wrap gap-2">
                  <button
                    type="button"
                    onClick={handleDownload}
                    className="inline-flex items-center gap-1.5 rounded-lg bg-neutral-900 px-3 py-2 text-sm font-medium text-white hover:bg-neutral-800"
                  >
                    <Download className="h-3.5 w-3.5" />
                    ダウンロード
                  </button>
                  <button
                    type="button"
                    onClick={handleReset}
                    className="inline-flex items-center gap-1.5 rounded-lg border border-neutral-200 bg-white px-3 py-2 text-sm font-medium text-neutral-700 hover:border-neutral-300"
                  >
                    別の画像で生成
                  </button>
                </div>
              </div>
            )}

            {resultUrls && resultUrls.length > 0 && (
              <div className="rounded-xl border border-neutral-200 bg-white p-4 space-y-4">
                <h3 className="text-sm font-semibold text-neutral-700">結果（{resultUrls.length}枚）</h3>
                <div
                  className="grid gap-3 rounded-lg bg-neutral-100 p-3"
                  style={{ gridTemplateColumns: "repeat(auto-fill, minmax(140px, 1fr))" }}
                >
                  {resultUrls.map((url, i) => (
                    <div key={i} className="flex min-h-[140px] items-center justify-center rounded-lg bg-white">
                      <img
                        src={url}
                        alt={`ポーズ ${i + 1}`}
                        className="max-h-[280px] w-full rounded-lg object-contain"
                      />
                    </div>
                  ))}
                </div>
                <div className="flex flex-wrap gap-2">
                  <button
                    type="button"
                    onClick={handleDownloadAll}
                    disabled={downloadingZip}
                    className="inline-flex items-center gap-1.5 rounded-lg bg-neutral-900 px-3 py-2 text-sm font-medium text-white hover:bg-neutral-800 disabled:opacity-50"
                  >
                    {downloadingZip ? "ZIP作成中..." : (
                      <>
                        <Download className="h-3.5 w-3.5" />
                        すべてダウンロード（ZIP）
                      </>
                    )}
                  </button>
                  <button
                    type="button"
                    onClick={handleReset}
                    className="inline-flex items-center gap-1.5 rounded-lg border border-neutral-200 bg-white px-3 py-2 text-sm font-medium text-neutral-700 hover:border-neutral-300"
                  >
                    別の画像で生成
                  </button>
                </div>
              </div>
            )}
          </div>
        </section>
      </form>
    </div>
  );
}

export default function CharacterToolsPage() {
  return <CharacterToolsContent />;
}
