import Link from 'next/link';

interface LoginErrorPageProps {
  searchParams: { error?: string };
}

/**
 * SSOログインエラーページ
 */
export default function LoginErrorPage({ searchParams }: LoginErrorPageProps) {
  const error = searchParams.error;

  const errorMessages: Record<string, string> = {
    missing_params: '必要なパラメータが不足しています。',
    invalid_token: '認証トークンが無効です。もう一度お試しください。',
    user_not_found: 'ユーザーが見つかりませんでした。',
    invalid_redirect: 'リダイレクト先が無効です。',
  };

  const errorMessage = errorMessages[error || ''] || '不明なエラーが発生しました。';

  return (
    <div className="flex min-h-screen items-center justify-center bg-neutral-50 px-4">
      <div className="w-full max-w-sm">
        <div className="mb-8 flex justify-center">
          <h1 className="text-2xl font-bold text-neutral-900">ログインエラー</h1>
        </div>
        <div className="rounded-2xl border border-red-200 bg-white p-6">
          <div className="mb-4">
            <p className="text-sm text-red-600">{errorMessage}</p>
          </div>
          <Link
            href="/login"
            className="block w-full rounded-xl bg-neutral-900 px-4 py-3 text-center text-white hover:bg-neutral-800"
          >
            ログインページに戻る
          </Link>
          <Link
            href="/"
            className="mt-2 block w-full rounded-xl border border-neutral-200 px-4 py-3 text-center text-neutral-700 hover:bg-neutral-50"
          >
            トップページに戻る
          </Link>
        </div>
      </div>
    </div>
  );
}
