"use client";

import type { MarketingAnalysis } from "@/types/swipe-lp";

interface Step2AnalysisProps {
  marketingAnalysis: MarketingAnalysis;
  onNext: () => void;
}

export function Step2Analysis({ marketingAnalysis, onNext }: Step2AnalysisProps) {
  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-lg font-bold mb-2">Step 2: 分析結果を確認</h2>
        <p className="text-sm text-neutral-600 mb-6">
          AIが抽出したユーザーインサイトと根拠を確認してください
        </p>
      </div>

      <div className="bg-white border-2 border-neutral-200 rounded-xl p-6 space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <h3 className="font-bold text-sm text-neutral-600 mb-2">
              ビジネスタイプ
            </h3>
            <p className="text-lg">{marketingAnalysis.businessType}</p>
          </div>
          <div>
            <h3 className="font-bold text-sm text-neutral-600 mb-2">
              ターゲット
            </h3>
            <p className="text-lg">{marketingAnalysis.target}</p>
          </div>
          <div>
            <h3 className="font-bold text-sm text-neutral-600 mb-2">
              感情トリガー
            </h3>
            <p className="text-lg">{marketingAnalysis.emotionalTrigger}</p>
          </div>
          <div>
            <h3 className="font-bold text-sm text-neutral-600 mb-2">
              解決すべき痛み
            </h3>
            <ul className="space-y-1">
              {marketingAnalysis.painPoints.map((p, i) => (
                <li key={i} className="flex gap-2">
                  <span className="text-red-500">•</span>
                  <span>{p}</span>
                </li>
              ))}
            </ul>
          </div>
        </div>

        <details className="group" open>
          <summary className="cursor-pointer font-bold text-neutral-700 hover:text-neutral-900">
            3C・AIDMA 詳細
          </summary>
          <div className="mt-4 space-y-4 text-sm">
            <div>
              <h4 className="font-bold mb-2">3C分析</h4>
              <div className="bg-neutral-50 p-4 rounded-lg space-y-2">
                <p>
                  <strong>Customer:</strong>{" "}
                  {marketingAnalysis.framework.threeC.customer}
                </p>
                <p>
                  <strong>Competitor:</strong>{" "}
                  {marketingAnalysis.framework.threeC.competitor}
                </p>
                <p>
                  <strong>Company:</strong>{" "}
                  {marketingAnalysis.framework.threeC.company}
                </p>
              </div>
            </div>
            <div>
              <h4 className="font-bold mb-2">AIDMA</h4>
              <div className="bg-neutral-50 p-4 rounded-lg space-y-2">
                <p>
                  <strong>Attention:</strong>{" "}
                  {marketingAnalysis.framework.aidma.attention}
                </p>
                <p>
                  <strong>Interest:</strong>{" "}
                  {marketingAnalysis.framework.aidma.interest}
                </p>
                <p>
                  <strong>Desire:</strong>{" "}
                  {marketingAnalysis.framework.aidma.desire}
                </p>
                <p>
                  <strong>Memory:</strong>{" "}
                  {marketingAnalysis.framework.aidma.memory}
                </p>
                <p>
                  <strong>Action:</strong>{" "}
                  {marketingAnalysis.framework.aidma.action}
                </p>
              </div>
            </div>
          </div>
        </details>
      </div>

      <button
        type="button"
        onClick={onNext}
        className="w-full bg-neutral-900 text-white py-4 rounded-xl font-bold hover:bg-neutral-800"
      >
        次へ：補足情報を入力
      </button>
    </div>
  );
}
