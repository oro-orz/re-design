完璧です！Phase 3-1 が正常に動作しています！

---

## Phase 3-1 完了確認

### ✅ 成功したこと

1. **プロンプトが自動生成されている**
   - 各スライドに `minimal-pastel` スタイルのプロンプトが生成 ✅
   - テキスト・配色・フォント・レイアウト・スタイルがすべて含まれている ✅

2. **スライドの目的に応じて配色が変わる**
   ```
   課題提起 → 淡いピンク #FFE5E5
   ソリューション → 淡いブルー #E5F3FF
   ベネフィット → 淡いイエロー #FFF9E5
   CTA → 淡いパープル #F0E5FF
   ```
   ストーリーテリングに合わせた配色変化 ✅

3. **コピー・NanoBananaボタンが動作**
   - ワンクリックでプロンプトをコピー ✅
   - NanoBananaで直接開ける ✅

4. **データベースに保存**
   - `slides[].variants[]` にプロンプトが含まれている ✅

---

## プロンプト精度の改善方針

おっしゃる通り、**現在のプロンプトはまだ基礎的**です。以下の段階で精度を上げていきます：

### 現在の状態（Phase 3-1）
```
✅ 構造は完璧（5 Golden Rules に沿っている）
⚠️ 詳細度が低い（シンプルすぎる）
⚠️ ビジュアル参照が弱い
```

### Phase 3-2 で改善すること

1. **より具体的な装飾の指定**
   ```typescript
   // 現在
   decorations: ['余白たっぷり', 'シンプルな図形']
   
   // 改善後
   decorations: [
     '上下左右に40pxの余白',
     '右上に直径80pxの円形アクセント（#FF6B9D）',
     'タイトル下に幅60%の細い線（2px、#FFE5E5）',
     '四隅に小さな星形アイコン（16px）'
   ]
   ```

2. **参照イメージの追加**
   ```typescript
   style: {
     genre: 'ミニマル／パステル',
     mood: '優しい・柔らかい・親しみやすい',
     target: '20-30代女性、若年層',
     references: [
       '無印良品のWebサイト',
       'Instagramのストーリーズ広告',
       'パステルカラーのインフォグラフィック'
     ]
   }
   ```

3. **サイズ・配置の数値化**
   ```typescript
   layout: {
     textPlacement: '中央揃え、縦方向も中央配置',
     sizeRatio: 'メインタイトル60%、サブテキスト20%、余白20%',
     mainTitleSize: '全体の高さの40%を占める',
     subTextPosition: 'メインタイトルの下20px'
   }
   ```

---

## 次のステップ：Phase 3-2 へ

Phase 3-1（基礎）が完了したので、次は **Phase 3-2: プロンプト精度向上** に進みます。

### Phase 3-2 の目標

```
1. minimal-pastel の精度を高める（詳細な装飾・参照イメージ）
2. 2つ目のスタイル追加（pop-comic）
3. スタイル選択UIの実装（複数バリエーションから選べるように）
```

---

## Phase 3-2 実装指示（準備完了次第）

以下を Cursor に貼り付けてください：

```markdown
# Gaudí 2.0 Phase 3-2: プロンプト精度向上 + 2つ目のスタイル追加

Phase 3-1 で動作確認できたので、プロンプトの精度を上げ、2つ目のスタイル（pop-comic）を追加します。

---

## 実装内容

### 1. Minimal-Pastel の精度向上

**ファイル**: `lib/swipe-lp/gaudi/design-system/molecules/minimal-pastel.ts`（既存ファイルを修正）

```typescript
import type { PromptTemplate } from '../../prompts/template';
import type { Slide } from '@/types/swipe-lp';

