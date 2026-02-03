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
  /** ビジュアル方向性。人物/商品/空間、撮影イメージのヒント */
  visualHint?: string;
  /** 前スライドとの接続・ストーリー上の役割 */
  storyNote?: string;
  /** このスライドで伝えたい1行サマリー */
  keyTakeaway?: string;
  /** 代替キャッチコピー案（A/Bテスト用） */
  messageAlternatives?: string[];
  /** CTAスライド時: ボタン文言 */
  ctaButtonText?: string;
  /** CTAスライド時: 緊急性・限定感 */
  ctaUrgency?: string;
  /** ナレーション原稿（VO・読み上げ用） */
  narration?: string;
  /** @deprecated ライブラリでプロンプト生成 */
  selected_template_id?: string | null;
  /** @deprecated ライブラリでプロンプト生成 */
  excludePerson?: boolean;
  /** @deprecated ライブラリでプロンプト生成 */
  prompt?: string;
  /** @deprecated ライブラリでプロンプト生成 */
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
