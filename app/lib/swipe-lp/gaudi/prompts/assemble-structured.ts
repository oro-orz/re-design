/**
 * 構造化テンプレート + 生成コンテンツ → 最終プロンプト
 * 成功プロンプトのフォーマットを踏襲したシンプル版
 */

import type { PromptTemplate } from "@/types/swipe-lp-v3";
import type { SwipeLPv3Slide } from "@/types/swipe-lp-v3";

export interface GeneratedContent {
  subject: string;
  scene: string;
  texts: Record<string, string>;
}

const OVERLAY_PREFIX = `OVERLAY MODE (Graphic elements only - NO person, NO background):

Generate ONLY text and decorative graphic elements. Do NOT generate any person, face, or photographic background.

CRITICAL INSTRUCTIONS:
1. [X] Do NOT generate any person, human, face, or body parts
2. [X] Do NOT generate any photographic background (no concrete walls, no rooms, no scenes)
3. [OK] Generate ONLY: text overlays, geometric shapes, icons, decorative frames
4. [OK] Use solid color or simple gradient background ONLY
5. [OK] All decorative elements should be flat graphic design (not photographic)

The output should be a pure graphic template with text and decorations, ready to overlay on a photo in Photoshop/Figma.

`;

/**
 * 成功プロンプトフォーマット準拠の組み立て関数
 * シンプルで効果的な構造を維持
 */
