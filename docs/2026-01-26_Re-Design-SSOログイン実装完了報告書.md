# Re:Design SSOログイン機能 実装完了報告書

**作成日**: 2026年1月26日  
**対象システム**: Re:Design  
**報告先**: TMG Portal開発チーム  
**バージョン**: 1.0

---

## 1. 実装完了のご報告

この度、TMG PortalからのSSOログイン機能の実装が完了いたしましたので、ご報告申し上げます。

Re:Designアプリ側で、TMG Portalからのリダイレクトを受け取り、Firebase IDトークンを検証して自動ログインを行う機能を実装いたしました。

---

## 2. 実装内容の概要

### 2.1 実装された機能

- ✅ TMG PortalからのSSOログインリダイレクトの受付
- ✅ Firebase IDトークンの検証（サーバーサイド）
- ✅ 社内メールアドレス（`companyEmail`）によるユーザー識別
- ✅ Supabaseセッションの自動作成
- ✅ エラーハンドリングとエラーページの実装

### 2.2 実装されたエンドポイント

**エンドポイント**: `/login`  
**メソッド**: `GET`  
**URL形式**: 
```
https://tmg-re-design.vercel.app/login?firebaseToken={idToken}&redirect={redirectPath}&companyEmail={tmg_email}
```

### 2.3 パラメータ仕様

#### 必須パラメータ

| パラメータ名 | 型 | 説明 | 例 |
|------------|-----|------|-----|
| `firebaseToken` | string | Firebase IDトークン（JWT形式） | `eyJhbGciOiJSUzI1NiIsInR5cCI6IkpXVCJ9...` |
| `companyEmail` | string | 社内メールアドレス（ユーザー識別用） | `yamada@timingood.co.jp` |

#### オプションパラメータ

| パラメータ名 | 型 | 説明 | デフォルト値 | 例 |
|------------|-----|------|------------|-----|
| `redirect` | string | ログイン後のリダイレクト先パス | `/` | `/`, `/projects` |

**注意**: Re:Designアプリには`/dashboard`パスは存在しません。ルートパス`/`がメインページ（ダッシュボード相当）です。

---

## 3. 実装フロー

### 3.1 正常系フロー

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
5. Re:Design側でFirebase IDトークンを検証（サーバーサイド）
   ↓
6. トークンが有効な場合、companyEmailでユーザーを識別
   ↓
7. Supabaseセッションを自動作成
   ↓
