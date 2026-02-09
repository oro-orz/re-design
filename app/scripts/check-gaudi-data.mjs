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
  console.error("[X] 環境変数が設定されていません");
  console.error("NEXT_PUBLIC_SUPABASE_URL:", supabaseUrl ? "設定済み" : "未設定");
  console.error("SUPABASE_SERVICE_ROLE_KEY:", supabaseKey ? "設定済み" : "未設定");
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function checkGaudiData() {
  console.log("[>] Gaudí 2.0 データ確認中...\n");

  // 最新のプロジェクトを取得
  const { data: projects, error } = await supabase
    .from("swipe_lp_projects")
    .select("*")
    .order("created_at", { ascending: false })
    .limit(5);

  if (error) {
    console.error("[X] エラー:", error.message);
    return;
  }

  if (!projects || projects.length === 0) {
    console.log("[!] プロジェクトが見つかりません");
    return;
  }

  console.log(`[*] 最新の ${projects.length} 件のプロジェクト:\n`);

  projects.forEach((project, index) => {
    console.log("=".repeat(80));
    console.log(`プロジェクト ${index + 1}: ${project.project_name}`);
    console.log("=".repeat(80));
    console.log(`ID: ${project.id}`);
    console.log(`作成日時: ${new Date(project.created_at).toLocaleString("ja-JP")}`);
    console.log(`入力タイプ: ${project.input_type}`);
    console.log(`URL: ${project.input_url || project.input_image_url || "N/A"}`);
    console.log(`ステータス: ${project.status}`);
    console.log();

    // Phase 1: Re:Design 分析
    if (project.phase1) {
      console.log("[OK] Re:Design Phase 1: 完了");
      const p1 = project.phase1;
      console.log(`   - Goal: ${p1.goal ? "あり" : "なし"}`);
      console.log(`   - Persona: ${p1.persona ? "あり" : "なし"}`);
      console.log(`   - Competitors: ${Array.isArray(p1.competitors) ? p1.competitors.length : 0} 件`);
      console.log(`   - SWOT: ${p1.swot ? "あり" : "なし"}`);
      console.log(`   - Market Trend: ${p1.market_trend ? "あり" : "なし"}`);
    } else {
      console.log("[--] Re:Design Phase 1: 未実行");
    }
    console.log();

    // Gaudí マーケティング分析
    if (project.marketing_analysis) {
      const ma = project.marketing_analysis;
      console.log("[OK] Gaudí マーケティング分析: 完了");
      console.log(`   - ビジネスタイプ: ${ma.businessType}`);
      console.log(`   - ターゲット: ${ma.target}`);
      if (ma.painPoints?.length) {
        console.log("   - 痛み:");
        ma.painPoints.forEach((pain, i) => {
          console.log(`      ${i + 1}. ${pain}`);
        });
      }
      console.log(`   - ソリューション: ${ma.solution}`);
      console.log(`   - 感情トリガー: ${ma.emotionalTrigger}`);
      console.log();

      // 3C 分析
      if (ma.framework?.threeC) {
        const c = ma.framework.threeC;
        console.log("   - 3C 分析:");
        console.log(`      Customer: ${(c.customer || "").substring(0, 100)}${(c.customer?.length || 0) > 100 ? "..." : ""}`);
        console.log(`      Competitor: ${(c.competitor || "").substring(0, 100)}${(c.competitor?.length || 0) > 100 ? "..." : ""}`);
        console.log(`      Company: ${(c.company || "").substring(0, 100)}${(c.company?.length || 0) > 100 ? "..." : ""}`);
        console.log();
      }

      // AIDMA
      if (ma.framework?.aidma) {
        const a = ma.framework.aidma;
        console.log("   - AIDMA:");
        console.log(`      Attention: ${(a.attention || "").substring(0, 80)}${(a.attention?.length || 0) > 80 ? "..." : ""}`);
        console.log(`      Interest: ${(a.interest || "").substring(0, 80)}${(a.interest?.length || 0) > 80 ? "..." : ""}`);
        console.log(`      Desire: ${(a.desire || "").substring(0, 80)}${(a.desire?.length || 0) > 80 ? "..." : ""}`);
        console.log(`      Memory: ${(a.memory || "").substring(0, 80)}${(a.memory?.length || 0) > 80 ? "..." : ""}`);
        console.log(`      Action: ${(a.action || "").substring(0, 80)}${(a.action?.length || 0) > 80 ? "..." : ""}`);
      }
    } else {
      console.log("[--] Gaudí マーケティング分析: 未実行");
    }
    console.log();

    // スライド構成
    if (project.slides && project.slides.length > 0) {
      console.log(`[OK] スライド構成: ${project.slides.length} 枚`);
      project.slides.forEach((slide) => {
        console.log(`   ${slide.number}. [${slide.purpose}] ${slide.message}`);
        if (slide.subMessage) {
          console.log(`      └─ ${slide.subMessage}`);
        }
        console.log(`      感情: ${slide.emotion || "N/A"}`);
      });
    } else {
      console.log("[--] スライド構成: 未生成");
    }
    console.log();
  });

  // design_styles テーブル確認
  console.log("=".repeat(80));
  console.log("[*] デザインスタイルライブラリ");
  console.log("=".repeat(80));

  const { data: styles, error: stylesError } = await supabase
    .from("design_styles")
    .select("id, name, category, tags, is_public, usage_count")
    .limit(10);

  if (stylesError) {
    console.log("[--] design_styles テーブル: 未作成またはエラー");
  } else if (!styles || styles.length === 0) {
    console.log("[!] スタイルが登録されていません（Phase 3 で登録予定）");
  } else {
    console.log(`[OK] ${styles.length} 件のスタイルが登録済み:`);
    styles.forEach((style) => {
      console.log(`   - ${style.name} (${style.category}) ${style.is_public ? "[public]" : "[private]"} 使用回数: ${style.usage_count}`);
    });
  }
  console.log();

  // 統計情報
  console.log("=".repeat(80));
  console.log("[*] 統計情報");
  console.log("=".repeat(80));

  const { count: totalProjects } = await supabase
    .from("swipe_lp_projects")
    .select("*", { count: "exact", head: true });

  const { count: withMarketing } = await supabase
    .from("swipe_lp_projects")
    .select("*", { count: "exact", head: true })
    .not("marketing_analysis", "is", null);

  const { count: withSlides } = await supabase
    .from("swipe_lp_projects")
    .select("*", { count: "exact", head: true })
    .not("slides", "eq", "[]");

  const total = totalProjects ?? 0;
  const marketing = withMarketing ?? 0;
  const slides = withSlides ?? 0;

  console.log(`総プロジェクト数: ${total}`);
  console.log(`マーケティング分析完了: ${marketing} (${total > 0 ? Math.round((marketing / total) * 100) : 0}%)`);
  console.log(`スライド構成完了: ${slides} (${total > 0 ? Math.round((slides / total) * 100) : 0}%)`);
  console.log();
}

checkGaudiData().catch(console.error);
