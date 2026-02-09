"use client";

import { useEffect, Suspense } from "react";
import { useSearchParams } from "next/navigation";
import Image from "next/image";

function LoginContent() {
  const searchParams = useSearchParams();

  useEffect(() => {
    const ssoError = searchParams.get("error");
    if (ssoError) {
      // 必要に応じてエラー表示（例: クエリを state に持って表示）
    }
  }, [searchParams]);

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
