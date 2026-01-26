#!/usr/bin/env node
/**
 * CSV からユーザーを読み取り、auth.users と app_users に登録する。
 * CSV: 社員番号,氏名,メールアドレス,パスワード（1行目ヘッダー、パスワード空はスキップ）
 *
 * 使い方: node scripts/seed-from-csv.mjs [CSVパス]
 * 例: npm run seed:csv
 *     npm run seed:csv -- "../業務用社員情報まとめ - ReDesign.csv"
 */

import dotenv from "dotenv";
import { existsSync, readFileSync } from "fs";
import { dirname, resolve } from "path";
import { fileURLToPath } from "url";
import { createClient } from "@supabase/supabase-js";

const __dirname = dirname(fileURLToPath(import.meta.url));
const root = resolve(__dirname, "..", "..");
const envLocal = resolve(__dirname, "..", ".env.local");
const defaultCsv = resolve(root, "業務用社員情報まとめ - ReDesign.csv");

if (existsSync(envLocal)) {
  dotenv.config({ path: envLocal });
}

const csvPath = process.argv[2] ? resolve(process.cwd(), process.argv[2]) : defaultCsv;

function parseCsv(path) {
  const raw = readFileSync(path, "utf-8");
  const lines = raw.split(/\r?\n/).map((s) => s.trim()).filter(Boolean);
  if (lines.length < 2) return [];
  const rows = [];
  for (let i = 1; i < lines.length; i++) {
    const cells = lines[i].split(",").map((s) => s.trim());
    const [employeeNumber, name, email, password] = cells;
    if (!employeeNumber || !name || !email || !password) continue;
    rows.push({ employeeNumber, name, email, password });
  }
  return rows;
}

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !serviceKey) {
  console.error("NEXT_PUBLIC_SUPABASE_URL と SUPABASE_SERVICE_ROLE_KEY を .env.local に設定してください。");
  process.exit(1);
}
if (!existsSync(csvPath)) {
  console.error(`CSV が見つかりません: ${csvPath}`);
  process.exit(1);
}

const entries = parseCsv(csvPath);
if (entries.length === 0) {
  console.error("CSV に有効な行がありません。");
  process.exit(1);
}

const supabase = createClient(supabaseUrl, serviceKey, {
  auth: { autoRefreshToken: false, persistSession: false },
});

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
  let ok = 0;
  let fail = 0;

  for (const { employeeNumber, name, email, password } of entries) {
    const authId = existingAuth.get(email);
    let resolvedAuthId = authId;

    if (authId) {
      const { error } = await supabase.auth.admin.updateUserById(authId, { password });
      if (error) {
        console.error(`更新失敗 ${email}:`, error.message);
        fail++;
        continue;
      }
    } else {
      const { data, error } = await supabase.auth.admin.createUser({
        email,
        password,
        email_confirm: true,
      });
      if (error) {
        console.error(`作成失敗 ${email}:`, error.message);
        fail++;
        continue;
      }
      resolvedAuthId = data.user.id;
    }

    const { error: upsertErr } = await supabase.from("app_users").upsert(
      {
        employee_number: String(employeeNumber),
        name,
        email,
        auth_user_id: resolvedAuthId,
      },
      { onConflict: "email" }
    );
    if (upsertErr) {
      console.error(`app_users upsert 失敗 ${email}:`, upsertErr.message);
      fail++;
      continue;
    }
    ok++;
  }
  console.log(`完了. 成功 ${ok}件${fail ? ` / 失敗 ${fail}件` : ""}`);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
