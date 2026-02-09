import { initializeApp, getApps, cert, App } from 'firebase-admin/app';
import { getAuth, Auth } from 'firebase-admin/auth';

let app: App | undefined;
let auth: Auth | undefined;

function getCredentialFromEnv():
  | { projectId: string; clientEmail: string; privateKey: string }
  | null {
  // 1) サービスアカウント JSON 文字列（Vercel で FIREBASE_SERVICE_ACCOUNT_KEY や GOOGLE_APPLICATION_CREDENTIALS_JSON を使っている場合）
  const jsonKey =
    process.env.FIREBASE_SERVICE_ACCOUNT_KEY ??
    process.env.GOOGLE_APPLICATION_CREDENTIALS_JSON;
  if (jsonKey) {
    try {
      const parsed = JSON.parse(jsonKey) as {
        project_id?: string;
        client_email?: string;
        private_key?: string;
      };
      const key = parsed.private_key?.replace(/\\n/g, '\n');
      if (parsed.project_id && parsed.client_email && key) {
        return {
          projectId: parsed.project_id,
          clientEmail: parsed.client_email,
          privateKey: key,
        };
      }
    } catch (e) {
      console.error('Firebase Admin: サービスアカウント JSON のパースに失敗しました');
      return null;
    }
  }

  // 2) 個別の環境変数
  const projectId = process.env.FIREBASE_PROJECT_ID;
  const clientEmail = process.env.FIREBASE_CLIENT_EMAIL;
  const privateKey = process.env.FIREBASE_PRIVATE_KEY?.replace(/\\n/g, '\n');
  if (projectId && clientEmail && privateKey) {
    return { projectId, clientEmail, privateKey };
  }

  return null;
}

/**
 * Firebase Admin SDKの初期化
 * FIREBASE_SERVICE_ACCOUNT_KEY / GOOGLE_APPLICATION_CREDENTIALS_JSON（JSON文字列）
 * または FIREBASE_PROJECT_ID + FIREBASE_CLIENT_EMAIL + FIREBASE_PRIVATE_KEY で初期化
 */
export function getFirebaseAdmin() {
  // 既に初期化されている場合は既存のインスタンスを返す
  if (auth) {
    return auth;
  }

  const cred = getCredentialFromEnv();
  if (!cred) {
    if (process.env.NODE_ENV === 'development') {
      console.warn(
        'Firebase Admin SDK: 環境変数が設定されていません（FIREBASE_SERVICE_ACCOUNT_KEY または FIREBASE_PROJECT_ID/CLIENT_EMAIL/PRIVATE_KEY）'
      );
    }
    return null;
  }

  try {
    const existingApps = getApps();
    if (existingApps.length > 0) {
      app = existingApps[0];
    } else {
      app = initializeApp({
        credential: cert({
          projectId: cred.projectId,
          clientEmail: cred.clientEmail,
          privateKey: cred.privateKey,
        }),
      });
    }

    auth = getAuth(app);
    return auth;
  } catch (error: any) {
    console.error('Firebase Admin SDK初期化エラー:', error.message);
    return null;
  }
}

/**
 * Firebase ID トークンを検証し、デコード結果を返す。
 * カスタムトークンログイン時は ID トークンに email が含まれないことがあるため、
 * 無い場合は getUser(uid) でユーザー情報から取得する。
 */
export async function verifyFirebaseIdToken(
  idToken: string
): Promise<{ uid: string; email?: string } | null> {
  const adminAuth = getFirebaseAdmin();
  if (!adminAuth) return null;
  try {
    const decoded = await adminAuth.verifyIdToken(idToken);
    let email = decoded.email ?? undefined;
    if (!email && decoded.uid) {
      const userRecord = await adminAuth.getUser(decoded.uid);
      email = userRecord.email ?? undefined;
    }
    return {
      uid: decoded.uid,
      email,
    };
  } catch (err: any) {
    console.error("[supabase-session] verifyFirebaseIdToken failed:", err?.code ?? err?.message ?? err);
    return null;
  }
}
