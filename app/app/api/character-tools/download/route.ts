import { NextRequest, NextResponse } from "next/server";

const ALLOWED_HOST_PATTERNS = [
  /^([a-z0-9-]+\.)?replicate\.delivery$/i,
  /\.supabase\.co$/i,
];

function isAllowedUrl(urlStr: string): boolean {
  try {
    const u = new URL(urlStr);
    if (u.protocol !== "https:") return false;
    const host = u.hostname.toLowerCase();
    return ALLOWED_HOST_PATTERNS.some((p) => p.test(host));
  } catch {
    return false;
  }
}

/**
 * GET ?url=... で画像を取得し、Content-Disposition: attachment で返す（同一タブで開かずダウンロードさせる）
 */
export async function GET(request: NextRequest) {
  const url = request.nextUrl.searchParams.get("url");
  if (!url || !isAllowedUrl(url)) {
    return NextResponse.json({ error: "Invalid url" }, { status: 400 });
  }
  try {
    const res = await fetch(url, { cache: "no-store" });
    if (!res.ok) {
      return NextResponse.json({ error: "Failed to fetch image" }, { status: 502 });
    }
    const contentType = res.headers.get("content-type") || "image/png";
    const buf = await res.arrayBuffer();
    const filename = `character-tool-${Date.now()}.${contentType.includes("webp") ? "webp" : "png"}`;
    return new NextResponse(buf, {
      headers: {
        "Content-Type": contentType,
        "Content-Disposition": `attachment; filename="${filename}"`,
      },
    });
  } catch (e) {
    console.error("Download proxy error:", e);
    return NextResponse.json({ error: "Download failed" }, { status: 502 });
  }
}
