/**
 * Supabase DB 状態確認
 * 実行: node scripts/check-db.mjs（app ディレクトリで）
 * .env.local に NEXT_PUBLIC_SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY が必要
 */

import { createClient } from "@supabase/supabase-js";
import dotenv from "dotenv";
import { existsSync } from "fs";
import { dirname, resolve } from "path";
import { fileURLToPath } from "url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const envLocal = resolve(__dirname, "..", ".env.local");
if (existsSync(envLocal)) {
  dotenv.config({ path: envLocal });
}

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error("[X] 環境変数が未設定: NEXT_PUBLIC_SUPABASE_URL / SUPABASE_SERVICE_ROLE_KEY");
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function checkDb() {
  console.log("=== Supabase DB 確認 ===\n");

  // prompt_templates
  const { count: ptCount, error: ptCountErr } = await supabase
    .from("prompt_templates")
    .select("*", { count: "exact", head: true });

  if (ptCountErr) {
    console.error("[X] prompt_templates:", ptCountErr.message);
  } else {
    console.log(`prompt_templates: ${ptCount ?? 0} 件`);
  }

  const { data: ptSample, error: ptSampleErr } = await supabase
    .from("prompt_templates")
    .select("id, name, category, sample_image_url, image_urls, style_json, slots_json, created_at")
    .order("created_at", { ascending: false })
    .limit(5);

  if (!ptSampleErr && ptSample?.length) {
    console.log("\n--- 直近5件 ---");
    ptSample.forEach((r, i) => {
      const hasStyle = !!r.style_json;
      const hasSlots = !!r.slots_json?.textSlots?.length;
      const hasImage = !!(r.sample_image_url || (Array.isArray(r.image_urls) && r.image_urls[0]));
      console.log(
        `  ${i + 1}. ${r.name || "(無名)"} | id: ${r.id?.slice(0, 20)}... | 画像:${hasImage ? "○" : "×"} style:${hasStyle ? "○" : "×"} slots:${hasSlots ? "○" : "×"}`
      );
    });
  }

  // swipe_lp_v3_projects
  const { count: v3Count, error: v3CountErr } = await supabase
    .from("swipe_lp_v3_projects")
    .select("*", { count: "exact", head: true });

  if (v3CountErr) {
    console.error("\n[X] swipe_lp_v3_projects:", v3CountErr.message);
  } else {
    console.log(`\nswipe_lp_v3_projects: ${v3Count ?? 0} 件`);
  }

  const { data: v3Sample } = await supabase
    .from("swipe_lp_v3_projects")
    .select("id, status, created_at")
    .order("created_at", { ascending: false })
    .limit(3);

  if (v3Sample?.length) {
    console.log("--- 直近3件 ---");
    v3Sample.forEach((r, i) => {
      console.log(`  ${i + 1}. status: ${r.status} | ${r.created_at}`);
    });
  }

  console.log("\n=== 完了 ===");
}

checkDb().catch((e) => {
  console.error(e);
  process.exit(1);
});
