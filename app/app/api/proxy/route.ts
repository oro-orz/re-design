import { NextRequest, NextResponse } from "next/server";
import { fetchHtml } from "@/lib/fetch-html";

export async function GET(request: NextRequest) {
  const url = request.nextUrl.searchParams.get("url");
  if (!url) {
    return NextResponse.json({ error: "url required" }, { status: 400 });
  }

  try {
    const text = await fetchHtml(url);
    return new NextResponse(text, {
      headers: { "Content-Type": "text/html; charset=utf-8" },
    });
  } catch (err) {
    const message = err instanceof Error ? err.message : "ページの取得に失敗しました";
    return NextResponse.json({ error: message }, { status: 502 });
  }
}
