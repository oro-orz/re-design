/**
 * SwipeLP v3 型定義
 */

import type { MarketingAnalysis } from "./swipe-lp";

export type SwipeLPv3Status =
  | "url_input"
  | "analyzing"
  | "analysis_done"
  | "supplement_input"
  | "slides_ready"
  | "prompts_ready";

/** スライドテキストのトーン（Step 3 で指定） */
export type OutputTone = "neutral" | "casual" | "professional" | "playful";

export interface SwipeLPv3Project {
  id: string;
  user_id: string;
  created_at: string;
  updated_at: string;
  input_url: string;
  status: SwipeLPv3Status;
  marketing_analysis?: MarketingAnalysis | null;
  user_supplement?: string | null;
  /** 特に強調したい点（Step 3） */
  emphasis_points?: string | null;
  /** テキストのトーン（Step 3） */
  output_tone?: OutputTone | string | null;
  /** スライド枚数指定 6|7|8（Step 3）。null のときは 6-8 枚で生成 */
  slide_count?: number | null;
  slides: SwipeLPv3Slide[];
  selected_template_id?: string | null;
}

export interface SwipeLPv3Slide {
  id: string;
  order: number;
  purpose: string;
  message: string;
  subMessage?: string;
  /** チェックリスト・キャプション等の追加テキスト（baseプロンプトの複数の「」ブロックを埋める） */
  additionalText?: string[];
  emotion?: string;
  /** このスライドで選択したデザインテンプレートID */
  selected_template_id?: string | null;
  /** true: 人物なし・背景単色・動画オーバーレイ用 */
  excludePerson?: boolean;
  prompt?: string;
  promptGeneratedAt?: string;
}

export interface PromptTemplate {
  id: string;
  name: string;
  sample_image_url?: string | null;
  base_prompt?: string | null;
  /** AI生成プロンプト（従来型・レガシー用） */
  prompt_text?: string | null;
  /** 参考画像URL一覧 */
  image_urls?: string[] | null;
  memo?: string | null;
  category?: string | null;
  subcategory?: string | null;
  /** 構造化: デザインスタイル定義（配色・レイアウト・フォント等） */
  style_json?: TemplateStyle | null;
  /** 構造化: テキストスロット定義 */
  slots_json?: TemplateSlots | null;
  created_at?: string;
  updated_at?: string;
}

/** 構造化テンプレートのスタイル定義 */
export interface TemplateStyle {
  photography: string;
  lighting: string;
  designStyle: string;
  layout: string;
  typography: string;
  colors: string;
  decorations: string[];
  mood: string;
}

export interface TemplateSlots {
  textSlots: TextSlot[];
}

export interface TextSlot {
  id: string;
  description: string;
}
