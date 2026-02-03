export interface RunGoogleVisionOCROptions {
  imageUrl?: string;
  imageContent?: string;
}

/**
 * Google Vision API で TEXT_DETECTION を実行し、検出したテキストを返す。
 * サーバー専用（Server Action から直接呼ぶ）。
 */
export async function runGoogleVisionOCR(
  options: RunGoogleVisionOCROptions
): Promise<string> {
  const { imageUrl, imageContent } = options;
  const apiKey = process.env.GOOGLE_VISION_API_KEY;

  if (!apiKey) {
    throw new Error("GOOGLE_VISION_API_KEY is not set in .env.local");
  }

  if (!imageContent && !imageUrl) {
    throw new Error("imageUrl or imageContent is required");
  }

  let imagePayload: { source?: { imageUri: string }; content?: string };
  if (imageContent) {
    imagePayload = {
      content: String(imageContent).replace(/\s/g, ""),
    };
  } else if (typeof imageUrl === "string" && imageUrl.startsWith("data:")) {
    const base64 = imageUrl
      .replace(/^data:image\/\w+;base64,/, "")
      .replace(/\s/g, "");
    imagePayload = { content: base64 };
  } else if (typeof imageUrl === "string") {
    imagePayload = { source: { imageUri: imageUrl } };
  } else {
    throw new Error("imageUrl or imageContent is required");
  }

  const response = await fetch(
    `https://vision.googleapis.com/v1/images:annotate?key=${apiKey}`,
    {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        requests: [
          {
            image: imagePayload,
            features: [{ type: "TEXT_DETECTION", maxResults: 1 }],
            imageContext: { languageHints: ["ja"] },
          },
        ],
      }),
    }
  );

  const rawText = await response.text();

  if (!response.ok) {
    let errorMessage = "OCR failed";
    try {
      const error = JSON.parse(rawText);
      errorMessage = error?.error?.message ?? error?.error ?? errorMessage;
    } catch {
      if (rawText) errorMessage = rawText.slice(0, 200);
    }
    throw new Error(errorMessage);
  }

  let data: { responses?: Array<{ fullTextAnnotation?: { text?: string } }> };
  try {
    data = JSON.parse(rawText);
  } catch {
    throw new Error("Invalid response from Vision API");
  }

  return (data.responses?.[0]?.fullTextAnnotation?.text ?? "").trim();
}
