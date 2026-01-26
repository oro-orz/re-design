#!/usr/bin/env node
/**
 * AUTH_USERS を読み取り、Supabase auth.users に登録し、app_users に社員番号・氏名・メールを保存する。
 * 形式: 社員番号:氏名:メール:パスワード （カンマ区切りで複数）。氏名にコロンは含めないこと。
 *
 * 使い方: npm run seed  （app ディレクトリで実行）
 */

import dotenv from "dotenv";
import { existsSync } from "fs";
import { dirname, resolve } from "path";
import { fileURLToPath } from "url";
import { createClient } from "@supabase/supabase-js";

const __dirname = dirname(fileURLToPath(import.meta.url));
const envLocal = resolve(__dirname, "..", ".env.local");
if (existsSync(envLocal)) {
  dotenv.config({ path: envLocal });
}

function parseAuthUsers(envValue) {
  if (!envValue?.trim()) return [];
  const parts = envValue.trim().split(",").map((s) => s.trim()).filter(Boolean);
  const entries = [];
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

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
const authUsers = process.env.AUTH_USERS;

if (!supabaseUrl || !serviceKey) {
  console.error("NEXT_PUBLIC_SUPABASE_URL と SUPABASE_SERVICE_ROLE_KEY を .env.local に設定してください。");
  process.exit(1);
}
if (!authUsers?.trim()) {
  console.error(
    "AUTH_USERS を .env.local に設定してください。形式: 社員番号:氏名:メール:パスワード （カンマ区切り）"
  );
  process.exit(1);
}

const supabase = createClient(supabaseUrl, serviceKey, {
  auth: { autoRefreshToken: false, persistSession: false },
});
const entries = parseAuthUsers(authUsers);
if (entries.length === 0) {
  console.error("AUTH_USERS に有効な 社員番号:氏名:メール:パスワード がありません。");
  process.exit(1);
}

async function listUsersByEmails(emails) {
  const { data, error } = await supabase.auth.admin.listUsers({ perPage: 1000 });
  if (error) throw error;
  const map = new Map();
  for (const u of data.users) {
    if (emails.includes(u.email)) map.set(u.email, u.id);
  }
  return map;
}

async function main() {
  const emails = entries.map((e) => e.email);
  const existingAuth = await listUsersByEmails(emails);

  for (const { employeeNumber, name, email, password } of entries) {
    const authId = existingAuth.get(email);
    let resolvedAuthId = authId;

    if (authId) {
      const { error } = await supabase.auth.admin.updateUserById(authId, { password });
      if (error) {
        console.error(`更新失敗 ${email}:`, error.message);
        continue;
      }
      console.log(`auth 更新: ${email}`);
    } else {
      const { data, error } = await supabase.auth.admin.createUser({
        email,
        password,
        email_confirm: true,
      });
      if (error) {
        console.error(`作成失敗 ${email}:`, error.message);
        continue;
      }
      resolvedAuthId = data.user.id;
      console.log(`auth 作成: ${email}`);
    }

    const { error: upsertErr } = await supabase.from("app_users").upsert(
      {
        employee_number: employeeNumber,
        name,
        email,
        auth_user_id: resolvedAuthId,
      },
      { onConflict: "email" }
    );
    if (upsertErr) {
      console.error(`app_users upsert 失敗 ${email}:`, upsertErr.message);
      continue;
    }
    console.log(`app_users 登録: ${employeeNumber} ${name} (${email})`);
  }
  console.log("完了.");
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
