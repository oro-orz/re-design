"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Link as LinkIcon, Loader2, Sparkles, ImagePlus, UsersRound, MessageSquare, ExternalLink, LayoutList } from "lucide-react";
import { createV3Project, analyzeUrlForV3 } from "@/actions/swipe-lp-v3";
import { StepProgressBar } from "./v3/[id]/components/StepProgressBar";
import { StepSectionHeader } from "./v3/[id]/components/StepSectionHeader";

export default function SwipeLPNewPage() {
  const router = useRouter();
  const [url, setUrl] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    const { project, error: createError } = await createV3Project(url.trim());

    if (createError || !project) {
      setError(createError ?? "プロジェクト作成に失敗しました");
      setLoading(false);
      return;
    }

    const { error: analyzeError } = await analyzeUrlForV3(project.id);

    if (analyzeError) {
      setError(analyzeError);
      setLoading(false);
      return;
    }

    router.push(`/swipe-lp/${project.short_id ?? project.id}`);
  };

  return (
    <div className="min-h-screen bg-neutral-50">
      <header className="sticky top-0 z-10 shrink-0 flex items-center justify-between min-h-[52px] px-4 py-2 bg-white border-b border-neutral-200">
        <div className="flex items-center gap-2 min-w-0">
          <div className="min-w-0">
            <h1 className="text-sm font-bold text-neutral-900 leading-tight">Re:Design</h1>
            <p className="text-[10px] text-neutral-500 leading-tight">スライド構成をステップで作成</p>
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
          <Link
            href="/character-tools"
            className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-md bg-white border border-neutral-200 text-xs font-medium text-neutral-700 hover:bg-neutral-50 hover:border-neutral-300 transition-colors"
          >
            <UsersRound className="w-3 h-3 shrink-0" />
            キャラ生成
          </Link>
          <span className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-md bg-neutral-100 border border-neutral-200 text-xs font-medium text-neutral-600">
            <LayoutList className="w-3 h-3 shrink-0" />
            スライド生成
          </span>
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

      <main className="grid min-h-[calc(100vh-53px)] grid-cols-1 lg:grid-cols-2">
        {/* 左: パンくず + URL入力 */}
        <aside className="flex flex-col min-h-0 border-r border-neutral-200 bg-white">
          <div className="shrink-0 px-6 pt-4 pb-2 border-b border-neutral-100">
            <StepProgressBar status="url_input" />
          </div>
          <div className="p-6 overflow-y-auto flex-1 space-y-4">
            <StepSectionHeader
              step={1}
              title="URLを入力"
              subtitle="分析したいLPや競合サイトのURLを入力してください"
            />

            <form onSubmit={handleSubmit} className="space-y-4">
              <input
                type="url"
                inputMode="url"
                autoComplete="url"
                value={url}
                onChange={(e) => setUrl(e.target.value)}
                placeholder="https://example.com"
                className="w-full border border-neutral-200 rounded-xl px-4 py-3 text-base focus:outline-none focus:ring-2 focus:ring-neutral-400 focus:border-transparent"
                required
              />

              {error && (
                <div className="bg-red-50 border border-red-200 rounded-lg p-4">
                  <p className="text-sm text-red-800">{error}</p>
                </div>
              )}

              <button
                type="submit"
                disabled={loading}
                className="w-full bg-neutral-900 text-white rounded-xl py-4 text-base font-medium hover:bg-neutral-800 disabled:opacity-50 flex items-center justify-center gap-2"
              >
                {loading ? (
                  <>
                    <Loader2 className="w-5 h-5 animate-spin" />
                    AI分析中...
                  </>
                ) : (
                  <>
                    <LinkIcon className="w-5 h-5" />
                    分析を開始
                  </>
                )}
              </button>
            </form>
          </div>
        </aside>

        {/* 右: Step2 分析結果（分析後に /swipe-lp/[id] で表示） */}
        <section className="overflow-y-auto bg-neutral-50 flex items-center justify-center">
          <p className="text-sm text-neutral-400">分析を開始すると結果がここに表示されます</p>
        </section>
      </main>
    </div>
  );
}
