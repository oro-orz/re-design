/**
 * AUTH_USERS のパース。
 * 形式: 社員番号:氏名:メール:パスワード （カンマ区切りで複数）
 * 氏名にコロンは含めないこと。
 */

export type AuthUserEntry = {
  employeeNumber: string;
  name: string;
  email: string;
  password: string;
};

export function parseAuthUsers(envValue: string | undefined): AuthUserEntry[] {
  if (!envValue?.trim()) return [];
  const raw = envValue.trim();
  const entries: AuthUserEntry[] = [];
  const parts = raw.split(",").map((s) => s.trim()).filter(Boolean);
  for (const part of parts) {
    const segs = part.split(":").map((s) => s.trim());
    if (segs.length < 4) continue;
    const [employeeNumber, name, email, password] = segs;
    if (employeeNumber && name && email && password) {
      entries.push({ employeeNumber, name, email, password });
    }
  }
  return entries;
}
