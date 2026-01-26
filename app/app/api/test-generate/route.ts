import { NextResponse } from "next/server";
import { readFile } from "fs/promises";
import { join } from "path";

/**
 * 画像生成フロー確認用のテストAPI。
 * GET /api/test-generate で public/test.png を使って analyze → generate を実行する。
 * ビルド時に OpenAI/Replicate を読まないよう動的 import を使用。
 */
export async function GET() {
  try {
    const path = join(process.cwd(), "public", "test.png");
    const buf = await readFile(path);
    const base64 = buf.toString("base64");
    const imageUrl = `data:image/png;base64,${base64}`;
    const projectId = crypto.randomUUID();

    const mode = "polish" as const;
    const aspectRatio = "1:1";
    const intensity = 2;

    const { analyze } = await import("@/actions/analyze");
    const { generateImage } = await import("@/actions/generate");

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

    const genRes = await generateImage({
      projectId,
      imageUrl,
      fluxPrompt: analyzeRes.flux_prompt,
      mode,
      feedbackText: analyzeRes.feedback,
      intensity,
    });
    if ("error" in genRes) {
      return NextResponse.json(
        { ok: false, step: "generate", error: genRes.error },
        { status: 500 }
      );
    }

    return NextResponse.json({
      ok: true,
      generatedImageUrl: genRes.generatedImageUrl,
      feedback: analyzeRes.feedback,
      fluxPromptLength: analyzeRes.flux_prompt.length,
    });
  } catch (e) {
    const msg = e instanceof Error ? e.message : String(e);
    return NextResponse.json(
      { ok: false, error: msg },
      { status: 500 }
    );
  }
}
