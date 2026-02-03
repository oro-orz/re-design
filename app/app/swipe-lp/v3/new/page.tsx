"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Link as LinkIcon, Loader2, ArrowLeft } from "lucide-react";
import { createV3Project, analyzeUrlForV3 } from "@/actions/swipe-lp-v3";

export default function SwipeLPv3NewPage() {
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

    router.push(`/swipe-lp/v3/${project.id}`);
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-neutral-50 to-white">
      <div className="max-w-2xl mx-auto p-6 space-y-8">
        <div className="flex items-center gap-4">
          <Link
            href="/"
            className="p-2 hover:bg-neutral-100 rounded-lg transition-colors"
          >
            <ArrowLeft className="w-5 h-5 text-neutral-600" />
          </Link>
          <header className="flex-1">
            <h1 className="text-2xl font-bold text-neutral-900">
              SwipeLP v3
            </h1>
            <p className="text-sm text-neutral-600">
              スライド構成をステップで作成
            </p>
          </header>
        </div>

        <div className="bg-white border-2 border-neutral-200 rounded-2xl p-8 shadow-sm">
          <h2 className="text-lg font-bold mb-2">Step 1: URLを入力</h2>
          <p className="text-sm text-neutral-600 mb-6">
            分析したいLPや競合サイトのURLを入力してください
          </p>

          <form onSubmit={handleSubmit} className="space-y-4">
            <input
              type="url"
              inputMode="url"
              autoComplete="url"
              value={url}
              onChange={(e) => setUrl(e.target.value)}
              placeholder="https://example.com"
              className="w-full border-2 border-neutral-200 rounded-xl px-4 py-3 text-lg focus:outline-none focus:border-neutral-900"
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
              className="w-full bg-neutral-900 text-white rounded-xl py-4 text-lg font-medium hover:bg-neutral-800 disabled:opacity-50 flex items-center justify-center gap-2"
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
      </div>
    </div>
  );
}