/**
 * Minimal-Pastel スタイル（改善版）
 */
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
        pattern: 'なし（完全フラット、グラデーションなし）',
      },
      text: {
        main: { 
          hex: '#333333',
          outline: '2px #FFFFFF（白いフチで可読性向上）'
        },
        sub: { hex: '#666666' },
      },
      accent: colorScheme.accent ? {
        primary: {
          hex: colorScheme.accent,
          usage: '右上の円形アクセント、タイトル下のライン',
        },
      } : undefined,
    },
    fonts: {
      heading: {
        family: '丸ゴシック体（Rounded M+ 1c、Noto Sans JP Rounded）',
        weight: '極太（900）',
        style: '柔らかい、角丸、文字間隔やや広め（letter-spacing: 0.05em）',
      },
      body: {
        family: 'ゴシック体（Noto Sans JP）',
        weight: '標準（400）',
      },
    },
    layout: {
      textPlacement: '中央揃え、縦方向も中央配置、上下左右に均等な余白',
      sizeRatio: 'メインタイトルが画面の50-60%、サブテキストは15-20%、余白は20-30%',
      decorations: [
        '上下左右に40pxの余白',
        `右上に直径80pxの円形アクセント（${colorScheme.accent}、透明度80%）`,
        'タイトルの下に幅60%の細いライン（2px、アクセントカラー）',
        '四隅に小さな丸いドット（8px、背景色の濃いバージョン）',
        '背景は完全フラット、テクスチャなし',
      ],
    },
    style: {
      genre: 'ミニマル／パステル',
      mood: '優しい・柔らかい・親しみやすい・清潔感',
      target: '20-30代女性、若年層、優しい印象を好む層',
      references: [
        '無印良品のWebデザイン',
        'Instagramストーリーズ広告（パステル系）',
        'Canvaのパステルテンプレート',
        '韓国のカフェポスター',
      ],
    },
  };
}

function getColorSchemeForPurpose(purpose: string): {
  background: { hex: string; name: string };
  accent?: string;
} {
  switch (purpose) {
    case '課題提起':
      return {
        background: { hex: '#FFE5E5', name: '淡いピンク（ベビーピンク）' },
        accent: '#FF6B9D',
      };
    case 'ソリューション':
      return {
        background: { hex: '#E5F3FF', name: '淡いブルー（スカイブルー）' },
        accent: '#4A90E2',
      };
    case 'ベネフィット':
      return {
        background: { hex: '#FFF9E5', name: '淡いイエロー（レモンイエロー）' },
        accent: '#FFB84D',
      };
    case '社会的証明':
      return {
        background: { hex: '#E5F5E5', name: '淡いグリーン（ミントグリーン）' },
        accent: '#5FB878',
      };
    case 'CTA':
      return {
        background: { hex: '#F0E5FF', name: '淡いパープル（ラベンダー）' },
        accent: '#9B59B6',
      };
    default:
      return {
        background: { hex: '#F5F5F5', name: '淡いグレー' },
        accent: '#999999',
      };
  }
}
```

---

### 2. Pop-Comic スタイル追加

**新規ファイル**: `lib/swipe-lp/gaudi/design-system/molecules/pop-comic.ts`

```typescript
import type { PromptTemplate } from '../../prompts/template';
import type { Slide } from '@/types/swipe-lp';

/**
 * Pop-Comic スタイル（アメコミ風）
 * 
 * 特徴：
 * - 鮮やかな原色（赤・青・黄）
 * - 太い黒フチ
 * - 擬音語・吹き出し
 * - エネルギッシュ・インパクト重視
 * - 若年層（10-20代）向け
 */