8. ユーザーをログイン状態にして、redirectパラメータで指定されたパスにリダイレクト
```

### 3.2 エラーハンドリング

以下のエラーケースに対応しています：

| エラーケース | エラーコード | 処理方法 |
|------------|------------|---------|
| `firebaseToken`が未指定 | `missing_params` | `/login/error?error=missing_params`にリダイレクト |
| `companyEmail`が未指定 | `missing_params` | `/login/error?error=missing_params`にリダイレクト |
| トークンが無効 | `invalid_token` | `/login/error?error=invalid_token`にリダイレクト |
| トークンの有効期限切れ | `invalid_token` | `/login/error?error=invalid_token`にリダイレクト |
| ユーザーが見つからない | `user_not_found` | `/login/error?error=user_not_found`にリダイレクト |
| 無効なリダイレクト先 | `invalid_redirect` | `/login/error?error=invalid_redirect`にリダイレクト |

---

## 4. 実装詳細

### 4.1 実装されたファイル

1. **`app/login/route.ts`**
   - SSOログインエンドポイントの実装
   - Firebase IDトークンの検証
   - Supabaseセッションの作成

2. **`app/login/page.tsx`**
   - ログインページ（通常のログインとSSOエラー表示）

3. **`app/login/error/page.tsx`**
   - SSOログインエラーページ

4. **`lib/sso.ts`**
   - ユーザー検索関数（`getUserByCompanyEmail`）
   - セッション作成関数（`createSupabaseSession`）

5. **`lib/firebase-admin.ts`**
   - Firebase Admin SDKの初期化（既存実装）

### 4.3 Supabaseセッションの作成方法

Supabase Admin APIでは、既存ユーザーに対して直接セッションを作成する方法が提供されていません。そのため、以下の方法を使用しています：

1. **マジックリンクの生成**: `supabaseAdmin.auth.admin.generateLink()`を使用して、ユーザーのメールアドレスでマジックリンクを生成
2. **セッションの作成**: 生成されたマジックリンクトークン（`hashed_token`）を使用して、`supabase.auth.verifyOtp()`でセッションを作成

この方法は、Supabaseの公式ドキュメントで推奨されている方法であり、SSOログインでも安全に使用できます。

**注意**: この方法では、実際のメール送信は行われません。マジックリンクトークンはサーバー側で直接検証され、セッションが作成されます。

### 4.2 セキュリティ対策

- ✅ Firebase IDトークンの検証をサーバーサイドで実施
- ✅ トークンの改ざん検出（Firebase Admin SDKによる検証）
- ✅ セッションCookieの設定（`httpOnly`, `secure`, `sameSite`）
- ✅ エラーメッセージの適切な処理
- ✅ リダイレクト先の検証（外部URLへのリダイレクトを防止）
- ✅ 相対パスのみ許可（絶対URLは拒否）

---

## 5. テスト方法

### 5.1 正常系テスト

TMG Portal側で以下のURL形式でリダイレクトを実行してください：

```
https://tmg-re-design.vercel.app/login?firebaseToken={有効なFirebaseIDトークン}&companyEmail={社内メールアドレス}&redirect=/
```

**期待される動作**:
- Firebase IDトークンが検証される
- ユーザーが識別される
- Supabaseセッションが作成される
- 指定されたリダイレクト先（`/`）にリダイレクトされる
- ログイン状態になる

**注意**: `redirect`パラメータを省略した場合も、デフォルトで`/`にリダイレクトされます。

### 5.2 異常系テスト

#### テストケース1: パラメータ不足
```
https://tmg-re-design.vercel.app/login?firebaseToken={トークン}
```
**期待される動作**: `/login/error?error=missing_params`にリダイレクト

#### テストケース2: 無効なトークン
```
https://tmg-re-design.vercel.app/login?firebaseToken=invalid_token&companyEmail=test@timingood.co.jp
```
**期待される動作**: `/login/error?error=invalid_token`にリダイレクト

#### テストケース3: 存在しないユーザー
```
https://tmg-re-design.vercel.app/login?firebaseToken={有効なトークン}&companyEmail=notfound@timingood.co.jp
```
**期待される動作**: `/login/error?error=user_not_found`にリダイレクト

#### テストケース4: 外部URLへのリダイレクト試行
```
https://tmg-re-design.vercel.app/login?firebaseToken={有効なトークン}&companyEmail=test@timingood.co.jp&redirect=https://evil.com
```
**期待される動作**: `/login/error?error=invalid_redirect`にリダイレクト

---

## 6. 環境変数の確認

Re:Design側で以下の環境変数が設定されていることを確認済みです：

- `FIREBASE_PROJECT_ID`
- `FIREBASE_CLIENT_EMAIL`
- `FIREBASE_PRIVATE_KEY`
- `NEXT_PUBLIC_SUPABASE_URL`
- `NEXT_PUBLIC_SUPABASE_ANON_KEY`
- `SUPABASE_SERVICE_ROLE_KEY`

---

## 7. 注意事項

### 7.1 Firebase IDトークンの有効期限

Firebase IDトークンは**1時間**の有効期限があります。TMG Portal側でトークンを取得してから、Re:Designへのリダイレクトまでに時間がかかる場合は、トークンの有効期限切れエラーが発生する可能性があります。

### 7.2 ユーザー登録について

Re:Design側の`app_users`テーブルにユーザーが登録されている必要があります。ユーザーが存在しない場合、`user_not_found`エラーが発生します。

### 7.3 リダイレクト先の指定

`redirect`パラメータで指定するパスは、Re:Designアプリ内の有効なパスである必要があります。存在しないパスを指定した場合、404エラーが発生する可能性があります。

**セキュリティ対策**:
- 外部URL（`http://`や`https://`で始まるパス）へのリダイレクトは自動的に拒否されます
- 相対パス（`/`で始まるパス）のみ許可されます
- 無効なリダイレクト先が指定された場合、`invalid_redirect`エラーが返されます

---

## 8. 統合テストの実施

TMG Portal側で以下の統合テストを実施していただくことをお願いいたします：

1. **正常系テスト**
   - 有効なFirebase IDトークンと社内メールアドレスでリダイレクト
   - ログイン成功とリダイレクト先への遷移を確認

2. **異常系テスト**
   - パラメータ不足の場合のエラーハンドリング
   - 無効なトークンの場合のエラーハンドリング
   - 存在しないユーザーの場合のエラーハンドリング

3. **セキュリティテスト**
   - トークンの改ざん検出
   - セッションCookieの設定確認

---

## 9. トラブルシューティング

### 9.1 よくある問題と解決方法

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
- ユーザー登録スクリプトを実行

#### 問題: セッションが作成されない

**原因**:
- Supabaseの設定に問題がある
- マジックリンクの生成に失敗している

**解決方法**:
- Supabaseの環境変数を確認
- Supabaseの接続を確認
- エラーログを確認

---

## 10. 連絡先・サポート

実装に関する質問や問題が発生した場合は、Re:Design開発チームまでお問い合わせください。

### 10.1 連絡先

- **開発チーム**: Re:Design開発チーム
- **問い合わせ方法**: プロジェクト管理ツールまたはメール

### 10.2 サポート範囲

- SSOログイン機能の動作確認
- エラーの原因調査
- 実装に関する技術的な質問

---

## 11. 今後の予定

### 11.1 改善予定

- セッション管理の最適化
- エラーメッセージの改善
- ログ機能の強化

### 11.2 追加機能の検討

- ログイン履歴の記録
- セッション管理画面の実装
- 多要素認証の対応

---

## 12. まとめ

TMG PortalからのSSOログイン機能の実装が完了いたしました。

実装内容は、仕様書（`2026-01-23_Re-Design-SSOログイン実装仕様書.md`）に基づいており、以下の機能を提供しています：

- ✅ Firebase IDトークンによる認証
- ✅ 社内メールアドレスによるユーザー識別
- ✅ 自動ログインとセッション管理
- ✅ 適切なエラーハンドリング

TMG Portal側での統合テストの実施をお願いいたします。問題が発生した場合は、お気軽にお問い合わせください。

---

**最終更新日**: 2026年1月26日  
**バージョン**: 1.0  
**作成者**: Re:Design開発チーム
