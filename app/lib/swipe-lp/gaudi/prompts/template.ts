/**
 * NanoBanana 用プロンプトのテンプレート構造
 */
export interface PromptTemplate {
  text: {
    main: string;
    sub?: string;
    other?: string[];
  };

  colors: {
    background: {
      main: { hex: string; name: string };
      sub?: { hex: string; name: string };
      pattern?: string;
    };
    text: {
      main: { hex: string; outline?: string };
      sub?: { hex: string; outline?: string };
    };
    accent?: {
      primary: { hex: string; usage: string };
    };
  };

  fonts: {
    heading: {
      family: string;
      weight: string;
      style?: string;
    };
    body?: {
      family: string;
      weight: string;
    };
  };

  layout: {
    textPlacement: string;
    sizeRatio: string;
    decorations?: string[];
  };

  style: {
    genre: string;
    mood: string;
    target: string;
    references?: string[];
  };
}

/**
 * プロンプトテンプレートから最終的な文字列プロンプトを生成
 * 高精度形式：改行・セクション分けを重視
 */
export function templateToPrompt(template: PromptTemplate): string {
  let textSection = `テキスト\nメイン: {{${template.text.main}}}`;
  if (template.text.sub) {
    textSection += `\nサブ: {{${template.text.sub}}}`;
  }
  if (template.text.other && template.text.other.length > 0) {
    textSection += `\nその他: {{${template.text.other.join("、")}}}`;
  }

  let colorSection = `\n\n配色`;
  colorSection += `\n背景:`;
  colorSection += `\n  メイン: {{${template.colors.background.main.name} ${template.colors.background.main.hex}}}`;
  if (template.colors.background.sub) {
    colorSection += `\n  サブ: {{${template.colors.background.sub.name} ${template.colors.background.sub.hex}}}`;
  }
  if (template.colors.background.pattern) {
    colorSection += `\n  パターン: {{${template.colors.background.pattern}}}`;
  }

  colorSection += `\n文字:`;
  colorSection += `\n  メイン: {{${template.colors.text.main.hex}${
    template.colors.text.main.outline
      ? `（${template.colors.text.main.outline}）`
      : ""
  }}}`;
  if (template.colors.text.sub) {
    colorSection += `\n  サブ: {{${template.colors.text.sub.hex}${
      template.colors.text.sub.outline
        ? `（${template.colors.text.sub.outline}）`
        : ""
    }}}`;
  }

  if (template.colors.accent) {
    colorSection += `\nアクセント:`;
    colorSection += `\n  ${template.colors.accent.primary.usage}: {{${template.colors.accent.primary.hex}}}`;
  }

  let fontSection = `\n\nフォント`;
  fontSection += `\n見出し: ${template.fonts.heading.family}、${template.fonts.heading.weight}`;
  if (template.fonts.heading.style) {
    fontSection += `、${template.fonts.heading.style}`;
  }
  if (template.fonts.body) {
    fontSection += `\nサブ系: ${template.fonts.body.family}、${template.fonts.body.weight}`;
  }

  let layoutSection = `\n\nレイアウト`;
  layoutSection += `\nテキスト配置:\n${template.layout.textPlacement}`;
  layoutSection += `\nサイズ比率:\n${template.layout.sizeRatio}`;
  if (template.layout.decorations && template.layout.decorations.length > 0) {
    layoutSection += `\n装飾・図形:`;
    template.layout.decorations.forEach((deco) => {
      layoutSection += `\n- ${deco}`;
    });
  }

  let styleSection = `\n\nスタイル`;
  styleSection += `\n${template.style.genre}`;
  styleSection += `\n${template.style.mood}`;
  styleSection += `\n${template.style.target}`;
  if (template.style.references && template.style.references.length > 0) {
    styleSection += `\n参照: ${template.style.references.join("、")}`;
  }

  return (
    textSection +
    colorSection +
    fontSection +
    layoutSection +
    styleSection
  ).trim();
}