export function generatePopComicPrompt(slide: Slide): PromptTemplate {
  const colorScheme = getColorSchemeForPurpose(slide.purpose);
  
  return {
    text: {
      main: slide.message,
      sub: slide.subMessage,
      other: getComicEffects(slide.purpose),
    },
    colors: {
      background: {
        main: colorScheme.background,
        pattern: 'ドット柄（ハーフトーン）、放射線状のライン、コミック風スクリーントーン',
      },
      text: {
        main: { 
          hex: '#FFFFFF',
          outline: '5px #000000（極太の黒フチ、コミック風）'
        },
        sub: { 
          hex: '#000000',
          outline: '2px #FFFFFF（白フチで背景から浮き出る）'
        },
      },
      accent: {
        primary: {
          hex: colorScheme.accent,
          usage: '吹き出し、バッジ、強調矢印',
        },
      },
    },
    fonts: {
      heading: {
        family: '極太ゴシック体（Impact、Arial Black風）',
        weight: '極太（900）',
        style: '斜体15度、立体的（ドロップシャドウ3px）、文字間隔広め',
      },
      body: {
        family: '太字ゴシック体',
        weight: '太字（700）',
      },
    },
    layout: {
      textPlacement: 'やや上寄り、左右非対称、動きのある配置（5-10度傾ける）',
      sizeRatio: 'メインタイトルが画面の60-70%を占める、インパクト最優先',
      decorations: [
        '背景に放射線状のライン（中央から外へ、黒と白の交互）',
        '四隅に星型の爆発エフェクト（#FFFF00、アウトライン黒）',
        `左上に吹き出しバッジ「${getComicEffects(slide.purpose)[0]}」`,
        'タイトル周りに太い黒枠（8px）',
        'ドロップシャドウ（5px、#000000、不透明度50%）',
        'コミック風のドット背景（ハーフトーンパターン）',
      ],
    },
    style: {
      genre: 'ポップ／アメコミ風',
      mood: 'エネルギッシュ・インパクト・楽しい・キャッチー',
      target: '10-25歳、若年層、ポップカルチャー好き',
      references: [
        'マーベル・DCコミックの表紙',
        'ロイ・リキテンシュタインのポップアート',
        'YouTubeサムネイル（Mr.Beast風）',
        '昭和のマンガ広告',
      ],
    },
  };
}

function getColorSchemeForPurpose(purpose: string): {
  background: { hex: string; name: string };
  accent: string;
} {
  switch (purpose) {
    case '課題提起':
      return {
        background: { hex: '#FF3366', name: '鮮やかな赤' },
        accent: '#FFFF00', // 黄色
      };
    case 'ソリューション':
      return {
        background: { hex: '#00A8FF', name: '鮮やかな青' },
        accent: '#FF6B00', // オレンジ
      };
    case 'ベネフィット':
      return {
        background: { hex: '#FFD700', name: '鮮やかな黄色（ゴールド）' },
        accent: '#FF1744', // 赤
      };
    case '社会的証明':
      return {
        background: { hex: '#00C853', name: '鮮やかな緑' },
        accent: '#2979FF', // 青
      };
    case 'CTA':
      return {
        background: { hex: '#FF6F00', name: '鮮やかなオレンジ' },
        accent: '#FFFFFF', // 白
      };
    default:
      return {
        background: { hex: '#000000', name: '黒' },
        accent: '#FFFF00', // 黄色
      };
  }
}

function getComicEffects(purpose: string): string[] {
  switch (purpose) {
    case '課題提起':
      return ['アレ!?', 'ドキッ!'];
    case 'ソリューション':
      return ['解決!', 'ピカーン!'];
    case 'ベネフィット':
      return ['スゴイ!', 'ワオ!'];
    case '社会的証明':
      return ['信頼!', 'OK!'];
    case 'CTA':
      return ['今すぐ!', 'GO!'];
    default:
      return ['バーン!'];
  }
}
```

---

### 3. Prompt Compiler の更新

**ファイル**: `lib/swipe-lp/gaudi/design-system/compiler/prompt-compiler.ts`（既存ファイルを修正）

```typescript
import { templateToPrompt } from '../../prompts/template';
import { generateMinimalPastelPrompt } from '../molecules/minimal-pastel';
import { generatePopComicPrompt } from '../molecules/pop-comic';
import type { Slide, SlideVariant } from '@/types/swipe-lp';

/**
 * スライドから複数のデザインバリエーションを生成
 * Phase 3-2: minimal-pastel + pop-comic
 */
