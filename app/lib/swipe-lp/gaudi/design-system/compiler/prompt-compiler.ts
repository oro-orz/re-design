/**
 * スライドからデザインバリエーション（プロンプト）を生成
 * Phase 3-2: minimal-pastel + pop-comic
 */

import { templateToPrompt } from "../../prompts/template";
import { generateMinimalPastelPrompt } from "../molecules/minimal-pastel";
import { generatePopComicPrompt } from "../molecules/pop-comic";
import type { Slide, SlideVariant } from "@/types/swipe-lp";
import type { SwipeLPv3Slide } from "@/types/swipe-lp-v3";

/** SwipeLPv3Slide を Slide 互換に変換 */
function toSlideLike(slide: SwipeLPv3Slide): Slide {
  return {
    number: slide.order,
    purpose: slide.purpose,
    message: slide.message,
    subMessage: slide.subMessage,
    emotion: slide.emotion,
    prompt: "",
    locked: false,
  };
}

/** 人物なし時: 構成要素はそのまま、写真（被写体・シーン）のみ削除して背景を単色に。動画オーバーレイ用 */
const OVERLAY_MODIFIER = `OVERLAY MODE (for video): Remove only the subject/person and the photographed scene. Replace the background with solid color or minimal gradient for easy masking. Keep the same composition: layout structure, text overlay positions and styles, decorative elements, color palette, design style. Identical to the design except the photo is removed.

`;

/**
 * base 内の「...」ブロックをスライドの message/subMessage/additionalText で置換
 * 1個目→message、2個目→subMessage、3個目以降→additionalText
 */
function replaceTextInBase(
  base: string,
  message: string,
  subMessage?: string | null,
  additionalText?: string[] | null
): string {
  const extra = additionalText ?? [];
  const replacers = [message, subMessage ?? "", ...extra].filter((s) => s.length > 0);
  if (replacers.length === 0) return base;
  let index = 0;
  return base.replace(/「[^」]*」/g, (match) => {
    if (index < replacers.length) {
      return `「${replacers[index++]}」`;
    }
    return match;
  });
}

/**
 * 通常モード: フル画像用プロンプトを生成
 * テンプレートがある場合: base 内のテキストをスライド内容で置換するだけ（下段の日本語プロンプトは付けない）
 * テンプレートがない場合: minimal-pastel のフォールバック
 */
function generateFullImagePrompt(
  slide: SwipeLPv3Slide,
  options: { templateId?: string | null; templateBasePrompt?: string | null }
): string {
  const basePrompt = options.templateBasePrompt?.trim();
  if (basePrompt) {
    const replaced = replaceTextInBase(
      basePrompt,
      slide.message,
      slide.subMessage,
      slide.additionalText
    );
    return replaced;
  }
  const slideLike = toSlideLike(slide);
  const styleTemplate =
    options.templateId === "pop-comic"
      ? generatePopComicPrompt(slideLike)
      : generateMinimalPastelPrompt(slideLike);
  return templateToPrompt(styleTemplate);
}

/**
 * オーバーレイモード: 人物なし
 * 構成要素（レイアウト・テキスト・装飾・配色）は通常と同じ。写真（被写体・シーン）だけ消して背景を単色に。
 */
function generateOverlayPrompt(
  slide: SwipeLPv3Slide,
  options: { templateBasePrompt?: string | null }
): string {
  const basePrompt = options.templateBasePrompt?.trim();
  if (basePrompt) {
    const replaced = replaceTextInBase(
      basePrompt,
      slide.message,
      slide.subMessage,
      slide.additionalText
    );
    return OVERLAY_MODIFIER + replaced;
  }
  const slideLike = toSlideLike(slide);
  const styleTemplate = generateMinimalPastelPrompt(slideLike);
  const contentPrompt = templateToPrompt(styleTemplate);
  return OVERLAY_MODIFIER + contentPrompt;
}

/**
 * v3用: 1スライドのプロンプトを生成
 * excludePerson で分岐し、それぞれ専用のプロンプトを構築する（後から編集しない）
 */
export function generatePromptForV3Slide(
  slide: SwipeLPv3Slide,
  options?: {
    templateId?: string | null;
    templateBasePrompt?: string | null;
    excludePerson?: boolean;
  }
): string {
  if (options?.excludePerson) {
    return generateOverlayPrompt(slide, {
      templateBasePrompt: options.templateBasePrompt,
    });
  }
  return generateFullImagePrompt(slide, {
    templateId: options?.templateId,
    templateBasePrompt: options?.templateBasePrompt,
  });
}

/**
 * スライドから複数のデザインバリエーションを生成
 */
export function generateSlideVariants(slide: Slide): SlideVariant[] {
  const variants: SlideVariant[] = [];

  const minimalTemplate = generateMinimalPastelPrompt(slide);
  variants.push({
    variantId: `${slide.number}-minimal-pastel`,
    styleName: "minimal-pastel",
    styleAtoms: minimalTemplate,
    prompt: templateToPrompt(minimalTemplate),
    selected: true,
  });

  const popTemplate = generatePopComicPrompt(slide);
  variants.push({
    variantId: `${slide.number}-pop-comic`,
    styleName: "pop-comic",
    styleAtoms: popTemplate,
    prompt: templateToPrompt(popTemplate),
    selected: false,
  });

  return variants;
}
