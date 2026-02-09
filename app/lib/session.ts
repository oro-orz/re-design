import "server-only";
import { cookies } from "next/headers";
import crypto from "crypto";

const COOKIE_NAME = "re-design.session";
const MAX_AGE_SEC = 24 * 60 * 60; // 24h

function getSecret(): string {
  const secret = process.env.SESSION_SECRET;
  if (!secret || secret.length < 32) {
    throw new Error("SESSION_SECRET must be set and at least 32 characters");
  }
  return secret;
}

function base64UrlEncode(buf: Buffer): string {
  return buf.toString("base64url");
}

function base64UrlDecode(str: string): Buffer {
  return Buffer.from(str, "base64url");
}

function sign(payload: string): string {
  const secret = getSecret();
  return crypto.createHmac("sha256", secret).update(payload).digest("base64url");
}

export interface SessionPayload {
  email: string;
  user_id: string;
  exp: number;
}

/**
 * セッション用 JWT を発行する（署名付き）
 */
export function createSessionToken(payload: Omit<SessionPayload, "exp">): string {
  const exp = Math.floor(Date.now() / 1000) + MAX_AGE_SEC;
  const payloadObj = { ...payload, exp };
  const payloadStr = JSON.stringify(payloadObj);
  const header = base64UrlEncode(Buffer.from(JSON.stringify({ alg: "HS256", typ: "JWT" })));
  const payloadB64 = base64UrlEncode(Buffer.from(payloadStr));
  const signature = sign(`${header}.${payloadB64}`);
  return `${header}.${payloadB64}.${signature}`;
}

/**
 * セッション用 JWT を検証し、payload を返す。無効なら null。
 */
export function verifySessionToken(token: string): SessionPayload | null {
  try {
    const parts = token.split(".");
    if (parts.length !== 3) return null;
    const [, payloadB64, sig] = parts;
    const payloadStr = base64UrlDecode(payloadB64).toString("utf8");
    const expectedSig = sign(`${parts[0]}.${payloadB64}`);
    const sigBuf = Buffer.from(sig, "base64url");
    const expectedBuf = Buffer.from(expectedSig, "base64url");
    if (sigBuf.length !== expectedBuf.length || !crypto.timingSafeEqual(sigBuf, expectedBuf)) {
      return null;
    }
    const payload = JSON.parse(payloadStr) as SessionPayload;
    if (payload.exp && payload.exp < Math.floor(Date.now() / 1000)) return null;
    if (!payload.email || !payload.user_id) return null;
    return payload;
  } catch {
    return null;
  }
}

/**
 * Cookie からセッションを読み、検証して現在ユーザーを返す。
 * Server Actions / API で「認証が必要です」の代わりに使用。
 */
export async function getCurrentUserFromSession(): Promise<{
  email: string;
  id: string;
} | null> {
  const cookieStore = await cookies();
  const token = cookieStore.get(COOKIE_NAME)?.value;
  if (!token) return null;
  const payload = verifySessionToken(token);
  if (!payload) return null;
  return { email: payload.email, id: payload.user_id };
}

export function getSessionCookieName(): string {
  return COOKIE_NAME;
}

export function getSessionMaxAge(): number {
  return MAX_AGE_SEC;
}
