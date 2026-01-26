import { NextRequest, NextResponse } from 'next/server';
import { getFirebaseAdmin } from '@/lib/firebase-admin';
import { getUserByCompanyEmail } from '@/lib/sso';
import { createAdminClient } from '@/lib/supabase/admin';
import { createServerClient } from '@supabase/ssr';

/**
 * SSOログインエンドポイント
 * TMG Portalからのリダイレクトを受け取り、Firebase IDトークンを検証してログイン処理を行う
 */
export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams;
  const firebaseToken = searchParams.get('firebaseToken');
  const companyEmail = searchParams.get('companyEmail');
  let redirectPath = searchParams.get('redirect') || '/';

  // パラメータの検証
  if (!firebaseToken || !companyEmail) {
    return NextResponse.redirect(
      new URL(`/login/error?error=missing_params`, request.url)
    );
  }

  // リダイレクト先の検証（外部URLへのリダイレクトを防ぐ）
  if (redirectPath.startsWith('http://') || redirectPath.startsWith('https://')) {
    return NextResponse.redirect(
      new URL(`/login/error?error=invalid_redirect`, request.url)
    );
  }

  // 相対パスのみ許可
  if (!redirectPath.startsWith('/')) {
    redirectPath = '/';
  }

  try {
    // Firebase Admin SDKの取得
    const auth = getFirebaseAdmin();
    if (!auth) {
      console.error('Firebase Admin SDKが初期化されていません');
      return NextResponse.redirect(
        new URL(`/login/error?error=invalid_token`, request.url)
      );
    }

    // Firebase IDトークンの検証
    const decodedToken = await auth.verifyIdToken(firebaseToken);

    // ユーザー情報の取得（companyEmailで検索）
    const user = await getUserByCompanyEmail(companyEmail);

    if (!user) {
      return NextResponse.redirect(
        new URL(`/login/error?error=user_not_found`, request.url)
      );
    }

    // Supabaseセッションの作成
    const supabaseAdmin = createAdminClient();
    
    // ユーザーのメールアドレスでマジックリンクを生成
    const { data: magicLinkData, error: linkError } = await supabaseAdmin.auth.admin.generateLink({
      type: 'magiclink',
      email: user.email,
    });

    if (linkError || !magicLinkData?.properties?.hashed_token) {
      console.error('マジックリンク生成エラー:', linkError);
      return NextResponse.redirect(
        new URL(`/login/error?error=invalid_token`, request.url)
      );
    }

    // セッションを作成するためのレスポンス
    const response = NextResponse.redirect(
      new URL(redirectPath, request.url)
    );

    // Supabaseセッションをサーバー側で作成
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

    if (!supabaseUrl || !supabaseAnonKey) {
      console.error('Supabase設定が不足しています');
      return NextResponse.redirect(
        new URL(`/login/error?error=invalid_token`, request.url)
      );
    }

    // サーバー側でセッションを作成
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

    // マジックリンクトークンを使用してセッションを作成
    const { error: verifyError } = await supabase.auth.verifyOtp({
      token_hash: magicLinkData.properties.hashed_token,
      type: 'email',
    });

    if (verifyError) {
      console.error('セッション検証エラー:', verifyError);
      return NextResponse.redirect(
        new URL(`/login/error?error=invalid_token`, request.url)
      );
    }

    return response;
  } catch (error: any) {
    console.error('SSO login error:', error);
    
    if (error.code === 'auth/id-token-expired') {
      return NextResponse.redirect(
        new URL(`/login/error?error=invalid_token`, request.url)
      );
    }
    
    return NextResponse.redirect(
      new URL(`/login/error?error=invalid_token`, request.url)
    );
  }
}
