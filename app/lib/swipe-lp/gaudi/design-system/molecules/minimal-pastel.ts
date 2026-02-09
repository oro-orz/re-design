/**
 * Minimal-Pastel スタイル（シンプル版）
 */

import type { PromptTemplate } from "../../prompts/template";
import type { Slide } from "@/types/swipe-lp";

export function generateMinimalPastelPrompt(slide: Slide): PromptTemplate {
  const colorScheme = getColorSchemeForPurpose(slide.purpose);

  return {
    text: {
      main: slide.message,
      sub: slide.subMessage,
    },
    colors: {
      background: {
        main: colorScheme.background,
        pattern: "なし（フラット）",
      },
      text: {
        main: { hex: "#333333", outline: "白フチ 2px" },
        sub: { hex: "#666666" },
      },
      accent: colorScheme.accent
        ? {
            primary: {
              hex: colorScheme.accent,
              usage: "円形アクセント、ライン",
            },
          }
        : undefined,
    },
    fonts: {
      heading: {
        family: "丸ゴシック体",
        weight: "極太",
        style: "角丸、文字間隔やや広め",
      },
      body: {
        family: "ゴシック体",
        weight: "標準",
      },
    },
    layout: {
      textPlacement: "中央揃え、縦方向も中央",
      sizeRatio: "メインタイトル50-60%、サブ15-20%、余白20-30%",
      decorations: [
        "余白たっぷり（上下左右40px）",
        `右上に円形アクセント（80px、${colorScheme.accent ?? "#999999"}、透明度80%）`,
        "タイトル下にライン（2px、幅60%）",
        "四隅に小さなドット（8px）",
      ],
    },
    style: {
      genre: "ミニマル／パステル",
      mood: "優しい・柔らかい・親しみやすい",
      target: "20-30代女性、若年層向け",
      references: ["無印良品", "Instagramストーリーズ", "Canva"],
    },
  };
}

function getColorSchemeForPurpose(purpose: string): {
  background: { hex: string; name: string };
  accent?: string;
} {
  switch (purpose) {
    case "課題提起":
      return {
        background: { hex: "#FFE5E5", name: "淡いピンク" },
        accent: "#FF6B9D",
      };
    case "ソリューション":
      return {
        background: { hex: "#E5F3FF", name: "淡いブルー" },
        accent: "#4A90E2",
      };
    case "ベネフィット":
      return {
        background: { hex: "#FFF9E5", name: "淡いイエロー" },
        accent: "#FFB84D",
      };
    case "社会的証明":
      return {
        background: { hex: "#E5F5E5", name: "淡いグリーン" },
        accent: "#5FB878",
      };
    case "CTA":
      return {
        background: { hex: "#F0E5FF", name: "淡いパープル" },
        accent: "#9B59B6",
      };
    default:
      return {
        background: { hex: "#F5F5F5", name: "淡いグレー" },
        accent: "#999999",
      };
  }
}
