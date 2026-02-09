"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { LogIn, LogOut } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { hasSupabase } from "@/lib/supabase/env";

/**
 * localhost のときだけ表示する開発用バナー。
 * Supabase でログインできるリンクを表示し、開発時も Server Actions が認証を通すようにする。
 */
export function DevLoginBanner() {
  const router = useRouter();
  const [isDev, setIsDev] = useState(false);
  const [hasSession, setHasSession] = useState(false);

  useEffect(() => {
    if (typeof window === "undefined") return;
    const dev =
      window.location.hostname === "localhost" ||
      window.location.hostname === "127.0.0.1";
    setIsDev(dev);
    if (dev && hasSupabase()) {
      createClient()
        .auth.getSession()
        .then(({ data: { session } }) => setHasSession(!!session));
    }
  }, []);

  const handleLogout = async () => {
    if (!hasSupabase()) return;
    await createClient().auth.signOut();
    setHasSession(false);
    router.refresh();
  };

  if (!isDev) return null;

  return (
    <div className="sticky top-0 z-30 flex items-center justify-center gap-2 bg-amber-100 py-1.5 px-4 text-xs text-amber-900 border-b border-amber-200">
      <span>開発モード</span>
      {hasSession ? (
        <button
          type="button"
          onClick={handleLogout}
          className="inline-flex items-center gap-1.5 font-medium text-amber-800 hover:text-amber-900 underline"
        >
          <LogOut className="w-3.5 h-3.5" />
          Supabaseログアウト
        </button>
      ) : (
        <Link
          href="/login"
          className="inline-flex items-center gap-1.5 font-medium text-amber-800 hover:text-amber-900 underline"
        >
          <LogIn className="w-3.5 h-3.5" />
          Supabaseでログイン
        </Link>
      )}
      <span className="text-amber-600">
        {hasSession ? "（ログイン中）" : "（テンプレート・スライド生成を使う場合）"}
      </span>
    </div>
  );
}
