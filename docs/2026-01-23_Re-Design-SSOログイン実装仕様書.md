# Re:Design SSOログイン実装仕様書

**作成日**: 2026年1月23日  
**対象システム**: Re:Design  
**目的**: TMG PortalからのSSOログイン機能実装  
**バージョン**: 1.0

---

## 目次

1. [概要](#1-概要)
2. [SSOログインの仕組み](#2-ssoログインの仕組み)
3. [リダイレクトURL仕様](#3-リダイレクトurl仕様)
4. [パラメータ仕様](#4-パラメータ仕様)
5. [実装フロー](#5-実装フロー)
6. [Firebase IDトークンの検証](#6-firebase-idトークンの検証)
7. [ユーザー識別方法](#7-ユーザー識別方法)
8. [エラーハンドリング](#8-エラーハンドリング)
9. [実装例](#9-実装例)
10. [テスト項目](#10-テスト項目)

---

## 1. 概要

### 1.1 目的

TMG PortalでFirebase認証（Googleログイン）済みのユーザーが、Re:Designアプリへのリンクをクリックした際に、再ログイン不要で自動的にログインできるようにする。

### 1.2 実装方式

- **認証方式**: Firebase Authentication（Googleログイン）
- **トークン**: Firebase IDトークン（JWT形式）
- **リダイレクト方式**: URLパラメータにトークンとユーザー識別情報を付与してリダイレクト
- **ユーザー識別**: 社内メールアドレス（`companyEmail`）

### 1.3 技術要件

- **フロントエンド**: Next.js（推奨）
- **認証**: Firebase Admin SDK（サーバーサイドでのトークン検証）
- **データベース**: ユーザー情報の取得（社内メールアドレスで識別）

---

## 2. SSOログインの仕組み

### 2.1 全体フロー

```
1. ユーザーがTMG PortalでRe:Designへのリンクをクリック
   ↓
2. TMG PortalがFirebase IDトークンを取得
   ↓
3. TMG Portalが社員情報を取得（社内メールアドレスを含む）
   ↓
4. Re:Designの/loginエンドポイントにリダイレクト
   - URL: https://tmg-re-design.vercel.app/login?firebaseToken={token}&redirect={path}&companyEmail={email}
   ↓
5. Re:Design側でFirebase IDトークンを検証
   ↓
6. トークンが有効な場合、companyEmailでユーザーを識別
   ↓
7. ユーザーをログイン状態にして、redirectパラメータで指定されたパスにリダイレクト
```

### 2.2 セキュリティ考慮事項

- Firebase IDトークンは1時間の有効期限を持つ
- トークンはサーバーサイドでのみ検証すること（クライアントサイドでの検証は不可）
- トークンの改ざんを防ぐため、Firebase Admin SDKを使用して検証すること

---

## 3. リダイレクトURL仕様

### 3.1 URL形式

```
https://tmg-re-design.vercel.app/login?firebaseToken={idToken}&redirect={redirectPath}&companyEmail={tmg_email}
```

### 3.2 URL例

```
https://tmg-re-design.vercel.app/login?firebaseToken=eyJhbGciOiJSUzI1NiIsInR5cCI6IkpXVCJ9...&redirect=/dashboard&companyEmail=yamada@timingood.co.jp
```

### 3.3 エンドポイント

- **パス**: `/login`
- **メソッド**: `GET`（推奨）または `POST`
- **HTTPS**: 必須

---

## 4. パラメータ仕様

### 4.1 必須パラメータ

| パラメータ名 | 型 | 説明 | 例 |
|------------|-----|------|-----|
| `firebaseToken` | string | Firebase IDトークン（JWT形式） | `eyJhbGciOiJSUzI1NiIsInR5cCI6IkpXVCJ9...` |
| `companyEmail` | string | 社内メールアドレス（ユーザー識別用） | `yamada@timingood.co.jp` |

### 4.2 オプションパラメータ

| パラメータ名 | 型 | 説明 | デフォルト値 | 例 |
|------------|-----|------|------------|-----|
| `redirect` | string | ログイン後のリダイレクト先パス | `/dashboard` | `/dashboard`, `/projects`, `/` |

### 4.3 パラメータの詳細

#### firebaseToken

- **形式**: JWT（JSON Web Token）
- **有効期限**: 1時間
- **取得元**: Firebase Authentication
- **検証**: Firebase Admin SDKを使用してサーバーサイドで検証

#### companyEmail

- **形式**: メールアドレス（`@timingood.co.jp`ドメイン）
- **用途**: ユーザーの識別
- **取得元**: TMG Portalの社員情報データベース
- **検証**: データベースに存在するユーザーか確認

#### redirect

- **形式**: パス文字列（先頭の`/`を含む）
- **用途**: ログイン成功後のリダイレクト先
- **デフォルト**: `/dashboard`
- **例**: `/dashboard`, `/projects`, `/settings`

---

## 5. 実装フロー

### 5.1 サーバーサイド実装（推奨）

#### ステップ1: `/login`エンドポイントの作成

```typescript
// app/login/page.tsx または app/api/login/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { getAuth } from 'firebase-admin/auth';
import { initializeApp, getApps, cert } from 'firebase-admin/app';

// Firebase Admin SDKの初期化（初回のみ）
if (!getApps().length) {
  initializeApp({
    credential: cert({
      projectId: process.env.FIREBASE_PROJECT_ID,
      clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
      privateKey: process.env.FIREBASE_PRIVATE_KEY?.replace(/\\n/g, '\n'),
    }),
  });
}

export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams;
  const firebaseToken = searchParams.get('firebaseToken');
  const companyEmail = searchParams.get('companyEmail');
  const redirectPath = searchParams.get('redirect') || '/dashboard';

  // パラメータの検証
  if (!firebaseToken || !companyEmail) {
    return NextResponse.redirect(
      new URL(`/login?error=missing_params`, request.url)
    );
  }

  try {
    // Firebase IDトークンの検証
    const auth = getAuth();
    const decodedToken = await auth.verifyIdToken(firebaseToken);

    // トークンから取得したメールアドレスとcompanyEmailの整合性確認（オプション）
    // 注意: decodedToken.emailはGoogleメールアドレス、companyEmailは社内メールアドレス

    // ユーザー情報の取得（companyEmailで検索）
    const user = await getUserByCompanyEmail(companyEmail);

    if (!user) {
      return NextResponse.redirect(
        new URL(`/login?error=user_not_found`, request.url)
      );
    }

    // セッションの作成（実装方法はアプリに依存）
    const sessionToken = await createSession(user);

    // セッションをCookieに設定
    const response = NextResponse.redirect(
      new URL(redirectPath, request.url)
    );
    response.cookies.set('session', sessionToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 60 * 60 * 24 * 7, // 7日間
    });

    return response;
  } catch (error) {
    console.error('SSO login error:', error);
    return NextResponse.redirect(
      new URL(`/login?error=invalid_token`, request.url)
    );
  }
}
```

#### ステップ2: ユーザー情報取得関数

```typescript
async function getUserByCompanyEmail(companyEmail: string) {
  // データベースからユーザーを検索
  // 実装は使用しているデータベースに依存
  // 例: Prisma, Drizzle, 直接SQLクエリなど
  
  // 例: Prismaを使用する場合
  // return await prisma.user.findUnique({
  //   where: { companyEmail },
  // });
}
```

#### ステップ3: セッション作成関数

```typescript
async function createSession(user: User) {
  // セッショントークンの生成
  // 実装は使用している認証ライブラリに依存
  // 例: JWT, session storeなど
  
  // 例: JWTを使用する場合
  // return jwt.sign({ userId: user.id }, process.env.JWT_SECRET, {
  //   expiresIn: '7d',
  // });
}
```

### 5.2 クライアントサイド実装（補助的）

クライアントサイドでは、エラーメッセージの表示やローディング状態の管理を行います。

```typescript
// app/login/page.tsx（クライアントコンポーネント）
'use client';

import { useEffect } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';

export default function LoginPage() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const error = searchParams.get('error');

  useEffect(() => {
    // SSOパラメータがある場合は自動的にサーバーサイドで処理される
    // このコンポーネントはエラー表示用
  }, []);

  if (error) {
    return (
      <div>
        <h1>ログインエラー</h1>
        <p>
          {error === 'missing_params' && '必要なパラメータが不足しています。'}
          {error === 'invalid_token' && '認証トークンが無効です。'}
          {error === 'user_not_found' && 'ユーザーが見つかりませんでした。'}
        </p>
        <button onClick={() => router.push('/')}>トップページに戻る</button>
      </div>
    );
  }

  return <div>ログイン処理中...</div>;
}
```

---

## 6. Firebase IDトークンの検証

### 6.1 検証方法

Firebase Admin SDKを使用してトークンを検証します。

```typescript
import { getAuth } from 'firebase-admin/auth';

const auth = getAuth();
const decodedToken = await auth.verifyIdToken(firebaseToken);
```

### 6.2 検証結果

検証成功時、以下の情報が取得できます：

```typescript
{
  uid: string;              // Firebase UID
  email: string;           // Googleメールアドレス
  email_verified: boolean;  // メールアドレスの検証状態
  name?: string;           // ユーザー名
  picture?: string;        // プロフィール画像URL
  iss: string;             // 発行者
  aud: string;             // 対象者
  exp: number;             // 有効期限（Unix timestamp）
  iat: number;             // 発行時刻（Unix timestamp）
}
```

### 6.3 エラーハンドリング

```typescript
try {
  const decodedToken = await auth.verifyIdToken(firebaseToken);
} catch (error) {
  if (error.code === 'auth/id-token-expired') {
    // トークンの有効期限切れ
  } else if (error.code === 'auth/argument-error') {
    // トークンの形式が不正
  } else {
    // その他のエラー
  }
}
```

---

## 7. ユーザー識別方法

### 7.1 識別パラメータ

Re:Designでは、**社内メールアドレス（`companyEmail`）**を使用してユーザーを識別します。

### 7.2 データベース検索

`companyEmail`パラメータを使用して、データベースからユーザー情報を取得します。

```typescript
// 例: ユーザーテーブルから検索
const user = await db.user.findUnique({
  where: { companyEmail },
});
```

### 7.3 ユーザーが見つからない場合

ユーザーが見つからない場合は、エラーページにリダイレクトするか、新規ユーザー登録フローに誘導します。

---

## 8. エラーハンドリング

### 8.1 エラーケース

| エラーケース | エラーコード | 処理方法 |
|------------|------------|---------|
| `firebaseToken`が未指定 | `missing_params` | エラーページにリダイレクト |
| `companyEmail`が未指定 | `missing_params` | エラーページにリダイレクト |
| トークンが無効 | `invalid_token` | エラーページにリダイレクト |
| トークンの有効期限切れ | `invalid_token` | エラーページにリダイレクト |
| ユーザーが見つからない | `user_not_found` | エラーページまたは新規登録ページにリダイレクト |

### 8.2 エラーページの実装

```typescript
// app/login/error/page.tsx
export default function LoginErrorPage({
  searchParams,
}: {
  searchParams: { error?: string };
}) {
  const errorMessages: Record<string, string> = {
    missing_params: '必要なパラメータが不足しています。',
    invalid_token: '認証トークンが無効です。もう一度お試しください。',
    user_not_found: 'ユーザーが見つかりませんでした。',
  };

  return (
    <div>
      <h1>ログインエラー</h1>
      <p>{errorMessages[searchParams.error || ''] || '不明なエラーが発生しました。'}</p>
      <a href="/">トップページに戻る</a>
    </div>
  );
}
```

---

## 9. 実装例

### 9.1 Next.js App Routerでの実装例

```typescript
// app/login/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { getAuth } from 'firebase-admin/auth';
import { initializeApp, getApps, cert } from 'firebase-admin/app';

// Firebase Admin SDKの初期化
if (!getApps().length) {
  initializeApp({
    credential: cert({
      projectId: process.env.FIREBASE_PROJECT_ID,
      clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
      privateKey: process.env.FIREBASE_PRIVATE_KEY?.replace(/\\n/g, '\n'),
    }),
  });
}

export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams;
  const firebaseToken = searchParams.get('firebaseToken');
  const companyEmail = searchParams.get('companyEmail');
  const redirectPath = searchParams.get('redirect') || '/dashboard';

  // パラメータ検証
  if (!firebaseToken || !companyEmail) {
    return NextResponse.redirect(
      new URL(`/login/error?error=missing_params`, request.url)
    );
  }

  try {
    // Firebase IDトークンの検証
    const auth = getAuth();
    const decodedToken = await auth.verifyIdToken(firebaseToken);

    // ユーザー情報の取得
    const user = await getUserByCompanyEmail(companyEmail);
    if (!user) {
      return NextResponse.redirect(
        new URL(`/login/error?error=user_not_found`, request.url)
      );
    }

    // セッションの作成（実装はアプリに依存）
    const sessionToken = await createSession(user);

    // リダイレクト
    const response = NextResponse.redirect(
      new URL(redirectPath, request.url)
    );
    
    // セッションCookieの設定
    response.cookies.set('session', sessionToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 60 * 60 * 24 * 7, // 7日間
    });

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

async function getUserByCompanyEmail(companyEmail: string) {
  // データベースからユーザーを検索
  // 実装は使用しているデータベースに依存
}

async function createSession(user: any) {
  // セッショントークンの生成
  // 実装は使用している認証ライブラリに依存
}
```

### 9.2 環境変数の設定

**✅ 既に設定済み**: Re:DesignのVercelにはFirebaseの環境変数が設定済みです。

以下の環境変数がVercelに設定されていることを確認してください：

```env
FIREBASE_PROJECT_ID=your-project-id
FIREBASE_CLIENT_EMAIL=your-service-account@your-project.iam.gserviceaccount.com
FIREBASE_PRIVATE_KEY="-----BEGIN PRIVATE KEY-----\n...\n-----END PRIVATE KEY-----\n"
```

**注意**: 
- Vercelの環境変数設定では、`FIREBASE_PRIVATE_KEY`に改行を含む文字列をそのまま設定できます
- コード内では `process.env.FIREBASE_PRIVATE_KEY?.replace(/\\n/g, '\n')` を使用して改行を正しく処理します

---

## 10. テスト項目

### 10.1 正常系テスト

- [ ] `firebaseToken`と`companyEmail`が正しく渡された場合、ログインが成功する
- [ ] `redirect`パラメータが指定された場合、指定されたパスにリダイレクトされる
- [ ] `redirect`パラメータが未指定の場合、`/dashboard`にリダイレクトされる
- [ ] セッションCookieが正しく設定される
- [ ] ログイン後、認証が必要なページにアクセスできる

### 10.2 異常系テスト

- [ ] `firebaseToken`が未指定の場合、エラーページにリダイレクトされる
- [ ] `companyEmail`が未指定の場合、エラーページにリダイレクトされる
- [ ] 無効な`firebaseToken`の場合、エラーページにリダイレクトされる
- [ ] 有効期限切れの`firebaseToken`の場合、エラーページにリダイレクトされる
- [ ] 存在しない`companyEmail`の場合、エラーページにリダイレクトされる
- [ ] 不正な`redirect`パラメータの場合、適切に処理される（セキュリティ考慮）

### 10.3 セキュリティテスト

- [ ] トークンの改ざんが検出される
- [ ] トークンの再利用が防止される（必要に応じて）
- [ ] セッションCookieが`httpOnly`で設定されている
- [ ] セッションCookieが`secure`で設定されている（本番環境）
- [ ] CSRF対策が実装されている

### 10.4 統合テスト

- [ ] TMG Portalからのリダイレクトが正常に動作する
- [ ] ログイン後のリダイレクトが正常に動作する
- [ ] エラー時のリダイレクトが正常に動作する

---

## 11. トラブルシューティング

### 11.1 よくある問題

#### 問題: トークンの検証に失敗する

**原因**:
- Firebase Admin SDKの初期化が正しく行われていない
- 環境変数が正しく設定されていない
- トークンが改ざんされている

**解決方法**:
- Firebase Admin SDKの初期化コードを確認
- 環境変数の設定を確認
- トークンの有効期限を確認

#### 問題: ユーザーが見つからない

**原因**:
- `companyEmail`がデータベースに存在しない
- データベースの接続に問題がある

**解決方法**:
- データベースで`companyEmail`を確認
- データベース接続を確認

#### 問題: セッションが作成されない

**原因**:
- セッション作成関数の実装に問題がある
- Cookieの設定に問題がある

**解決方法**:
- セッション作成関数のロジックを確認
- Cookieの設定を確認

---

## 12. 参考情報

### 12.1 関連ドキュメント

- [Firebase Admin SDK Documentation](https://firebase.google.com/docs/admin/setup)
- [Firebase ID Token Verification](https://firebase.google.com/docs/auth/admin/verify-id-tokens)
- [TMG Portal SSO実装詳細仕様書](../docs/2026-01-15_TMG-Portal-SSO実装詳細仕様書.md)

### 12.2 連絡先

実装に関する質問や問題がある場合は、TMG Portal開発チームまでお問い合わせください。

---

**最終更新日**: 2026年1月23日  
**バージョン**: 1.0
