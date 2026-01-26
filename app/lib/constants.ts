export const MODES = [
  {
    id: "polish",
    label: "ブラッシュアップ",
    guide: "レイアウトはそのままで、文字の読みやすさやくっきり感だけを整えます。まずは雰囲気を変えずに仕上げたいときにおすすめです。",
  },
  {
    id: "style_impact",
    label: "インパクト",
    guide: "赤・黄・黒を基調に、太めの文字で訴求力のある見た目にします。YouTubeのサムネイルやキャッチーな告知に向いています。",
  },
  {
    id: "style_luxury",
    label: "リッチ",
    guide: "黒×金や紺×銀などで、余白を活かした上品なトーンにします。ブランドや高単価商品の訴求におすすめです。",
  },
  {
    id: "style_official",
    label: "公式",
    guide: "紺・白・グレーで、すっきりした文字とレイアウトに整えます。企業・自治体の案内や信頼感のある告知向けです。",
  },
  {
    id: "style_emo",
    label: "エモ",
    guide: "パステルや紫系の色味と、レトロ〜ゲーム風のフォントで、Z世代向けのかわいらしい雰囲気にします。",
  },
  {
    id: "style_ugc",
    label: "UGC",
    guide: "自然な明るさと、手書きやラフなレイアウトで「自分で撮った」感を出します。InstagramストーリーなどSNS向けです。",
  },
] as const;

export type ModeId = (typeof MODES)[number]["id"];

export const ASPECT_RATIOS = [
  { id: "9:16", label: "9:16 (縦長)" },
  { id: "16:9", label: "16:9 (横長)" },
  { id: "4:5", label: "4:5" },
  { id: "4:3", label: "4:3" },
  { id: "1:1", label: "1:1 (スクエア)" },
  { id: "custom", label: "その他" },
] as const;

export type AspectRatioId = (typeof ASPECT_RATIOS)[number]["id"];

export const ACCEPT_IMAGE = "image/png,image/jpeg,image/webp";

export const COMPOSITION_SLIDER_MIN = 0;
export const COMPOSITION_SLIDER_MAX = 100;
export const COMPOSITION_SLIDER_DEFAULT = 50;

export const PROMPT_STRENGTH_MIN = 0.3;
export const PROMPT_STRENGTH_MAX = 0.9;
