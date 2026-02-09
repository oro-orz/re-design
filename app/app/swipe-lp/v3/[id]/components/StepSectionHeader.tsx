"use client";

interface StepSectionHeaderProps {
  step: number;
  title: string;
  subtitle?: string;
}

/** Step 1, 2, 3 等のセクション見出し（共通デザイン） */
export function StepSectionHeader({
  step,
  title,
  subtitle,
}: StepSectionHeaderProps) {
  return (
    <div>
      {/* ピル型バッジ（左: STEP + 数字 / 右: タイトル）- コンパクト */}
      <div className="inline-flex overflow-hidden rounded-full shadow-sm">
        <span className="bg-neutral-600 pl-3 pr-2 py-1 text-[10px] font-bold tracking-wider text-white flex items-center gap-1">
          STEP {step}
        </span>
        <span className="bg-neutral-900 pl-3 pr-3 py-1 text-[10px] font-bold text-white flex items-center">
          {title}
        </span>
      </div>
      {subtitle && (
        <p className="text-xs text-neutral-500 mt-2">{subtitle}</p>
      )}
    </div>
  );
}
