/**
 * Gaudí 2.0: マーケティング分析（3C・AIDMA フレームワーク）
 * 既存の Re:Design Phase1 とは別レイヤー
 */

import { openai, OPENAI_CHAT_MODEL } from "@/lib/openai";
import { fetchHtml } from "@/lib/fetch-html";
import { extractImages, extractTextFromHtml } from "@/lib/analyzer";
import { runGoogleVisionOCR } from "@/lib/ocr-google";
import type { MarketingAnalysis } from "@/types/swipe-lp";

const MAX_OCR_IMAGES = parseInt(process.env.MAX_OCR_IMAGES || "5", 10);

export interface RunMarketingAnalysisOptions {
  inputType: "url" | "image";
  /** URL 入力時: ウェブページURL。画像入力時: 画像URL（Supabase Storage 等） */
  url?: string;
  /** 画像 Blob（FormData から直接渡す場合のみ） */
  imageBlob?: Blob;
}

/**
 * URL または画像からマーケティング分析（3C・AIDMA）を実行
 */
export async function runMarketingAnalysis(
  options: RunMarketingAnalysisOptions
): Promise<MarketingAnalysis> {
  const { inputType, url, imageBlob } = options;

  console.log("[Gaudí Marketing] Starting analysis...", { inputType, url: url?.slice(0, 60) });

  let htmlText = "";
  let imageUrls: string[] = [];
  let ocrTexts: string[] = [];

  if (inputType === "url" && url) {
    try {
      const html = await fetchHtml(url);
      htmlText = extractTextFromHtml(html);
      const images = extractImages(html, url);
      imageUrls = images
        .sort((a, b) => b.fileSize - a.fileSize)
        .slice(0, MAX_OCR_IMAGES)
        .map((img) => img.url);

      console.log("[Gaudí Marketing] Extracted", {
        htmlLength: htmlText.length,
        imageCount: imageUrls.length,
      });

      if (process.env.GOOGLE_VISION_API_KEY && imageUrls.length > 0) {
        console.log("[Gaudí Marketing] Running OCR on", imageUrls.length, "images");
        const ocrResults = await Promise.all(
          imageUrls.map((imgUrl) =>
            runGoogleVisionOCR({ imageUrl: imgUrl }).catch((err) => {
              console.warn("[Gaudí Marketing] OCR failed for", imgUrl.slice(0, 50), (err as Error).message);
              return "";
            })
          )
        );
        ocrTexts = ocrResults.filter(Boolean);
        console.log("[Gaudí Marketing] OCR completed", ocrTexts.length, "texts extracted");
      }
    } catch (error) {
      console.error("[Gaudí Marketing] Content extraction failed", error);
      throw new Error("コンテンツの取得に失敗しました");
    }
  } else if (inputType === "image") {
    try {
      let base64: string;
      if (imageBlob) {
        base64 = await blobToBase64(imageBlob);
      } else if (url) {
        base64 = await fetchImageAsBase64(url);
      } else {
        throw new Error("画像の URL または Blob が必要です");
      }
      const ocrText = await runGoogleVisionOCR({ imageContent: base64 });
      ocrTexts = ocrText ? [ocrText] : [];
      console.log("[Gaudí Marketing] Image OCR completed");
    } catch (error) {
      console.error("[Gaudí Marketing] Image OCR failed", error);
      throw new Error("画像の分析に失敗しました");
    }
  } else {
    throw new Error("inputType が url の場合は url が必須です");
  }

  try {
    const response = await openai.chat.completions.create({
      model: OPENAI_CHAT_MODEL,
      messages: [
        {
          role: "system",
          content: `あなたはマーケティング戦略コンサルタントです。
以下のコンテンツを分析し、マーケティングフレームワークを適用してください。

## 分析フレームワーク

### 1. 3C分析
- Customer（顧客）: ターゲット層、ペルソナ、ニーズ、痛み
- Competitor（競合）: 競合の訴求ポイント、差別化要素
- Company（自社）: 強み、独自性、提供価値

### 2. AIDMA
- Attention（注意）: どう気づかせるか
- Interest（興味）: どう興味を持たせるか
- Desire（欲求）: どう欲しいと思わせるか
- Memory（記憶）: どう覚えてもらうか
- Action（行動）: どう行動させるか

### 3. 感情トリガー
- ターゲットの抱える痛み・不安
- それを解決した後の理想の状態
- 感情の変化（例: 焦り → 安心、不満 → 満足）

### 4. ポジショニング・訴求軸（スライド生成で必須）
- **positioning**: 業界内での立ち位置。競合との違いを踏まえ、このサービスならではの位置づけ（例: 「本気の婚活」vs「気軽な出会い・即時性」）
- **benefitAngle**: 訴求の軸。何を一番打ち出すか（例: タイパの良さ、即効性、手軽さ、ワクワク感、信頼性）
- **desireTimeHorizon**: ターゲットの欲求の時間軸。「短期的」= 今日・今週の欲求（例: 今夜誰かと話したい）、「長期的」= 人生・将来の不安や希望（例: 人生のチャンスを逃したくない）

## 分析対象コンテンツ

HTMLテキスト:
${htmlText}

OCRテキスト:
${ocrTexts.join("\n\n---\n\n")}

## 出力形式（JSON）

{
  "businessType": "業種・業態（例: 婚活マッチングアプリ）",
  "target": "ターゲット層の詳細（例: 25-35歳独身女性、結婚願望あり、仕事が忙しい）",
  "painPoints": ["具体的な痛み1", "具体的な痛み2", "具体的な痛み3"],
  "solution": "提供するソリューション（簡潔に）",
  "emotionalTrigger": "感情の変化（例: 焦り・不安 → 希望・安心）",
  "positioning": "サービスのポジショニング（業界内の立ち位置。競合との違いを踏まえた一言）",
  "benefitAngle": "訴求の軸（タイパ・即効性・手軽さ・ワクワク感など、このサービスで打ち出す価値）",
  "desireTimeHorizon": "短期的 または 長期的（ターゲットの欲求が今日・今週か、人生・将来か）",
  "framework": {
    "threeC": {
      "customer": "顧客のニーズ・ペルソナの詳細",
      "competitor": "競合の訴求ポイント・差別化要素",
      "company": "自社の強み・独自性・提供価値"
    },
    "aidma": {
      "attention": "どう気づかせるか（具体的な施策）",
      "interest": "どう興味を持たせるか（具体的な施策）",
      "desire": "どう欲しいと思わせるか（具体的な施策）",
      "memory": "どう覚えてもらうか（具体的な施策）",
      "action": "どう行動させるか（具体的なCTA）"
    }
  }
}

必ずJSON形式で回答してください。`,
        },
      ],
      response_format: { type: "json_object" },
      temperature: 0.7,
    });

    const result = JSON.parse(response.choices[0].message.content!) as MarketingAnalysis;
    console.log("[Gaudí Marketing] Analysis completed", result.businessType);
    return result;
  } catch (error) {
    console.error("[Gaudí Marketing] GPT analysis failed", error);
    throw new Error("マーケティング分析に失敗しました");
  }
}

async function blobToBase64(blob: Blob): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => {
      const dataUrl = reader.result as string;
      const base64 = dataUrl.split(",")[1];
      resolve(base64 ?? "");
    };
    reader.onerror = reject;
    reader.readAsDataURL(blob);
  });
}

/**
 * HTTPS 画像URLを fetch して base64 に変換（Google Vision API の imageUri は GCS 専用のため）
 */
async function fetchImageAsBase64(imageUrl: string): Promise<string> {
  const res = await fetch(imageUrl, { next: { revalidate: 0 } });
  if (!res.ok) {
    throw new Error(`画像の取得に失敗しました: ${res.status}`);
  }
  const buffer = await res.arrayBuffer();
  const bytes = new Uint8Array(buffer);
  let binary = "";
  for (let i = 0; i < bytes.byteLength; i++) {
    binary += String.fromCharCode(bytes[i]);
  }
  return btoa(binary);
}
