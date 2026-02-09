"use client";

import { useAuth } from "@/contexts/AuthContext";
import { isLocalhost } from "@/lib/auth";
import { ExternalLink } from "lucide-react";

const TMG_PORTAL_URL = "https://portal.tmgsystem.net";

export function TMGPortalLoginModal() {
  const { user, loading } = useAuth();

  if (typeof window === "undefined") return null;
  if (isLocalhost()) return null;
  if (loading || user) return null;

  const portalBase =
    process.env.NEXT_PUBLIC_TMG_PORTAL_URL?.replace(/\/$/, "") || TMG_PORTAL_URL;
  const redirectUri = encodeURIComponent(window.location.href);
  const loginUrl = `${portalBase}/login?redirect_uri=${redirectUri}`;

  return (
    <div
      className="fixed inset-0 z-[100] flex items-center justify-center bg-black/60 p-4"
      role="dialog"
      aria-modal="true"
      aria-labelledby="tmg-modal-title"
      aria-describedby="tmg-modal-desc"
    >
      <div className="w-full max-w-md rounded-xl bg-white p-6 shadow-xl">
        <h2
          id="tmg-modal-title"
          className="mb-2 text-lg font-bold text-neutral-900"
        >
          ログインが必要です
        </h2>
        <p id="tmg-modal-desc" className="mb-6 text-sm text-neutral-600">
          TMGポータルでログインしてください。ログイン後、このツールに自動で戻ります。
        </p>
        <a
          href={loginUrl}
          className="inline-flex w-full items-center justify-center gap-2 rounded-lg bg-neutral-900 px-4 py-3 text-sm font-medium text-white hover:bg-neutral-800 transition-colors"
        >
          <ExternalLink className="h-4 w-4 shrink-0" aria-hidden />
          TMGポータルでログイン
        </a>
        <p className="mt-4 text-center text-xs text-neutral-500">
          <a
            href={TMG_PORTAL_URL}
            target="_blank"
            rel="noopener noreferrer"
            className="underline hover:text-neutral-700"
          >
            {TMG_PORTAL_URL}
          </a>
        </p>
      </div>
    </div>
  );
}
