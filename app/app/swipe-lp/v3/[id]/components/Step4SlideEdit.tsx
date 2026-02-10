"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { Trash2, Copy, Sparkles, WandSparkles } from "lucide-react";
import type { SwipeLPv3Slide } from "@/types/swipe-lp-v3";
import { updateV3Slides } from "@/actions/swipe-lp-v3";
import { StepSectionHeader } from "./StepSectionHeader";
import { StepProgressBar } from "./StepProgressBar";
import type { SwipeLPv3Status } from "@/types/swipe-lp-v3";

/** ライブラリ用コピーフォーマット */
const LIBRARY_COPY_FORMAT = {
  main: "【メインコピー】",
  sub: "【サブコピー】",
  additional: "【追加テキスト】",
};

function formatForLibraryCopy(slide: SwipeLPv3Slide): string {
  const parts: string[] = [];
  parts.push(LIBRARY_COPY_FORMAT.main);
  parts.push(slide.message?.trim() || "");
  parts.push("");
  parts.push(LIBRARY_COPY_FORMAT.sub);
  parts.push(slide.subMessage?.trim() || "");
  parts.push("");
  parts.push(LIBRARY_COPY_FORMAT.additional);
  parts.push((slide.additionalText ?? []).join("\n"));
  return parts.join("\n");
}

interface Step4SlideEditProps {
  projectId: string;
  slides: SwipeLPv3Slide[];
  onUpdate: () => void;
  onBackToStep3: () => void;
  displayStatus: SwipeLPv3Status;
  /** 他ユーザーによる閲覧時（編集・保存・戻る非表示） */
  readOnly?: boolean;
}

