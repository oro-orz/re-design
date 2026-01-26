import { initializeApp, getApps, cert, App } from 'firebase-admin/app';
import { getAuth, Auth } from 'firebase-admin/auth';

let app: App | undefined;
let auth: Auth | undefined;

/**
 * Firebase Admin SDKの初期化
 * 環境変数が設定されている場合のみ初期化
 */
export function getFirebaseAdmin() {
  // 既に初期化されている場合は既存のインスタンスを返す
  if (auth) {
    return auth;
  }

  const projectId = process.env.FIREBASE_PROJECT_ID;
  const clientEmail = process.env.FIREBASE_CLIENT_EMAIL;
  const privateKey = process.env.FIREBASE_PRIVATE_KEY?.replace(/\\n/g, '\n');

  // 環境変数が設定されていない場合はnullを返す
  if (!projectId || !clientEmail || !privateKey) {
    if (process.env.NODE_ENV === 'development') {
      console.warn('Firebase Admin SDK: 環境変数が設定されていません');
    }
    return null;
  }

  try {
    // 既存のアプリインスタンスを確認
    const existingApps = getApps();
    if (existingApps.length > 0) {
      app = existingApps[0];
    } else {
      app = initializeApp({
        credential: cert({
          projectId,
          clientEmail,
          privateKey,
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
