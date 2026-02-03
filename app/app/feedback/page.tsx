"use client";

import { useCallback, useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Sparkles, Loader2, RefreshCw, RotateCcw, Library, ExternalLink } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { UploadZone } from "../components/UploadZone";
import { ResultView } from "../components/ResultView";
import { uploadProject } from "@/actions/upload";
import { analyze } from "@/actions/analyze";

const REDIRECT_STABILIZE_MS = 300;

export default function FeedbackPage() {
  const router = useRouter();
  const {
    user,
    loading: authLoading,
    error: authError,
    hadTokenThisSession,
    logout: authLogout,
  } = useAuth();

  const [file, setFile] = useState<File | null>(null);
  const [preview, setPreview] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [projectId, setProjectId] = useState<string | null>(null);
  const [originalUrl, setOriginalUrl] = useState<string | null>(null);
  const [feedback, setFeedback] = useState("");

  const handleSelectFile = useCallback((f: File) => {
    setFile(f);
    const u = URL.createObjectURL(f);
    setPreview(u);
    setProjectId(null);
    setOriginalUrl(null);
    setFeedback("");
  }, []);

  const handleGenerate = useCallback(async () => {
    if (!file) {
      setError("画像を選択してください。");
      return;
    }
    setError(null);
    setLoading(true);

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

      const analyzeRes = await analyze({
        imageUrl: originalImageUrl,
        mode: "polish",
        aspectRatio: "9:16",
      });
      if ("error" in analyzeRes) {
        setError(analyzeRes.error ?? "分析に失敗しました。");
        return;
      }
      setFeedback(analyzeRes.feedback);
    } finally {
      setLoading(false);
    }
  }, [file]);

  const handleRetryWithSettings = useCallback(() => {
    setError(null);
    setFeedback("");
  }, []);

  const handleReset = useCallback(() => {
    setFile(null);
    setPreview(null);
    setError(null);
    setProjectId(null);
    setOriginalUrl(null);
    setFeedback("");
  }, []);

  // 未認証時は TMG Portal へリダイレクト（SSO）
  useEffect(() => {
    if (authLoading || user || authError) return;
    if (hadTokenThisSession && !user) return;
    if (typeof window === "undefined") return;

    const params = new URLSearchParams(window.location.search);
    if (params.has("token")) return;

    const redirectToPortal = () => {
      const url = new URL(window.location.href);
      url.searchParams.delete("token");
      const redirectUri = encodeURIComponent(url.toString());
      const portalUrl = process.env.NEXT_PUBLIC_TMG_PORTAL_URL;
      if (portalUrl) {
        window.location.href = `${portalUrl}/login?redirect_uri=${redirectUri}`;
      } else {
        router.push("/login");
      }
    };

    const t = setTimeout(() => {
      const again = new URLSearchParams(window.location.search);
      if (again.has("token")) return;
      redirectToPortal();
    }, REDIRECT_STABILIZE_MS);
    return () => clearTimeout(t);
  }, [user, authLoading, authError, hadTokenThisSession, router]);

  // 認証ローディング中
  if (authLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-neutral-50">
        <p className="text-neutral-600">読み込み中...</p>
      </div>
    );
  }

  // 未認証（リダイレクト待ち or エラー表示）
  if (!user) {
    const portalUrl = process.env.NEXT_PUBLIC_TMG_PORTAL_URL;
    const hasTokenInUrl =
      typeof window !== "undefined" &&
      new URLSearchParams(window.location.search).has("token");
    const redirectLabel = hasTokenInUrl
      ? "認証処理中..."
      : portalUrl
        ? "ポータルへ移動中..."
        : "ログインページへ移動中...";

    return (
      <div className="flex min-h-screen flex-col items-center justify-center gap-4 bg-neutral-50 p-4">
        <p className="text-neutral-700">{redirectLabel}</p>
        {authError && (
          <p className="rounded-lg border border-red-200 bg-red-50 px-4 py-2 text-sm text-red-700">
            {authError}
          </p>
        )}
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-neutral-50">
      <header className="sticky top-0 z-10 shrink-0 flex items-center justify-between min-h-[52px] px-4 py-2 bg-white border-b border-neutral-200">
        <div className="flex items-center gap-2 min-w-0">
          <div className="min-w-0">
            <h1 className="text-sm font-bold text-neutral-900 leading-tight">フィードバック</h1>
            <p className="text-[10px] text-neutral-500 leading-tight">デザインにフィードバックします</p>
          </div>
        </div>
        <div className="flex items-center gap-1.5 shrink-0">
          <Link
            href="/"
            className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-md bg-white border border-neutral-200 text-xs font-medium text-neutral-700 hover:bg-neutral-50 hover:border-neutral-300 transition-colors"
          >
            <Library className="w-3 h-3 shrink-0" />
            ライブラリ
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

      <main className="grid min-h-[calc(100vh-53px)] grid-cols-1 lg:grid-cols-2">
        <aside className="overflow-y-auto border-r border-neutral-200 bg-white">
          <div className="mx-auto max-w-md space-y-6 p-6" data-settings-section>
            <UploadZone
            onSelect={handleSelectFile}
            preview={preview}
            disabled={loading}
          />
          {error && (
            <p className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
              {error}
            </p>
          )}
          <button
            type="button"
            onClick={handleGenerate}
            disabled={loading || !file}
            className="inline-flex w-full items-center justify-center gap-2 rounded-xl bg-neutral-900 px-4 py-3.5 font-medium text-white transition-colors hover:bg-neutral-800 disabled:opacity-50"
          >
            {loading ? (
              <>
                <Loader2 className="h-5 w-5 animate-spin" />
                分析中...
              </>
            ) : (
              <>
                <Sparkles className="h-5 w-5" />
                分析する
              </>
            )}
          </button>
          {originalUrl && (
            <div className="flex flex-col gap-2">
              <button
                type="button"
                onClick={handleRetryWithSettings}
                disabled={loading}
                className="inline-flex w-full items-center justify-center gap-2 rounded-xl border border-neutral-200 bg-white px-4 py-2.5 text-sm font-medium text-neutral-700 transition-colors hover:border-neutral-300 hover:bg-neutral-50 disabled:opacity-50"
              >
                <RefreshCw className="h-4 w-4" />
                同じ画像で再分析
              </button>
              <button
                type="button"
                onClick={handleReset}
                disabled={loading}
                className="inline-flex w-full items-center justify-center gap-2 rounded-xl border border-neutral-200 bg-white px-4 py-2.5 text-sm font-medium text-neutral-700 transition-colors hover:border-neutral-300 hover:bg-neutral-50 disabled:opacity-50"
              >
                <RotateCcw className="h-4 w-4" />
                別の画像で分析する
              </button>
            </div>
          )}
          </div>
        </aside>

        <section className="overflow-y-auto bg-neutral-50">
          <div className="mx-auto max-w-lg p-6 space-y-6">
            <div className="w-full rounded-xl border border-neutral-200 bg-white px-4 py-3">
              <p className="text-xs leading-relaxed text-neutral-600">
                画像をアップロードして「分析する」を押すと、整列・近接・コントラスト・可読性など、デザインの原則に沿ったフィードバックが表示されます。
              </p>
              <p className="mt-2 text-xs leading-relaxed text-neutral-600">
                フィードバックをコピーして、そのままデザイン改善に活かせます。
              </p>
            </div>
            {originalUrl && (
              <ResultView
                originalUrl={originalUrl}
                generatedUrl={null}
                feedback={feedback}
                loading={loading}
              />
            )}
          </div>
        </section>
      </main>
    </div>
  );
}
