/**
 * Pop-Comic スタイル（シンプル版）
 */

import type { PromptTemplate } from "../../prompts/template";
import type { Slide } from "@/types/swipe-lp";

export function generatePopComicPrompt(slide: Slide): PromptTemplate {
  const colorScheme = getColorSchemeForPurpose(slide.purpose);
  const effects = getComicEffects(slide.purpose);

  return {
    text: {
      main: slide.message,
      sub: slide.subMessage,
      other: effects,
    },
    colors: {
      background: {
        main: colorScheme.background,
        pattern: "ドット柄（ハーフトーン）、放射線",
      },
      text: {
        main: { hex: "#FFFFFF", outline: "黒フチ 5px" },
        sub: { hex: "#000000", outline: "白フチ 2px" },
      },
      accent: {
        primary: {
          hex: colorScheme.accent,
          usage: "吹き出し、星型",
        },
      },
    },
    fonts: {
      heading: {
        family: "極太ゴシック体（Impact風）",
        weight: "極太",
        style: "斜体15度、立体的（ドロップシャドウ3px）",
      },
      body: {
        family: "太字ゴシック体",
        weight: "太字",
      },
    },
    layout: {
      textPlacement: "やや上寄り、動きのある配置（5-10度傾ける）",
      sizeRatio: "メインタイトル60-70%、インパクト最優先",
      decorations: [
        "放射線状のライン（中央から外へ）",
        "四隅に星型の爆発エフェクト",
        `吹き出しバッジ「${effects[0]}」`,
        "タイトル周りに太い黒枠（8px）",
        "ドロップシャドウ（5px）",
      ],
    },
    style: {
      genre: "ポップ／アメコミ風",
      mood: "エネルギッシュ・インパクト・キャッチー",
      target: "10-25歳、若年層、ポップカルチャー好き",
      references: [
        "マーベルコミック",
        "YouTubeサムネイル",
        "ロイ・リキテンシュタイン",
      ],
    },
  };
}

function getColorSchemeForPurpose(purpose: string): {
  background: { hex: string; name: string };
  accent: string;
} {
  switch (purpose) {
    case "課題提起":
      return {
        background: { hex: "#FF3366", name: "鮮やかな赤" },
        accent: "#FFFF00",
      };
    case "ソリューション":
      return {
        background: { hex: "#00A8FF", name: "鮮やかな青" },
        accent: "#FF6B00",
      };
    case "ベネフィット":
      return {
        background: { hex: "#FFD700", name: "鮮やかな黄色" },
        accent: "#FF1744",
      };
    case "社会的証明":
      return {
        background: { hex: "#00C853", name: "鮮やかな緑" },
        accent: "#2979FF",
      };
    case "CTA":
      return {
        background: { hex: "#FF6F00", name: "鮮やかなオレンジ" },
        accent: "#FFFFFF",
      };
    default:
      return {
        background: { hex: "#000000", name: "黒" },
        accent: "#FFFF00",
      };
  }
}

function getComicEffects(purpose: string): string[] {
  switch (purpose) {
    case "課題提起":
      return ["アレ!?", "ドキッ!"];
    case "ソリューション":
      return ["解決!", "ピカーン!"];
    case "ベネフィット":
      return ["スゴイ!", "ワオ!"];
    case "社会的証明":
      return ["信頼!", "OK!"];
    case "CTA":
      return ["今すぐ!", "GO!"];
    default:
      return ["バーン!"];
  }
}