export function assembleStructuredPrompt(
  template: PromptTemplate,
  content: GeneratedContent,
  overlayMode: boolean = false,
  aspectRatio: string = "9:16"
): string {
  const style = template.style_json;
  const slots = template.slots_json;

  if (!style || !slots) {
    throw new Error("Template requires style_json and slots_json");
  }

  const ratio = aspectRatio?.trim() || "9:16";

  // レイアウト比率を抽出
  const layoutMatch = style.layout?.match(/(\d+)%/);
  const subjectWidth = layoutMatch ? layoutMatch[1] : "60";
  const textWidth = 100 - parseInt(subjectWidth);

  // 装飾要素
  const decorations = Array.isArray(style.decorations) 
    ? style.decorations.join(", ") 
    : "";

  // メインプロンプト本文
  let prompt = `A powerful vertical mobile advertisement (${ratio}), ${style.mood || "dramatic and impactful"} design.

BACKGROUND: ${style.colors}${decorations ? `
Textures: ${decorations}` : ""}

RIGHT SIDE (${subjectWidth}% of width): ${content.subject.replace(/positioned (left|right)[-\s]*(aligned|side)?/gi, '')}

**CRITICAL: Subject must be positioned FAR RIGHT occupying ${subjectWidth}% of frame width. NOT left-aligned. Creating visual weight on right side of composition.**

LEFT SIDE (${textWidth}% of width): Clean layout with breathing room for text elements.
`;

  // テキスト要素を配置別に追加（詳細なデザイン指示付き）
  slots.textSlots.forEach((slot) => {
    const text = content.texts[slot.id];
    if (!text) return;

    // slot.description から配置を判定
    const desc = slot.description.toLowerCase();
    let position = "SECTION";
    let fullInstruction = "";
    
    if (desc.includes("top") || desc.includes("headline")) {
      position = "TOP";
      fullInstruction = `Large bold Japanese text "${text}" in white, vertical orientation, heavy gothic font weight 900.`;
    } else if (desc.includes("middle") || desc.includes("checklist")) {
      position = "MIDDLE";
      // チェックリストの場合は具体的なデザイン指示
      fullInstruction = `Six navy blue (#1B3A52) rectangular boxes (with depth/shadow), stacked vertically with generous spacing. Each box contains: large white checkmark icon + Japanese text in bold gothic font. Text items: "${text}". Boxes should have subtle gradient and depth.`;
    } else if (desc.includes("center") || desc.includes("warning")) {
      position = "CENTER TEXT";
      // ゴールド強調を含む警告文
      fullInstruction = `"${text}" This text should be large and dramatic. Key emphasis word in bright glowing gold (#FFD700) with outer glow effect.`;
    } else if (desc.includes("bottom") || desc.includes("symptom") || desc.includes("icon")) {
      position = "BOTTOM";
      // 黒い円形アイコン
      fullInstruction = `Six large black circles (with inner shadow for depth) arranged in a row, each containing white Japanese text. Items: "${text}". Circles should be substantial and easily readable.`;
    } else {
      // デフォルト
      fullInstruction = `"${text}"`;
    }

    prompt += `\n${position}: ${fullInstruction}`;
  });

  // スタイル・技術仕様
  prompt += `

OVERALL STYLE: ${style.designStyle || "High-contrast professional advertising, dramatic lighting, cinematic photography combined with bold graphic design. Deep shadows, strong highlights, premium feel."}

Photography: ${style.photography || "Professional studio photography"}

TECHNICAL: ${ratio} aspect ratio, high resolution, no watermarks, photorealistic subject integrated with bold graphic elements, ${style.mood || "premium"} aesthetic.

ADDITIONAL SPECIFICATIONS:

LIGHTING: 
${style.lighting || "- High contrast with dramatic shadows\n- Overall: deep blacks, bright whites"}

TYPOGRAPHY:
${style.typography || "- Bold modern sans-serif\n- Heavy weight for headlines"}

COLOR DEPTH:
${style.colors}

COMPOSITION:
${style.layout || "- Balanced layout\n- Clear visual hierarchy"}

**CRITICAL: Subject positioned at RIGHT ${subjectWidth}% of frame. Text positioned at LEFT ${textWidth}% of frame. Clear separation between photo area (right) and text area (left).**`;

  // オーバーレイモード（人物なし・テキストあり）
  if (overlayMode) {
    // 背景を透明に変更
    prompt = prompt.replace(/BACKGROUND:[\s\S]*?(?=RIGHT SIDE|LEFT SIDE)/, 
      'BACKGROUND: **TRANSPARENT** - Use transparent background (PNG with alpha channel) or pure white (#FFFFFF) if transparency not supported. NO gradients, NO textures.\n\n');
    
    // 人物・背景の記述を削除
    prompt = prompt.replace(/RIGHT SIDE[\s\S]*?\*\*CRITICAL:[\s\S]*?\*\*/, 
      'RIGHT SIDE (60% of width): **TRANSPARENT AREA** - Leave this area completely transparent for photo placement in post-production.\n\n**CRITICAL: This area must be transparent or solid white. NO photographic elements.**');
    
    // 写真撮影の指示を削除
    prompt = prompt.replace(/Photography:.*/, 'Photography: None - pure graphic design template');
    
    // ライティングの指示を削除
    prompt = prompt.replace(/LIGHTING:[\s\S]*?(?=TYPOGRAPHY|COLOR|COMPOSITION)/, '');
    
    // プリフィックスを追加
    prompt = OVERLAY_PREFIX + prompt + `

CRITICAL OVERLAY MODE REQUIREMENTS:
- [OK] TRANSPARENT BACKGROUND (PNG with alpha channel) or pure white if transparency not available
- [X] NO gradients in background
- [X] NO textures (concrete, grunge, etc.)
- [X] NO photographic elements
- [X] NO person, face, or human subject
- [OK] Text and graphic decorations ONLY (checkboxes, circles, frames)
- [OK] Right side area must be completely transparent for photo overlay`;
  }

  return prompt.trim();
}

/**
 * 従来型テンプレート（prompt_text の「」ブロックをスライドテキストで置換）
 * 後方互換性のため維持
 */
export function assembleTraditionalPrompt(
  template: PromptTemplate,
  slide: SwipeLPv3Slide,
  overlayMode: boolean = false
): string {
  let baseText = template.prompt_text || template.base_prompt || "";

  const texts = [
    slide.message,
    slide.subMessage ?? "",
    ...(slide.additionalText ?? []),
  ].filter(Boolean);

  let replacementIndex = 0;
  baseText = baseText.replace(/「[^」]*」/g, (match) => {
    if (replacementIndex < texts.length) {
      return `「${texts[replacementIndex++]}」`;
    }
    return match;
  });

  if (overlayMode) {
    baseText = OVERLAY_PREFIX + baseText + `

CRITICAL: NO text in image.`;
  }

  return baseText;
}