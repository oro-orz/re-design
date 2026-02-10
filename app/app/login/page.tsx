"use client";

import { useEffect, useState, Suspense } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import Image from "next/image";

function isLocalhost(): boolean {
  if (typeof window === "undefined") return false;
  return (
    window.location.hostname === "localhost" ||
    window.location.hostname === "127.0.0.1"
  );
}

function LoginContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const [devLoginLoading, setDevLoginLoading] = useState(false);
  const [devLoginError, setDevLoginError] = useState<string | null>(null);
  const showDevLogin = isLocalhost();

  useEffect(() => {
    const ssoError = searchParams.get("error");
    if (ssoError) {
      // 必要に応じてエラー表示（例: クエリを state に持って表示）
    }
  }, [searchParams]);

  const handleDevLogin = async () => {
    setDevLoginError(null);
    setDevLoginLoading(true);
    try {
      const res = await fetch("/api/auth/dev-session", { method: "POST" });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.error || "ログインに失敗しました");
      }
      const callbackUrl = searchParams.get("callbackUrl") || "/";
      router.push(callbackUrl);
      router.refresh();
    } catch (e) {
      setDevLoginError(e instanceof Error ? e.message : "ログインに失敗しました");
    } finally {
      setDevLoginLoading(false);
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-neutral-50 px-4">
      <div className="w-full max-w-sm text-center">
        <div className="mb-8 flex justify-center">
          <Image
            src="/Re-Design-logo.svg"
            alt="Re:Design"
            width={280}
            height={80}
            priority
            unoptimized
            className="h-20 w-auto"
          />
        </div>
        <p className="text-neutral-600">
          TMG ポータルからアクセスするか、アプリ内の Google ログインをご利用ください。
        </p>
        {showDevLogin && (
          <div className="mt-8 pt-8 border-t border-neutral-200">
            <p className="text-xs text-neutral-500 mb-3">ローカル開発用</p>
            <button
              type="button"
              onClick={handleDevLogin}
              disabled={devLoginLoading}
              className="w-full rounded-xl bg-neutral-800 px-4 py-3 text-sm font-medium text-white hover:bg-neutral-700 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {devLoginLoading ? "ログイン中…" : "開発用ログイン"}
            </button>
            {devLoginError && (
              <p className="mt-3 text-sm text-red-600">{devLoginError}</p>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

export default function LoginPage() {
  return (
    <Suspense
      fallback={
        <div className="flex min-h-screen items-center justify-center bg-neutral-50">
          読み込み中...
        </div>
      }
    >
      <LoginContent />
    </Suspense>
  );
}
