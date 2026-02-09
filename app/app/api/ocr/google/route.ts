import { NextRequest, NextResponse } from "next/server";
import { runGoogleVisionOCR } from "@/lib/ocr-google";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { imageUrl, imageContent } = body;

    if (!imageContent && !imageUrl) {
      return NextResponse.json(
        { error: "imageUrl or imageContent is required" },
        { status: 400 }
      );
    }

    const text = await runGoogleVisionOCR({ imageUrl, imageContent });
    return NextResponse.json({ text });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Unknown error";
    const status =
      message.includes("GOOGLE_VISION_API_KEY") ? 500
      : message.includes("required") ? 400
      : 502;
    return NextResponse.json({ error: message }, { status });
  }
}
