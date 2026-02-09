export interface ImageData {
  id: string;
  url: string;
  alt: string;
  dimensions: { width: number; height: number };
  fileSize: number;
}

export interface ExtractedContent {
  images: ImageData[];
  htmlText: string;
  ocrTexts: string[];
}
