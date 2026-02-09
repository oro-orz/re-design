// types/overlay-mode.ts

/**
 * Overlay Mode - ベース画像生成の結果
 */
export interface OverlayModeResult {
  // 入力画像
  referenceImageUrl: string;

  // 生成されたベース画像
  baseImageUrl: string;

  // 生成日時
  generatedAt: string;
}

/**
 * ベース画像生成のオプション
 */
export interface GenerateBaseImageOptions {
  referenceImageUrl: string;
  removeText: boolean; // テキストを除去するか（常にtrue）
  preserveLayout: boolean; // レイアウトを保持するか（常にtrue）
  changePerson?: boolean; // 人物を変更するか
  targetPerson?: TargetPerson; // 変更先のターゲット
}

/**
 * ターゲット人物の種類
 */
export type TargetPerson =
  | "30代女性ママ"
  | "30代男性ビジネスマン"
  | "40代女性キャリア"
  | "20代女性若手"
  | "30代男性カジュアル"
  | "40代男性経営者";

/**
 * ターゲット人物の詳細説明
 */
export const TARGET_PERSON_DESCRIPTIONS: Record<TargetPerson, string> = {
  "30代女性ママ":
    "a Japanese woman in her early 30s, mother, wearing casual comfortable home clothes (beige knit sweater or cardigan), warm gentle smile, approachable and friendly appearance, natural makeup, relaxed posture",
  "30代男性ビジネスマン":
    "a Japanese man in his early 30s, wearing business casual attire (shirt and chinos or smart casual), confident professional appearance, slight smile, modern hairstyle",
  "40代女性キャリア":
    "a Japanese woman in her early 40s, wearing professional business attire (blazer or elegant blouse), calm and mature demeanor, sophisticated appearance, confident expression",
  "20代女性若手":
    "a Japanese woman in her early 20s, wearing casual modern style clothes (trendy top or dress), energetic and youthful appearance, bright smile, contemporary fashion",
  "30代男性カジュアル":
    "a Japanese man in his early 30s, wearing casual clothes (polo shirt or casual shirt), friendly and relaxed appearance, approachable demeanor, natural smile",
  "40代男性経営者":
    "a Japanese man in his early 40s, wearing business suit or high-quality casual attire, authoritative yet approachable presence, confident and experienced appearance",
};

/**
 * テキスト削除の強度
 * - preserve: 装飾をなるべく残す（複雑な装飾上のテキストは残る可能性あり）
 * - aggressive: テキストを完全に削除（複雑な場合は装飾ごと削除。リボン・枠などは残す）
 */
export type TextRemovalMode = "preserve" | "aggressive";

/**
 * ベース画像の作り方
 * - text-removal: 元画像からテキストを削除（装飾は維持）
 * - rebuild: レイアウト・トンマナのみ維持し、背景・人物・装飾を新規生成
 */
export type BaseImageMode = "text-removal" | "rebuild";
