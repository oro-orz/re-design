/**
 * 認証ユーティリティ関数（Firebase Auth / SSO）
 */

import {
  signInWithPopup,
  GoogleAuthProvider,
  signOut,
  onAuthStateChanged,
  User,
  AuthError,
} from "firebase/auth";
import { getFirebaseAuth } from "./firebase";

export interface Employee {
  employee_number: string;
  name: string;
  location: string;
  department: string;
  role: string;
  tmg_email: string;
  google_email: string;
  chatwork_id: string | null;
}

/**
 * カスタムトークン JWT の payload から発行元 Firebase プロジェクト ID を取得する
 * iss が "firebase-adminsdk-xxx@PROJECT_ID.iam.gserviceaccount.com" の形式
 */
export function getProjectIdFromCustomToken(token: string): string | null {
  try {
    const parts = token.split(".");
    if (parts.length !== 3) return null;
    const payloadB64 = parts[1].replace(/-/g, "+").replace(/_/g, "/");
    const payload = JSON.parse(atob(payloadB64)) as { iss?: string };
    const iss = payload.iss;
    if (!iss || typeof iss !== "string") return null;
    const match = iss.match(/@([^.]+)\.iam\.gserviceaccount\.com$/);
    return match ? match[1] : null;
  } catch {
    return null;
  }
}

/**
 * localhost かどうかを判定
 */
export function isLocalhost(): boolean {
  if (typeof window === "undefined") return false;
  return (
    window.location.hostname === "localhost" ||
    window.location.hostname === "127.0.0.1"
  );
}

/**
 * 開発環境用のダミーユーザーを作成
 */
export function createMockUser(): User {
  return {
    uid: "mock-user-id",
    email: "dev@example.com",
    displayName: "開発ユーザー",
    photoURL: null,
    emailVerified: true,
    isAnonymous: false,
    metadata: {},
    providerData: [],
    refreshToken: "",
    tenantId: null,
    delete: async () => {},
    getIdToken: async () => "mock-token",
    getIdTokenResult: async () => ({
      token: "mock-token",
      claims: {},
      authTime: new Date().toISOString(),
      issuedAtTime: new Date().toISOString(),
      expirationTime: new Date(Date.now() + 3600000).toISOString(),
      signInProvider: null,
      signInSecondFactor: null,
    }),
    reload: async () => {},
    toJSON: () => ({}),
    phoneNumber: null,
    providerId: "google.com",
  } as User;
}

/**
 * 開発環境用のダミー社員情報を作成
 */
export function createMockEmployee(): Employee {
  return {
    employee_number: "DEV001",
    name: "開発ユーザー",
    location: "東京本社",
    department: "開発部",
    role: "開発者",
    tmg_email: "dev@tmg.co.jp",
    google_email: "dev@example.com",
    chatwork_id: null,
  };
}

/**
 * Google ログイン
 */
export async function signInWithGoogle(): Promise<User> {
  const auth = getFirebaseAuth();
  if (!auth) {
    throw new Error("Firebase Auth is not initialized");
  }

  const provider = new GoogleAuthProvider();
  provider.setCustomParameters({
    prompt: "select_account",
  });

  const result = await signInWithPopup(auth, provider);
  return result.user;
}

/**
 * ログアウト
 */
export async function logOut(): Promise<void> {
  const auth = getFirebaseAuth();
  if (!auth) {
    throw new Error("Firebase Auth is not initialized");
  }

  await signOut(auth);
}

/**
 * 認証状態の監視
 */
export function onAuthStateChange(
  callback: (user: User | null) => void
): () => void {
  const auth = getFirebaseAuth();
  if (!auth) {
    return () => {};
  }

  return onAuthStateChanged(auth, callback);
}

/**
 * Firebase 認証エラーを日本語メッセージに変換
 */
export function getAuthErrorMessage(error: AuthError): string {
  const errorMessages: Record<string, string> = {
    "auth/popup-closed-by-user": "ログインがキャンセルされました",
    "auth/popup-blocked":
      "ポップアップがブロックされました。ポップアップを許可してください。",
    "auth/cancelled-popup-request": "ログインがキャンセルされました",
    "auth/network-request-failed":
      "ネットワークエラーが発生しました。接続を確認してください。",
    "auth/too-many-requests":
      "リクエストが多すぎます。しばらく待ってから再試行してください。",
    "auth/user-disabled": "このアカウントは無効化されています",
    "auth/operation-not-allowed": "この認証方法は許可されていません",
    "auth/internal-error": "内部エラーが発生しました。再試行してください。",
    "auth/invalid-custom-token":
      "ポータルからのトークンが無効です。トークン期限切れの場合はポータルで再度ログインしてください。",
    "auth/custom-token-mismatch":
      "トークンのプロジェクトと子サイトの設定が一致していません。NEXT_PUBLIC_FIREBASE_PROJECT_ID を確認してください。",
  };

  return errorMessages[error.code] || `認証エラー: ${error.message}`;
}
