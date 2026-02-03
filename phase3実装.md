

## 表示確認結果

### ✅ すべて正常に表示されています

1. **📊 Gaudí マーケティング分析セクション**
   - ビジネスタイプ: テクノロジー製品販売 ✅
   - ターゲット: 学生および教育関係者 ✅
   - 感情トリガー: 経済的負担の軽減 → 賢い選択で得られる満足感 ✅
   - 解決すべき痛み（3つ）✅
   - 3C・AIDMA 詳細（折りたたみ）✅

2. **📱 スライド構成セクション（7枚）**
   - すべてのスライドが正しく表示 ✅
   - purpose / message / subMessage / emotion がすべて含まれている ✅
   - ストーリーテリングの流れが完璧 ✅

---

## Phase 3 実装方針の決定

**オプションA: シンプルスタート** で進めましょう！

理由：
1. 早く動くものが見られる
2. プロンプト生成の精度を確認しながら進められる
3. 問題があれば早期発見できる

---

## Phase 3-1: 最小プロトタイプ実装

以下を Cursor に貼り付けてください：

```markdown
# Gaudí 2.0 Phase 3-1: 最小プロトタイプ（1スタイルのみ）

Phase 2 で生成したスライド構成に対して、**1つのデザインスタイル**（minimal-pastel）のプロンプトを生成します。

---

## 実装内容

### 1. プロンプトテンプレート構造の定義

**新規ファイル**: `lib/swipe-lp/gaudi/prompts/template.ts`

```typescript
/**
 * NanoBanana 用プロンプトのテンプレート構造
 */
export interface PromptTemplate {
  // テキスト要素
  text: {
    main: string;        // メインメッセージ
    sub?: string;        // サブメッセージ
    other?: string[];    // その他のテキスト（バッジなど）
  };
  
  // 配色
  colors: {
    background: {
      main: { hex: string; name: string };
      sub?: { hex: string; name: string };
      pattern?: string;
    };
    text: {
      main: { hex: string; outline?: string };
      sub?: { hex: string };
    };
    accent?: {
      primary: { hex: string; usage: string };
    };
  };
  
  // フォント
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
  
  // レイアウト
  layout: {
    textPlacement: string;
    sizeRatio: string;
    decorations?: string[];
  };
  
  // スタイル
  style: {
    genre: string;
    mood: string;
    target: string;
  };
}

/**
 * プロンプトテンプレートから最終的な文字列プロンプトを生成
 */
export function templateToPrompt(template: PromptTemplate): string {
  return `
テキスト
メイン: {{${template.text.main}}}
${template.text.sub ? `サブ: {{${template.text.sub}}}` : ''}
${template.text.other?.length ? `その他: {{${template.text.other.join(', ')}}}` : ''}

配色
背景:
  メイン: {{${template.colors.background.main.name} ${template.colors.background.main.hex}}}
  ${template.colors.background.sub ? `サブ: {{${template.colors.background.sub.name} ${template.colors.background.sub.hex}}}` : ''}
  ${template.colors.background.pattern ? `パターン: {{${template.colors.background.pattern}}}` : ''}
文字:
  メイン: {{${template.colors.text.main.hex}${template.colors.text.main.outline ? `（フチ ${template.colors.text.main.outline}）` : ''}}}
  ${template.colors.text.sub ? `サブ: {{${template.colors.text.sub.hex}}}` : ''}
${template.colors.accent ? `アクセント:\n  ${template.colors.accent.primary.usage}: {{${template.colors.accent.primary.hex}}}` : ''}

フォント
見出し: ${template.fonts.heading.family}、${template.fonts.heading.weight}${template.fonts.heading.style ? `、${template.fonts.heading.style}` : ''}
${template.fonts.body ? `サブ系: ${template.fonts.body.family}、${template.fonts.body.weight}` : ''}

レイアウト
テキスト配置: ${template.layout.textPlacement}
サイズ比率: ${template.layout.sizeRatio}
${template.layout.decorations?.length ? `装飾: ${template.layout.decorations.join('、')}` : ''}

スタイル
${template.style.genre}
${template.style.mood}
${template.style.target}向け
  `.trim();
}
```

---

### 2. Minimal-Pastel スタイル定義

**新規ファイル**: `lib/swipe-lp/gaudi/design-system/molecules/minimal-pastel.ts`

```typescript
import type { PromptTemplate } from '../../prompts/template';
import type { Slide } from '@/types/swipe-lp';

