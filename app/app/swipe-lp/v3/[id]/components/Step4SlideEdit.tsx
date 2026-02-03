"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { Plus, Trash2, Copy, ChevronDown, ChevronRight } from "lucide-react";
import type { SwipeLPv3Slide } from "@/types/swipe-lp-v3";
import { updateV3Slides } from "@/actions/swipe-lp-v3";

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

function estimateNarrationSeconds(text: string): number {
  if (!text?.trim()) return 0;
  return Math.ceil(text.trim().length / 5);
}

interface Step4SlideEditProps {
  projectId: string;
  slides: SwipeLPv3Slide[];
  onUpdate: () => void;
}

export function Step4SlideEdit({
  projectId,
  slides,
  onUpdate,
}: Step4SlideEditProps) {
  const [editingSlides, setEditingSlides] = useState(slides);
  const [selectedId, setSelectedId] = useState<string | null>(
    slides[0]?.id ?? null
  );
  const [error, setError] = useState<string | null>(null);
  const [copyToast, setCopyToast] = useState<string | null>(null);
  const [expandedDetails, setExpandedDetails] = useState(true);

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
    setCopyToast("ライブラリ用にコピーしました。ライブラリで「一括貼り付け」を押してください。");
    setTimeout(() => setCopyToast(null), 3000);
  };

  const addSlide = () => {
    const newSlide: SwipeLPv3Slide = {
      id: crypto.randomUUID(),
      order: editingSlides.length + 1,
      purpose: "補足",
      message: "",
      subMessage: "",
    };
    const next = [...editingSlides, newSlide].map((s, i) => ({
      ...s,
      order: i + 1,
    }));
    setEditingSlides(next);
    setSelectedId(newSlide.id);
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
    <div className="space-y-4">
      <div>
        <h2 className="text-lg font-bold mb-2">Step 4: スライド構成</h2>
        <p className="text-sm text-neutral-600 mb-2">
          スライドを編集・追加・削除できます。構成ができたら
          <Link
            href="/library/manage"
            className="text-blue-600 hover:underline mx-1"
          >
            ライブラリ
          </Link>
          でデザインを選びプロンプトを生成できます。
        </p>
        {copyToast && (
          <div className="mb-4 p-3 bg-green-50 border border-green-200 rounded-xl text-green-800 text-sm">
            {copyToast}
          </div>
        )}
        {error && (
          <div className="mb-4 p-4 bg-red-50 border border-red-200 rounded-xl text-red-800 text-sm">
            {error}
          </div>
        )}
      </div>

      <div className="flex gap-4 min-h-[500px]">
        {/* 左: スライド一覧 */}
        <div className="w-48 shrink-0 flex flex-col gap-2">
          {editingSlides.map((slide) => (
            <button
              key={slide.id}
              type="button"
              onClick={() => setSelectedId(slide.id)}
              className={`text-left rounded-xl border-2 p-3 transition-colors ${
                selectedId === slide.id
                  ? "border-neutral-900 bg-neutral-900 text-white"
                  : "border-neutral-200 hover:border-neutral-400 bg-white"
              }`}
            >
              <span className="text-xs font-bold text-neutral-500 block">
                #{slide.order}
              </span>
              <span
                className={`text-xs font-medium block truncate ${
                  selectedId === slide.id ? "text-white" : "text-neutral-800"
                }`}
              >
                {slide.purpose || "未設定"}
              </span>
              <span
                className={`text-xs block truncate mt-0.5 ${
                  selectedId === slide.id ? "text-white/80" : "text-neutral-500"
                }`}
              >
                {slide.message || "メッセージなし"}
              </span>
            </button>
          ))}
          <button
            type="button"
            onClick={addSlide}
            className="border-2 border-dashed border-neutral-300 rounded-xl py-3 flex items-center justify-center gap-2 text-neutral-500 hover:border-neutral-500 hover:text-neutral-700 text-sm"
          >
            <Plus className="w-4 h-4" />
            スライド追加
          </button>
        </div>

        {/* 右: 選択スライドの詳細 */}
        <div className="flex-1 min-w-0 overflow-y-auto">
          {selectedSlide ? (
            <div className="space-y-4 pr-2">
              <div className="flex items-center justify-between">
                <span className="text-sm font-bold text-neutral-500">
                  #{selectedSlide.order} {selectedSlide.purpose}
                </span>
                <button
                  type="button"
                  onClick={() => removeSlide(selectedSlide.id)}
                  className="p-2 text-red-600 hover:bg-red-50 rounded-lg"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
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
                  className="w-full border border-neutral-200 rounded-lg px-3 py-2 text-sm"
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
                  className="w-full border border-neutral-200 rounded-lg px-3 py-2 text-sm"
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
                  className="w-full border border-neutral-200 rounded-lg px-3 py-2 text-sm resize-none"
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
                  className="w-full border border-neutral-200 rounded-lg px-3 py-2 text-sm resize-none"
                />
              </div>

              {/* 折りたたみ: 詳細 */}
              <div className="border border-neutral-200 rounded-xl overflow-hidden">
                <button
                  type="button"
                  onClick={() => setExpandedDetails(!expandedDetails)}
                  className="w-full flex items-center gap-2 px-4 py-3 bg-neutral-50 hover:bg-neutral-100 text-left text-sm font-medium"
                >
                  {expandedDetails ? (
                    <ChevronDown className="w-4 h-4" />
                  ) : (
                    <ChevronRight className="w-4 h-4" />
                  )}
                  詳細
                </button>
                {expandedDetails && (
                  <div className="p-4 space-y-4 border-t border-neutral-200">
                    <div>
                      <label className="block text-xs font-medium text-neutral-500 mb-1">
                        ビジュアル方向性
                      </label>
                      <input
                        type="text"
                        value={selectedSlide.visualHint ?? ""}
                        onChange={(e) =>
                          updateSlide(selectedSlide.id, {
                            visualHint: e.target.value,
                          })
                        }
                        placeholder="例: 青空の下で笑顔の男性。解放感を演出"
                        className="w-full border border-neutral-200 rounded-lg px-3 py-2 text-sm"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-medium text-neutral-500 mb-1">
                        ストーリー上の役割
                      </label>
                      <input
                        type="text"
                        value={selectedSlide.storyNote ?? ""}
                        onChange={(e) =>
                          updateSlide(selectedSlide.id, {
                            storyNote: e.target.value,
                          })
                        }
                        placeholder="例: ファーストビュー。理想の姿で引き込み"
                        className="w-full border border-neutral-200 rounded-lg px-3 py-2 text-sm"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-medium text-neutral-500 mb-1">
                        伝えたいこと（1行）
                      </label>
                      <input
                        type="text"
                        value={selectedSlide.keyTakeaway ?? ""}
                        onChange={(e) =>
                          updateSlide(selectedSlide.id, {
                            keyTakeaway: e.target.value,
                          })
                        }
                        placeholder="例: 退職後の穏やかな生活をイメージさせる"
                        className="w-full border border-neutral-200 rounded-lg px-3 py-2 text-sm"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-medium text-neutral-500 mb-1">
                        代替コピー案（A/Bテスト用）
                      </label>
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
                        className="w-full border border-neutral-200 rounded-lg px-3 py-2 text-sm resize-none"
                      />
                    </div>
                    {(selectedSlide.purpose?.toLowerCase().includes("cta") ||
                      selectedSlide.purpose?.toLowerCase().includes("クロージング")) && (
                      <>
                        <div>
                          <label className="block text-xs font-medium text-neutral-500 mb-1">
                            ボタン文言
                          </label>
                          <input
                            type="text"
                            value={selectedSlide.ctaButtonText ?? ""}
                            onChange={(e) =>
                              updateSlide(selectedSlide.id, {
                                ctaButtonText: e.target.value,
                              })
                            }
                            placeholder="例: LINEで無料相談"
                            className="w-full border border-neutral-200 rounded-lg px-3 py-2 text-sm"
                          />
                        </div>
                        <div>
                          <label className="block text-xs font-medium text-neutral-500 mb-1">
                            緊急性・限定感
                          </label>
                          <input
                            type="text"
                            value={selectedSlide.ctaUrgency ?? ""}
                            onChange={(e) =>
                              updateSlide(selectedSlide.id, {
                                ctaUrgency: e.target.value,
                              })
                            }
                            placeholder="例: 24時間受付"
                            className="w-full border border-neutral-200 rounded-lg px-3 py-2 text-sm"
                          />
                        </div>
                      </>
                    )}
                  </div>
                )}
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
                  placeholder="話し言葉で15-30秒程度。テキストの補足・感情の深掘り"
                  rows={4}
                  className="w-full border border-neutral-200 rounded-lg px-3 py-2 text-sm resize-none"
                />
                {selectedSlide.narration?.trim() && (
                  <p className="text-xs text-neutral-500 mt-1">
                    約{estimateNarrationSeconds(selectedSlide.narration)}秒
                  </p>
                )}
              </div>

              <button
                type="button"
                onClick={handleCopyForLibrary}
                className="inline-flex items-center gap-2 px-4 py-2 bg-neutral-100 hover:bg-neutral-200 rounded-lg text-sm font-medium"
              >
                <Copy className="w-4 h-4" />
                ライブラリ用にコピー
              </button>
            </div>
          ) : (
            <div className="flex items-center justify-center h-full text-neutral-500 text-sm">
              スライドを選択してください
            </div>
          )}
        </div>
      </div>

      <button
        type="button"
        onClick={handleSaveSlides}
        className="w-full bg-neutral-900 text-white py-4 rounded-xl font-bold hover:bg-neutral-800"
      >
        スライドを保存
      </button>
    </div>
  );
}
