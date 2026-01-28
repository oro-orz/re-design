/**
 * Firebase 初期化
 * クライアントサイドでのみ使用
 */

import { initializeApp, getApps, FirebaseApp } from "firebase/app";
import { getAuth, Auth } from "firebase/auth";

const firebaseConfig = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID,
};

let app: FirebaseApp | undefined;
let auth: Auth | undefined;

/**
 * Firebase App を取得（未初期化の場合は初期化）
 */
export function getFirebaseApp(): FirebaseApp | undefined {
  if (typeof window === "undefined") {
    return undefined;
  }

  if (!app && getApps().length === 0) {
    try {
      app = initializeApp(firebaseConfig);
    } catch (error) {
      console.error("Firebase initialization error:", error);
      return undefined;
    }
  } else if (!app) {
    app = getApps()[0] as FirebaseApp;
  }

  return app;
}

/**
 * Firebase Auth を取得
 */
export function getFirebaseAuth(): Auth | undefined {
  if (typeof window === "undefined") {
    return undefined;
  }

  if (!auth) {
    const firebaseApp = getFirebaseApp();
    if (firebaseApp) {
      auth = getAuth(firebaseApp);
    }
  }

  return auth;
}