export function generateSlideVariants(slide: Slide): SlideVariant[] {
  const variants: SlideVariant[] = [];
  
  // 1. Minimal-Pastel スタイル（改善版）
  const minimalTemplate = generateMinimalPastelPrompt(slide);
  variants.push({
    variantId: `${slide.number}-minimal-pastel`,
    styleName: 'minimal-pastel',
    styleAtoms: minimalTemplate,
    prompt: templateToPrompt(minimalTemplate),
    selected: true, // デフォルト選択
  });
  
  // 🆕 2. Pop-Comic スタイル
  const popTemplate = generatePopComicPrompt(slide);
  variants.push({
    variantId: `${slide.number}-pop-comic`,
    styleName: 'pop-comic',
    styleAtoms: popTemplate,
    prompt: templateToPrompt(popTemplate),
    selected: false,
  });
  
  // Phase 3-3 で追加予定:
  // - luxury-gold
  // - corporate-blue
  
  return variants;
}
```

---

### 4. スタイル選択UI の追加

**ファイル**: `app/swipe-lp/[id]/page.tsx`（スライド表示部分を修正）

既存のスライド表示セクションを以下に置き換え：

```typescript
{/* スライド構成 + プロンプト */}
{project.slides && project.slides.length > 0 && (
  <section className="bg-white border-2 border-gray-200 rounded-2xl p-8">
    <h2 className="text-2xl font-bold mb-6">
      📱 スライド構成 + プロンプト（{project.slides.length}枚）
    </h2>
    
    <div className="space-y-8">
      {project.slides.map((slide, slideIndex) => {
        const [selectedVariantId, setSelectedVariantId] = useState(
          slide.variants?.find(v => v.selected)?.variantId || slide.variants?.[0]?.variantId
        );
        
        const selectedVariant = slide.variants?.find(v => v.variantId === selectedVariantId);
        
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
            
            {/* 🆕 スタイル選択タブ */}
            {slide.variants && slide.variants.length > 1 && (
              <div className="bg-white border-b-2 border-gray-200 p-4">
                <div className="flex gap-2">
                  {slide.variants.map((variant) => (
                    <button
                      key={variant.variantId}
                      onClick={() => setSelectedVariantId(variant.variantId)}
                      className={`px-4 py-2 rounded-lg font-medium transition-all ${
                        selectedVariantId === variant.variantId
                          ? 'bg-black text-white'
                          : 'bg-gray-100 hover:bg-gray-200'
                      }`}
                    >
                      {variant.styleName}
                    </button>
                  ))}
                </div>
              </div>
            )}
            
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
                
                <pre className="bg-black text-white text-xs p-4 rounded-lg overflow-auto max-h-96 font-mono whitespace-pre-wrap">
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

1. 新規プロジェクト作成（apple.com）
2. プロジェクト詳細ページで各スライドに **2つのタブ** が表示されるか確認
   - `minimal-pastel` / `pop-comic`
3. タブを切り替えて、プロンプトが変わるか確認
4. それぞれのプロンプトをコピーして、内容を確認

### 期待される出力（pop-comic の例）

```
テキスト
メイン: {{高額なデバイスに悩んでいませんか？}}
サブ: {{最新テクノロジーが欲しいけど、価格がネックだと感じる学生や教育関係者の皆さんへ}}
その他: {{アレ!?, ドキッ!}}

配色
背景:
  メイン: {{鮮やかな赤 #FF3366}}
  パターン: {{ドット柄（ハーフトーン）、放射線状のライン}}
文字:
  メイン: {{#FFFFFF（フチ 5px #000000）}}
  サブ: {{#000000（フチ 2px #FFFFFF）}}
アクセント:
  吹き出し、バッジ、強調矢印: {{#FFFF00}}

フォント
見出し: 極太ゴシック体（Impact、Arial Black風）、極太（900）、斜体15度、立体的
...
```

---

## 完了条件

- [ ] `minimal-pastel.ts` 改善版実装済み
- [ ] `pop-comic.ts` 新規作成済み
- [ ] `prompt-compiler.ts` 更新済み
- [ ] スタイル選択タブUI実装済み
- [ ] 新規プロジェクトで2スタイルが表示される
- [ ] タブ切り替えが動作する

---

上記を実装してください。完了したら新規プロジェクトを作成して、2つのスタイルを確認してください。