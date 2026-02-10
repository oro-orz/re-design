import { NextRequest, NextResponse } from "next/server";
import { createSessionToken, getSessionCookieName, getSessionMaxAge } from "@/lib/session";
import { createAdminClient } from "@/lib/supabase/admin";

const DEV_EMAIL = "dev@example.com";

/**
 * ローカル開発用: 開発ユーザーでセッション Cookie を発行する。
 * NODE_ENV=development のときのみ有効。
 */
export async function POST(request: NextRequest) {
  if (process.env.NODE_ENV !== "development") {
    return NextResponse.json({ error: "開発環境でのみ利用できます" }, { status: 403 });
  }

  const supabase = createAdminClient();
  const { data: existing } = await supabase
    .from("app_users")
    .select("id")
    .eq("email", DEV_EMAIL)
    .single();

  let userId: string;
  if (existing?.id) {
    userId = existing.id;
  } else {
    const { data: inserted, error: insertError } = await supabase
      .from("app_users")
      .insert({
        employee_number: "DEV001",
        name: "開発ユーザー",
        email: DEV_EMAIL,
        auth_user_id: null,
      })
      .select("id")
      .single();
    if (insertError || !inserted?.id) {
      console.error("[auth/dev-session] app_users insert error:", insertError);
      return NextResponse.json(
        { error: "開発ユーザーの登録に失敗しました" },
        { status: 500 }
      );
    }
    userId = inserted.id;
  }

  const token = createSessionToken({ email: DEV_EMAIL, user_id: userId });
  const res = NextResponse.json({ ok: true });
  res.cookies.set(getSessionCookieName(), token, {
    httpOnly: true,
    secure: false,
    sameSite: "lax",
    maxAge: getSessionMaxAge(),
    path: "/",
  });
  return res;
}
