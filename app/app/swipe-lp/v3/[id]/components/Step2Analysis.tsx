"use client";

import { ExternalLink } from "lucide-react";
import type { MarketingAnalysis } from "@/types/swipe-lp";
import { StepSectionHeader } from "./StepSectionHeader";

interface Step2Props {
  marketingAnalysis: MarketingAnalysis;
  onNext: () => void;
}

interface Step2LeftProps {
  inputUrl: string;
  marketingAnalysis: MarketingAnalysis;
}

const labelClass =
  "text-[11px] font-semibold uppercase tracking-wider text-neutral-500";

const USER_INSIGHT_SEARCH_URL =
  "https://www.google.com/search?q=ユーザーインサイトとは";

const THREE_C_SEARCH_URL =
  "https://www.google.com/search?q=3c%E5%88%86%E6%9E%90%E3%81%A8%E3%81%AF";

export const AIDMA_SEARCH_URL =
  "https://www.google.com/search?q=AIDMA%E3%81%A8%E3%81%AF%EF%BC%9F";

/** 3C・AIDMA・分析結果用のテーブルカード（Step3でも使用） */
export function FrameworkCard({
  title,
  badge,
  items,
  headerLink,
}: {
  title: string;
  badge: string;
  items: { label: string; value: string }[];
  headerLink?: { href: string; label: string };
}) {
  return (
    <div className="rounded-lg border border-neutral-200 bg-white overflow-hidden">
      <div className="px-4 py-2.5 bg-neutral-50 border-b border-neutral-200 flex items-center justify-between gap-2">
        <div className="flex items-center gap-2">
          <span className={`${labelClass}`}>{title}</span>
          <span className="text-[10px] px-1.5 py-0.5 rounded bg-neutral-200 text-neutral-600">
            {badge}
          </span>
        </div>
        {headerLink && (
          <a
            href={headerLink.href}
            target="_blank"
            rel="noopener noreferrer"
            className="text-[10px] text-neutral-500 hover:text-neutral-800 flex items-center gap-1 shrink-0"
          >
            {headerLink.label}
            <ExternalLink className="w-3 h-3" />
          </a>
        )}
      </div>
      <div className="divide-y divide-neutral-100">
        {items.map(({ label, value }) => (
          <div key={label} className="px-4 py-3">
            <span className="block text-[10px] font-medium text-neutral-500 mb-1">
              {label}
            </span>
            <p className="text-sm text-neutral-800 leading-relaxed whitespace-pre-line">
              {value}
            </p>
          </div>
        ))}
      </div>
    </div>
  );
}

/** 左: Step1 URL + 分析結果（テーブル形式） */
export function Step2AnalysisLeft({ inputUrl, marketingAnalysis }: Step2LeftProps) {
  const analysisItems = [
    { label: "ビジネスタイプ", value: marketingAnalysis.businessType },
    { label: "ターゲット", value: marketingAnalysis.target },
    { label: "感情トリガー", value: marketingAnalysis.emotionalTrigger },
    {
      label: "解決すべき痛み",
      value: marketingAnalysis.painPoints.map((p) => `・ ${p}`).join("\n"),
    },
  ];

  return (
    <div className="space-y-6">
      <div className="space-y-3">
        <StepSectionHeader step={1} title="入力URL" />
        <p className="text-sm text-neutral-600 break-all bg-neutral-50 rounded-lg px-3 py-2 border border-neutral-200">
          {inputUrl}
        </p>
      </div>

      <div className="space-y-3">
        <StepSectionHeader step={2} title="リサーチ" />
        <FrameworkCard
          title="分析結果"
          badge="インサイト"
          items={analysisItems}
          headerLink={{
            href: USER_INSIGHT_SEARCH_URL,
            label: "ユーザーインサイトとは？",
          }}
        />
      </div>
    </div>
  );
}

/** 右: 3C・AIDMA・次へボタン */
export function Step2AnalysisRight({ marketingAnalysis, onNext }: Step2Props) {
  const { framework } = marketingAnalysis;

  const threeCItems = [
    { label: "顧客（Customer）", value: framework.threeC.customer },
    { label: "競合（Competitor）", value: framework.threeC.competitor },
    { label: "自社（Company）", value: framework.threeC.company },
  ];

  const aidmaItems = [
    { label: "注目（Attention）", value: framework.aidma.attention },
    { label: "興味（Interest）", value: framework.aidma.interest },
    { label: "欲求（Desire）", value: framework.aidma.desire },
    { label: "記憶（Memory）", value: framework.aidma.memory },
    { label: "行動（Action）", value: framework.aidma.action },
  ];

  return (
    <div className="space-y-6">
      <FrameworkCard
        title="3C分析"
        badge="顧客・競合・自社"
        items={threeCItems}
        headerLink={{
          href: THREE_C_SEARCH_URL,
          label: "3C分析とは？",
        }}
      />

      <FrameworkCard
        title="AIDMA"
        badge="認知〜行動の流れ"
        items={aidmaItems}
        headerLink={{
          href: AIDMA_SEARCH_URL,
          label: "AIDMAとは？",
        }}
      />

      <button
        type="button"
        onClick={onNext}
        className="w-full bg-neutral-900 text-white py-3.5 rounded-xl text-sm font-bold hover:bg-neutral-800"
      >
        次へ：補足情報を入力
      </button>
    </div>
  );
}

