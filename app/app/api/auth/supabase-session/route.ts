import { NextRequest, NextResponse } from "next/server";
import { verifyFirebaseIdToken } from "@/lib/firebase-admin";
import { createSupabaseSessionForFirebaseEmail } from "@/lib/sso";

/**
 * Firebase ログイン済みユーザー用に Supabase セッションを発行する。
 * 本番で TMG Portal SSO ログイン後、Server Actions が Supabase の getUser() を通すために使用する。
 *
 * POST body: { idToken: string } (Firebase の getIdToken() の結果)
 * 成功時: { hashed_token: string } → クライアントで supabase.auth.verifyOtp({ token_hash, type: 'magiclink' }) を呼ぶ
 */
export async function POST(request: NextRequest) {
  const useFirebaseSSO =
    process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID &&
    process.env.NEXT_PUBLIC_TMG_PORTAL_URL;
  if (!useFirebaseSSO) {
    return NextResponse.json(
      { error: "Firebase SSO が有効ではありません" },
      { status: 400 }
    );
  }

  let body: { idToken?: string };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json(
      { error: "idToken が必要です" },
      { status: 400 }
    );
  }

  const idToken = body.idToken?.trim();
  if (!idToken) {
    return NextResponse.json(
      { error: "idToken が必要です" },
      { status: 400 }
    );
  }

  const decoded = await verifyFirebaseIdToken(idToken);
  if (!decoded) {
    return NextResponse.json(
      { error: "トークンの検証に失敗しました（Firebase Admin の設定を確認してください）" },
      { status: 500 }
    );
  }
  if (!decoded.email) {
    return NextResponse.json(
      { error: "トークンにメールアドレスが含まれていません。ポータル側でカスタムトークンに email を設定してください。" },
      { status: 401 }
    );
  }

  const result = await createSupabaseSessionForFirebaseEmail(decoded.email);
  if (!result) {
    return NextResponse.json(
      { error: "Supabase セッションの作成に失敗しました" },
      { status: 500 }
    );
  }

  return NextResponse.json({ hashed_token: result.hashed_token });
}
