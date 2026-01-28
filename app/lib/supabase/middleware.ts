import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";

export async function updateSession(request: NextRequest) {
  // Firebase SSO 使用時は Supabase のリダイレクトを行わない（保護は page 側の Firebase で行う）
  const useFirebaseSSO =
    process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID &&
    process.env.NEXT_PUBLIC_TMG_PORTAL_URL;
  if (useFirebaseSSO) {
    return NextResponse.next({ request });
  }

  // 開発モード: 認証チェックをスキップ
  const DEV_MODE = process.env.NODE_ENV === "development";
  if (DEV_MODE) {
    return NextResponse.next();
  }

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  if (!supabaseUrl || !supabaseAnonKey) {
    return NextResponse.next();
  }

  let response = NextResponse.next({ request });
  const supabase = createServerClient(supabaseUrl, supabaseAnonKey, {
    cookies: {
      getAll() {
        return request.cookies.getAll();
      },
      setAll(cookiesToSet) {
        cookiesToSet.forEach(({ name, value, options }) =>
          response.cookies.set(name, value, options)
        );
      },
    },
  });

  const {
    data: { user },
  } = await supabase.auth.getUser();

  const path = request.nextUrl.pathname;
  const isAuth = path === "/login" || path === "/signup";

  if (!user && !isAuth && path === "/") {
    return NextResponse.redirect(new URL("/login", request.url));
  }
  if (user && isAuth) {
    return NextResponse.redirect(new URL("/", request.url));
  }

  return response;
}