/**
 * Minimal-Pastel スタイル
 * 
 * 特徴：
 * - パステルカラー（淡いピンク・ブルー・イエロー）
 * - 余白たっぷり
 * - 丸ゴシック体
 * - 柔らかく優しい印象
 * - 女性向け・若年層向け
 */
export function generateMinimalPastelPrompt(slide: Slide): PromptTemplate {
  // スライドの目的に応じて色を変える
  const colorScheme = getColorSchemeForPurpose(slide.purpose);
  
  return {
    text: {
      main: slide.message,
      sub: slide.subMessage,
    },
    colors: {
      background: {
        main: colorScheme.background,
        pattern: 'なし（フラット）',
      },
      text: {
        main: { hex: '#333333' }, // ダークグレー（黒より柔らかい）
        sub: { hex: '#666666' },
      },
      accent: colorScheme.accent ? {
        primary: {
          hex: colorScheme.accent,
          usage: '強調要素・アイコン',
        },
      } : undefined,
    },
    fonts: {
      heading: {
        family: '丸ゴシック体',
        weight: '極太（900）',
        style: '柔らかい、角丸',
      },
      body: {
        family: 'ゴシック体',
        weight: '標準（400）',
      },
    },
    layout: {
      textPlacement: '中央揃え、縦方向も中央配置',
      sizeRatio: 'メインタイトルが全体の50-60%、サブテキストは小さめ',
      decorations: [
        '余白たっぷり（マージン大きめ）',
        'シンプルな図形（円・四角）',
        'パステルカラーのアクセント',
      ],
    },
    style: {
      genre: 'ミニマル／パステル',
      mood: '優しい・柔らかい・親しみやすい',
      target: '20-30代女性、若年層、優しい印象を好む層',
    },
  };
}

/**
 * スライドの目的に応じた配色を返す
 */
function getColorSchemeForPurpose(purpose: string): {
  background: { hex: string; name: string };
  accent?: string;
} {
  switch (purpose) {
    case '課題提起':
      return {
        background: { hex: '#FFE5E5', name: '淡いピンク' },
        accent: '#FF6B9D', // アクセントピンク
      };
    
    case 'ソリューション':
      return {
        background: { hex: '#E5F3FF', name: '淡いブルー' },
        accent: '#4A90E2', // アクセントブルー
      };
    
    case 'ベネフィット':
      return {
        background: { hex: '#FFF9E5', name: '淡いイエロー' },
        accent: '#FFB84D', // アクセントオレンジ
      };
    
    case '社会的証明':
      return {
        background: { hex: '#E5F5E5', name: '淡いグリーン' },
        accent: '#5FB878', // アクセントグリーン
      };
    
    case 'CTA':
      return {
        background: { hex: '#F0E5FF', name: '淡いパープル' },
        accent: '#9B59B6', // アクセントパープル
      };
    
    default:
      return {
        background: { hex: '#F5F5F5', name: '淡いグレー' },
      };
  }
}
```

---

### 3. プロンプト生成関数

**新規ファイル**: `lib/swipe-lp/gaudi/design-system/compiler/prompt-compiler.ts`

```typescript
import { templateToPrompt } from '../../prompts/template';
import { generateMinimalPastelPrompt } from '../molecules/minimal-pastel';
import type { Slide, SlideVariant } from '@/types/swipe-lp';

/**
 * スライドから複数のデザインバリエーションを生成
 * Phase 3-1: minimal-pastel のみ
 */
