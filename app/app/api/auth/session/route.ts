import { NextRequest, NextResponse } from "next/server";
import { verifyFirebaseIdToken } from "@/lib/firebase-admin";
import { createSessionToken, getSessionCookieName, getSessionMaxAge } from "@/lib/session";
import { createAdminClient } from "@/lib/supabase/admin";

/**
 * Firebase ログイン後に署名付きセッション Cookie を発行する。
 * Supabase Auth は使わず、Cookie のみで「現在ユーザー」を識別する。
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

  if (!process.env.SESSION_SECRET || process.env.SESSION_SECRET.length < 32) {
    return NextResponse.json(
      { error: "SESSION_SECRET が設定されていません" },
      { status: 500 }
    );
  }

  let body: { idToken?: string; employee?: { employee_number: string; name: string; email: string } };
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
  if (!decoded?.email) {
    return NextResponse.json(
      { error: "無効なトークンです" },
      { status: 401 }
    );
  }

  const email = decoded.email.toLowerCase().trim();
  const supabase = createAdminClient();

  let userId: string;

  const { data: existing } = await supabase
    .from("app_users")
    .select("id")
    .eq("email", email)
    .single();

  if (existing?.id) {
    userId = existing.id;
  } else {
    const emp = body.employee;
    if (!emp || emp.email?.toLowerCase().trim() !== email) {
      return NextResponse.json(
        { error: "app_users に未登録のメールです。employee を付与して再試行してください。" },
        { status: 403 }
      );
    }
    const { data: inserted, error: insertError } = await supabase
      .from("app_users")
      .insert({
        employee_number: emp.employee_number,
        name: emp.name,
        email,
        auth_user_id: null,
      })
      .select("id")
      .single();
    if (insertError || !inserted?.id) {
      console.error("[auth/session] app_users insert error:", insertError);
      return NextResponse.json(
        { error: "ユーザー登録に失敗しました" },
        { status: 500 }
      );
    }
    userId = inserted.id;
  }

  const token = createSessionToken({ email, user_id: userId });
  const res = NextResponse.json({ ok: true });
  res.cookies.set(getSessionCookieName(), token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    maxAge: getSessionMaxAge(),
    path: "/",
  });
  return res;
}
