import { NextResponse } from "next/server";
import { readFile } from "fs/promises";
import { join } from "path";

/**
 * フィードバック分析のテストAPI。
 * GET /api/test-generate で public/test.png を使って analyze を実行する。
 * ビルド時に OpenAI を読まないよう動的 import を使用。
 */
export async function GET() {
  try {
    const path = join(process.cwd(), "public", "test.png");
    const buf = await readFile(path);
    const base64 = buf.toString("base64");
    const imageUrl = `data:image/png;base64,${base64}`;

    const mode = "polish" as const;
    const aspectRatio = "9:16";

    const { analyze } = await import("@/actions/analyze");

    const analyzeRes = await analyze({
      imageUrl,
      mode,
      aspectRatio,
    });
    if ("error" in analyzeRes) {
      return NextResponse.json(
        { ok: false, step: "analyze", error: analyzeRes.error },
        { status: 500 }
      );
    }

    return NextResponse.json({
      ok: true,
      feedback: analyzeRes.feedback,
    });
  } catch (e) {
    const msg = e instanceof Error ? e.message : String(e);
    return NextResponse.json(
      { ok: false, error: msg },
      { status: 500 }
    );
  }
}
