// スワイプLPプロジェクトの型定義

export interface SwipeLPProject {
  id: string;
  user_id: string;
  created_at: string;
  updated_at: string;

  // 入力（URL または 画像）
  input_type: "url" | "image";
  input_url?: string;
  input_image_url?: string;

  // AI分析結果
  analysis?: Analysis;

  // スライド構成
  slides: Slide[];

  // ステータス
  status:
    | "draft"
    | "analyzing"
    | "slide_review" // スライド確認・編集待ち
    | "design_selection" // プロンプト生成済み
    | "ready"
    | "completed";

  // プロジェクト名
  project_name: string;

  // Gaudí 2.0: マーケティング分析（3C・AIDMA）
  marketing_analysis?: MarketingAnalysis;
}

/** Gaudí 2.0: マーケティング分析結果（3C・AIDMA フレームワーク） */
export interface MarketingAnalysis {
  businessType: string;
  target: string;
  painPoints: string[];
  solution: string;
  emotionalTrigger: string;
  /** サービスのポジショニング（業界内の立ち位置。例: 本気の婚活 vs 気軽な出会い・即時性） */
  positioning?: string;
  /** 訴求の軸（何を打ち出すか。例: タイパ・即効性・手軽さ・ワクワク感） */
  benefitAngle?: string;
  /** 欲求の時間軸（短期的: 今日・今週 / 長期的: 人生・将来）。スライドの共感・ベネフィットの方向性に使う */
  desireTimeHorizon?: string;
  framework: {
    threeC: {
      customer: string;
      competitor: string;
      company: string;
    };
    aidma: {
      attention: string;
      interest: string;
      desire: string;
      memory: string;
      action: string;
    };
  };
}

export interface Analysis {
  business_type: string;
  target: string;
  main_message: string;
  emotional_trigger: string;
  key_insights?: string[];
}

export interface Slide {
  number: number;
  purpose: string;
  message: string;
  subMessage?: string;
  additionalText?: string[];
  emotion?: string;
  visualHint?: string;
  storyNote?: string;
  keyTakeaway?: string;
  messageAlternatives?: string[];
  narration?: string;
  ctaButtonText?: string;
  ctaUrgency?: string;
  prompt: string;
  locked?: boolean;
  /** Gaudí 2.0: デザインバリエーション */
  variants?: SlideVariant[];
}

/** Gaudí 2.0: スライドのデザインバリエーション */
export interface SlideVariant {
  variantId: string;
  styleName: string;
  styleAtoms?: unknown;
  prompt: string;
  selected: boolean;
}

export interface CreateProjectInput {
  type: "url" | "image";
  url?: string;
  /** 画像アップロード時。サーバーでは Blob として扱う（File は Node で未定義のため） */
  imageFile?: Blob;
}

export interface UpdateSlideInput {
  projectId: string;
  slideNumber: number;
  updates: Partial<Slide>;
}