export function generateSlideVariants(slide: Slide): SlideVariant[] {
  const variants: SlideVariant[] = [];
  
  // Minimal-Pastel スタイル
  const minimalTemplate = generateMinimalPastelPrompt(slide);
  const minimalPrompt = templateToPrompt(minimalTemplate);
  
  variants.push({
    variantId: `${slide.number}-minimal-pastel`,
    styleName: 'minimal-pastel',
    styleAtoms: minimalTemplate, // デバッグ用に保存
    prompt: minimalPrompt,
    selected: true, // 最初のバリアントをデフォルト選択
  });
  
  // Phase 3-2 で追加予定:
  // - pop-comic
  // - luxury-gold
  // - corporate-blue
  
  return variants;
}
```

---

### 4. Server Action の拡張

**ファイル**: `actions/swipe-lp.ts`（`runGaudiMarketingAnalysis` を再度修正）

```typescript
import { runMarketingAnalysis } from '@/lib/swipe-lp/gaudi/marketing/analyzer';
import { generateSlideStructure as generateGaudiSlideStructure } from '@/lib/swipe-lp/gaudi/slides/structure-generator';
import { generateSlideVariants } from '@/lib/swipe-lp/gaudi/design-system/compiler/prompt-compiler';

export async function runGaudiMarketingAnalysis(projectId: string) {
  "use server";
  
  try {
    console.log('[runGaudiMarketingAnalysis] Starting for project:', projectId);
    
    const { data: project, error: fetchError } = await supabase
      .from("swipe_lp_projects")
      .select("*")
      .eq("id", projectId)
      .single();
    
    if (fetchError || !project) {
      console.error('[runGaudiMarketingAnalysis] Project not found:', fetchError);
      return { error: "プロジェクトが見つかりません" };
    }
    
    // Phase 1: マーケティング分析
    console.log('[runGaudiMarketingAnalysis] Phase 1: Marketing analysis...');
    const marketingAnalysis = await runMarketingAnalysis(
      project.input_type,
      project.input_type === "url" ? project.input_url : project.input_image_url
    );
    console.log('[runGaudiMarketingAnalysis] Phase 1 completed');
    
    // Phase 2: スライド構成生成
    console.log('[runGaudiMarketingAnalysis] Phase 2: Generating slide structure...');
    const slides = await generateGaudiSlideStructure(marketingAnalysis);
    console.log('[runGaudiMarketingAnalysis] Phase 2 completed:', slides.length, 'slides');
    
    // 🆕 Phase 3: デザインバリエーション生成
    console.log('[runGaudiMarketingAnalysis] Phase 3: Generating design variants...');
    const slidesWithVariants = slides.map(slide => ({
      ...slide,
      variants: generateSlideVariants(slide),
    }));
    console.log('[runGaudiMarketingAnalysis] Phase 3 completed: 1 variant per slide');
    
    // DBに保存
    const { error: updateError } = await supabase
      .from("swipe_lp_projects")
      .update({
        marketing_analysis: marketingAnalysis,
        slides: slidesWithVariants, // バリエーション付きスライド
        status: "design_selection"
      })
      .eq("id", projectId);
    
    if (updateError) {
      console.error('[runGaudiMarketingAnalysis] Update failed:', updateError);
      return { error: "分析結果の保存に失敗しました" };
    }
    
    console.log('[runGaudiMarketingAnalysis] Completed successfully');
    return { success: true };
    
  } catch (err) {
    console.error('[runGaudiMarketingAnalysis] Error:', err);
    return { 
      error: err instanceof Error ? err.message : "マーケティング分析に失敗しました" 
    };
  }
}
```

---

### 5. プロジェクト詳細ページでプロンプト表示

**ファイル**: `app/swipe-lp/[id]/page.tsx`（スライド構成セクションを修正）

既存のスライド構成セクションを以下に置き換え：

```typescript
{/* スライド構成 + プロンプト */}
{project.slides && project.slides.length > 0 && (
  <section className="bg-white border-2 border-gray-200 rounded-2xl p-8">
    <h2 className="text-2xl font-bold mb-6">
      📱 スライド構成 + プロンプト（{project.slides.length}枚）
    </h2>
    
    <div className="space-y-8">
      {project.slides.map((slide) => {
        const selectedVariant = slide.variants?.find(v => v.selected) || slide.variants?.[0];
        
        return (
          <div 
            key={slide.number} 
            className="border-2 border-gray-200 rounded-xl overflow-hidden"
          >
            {/* スライド情報 */}
            <div className="bg-gray-50 p-6 border-b-2 border-gray-200">
              <div className="flex items-center gap-3 mb-3">
                <span className="text-3xl font-bold text-gray-300">
                  {slide.number}
                </span>
                <span className="text-xs bg-black text-white px-3 py-1 rounded-full">
                  {slide.purpose}
                </span>
                <span className="text-xs text-gray-500">
                  {slide.emotion}
                </span>
              </div>
              
              <h3 className="text-xl font-bold mb-2">
                {slide.message}
              </h3>
              
              {slide.subMessage && (
                <p className="text-gray-600">
                  {slide.subMessage}
                </p>
              )}
            </div>
            
            {/* プロンプト表示 */}
            {selectedVariant && (
              <div className="p-6">
                <div className="flex items-center gap-3 mb-4">
                  <h4 className="font-bold">
                    デザインスタイル: {selectedVariant.styleName}
                  </h4>
                  <button
                    onClick={() => {
                      navigator.clipboard.writeText(selectedVariant.prompt);
                      alert('プロンプトをコピーしました');
                    }}
                    className="text-sm bg-gray-100 hover:bg-gray-200 px-3 py-1 rounded-lg"
                  >
                    📋 コピー
                  </button>
                  <button
                    onClick={() => {
                      const encoded = encodeURIComponent(selectedVariant.prompt);
                      window.open(`https://nanobanana.ai?prompt=${encoded}`, '_blank');
                    }}
                    className="text-sm bg-black text-white hover:bg-gray-800 px-3 py-1 rounded-lg"
                  >
                    🍌 NanoBananaで開く
                  </button>
                </div>
                
                <pre className="bg-black text-white text-xs p-4 rounded-lg overflow-auto max-h-96 font-mono">
{selectedVariant.prompt}
                </pre>
              </div>
            )}
          </div>
        );
      })}
    </div>
  </section>
)}
```

---

## テスト方法

### 1. 新規プロジェクト作成

```bash
npm run dev
```

1. http://localhost:3000/swipe-lp/new にアクセス
2. URL: `https://www.apple.com/jp/`
3. 「スライド構成を自動生成」をクリック
4. コンソールで確認：