export function Step4SlideEdit({
  projectId,
  slides,
  onUpdate,
  onBackToStep3,
  displayStatus,
  readOnly = false,
}: Step4SlideEditProps) {
  const [editingSlides, setEditingSlides] = useState(slides);
  const [selectedId, setSelectedId] = useState<string | null>(
    slides[0]?.id ?? null
  );
  const [error, setError] = useState<string | null>(null);
  const [copyToast, setCopyToast] = useState<string | null>(null);

  useEffect(() => {
    setEditingSlides(slides);
    if (!selectedId && slides[0]) setSelectedId(slides[0].id);
  }, [slides, selectedId]);

  const selectedSlide = editingSlides.find((s) => s.id === selectedId);

  const handleSaveSlides = async () => {
    setError(null);
    const result = await updateV3Slides(projectId, editingSlides);
    if (result.error) setError(result.error);
    else onUpdate();
  };

  const handleCopyForLibrary = async () => {
    if (!selectedSlide) return;
    const text = formatForLibraryCopy(selectedSlide);
    await navigator.clipboard.writeText(text);
    setCopyToast("プロンプト用にコピーしました。ライブラリで「一括貼り付け」を押してください。");
    setTimeout(() => setCopyToast(null), 3000);
  };

  const removeSlide = (id: string) => {
    const next = editingSlides
      .filter((s) => s.id !== id)
      .map((s, i) => ({ ...s, order: i + 1 }));
    setEditingSlides(next);
    if (selectedId === id) setSelectedId(next[0]?.id ?? null);
  };

  const updateSlide = (id: string, updates: Partial<SwipeLPv3Slide>) => {
    setEditingSlides(
      editingSlides.map((s) => (s.id === id ? { ...s, ...updates } : s))
    );
  };

  return (
    <div className="min-h-screen bg-neutral-50 flex flex-col">
      {/* トップバー: パンくず + 保存 + 戻る */}
      <div className="shrink-0 px-6 py-3 flex items-center justify-between border-b border-neutral-200 bg-white">
        <StepProgressBar status={displayStatus} />
        {!readOnly && (
          <button
            type="button"
            onClick={handleSaveSlides}
            className="px-4 py-2 bg-neutral-900 text-white rounded-lg text-sm font-semibold hover:bg-neutral-800"
          >
            スライドを保存
          </button>
        )}
      </div>

      {/* 2カラム: 左=スライドカード一覧 / 右=詳細 */}
      <main className="flex-1 grid min-h-0 grid-cols-1 lg:grid-cols-2">
        {/* 左: スライド概要カード（横並び・改行あり） */}
        <aside className="flex flex-col min-h-0 border-r border-neutral-200 bg-white overflow-y-auto">
          <div className="p-6">
            <div className="mb-4">
              <StepSectionHeader
                step={4}
                title="スライド構成"
                subtitle="スライドをクリックして詳細を編集"
              />
            </div>
            {!readOnly && (
              <button
                type="button"
                onClick={onBackToStep3}
                className="text-sm text-neutral-600 hover:text-neutral-900 underline mb-4 block"
              >
                Step 3 に戻る
              </button>
            )}
            {copyToast && (
              <div className="mb-4 p-3 bg-green-50 border border-green-200 rounded-lg text-green-800 text-sm">
                {copyToast}
              </div>
            )}
            {error && (
              <div className="mb-4 p-4 bg-red-50 border border-red-200 rounded-lg text-red-800 text-sm">
                {error}
              </div>
            )}
            <div className="flex flex-wrap gap-3">
              {editingSlides.map((slide) => (
                <button
                  key={slide.id}
                  type="button"
                  onClick={() => setSelectedId(slide.id)}
                  className={`text-left rounded-lg border p-4 w-[200px] min-h-[120px] transition-colors ${
                    selectedId === slide.id
                      ? "border-neutral-900 bg-neutral-900 text-white"
                      : "border-neutral-200 hover:border-neutral-400 bg-white"
                  }`}
                >
                  <span className="text-xs font-bold text-neutral-500 block mb-1">
                    #{slide.order}
                  </span>
                  <span
                    className={`text-sm font-medium block mb-1 ${
                      selectedId === slide.id ? "text-white" : "text-neutral-800"
                    }`}
                  >
                    {slide.purpose || "未設定"}
                  </span>
                  <span
                    className={`text-xs block leading-relaxed ${
                      selectedId === slide.id ? "text-white/90" : "text-neutral-600"
                    }`}
                  >
                    {slide.message || "メッセージなし"}
                  </span>
                </button>
              ))}
            </div>

            {/* デザインイメージ（選択スライドのビジュアル・ストーリー用メモ） */}
            {selectedSlide && (
              <div className="mt-6 rounded-xl border border-amber-200/80 bg-amber-50/50 p-4 space-y-4 shadow-sm">
                <h3 className="flex items-center gap-2 text-sm font-semibold text-amber-900">
                  <WandSparkles className="w-4 h-4 text-amber-600" />
                  デザインイメージ
                </h3>
                <div className="space-y-4">
                  <div>
                    <label className="block text-xs font-medium text-neutral-600 mb-1">ビジュアル方向性</label>
                    <input
                      type="text"
                      value={selectedSlide.visualHint ?? ""}
                      onChange={(e) =>
                        updateSlide(selectedSlide.id, { visualHint: e.target.value })
                      }
                      placeholder="例: 青空の下で笑顔の男性。解放感を演出"
                      className="w-full border border-neutral-200 rounded-lg px-3 py-2 text-sm bg-white disabled:opacity-70 disabled:bg-neutral-50"
                      disabled={readOnly}
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-neutral-600 mb-1">ストーリー上の役割</label>
                    <input
                      type="text"
                      value={selectedSlide.storyNote ?? ""}
                      onChange={(e) =>
                        updateSlide(selectedSlide.id, { storyNote: e.target.value })
                      }
                      placeholder="例: ファーストビュー。理想の姿で引き込み"
                      className="w-full border border-neutral-200 rounded-lg px-3 py-2 text-sm bg-white disabled:opacity-70 disabled:bg-neutral-50"
                      disabled={readOnly}
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-neutral-600 mb-1">伝えたいこと（1行）</label>
                    <input
                      type="text"
                      value={selectedSlide.keyTakeaway ?? ""}
                      onChange={(e) =>
                        updateSlide(selectedSlide.id, { keyTakeaway: e.target.value })
                      }
                      placeholder="例: 退職後の穏やかな生活をイメージさせる"
                      className="w-full border border-neutral-200 rounded-lg px-3 py-2 text-sm bg-white disabled:opacity-70 disabled:bg-neutral-50"
                      disabled={readOnly}
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-neutral-600 mb-1">代替コピー案（A/Bテスト用）</label>
                    <textarea
                      value={
                        Array.isArray(selectedSlide.messageAlternatives)
                          ? selectedSlide.messageAlternatives.join("\n")
                          : ""
                      }
                      onChange={(e) =>
                        updateSlide(selectedSlide.id, {
                          messageAlternatives: e.target.value
                            .split("\n")
                            .map((s) => s.trim())
                            .filter(Boolean)
                            .slice(0, 2),
                        })
                      }
                      placeholder="1行に1案（最大2案）"
                      rows={2}
                      className="w-full border border-neutral-200 rounded-lg px-3 py-2 text-sm resize-none bg-white disabled:opacity-70 disabled:bg-neutral-50"
                      disabled={readOnly}
                    />
                  </div>
                  {(selectedSlide.purpose?.toLowerCase().includes("cta") ||
                    selectedSlide.purpose?.toLowerCase().includes("クロージング")) && (
                    <>
                      <div>
                        <label className="block text-xs font-medium text-neutral-600 mb-1">ボタン文言</label>
                        <input
                          type="text"
                          value={selectedSlide.ctaButtonText ?? ""}
                          onChange={(e) =>
                            updateSlide(selectedSlide.id, { ctaButtonText: e.target.value })
                          }
                          placeholder="例: LINEで無料相談"
                          className="w-full border border-neutral-200 rounded-lg px-3 py-2 text-sm bg-white disabled:opacity-70 disabled:bg-neutral-50"
                          disabled={readOnly}
                        />
                      </div>
                      <div>
                        <label className="block text-xs font-medium text-neutral-600 mb-1">緊急性・限定感</label>
                        <input
                          type="text"
                          value={selectedSlide.ctaUrgency ?? ""}
                          onChange={(e) =>
                            updateSlide(selectedSlide.id, { ctaUrgency: e.target.value })
                          }
                          placeholder="例: 24時間受付"
                          className="w-full border border-neutral-200 rounded-lg px-3 py-2 text-sm bg-white disabled:opacity-70 disabled:bg-neutral-50"
                          disabled={readOnly}
                        />
                      </div>
                    </>
                  )}
                </div>
              </div>
            )}
          </div>
        </aside>

        {/* 右: 選択スライドの詳細 */}
        <section className="overflow-y-auto bg-neutral-50">
          <div className="p-6 max-w-2xl">
          {selectedSlide ? (
            <div className="space-y-4">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <span className="text-sm font-bold text-neutral-500">
                  #{selectedSlide.order} {selectedSlide.purpose}
                </span>
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={handleCopyForLibrary}
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-neutral-100 hover:bg-neutral-200 rounded-lg text-xs font-medium text-neutral-700"
                  >
                    <Copy className="w-3.5 h-3.5" />
                    プロンプト用にコピー
                  </button>
                  {!readOnly && (
                    <>
                      <Link
                        href="/library/manage"
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center gap-1.5 px-3 py-1.5 border border-neutral-200 hover:border-neutral-300 hover:bg-neutral-50 rounded-lg text-xs font-medium text-neutral-700 transition-colors"
                      >
                        <Sparkles className="w-3.5 h-3.5" />
                        プロンプトを生成
                      </Link>
                      <button
                        type="button"
                        onClick={() => removeSlide(selectedSlide.id)}
                        className="p-1.5 text-red-600 hover:bg-red-50 rounded-lg"
                        aria-label="このスライドを削除"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </>
                  )}
                </div>
              </div>

              <div>
                <label className="block text-xs font-medium text-neutral-500 mb-1">
                  狙い（心理トリガー）
                </label>
                <input
                  type="text"
                  value={selectedSlide.emotion ?? ""}
                  onChange={(e) =>
                    updateSlide(selectedSlide.id, { emotion: e.target.value })
                  }
                  placeholder="例: 自由・安堵・共感・焦り"
                  className="w-full border border-neutral-200 rounded-lg px-3 py-2 text-sm disabled:opacity-70 disabled:bg-neutral-50"
                  disabled={readOnly}
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-neutral-500 mb-1">
                  メインコピー *
                </label>
                <input
                  type="text"
                  value={selectedSlide.message}
                  onChange={(e) =>
                    updateSlide(selectedSlide.id, { message: e.target.value })
                  }
                  placeholder="メインメッセージ"
                  className="w-full border border-neutral-200 rounded-lg px-3 py-2 text-sm disabled:opacity-70 disabled:bg-neutral-50"
                  disabled={readOnly}
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-neutral-500 mb-1">
                  サブコピー
                </label>
                <textarea
                  value={selectedSlide.subMessage ?? ""}
                  onChange={(e) =>
                    updateSlide(selectedSlide.id, {
                      subMessage: e.target.value,
                    })
                  }
                  placeholder="サブメッセージ"
                  rows={2}
                  className="w-full border border-neutral-200 rounded-lg px-3 py-2 text-sm resize-none disabled:opacity-70 disabled:bg-neutral-50"
                  disabled={readOnly}
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-neutral-500 mb-1">
                  追加テキスト（1行1項目・チェックリスト等）
                </label>
                <textarea
                  value={(selectedSlide.additionalText ?? []).join("\n")}
                  onChange={(e) =>
                    updateSlide(selectedSlide.id, {
                      additionalText: e.target.value
                        .split("\n")
                        .map((s) => s.trim())
                        .filter(Boolean),
                    })
                  }
                  placeholder={"例：\n無料マッチ\n結婚前提\n2分で登録"}
                  rows={2}
                  className="w-full border border-neutral-200 rounded-lg px-3 py-2 text-sm resize-none disabled:opacity-70 disabled:bg-neutral-50"
                  disabled={readOnly}
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-neutral-500 mb-1">
                  ナレーション原稿（VO・読み上げ用）
                </label>
                <textarea
                  value={selectedSlide.narration ?? ""}
                  onChange={(e) =>
                    updateSlide(selectedSlide.id, {
                      narration: e.target.value,
                    })
                  }
                  placeholder="SNSインフルエンサー風に視聴者に語りかける。15-30秒程度（ねえ、みんな、あなた、など）"
                  rows={4}
                  className="w-full border border-neutral-200 rounded-lg px-3 py-2 text-sm resize-none disabled:opacity-70 disabled:bg-neutral-50"
                  disabled={readOnly}
                />
              </div>
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center min-h-[200px] text-neutral-500 text-sm">
              <p>スライドをクリックして詳細を編集</p>
            </div>
          )}
          </div>
        </section>
      </main>
    </div>
  );
}
