"use client";

import { useState, useEffect } from "react";
import { GripVertical, Plus, Trash2, Palette } from "lucide-react";
import type { SwipeLPv3Slide } from "@/types/swipe-lp-v3";
import { DesignLibraryModal } from "./DesignLibraryModal";
import { updateV3Slides, listPromptTemplatesForSlide } from "@/actions/swipe-lp-v3";
import { generatePromptForSlide } from "@/actions/swipe-lp-v3";

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
  const [error, setError] = useState<string | null>(null);
  const [slideIdForLibrary, setSlideIdForLibrary] = useState<string | null>(null);
  const [candidateOffset, setCandidateOffset] = useState(0);

  const [recommended, setRecommended] = useState<
    Array<{ id: string; name: string; sample_image_url: string | null; image_urls?: string[] | null; category: string | null }>
  >([]);
  const [others, setOthers] = useState<
    Array<{ id: string; name: string; sample_image_url: string | null; image_urls?: string[] | null; category: string | null }>
  >([]);
  const [generatingId, setGeneratingId] = useState<string | null>(null);

  useEffect(() => {
    setEditingSlides(slides);
  }, [slides]);

  const openLibraryForSlide = (slide: SwipeLPv3Slide) => {
    setSlideIdForLibrary(slide.id);
    setCandidateOffset(0);
    loadTemplatesForSlide(slide, 0);
  };

  const loadTemplatesForSlide = async (slide: SwipeLPv3Slide, offset: number) => {
    const { recommended: rec, others: oth } = await listPromptTemplatesForSlide(projectId, slide, offset);
    if (rec) setRecommended(rec);
    if (oth) setOthers(oth);
  };

  const handleMoreCandidates = async () => {
    const slide = editingSlides.find((s) => s.id === slideIdForLibrary);
    if (!slide) return;
    const next = candidateOffset + 1;
    setCandidateOffset(next);
    await loadTemplatesForSlide(slide, next);
  };

  const handleSaveSlides = async () => {
    await updateV3Slides(projectId, editingSlides);
    onUpdate();
  };

  const handleSelectTemplate = async (id: string) => {
    if (!slideIdForLibrary) return;
    const nextSlides = editingSlides.map((s) =>
      s.id === slideIdForLibrary ? { ...s, selected_template_id: id } : s
    );
    setEditingSlides(nextSlides);
    setSlideIdForLibrary(null);
    await updateV3Slides(projectId, nextSlides);
    onUpdate();
  };

  const handleGeneratePrompt = async (slideId: string) => {
    setError(null);
    setGeneratingId(slideId);
    try {
      const saveResult = await updateV3Slides(projectId, editingSlides);
      if (saveResult.error) {
        setError(saveResult.error);
        return;
      }
      const genResult = await generatePromptForSlide(projectId, slideId);
      if (genResult.error) {
        setError(genResult.error);
        return;
      }
      onUpdate();
    } finally {
      setGeneratingId(null);
    }
  };

  const addSlide = () => {
    const newSlide: SwipeLPv3Slide = {
      id: crypto.randomUUID(),
      order: editingSlides.length + 1,
      purpose: "補足",
      message: "",
      subMessage: "",
    };
    setEditingSlides([...editingSlides, newSlide]);
  };

  const removeSlide = (id: string) => {
    const next = editingSlides
      .filter((s) => s.id !== id)
      .map((s, i) => ({ ...s, order: i + 1 }));
    setEditingSlides(next);
  };

  const updateSlide = (id: string, updates: Partial<SwipeLPv3Slide>) => {
    setEditingSlides(
      editingSlides.map((s) => (s.id === id ? { ...s, ...updates } : s))
    );
  };

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-lg font-bold mb-2">Step 4-5: スライド構成とプロンプト</h2>
        <p className="text-sm text-neutral-600 mb-4">
          スライドを編集・追加・削除できます。デザインを選んでから、各スライドのプロンプトを生成してください。
        </p>

        {error && (
          <div className="mb-4 p-4 bg-red-50 border border-red-200 rounded-xl text-red-800 text-sm">
            {error}
          </div>
        )}
      </div>

      <div className="space-y-4">
        {editingSlides.map((slide) => (
          <div
            key={slide.id}
            className="border-2 border-neutral-200 rounded-xl p-4 space-y-3"
          >
            <div className="flex items-center gap-2">
              <GripVertical className="w-5 h-5 text-neutral-400" />
              <span className="text-sm font-bold text-neutral-500">
                #{slide.order}
              </span>
              <button
                type="button"
                onClick={() => removeSlide(slide.id)}
                className="ml-auto p-2 text-red-600 hover:bg-red-50 rounded-lg"
              >
                <Trash2 className="w-4 h-4" />
              </button>
            </div>

            <input
              type="text"
              value={slide.message}
              onChange={(e) => updateSlide(slide.id, { message: e.target.value })}
              placeholder="メインメッセージ"
              className="w-full border border-neutral-200 rounded-lg px-3 py-2 text-sm"
            />
            <textarea
              value={slide.subMessage ?? ""}
              onChange={(e) =>
                updateSlide(slide.id, { subMessage: e.target.value })
              }
              placeholder="サブメッセージ"
              rows={2}
              className="w-full border border-neutral-200 rounded-lg px-3 py-2 text-sm resize-none"
            />
            <div>
              <label className="block text-xs text-neutral-500 mb-1">
                追加テキスト（1行1項目・チェックリスト等）
              </label>
              <textarea
                value={(slide.additionalText ?? []).join("\n")}
                onChange={(e) =>
                  updateSlide(slide.id, {
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

            <div className="flex flex-wrap items-center gap-3 pt-2">
              <button
                type="button"
                onClick={() => openLibraryForSlide(slide)}
                className="inline-flex items-center gap-2 px-3 py-1.5 border border-neutral-200 rounded-lg text-sm hover:border-neutral-400"
              >
                <Palette className="w-4 h-4" />
                デザインを選ぶ
                {slide.selected_template_id && (
                  <span className="text-xs bg-neutral-200 px-1.5 py-0.5 rounded">
                    選択中
                  </span>
                )}
              </button>

              <select
                value={slide.excludePerson ? "overlay" : "full"}
                onChange={(e) =>
                  updateSlide(slide.id, {
                    excludePerson: e.target.value === "overlay",
                  })
                }
                className="border border-neutral-200 rounded-lg px-3 py-1 text-sm"
                title="人物なし：テキストのみ（背景単色・マスクしやすい）"
              >
                <option value="full">通常</option>
                <option value="overlay">人物なし</option>
              </select>

              <button
                type="button"
                onClick={() => handleGeneratePrompt(slide.id)}
                disabled={!slide.selected_template_id || generatingId === slide.id}
                title={!slide.selected_template_id ? "デザインを選択してください" : undefined}
                className="ml-auto px-4 py-2 bg-neutral-900 text-white text-sm rounded-lg hover:bg-neutral-800 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {generatingId === slide.id
                  ? "生成中..."
                  : slide.prompt
                    ? "再生成"
                    : "プロンプト生成"}
              </button>
            </div>

            {slide.prompt && (
              <div className="mt-3 p-3 bg-neutral-50 rounded-lg">
                <p className="text-xs font-bold text-neutral-600 mb-1">
                  生成されたプロンプト
                </p>
                <pre className="text-xs whitespace-pre-wrap break-words max-h-32 overflow-y-auto">
                  {slide.prompt}
                </pre>
                <button
                  type="button"
                  onClick={() => navigator.clipboard.writeText(slide.prompt!)}
                  className="mt-2 text-xs text-blue-600 hover:underline"
                >
                  コピー
                </button>
              </div>
            )}
          </div>
        ))}

        <button
          type="button"
          onClick={addSlide}
          className="w-full border-2 border-dashed border-neutral-300 rounded-xl py-4 flex items-center justify-center gap-2 text-neutral-600 hover:border-neutral-500"
        >
          <Plus className="w-5 h-5" />
          スライドを追加
        </button>

        <button
          type="button"
          onClick={handleSaveSlides}
          className="w-full bg-neutral-900 text-white py-4 rounded-xl font-bold hover:bg-neutral-800"
        >
          スライドを保存
        </button>
      </div>

      <DesignLibraryModal
        isOpen={!!slideIdForLibrary}
        onClose={() => setSlideIdForLibrary(null)}
        recommended={recommended}
        others={others}
        selectedId={
          slideIdForLibrary
            ? editingSlides.find((s) => s.id === slideIdForLibrary)?.selected_template_id ?? null
            : null
        }
        onSelect={handleSelectTemplate}
        onMoreCandidates={others.length > 0 ? handleMoreCandidates : undefined}
      />
    </div>
  );
}
