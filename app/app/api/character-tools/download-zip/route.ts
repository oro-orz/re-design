import { NextRequest, NextResponse } from "next/server";
import JSZip from "jszip";

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
 * POST body: { urls: string[] }
 * 各URLの画像を取得してZIPにまとめ、1ファイルで返す
 */
export async function POST(request: NextRequest) {
  let body: { urls?: string[] };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid body" }, { status: 400 });
  }
  const urls = Array.isArray(body.urls) ? body.urls : [];
  if (urls.length === 0 || urls.length > 24) {
    return NextResponse.json({ error: "urls must be 1-24 items" }, { status: 400 });
  }
  const allowed = urls.filter((u) => typeof u === "string" && isAllowedUrl(u));
  if (allowed.length !== urls.length) {
    return NextResponse.json({ error: "Invalid url in list" }, { status: 400 });
  }

  const zip = new JSZip();
  const timestamp = Date.now();

  for (let i = 0; i < allowed.length; i++) {
    try {
      const res = await fetch(allowed[i], { cache: "no-store" });
      if (!res.ok) continue;
      const buf = await res.arrayBuffer();
      const ext = res.headers.get("content-type")?.includes("webp") ? "webp" : "png";
      zip.file(`multipose-${timestamp}-${i + 1}.${ext}`, buf);
    } catch {
      // skip failed image
    }
  }

  const zipBuf = await zip.generateAsync({ type: "arraybuffer" });
  const filename = `character-multipose-${timestamp}.zip`;
  const zipBlob = new Blob([zipBuf], { type: "application/zip" });

  return new NextResponse(zipBlob, {
    headers: {
      "Content-Type": "application/zip",
      "Content-Disposition": `attachment; filename="${filename}"`,
    },
  });
}