```
[runGaudiMarketingAnalysis] Phase 1: Marketing analysis...
[runGaudiMarketingAnalysis] Phase 1 completed
[runGaudiMarketingAnalysis] Phase 2: Generating slide structure...
[runGaudiMarketingAnalysis] Phase 2 completed: 7 slides
[runGaudiMarketingAnalysis] Phase 3: Generating design variants...
[runGaudiMarketingAnalysis] Phase 3 completed: 1 variant per slide
```

### 2. プロンプト確認

`/swipe-lp/[id]` で各スライドのプロンプトが表示されるか確認：

```
テキスト
メイン: {{高額なデバイスに悩んでいませんか？}}
サブ: {{最新テクノロジーが欲しいけど、価格がネックだと感じる学生や教育関係者の皆さんへ}}

配色
背景:
  メイン: {{淡いピンク #FFE5E5}}
文字:
  メイン: {{#333333}}
...
```

### 3. データ確認

```bash
npm run check:gaudi
```

`variants` 配列が含まれているか確認。

---

## 完了条件

- [ ] `template.ts` 作成済み
- [ ] `minimal-pastel.ts` 作成済み
- [ ] `prompt-compiler.ts` 作成済み
- [ ] `runGaudiMarketingAnalysis` に Phase 3 追加済み
- [ ] プロジェクト詳細ページでプロンプト表示済み
- [ ] 新規プロジェクトでテスト成功
- [ ] コピーボタン・NanoBananaボタンが動作

---

上記を実装してください。完了したら新規プロジェクトを作成してプロンプトを確認してください。
