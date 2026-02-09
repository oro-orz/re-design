import * as cheerio from "cheerio";
import type { ImageData } from "@/types/analyzer";

const FILTER = {
  // 外部取得で400になるURLを除外
  excludeUrls: [
    "lazy.png",
    "pixel.gif",
    "tracking",
    "_next/image", // Next.js Image Optimization（直接取得で400）
  ],
  minFileSize: 1000,
};

function resolveImageUrl($: cheerio.CheerioAPI, $img: cheerio.Cheerio<any>, baseUrl: string): string | null {
  const $picture = $img.closest("picture");
  if ($picture.length) {
    const srcset = $picture.find("source").first().attr("srcset");
    if (srcset) {
      const first = srcset.split(",")[0]?.trim().split(/\s+/)[0];
      if (first) {
        try {
          return new URL(first, baseUrl).href;
        } catch {
          return null;
        }
      }
    }
  }
  const src = $img.attr("src") || $img.attr("data-src");
  if (!src) return null;
  try {
    return new URL(src, baseUrl).href;
  } catch {
    return null;
  }
}

function maybeRewriteLocalhost(url: string, baseUrl: string): string {
  if (process.env.NODE_ENV !== "development") return url;
  try {
    const parsed = new URL(url);
    const baseParsed = new URL(baseUrl);
    if (
      parsed.hostname === "localhost" ||
      parsed.hostname === "127.0.0.1" ||
      (parsed.protocol === "http:" && parsed.hostname.endsWith(".local"))
    ) {
      const baseDir = baseParsed.pathname.replace(/\/[^/]*$/, "/");
      const path = parsed.pathname.startsWith("/") ? parsed.pathname.slice(1) : parsed.pathname;
      return baseParsed.origin + baseDir + path + parsed.search;
    }
  } catch {
    /* ignore */
  }
  return url;
}

export function extractImages(html: string, baseUrl: string): ImageData[] {
  const $ = cheerio.load(html);
  const images: ImageData[] = [];
  let idx = 0;

  $("img").each((_, el) => {
    const $el = $(el);
    let url = resolveImageUrl($, $el, baseUrl);
    if (!url || url.startsWith("data:")) return;

    url = maybeRewriteLocalhost(url, baseUrl);

    const lower = url.toLowerCase();
    if (FILTER.excludeUrls.some((x) => lower.includes(x))) return;

    const w = parseInt($el.attr("width") ?? "0", 10) || 0;
    const h = parseInt($el.attr("height") ?? "0", 10) || 0;
    let fileSize = 0;
    if (w > 0 && h > 0) {
      const ext = url.split(".").pop()?.toLowerCase() ?? "";
      const q = ext === "webp" || ext === "avif" ? 0.2 : 0.3;
      fileSize = Math.ceil(w * h * 4 * q);
    }
    if (fileSize > 0 && fileSize < FILTER.minFileSize) return;

    images.push({
      id: `img-${idx++}`,
      url,
      alt: $el.attr("alt") ?? "",
      dimensions: { width: w, height: h },
      fileSize,
    });
  });

  return images;
}

const MAX_PARAGRAPHS = 10;
const MAX_LIST_ITEMS = 20;
/** 画像中心LP用: alt テキストは最大件数と合計文字数で制限 */
const MAX_ALT_ITEMS = 30;
const MAX_ALT_TOTAL_CHARS = 8000;

export function extractTextFromHtml(html: string): string {
  const $ = cheerio.load(html);

  const parts: string[] = [];

  const title = $("title").first().text().trim();
  if (title) {
    parts.push("【タイトル】", title);
  }

  const metaDesc =
    $('meta[name="description"]').attr("content")?.trim() ||
    $('meta[property="og:description"]').attr("content")?.trim();
  if (metaDesc) {
    parts.push("【メタ説明】", metaDesc);
  }

  const headings = $("h1, h2, h3")
    .map((_, el) => $(el).text().trim())
    .get()
    .filter(Boolean);
  const paragraphs = $("p")
    .map((_, el) => $(el).text().trim())
    .get()
    .filter(Boolean)
    .slice(0, MAX_PARAGRAPHS);
  const listItems = $("ul li, ol li")
    .map((_, el) => $(el).text().trim())
    .get()
    .filter(Boolean)
    .slice(0, MAX_LIST_ITEMS);

  if (headings.length) {
    parts.push("【見出し】", headings.join("\n"));
  }
  if (paragraphs.length) {
    parts.push("【本文】", paragraphs.join("\n"));
  }
  if (listItems.length) {
    parts.push("【リスト】", listItems.join("\n"));
  }

  const altTexts: string[] = [];
  let altTotalChars = 0;
  $("img").each((_, el) => {
    if (altTexts.length >= MAX_ALT_ITEMS || altTotalChars >= MAX_ALT_TOTAL_CHARS) return false;
    const alt = $(el).attr("alt")?.trim();
    if (!alt) return;
    const take = Math.min(alt.length, MAX_ALT_TOTAL_CHARS - altTotalChars);
    if (take > 0) {
      altTexts.push(take < alt.length ? alt.slice(0, take) : alt);
      altTotalChars += take;
    }
  });
  if (altTexts.length) {
    parts.push("【画像の説明】", altTexts.join("\n\n"));
  }

  return parts.join("\n\n").trim();
}
