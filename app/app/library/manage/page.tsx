"use client";

import { useState, useEffect, useRef } from "react";
import { createPortal } from "react-dom";
import Link from "next/link";
import { ArrowLeft, Upload, Loader2, Trash2, Sparkles, X, Copy, CopyCheck, RefreshCw, Save, Palette, Type } from "lucide-react";
import {
  listPromptTemplates,
  deletePromptTemplate,
  uploadAndCreateTemplatesFromImages,
  generatePromptFromTemplateAndText,
  regeneratePromptTemplate,
  updatePromptTemplate,
} from "@/actions/library";
import type { PromptTemplate, TemplateStyle, TemplateSlots } from "@/types/swipe-lp-v3";
import { ASPECT_RATIOS } from "@/lib/constants";
import { AspectRatioIcon } from "@/app/components/AspectRatioIcon";

/** 構造化スタイルを表形式で編集 */
function StyleJsonEditor({
  style,
  onChange,
}: {
  style: TemplateStyle;
  onChange: (s: TemplateStyle) => void;
}) {
  const update = (key: keyof TemplateStyle, value: string | string[]) => {
    onChange({ ...style, [key]: value });
  };
  const rows: { key: keyof TemplateStyle; label: string }[] = [
    { key: "photography", label: "撮影" },
    { key: "lighting", label: "ライト" },
    { key: "designStyle", label: "デザイン" },
    { key: "layout", label: "レイアウト" },
    { key: "typography", label: "タイポ" },
    { key: "colors", label: "配色" },
    { key: "decorations", label: "装飾" },
    { key: "mood", label: "ムード" },
  ];
  return (
    <div className="overflow-x-auto">
      <table className="w-full text-xs">
        <tbody>
          {rows.map(({ key, label }) => {
            const val = style[key];
            const isArray = Array.isArray(val);
            return (
              <tr key={key} className="hover:bg-white/50 transition-colors">
                <th className="py-1.5 pr-3 text-left font-medium text-neutral-500 align-middle w-20 shrink-0 text-xs">
                  {label}
                </th>
                <td className="py-1.5 align-middle">
                  <input
                    type="text"
                    value={isArray ? (val as string[]).join("、") : (val as string) || ""}
                    onChange={(e) => {
                      const v = e.target.value;
                      update(key, isArray ? v.split(/[、,]/).map((s) => s.trim()).filter(Boolean) : v);
                    }}
                    placeholder={isArray ? "カンマまたは、で区切り" : ""}
                    className="w-full text-neutral-800 bg-white border border-neutral-200 rounded-md px-2.5 py-1.5 text-xs focus:outline-none focus:ring-2 focus:ring-neutral-400 focus:border-transparent hover:border-neutral-300 transition-colors"
                  />
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}

/** テキストスロットを表形式で編集 */
function SlotsJsonEditor({
  slots,
  onChange,
}: {
  slots: TemplateSlots;
  onChange: (s: TemplateSlots) => void;
}) {
  const list = slots?.textSlots ?? [];
  if (list.length === 0) return null;
  const updateDesc = (id: string, description: string) => {
    onChange({
      textSlots: list.map((s) => (s.id === id ? { ...s, description } : s)),
    });
  };
  return (
    <div className="overflow-x-auto">
      <table className="w-full text-xs">
        <thead>
          <tr>
            <th className="py-1.5 pr-3 text-left font-medium text-neutral-600 align-middle text-xs">ID</th>
            <th className="py-1.5 text-left font-medium text-neutral-600 align-middle text-xs">説明</th>
          </tr>
        </thead>
        <tbody>
          {list.map((s) => (
            <tr key={s.id} className="hover:bg-white/50 transition-colors">
              <td className="py-1.5 pr-3 font-medium text-neutral-700 align-middle w-24 shrink-0 text-xs">
                {s.id}
              </td>
              <td className="py-1.5 align-middle">
                <input
                  type="text"
                  value={s.description}
                  onChange={(e) => updateDesc(s.id, e.target.value)}
                  className="w-full text-neutral-800 bg-white border border-neutral-200 rounded-md px-2.5 py-1.5 text-xs focus:outline-none focus:ring-2 focus:ring-neutral-400 focus:border-transparent hover:border-neutral-300 transition-colors"
                />
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

export default function LibraryManagePage() {
  const [templates, setTemplates] = useState<PromptTemplate[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [generating, setGenerating] = useState(false);
  const [files, setFiles] = useState<File[]>([]);
  const [selectedTemplate, setSelectedTemplate] = useState<PromptTemplate | null>(null);
  const [regenerating, setRegenerating] = useState(false);
  const [saving, setSaving] = useState(false);
  const [editingStyle, setEditingStyle] = useState<TemplateStyle | null>(null);
  const [editingSlots, setEditingSlots] = useState<TemplateSlots | null>(null);
  const [promptGenMessage, setPromptGenMessage] = useState("");
  const [promptGenSubMessage, setPromptGenSubMessage] = useState("");
  const [promptGenAdditionalText, setPromptGenAdditionalText] = useState("");
  const [promptGenExcludePerson, setPromptGenExcludePerson] = useState(false);
  const [overlayMode, setOverlayMode] = useState(false);
  const [promptGenAspectRatio, setPromptGenAspectRatio] = useState<string>("9:16");
  const [promptGenCustomAspectRatio, setPromptGenCustomAspectRatio] = useState("");
  const [generatingPrompt, setGeneratingPrompt] = useState(false);
  const [generatedPrompt, setGeneratedPrompt] = useState<string | null>(null);
  const [showGenerateModal, setShowGenerateModal] = useState(false);
  const [copied, setCopied] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (selectedTemplate) {
      setEditingStyle(selectedTemplate.style_json ?? null);
      setEditingSlots(selectedTemplate.slots_json ?? null);
      setGeneratedPrompt(null);
      setCopied(false);
    } else {
      setEditingStyle(null);
      setEditingSlots(null);
      setGeneratedPrompt(null);
      setShowGenerateModal(false);
      setCopied(false);
    }
  }, [selectedTemplate]);

  const load = async () => {
    setLoading(true);
    const { templates: t, error: e } = await listPromptTemplates();
    if (e) setError(e);
    else setTemplates(t ?? []);
    setLoading(false);
  };

  useEffect(() => {
    load();
  }, []);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selected = Array.from(e.target.files || []);
    setFiles(selected);
  };

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const form = e.currentTarget;
    const formData = new FormData(form);
    const images = formData.getAll("images");
    if (!images.length || (images[0] instanceof File && (images[0] as File).size === 0)) {
      setError("画像を1枚以上選択してください");
      return;
    }
    setGenerating(true);
    setError(null);

    const { error: err } = await uploadAndCreateTemplatesFromImages(formData);

    if (err) {
      setError(err);
    } else {
      setFiles([]);
      form.reset();
      if (fileInputRef.current) fileInputRef.current.value = "";
      load();
    }
    setGenerating(false);
  };

  const handleDelete = async (e: React.MouseEvent, id: string) => {
    e.stopPropagation();
    if (!confirm("削除しますか？")) return;
    const { error: err } = await deletePromptTemplate(id);
    if (err) setError(err);
    else {
      load();
      setSelectedTemplate((prev) => (prev?.id === id ? null : prev));
    }
  };

  const handleCopyPrompt = async (text: string) => {
    await navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleRegenerate = async () => {
    if (!selectedTemplate?.id) return;
    const hasImage = selectedTemplate.sample_image_url || selectedTemplate.image_urls?.[0];
    if (!hasImage) {
      setError("参照画像がありません");
      return;
    }
    setRegenerating(true);
    setError(null);
    const { template, error: err } = await regeneratePromptTemplate(selectedTemplate.id);
    if (err) setError(err);
    else if (template) {
      setSelectedTemplate(template);
      load();
    }
    setRegenerating(false);
  };

  const handleGeneratePrompt = async () => {
    if (!selectedTemplate?.id) return;
    if (!overlayMode && !promptGenMessage.trim()) {
      setError("メインコピーを入力してください");
      return;
    }
    setGeneratingPrompt(true);
    setError(null);
    const selectedAspectRatio =
      promptGenAspectRatio === "custom"
        ? promptGenCustomAspectRatio.trim()
        : promptGenAspectRatio;
    const { prompt, error: err } = await generatePromptFromTemplateAndText(selectedTemplate.id, {
      message: promptGenMessage.trim(),
      subMessage: promptGenSubMessage.trim() || undefined,
      additionalText: promptGenAdditionalText
        .split("\n")
        .map((s) => s.trim())
        .filter(Boolean),
      excludePerson: promptGenExcludePerson,
      overlayMode,
      aspectRatio: selectedAspectRatio || "9:16",
    });
    if (err) setError(err);
    else if (prompt) setGeneratedPrompt(prompt);
    setGeneratingPrompt(false);
  };

  const handleSaveJson = async () => {
    if (!selectedTemplate?.id || (!editingStyle && !editingSlots)) return;
    setSaving(true);
    setError(null);
    const updates: Parameters<typeof updatePromptTemplate>[1] = {};
    if (editingStyle) updates.style_json = editingStyle;
    if (editingSlots) updates.slots_json = editingSlots;
    const { error: err } = await updatePromptTemplate(selectedTemplate.id, updates);
    if (err) setError(err);
    else {
      setSelectedTemplate(null);
      load();
    }
    setSaving(false);
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-neutral-50 to-white">
      <div className="max-w-2xl mx-auto p-6 space-y-8">
        <div className="flex items-center gap-4">
          <Link
            href="/"
            className="p-2 hover:bg-neutral-100 rounded-lg transition-colors"
          >
            <ArrowLeft className="w-5 h-5 text-neutral-600" />
          </Link>
          <h1 className="text-xl font-bold text-neutral-900">
            プロンプトライブラリ
          </h1>
        </div>

        {error && (
          <div className="bg-red-50 border border-red-200 rounded-xl p-4">
            <p className="text-sm text-red-800">{error}</p>
          </div>
        )}

        <form
          onSubmit={handleSubmit}
          className="bg-white border-2 border-neutral-200 rounded-2xl p-6 space-y-4"
        >
          <div className="relative border-2 border-dashed border-neutral-300 rounded-xl min-h-[140px] flex flex-wrap gap-2 p-4 cursor-pointer hover:border-neutral-400">
            {files.length > 0 ? (
              files.map((f, i) => (
                <div
                  key={i}
                  className="w-16 h-16 rounded-lg overflow-hidden bg-neutral-100 flex-shrink-0 pointer-events-none"
                >
                  <img
                    src={URL.createObjectURL(f)}
                    alt=""
                    className="w-full h-full object-cover"
                  />
                </div>
              ))
            ) : (
              <div className="flex items-center gap-2 text-neutral-500 w-full justify-center py-6 pointer-events-none">
                <Upload className="w-10 h-10" />
                <span>クリックして画像を選択</span>
              </div>
            )}
            <input
              ref={fileInputRef}
              type="file"
              name="images"
              accept="image/*"
              multiple
              onChange={handleFileChange}
              className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10"
              aria-label="画像を選択"
            />
          </div>

          <button
            type="submit"
            disabled={generating || !files.length}
            className="w-full bg-neutral-900 text-white py-4 rounded-xl font-bold hover:bg-neutral-800 disabled:opacity-50 flex items-center justify-center gap-2"
          >
            {generating ? (
              <>
                <Loader2 className="w-5 h-5 animate-spin" />
                生成中…
              </>
            ) : (
              <>
                <Sparkles className="w-5 h-5" />
                テンプレ生成
              </>
            )}
          </button>
        </form>

        {loading ? (
          <div className="flex justify-center py-12">
            <Loader2 className="w-8 h-8 animate-spin text-neutral-400" />
          </div>
        ) : (
          <div className="space-y-4">
            <h2 className="font-bold">登録済み</h2>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
              {templates.map((t) => (
                <div
                  key={t.id}
                  role="button"
                  tabIndex={0}
                  onClick={() => setSelectedTemplate(t)}
                  onKeyDown={(e) => e.key === "Enter" && setSelectedTemplate(t)}
                  className="bg-white border-2 border-neutral-200 rounded-xl overflow-hidden group text-left hover:border-neutral-400 transition-colors cursor-pointer"
                >
                  <div className="aspect-[9/16] bg-neutral-100 flex items-center justify-center relative overflow-hidden">
                    {(t.sample_image_url || t.image_urls?.[0]) ? (
                      <img
                        src={t.sample_image_url || t.image_urls?.[0] || ""}
                        alt=""
                        className="w-full h-full object-contain object-center"
                      />
                    ) : (
                      <span className="text-neutral-400 text-xs">No image</span>
                    )}
                    <button
                      type="button"
                      onClick={(e) => handleDelete(e, t.id)}
                      className="absolute top-2 right-2 p-2 bg-black/50 text-white rounded-lg opacity-0 group-hover:opacity-100 transition-opacity hover:bg-black/70"
                      aria-label="削除"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                  <div className="p-2">
                    {t.category && (
                      <p className="text-xs font-medium text-neutral-700">
                        {t.category}
                      </p>
                    )}
                    {t.memo && (
                      <p className="text-xs text-neutral-500">{t.memo}</p>
                    )}
                  </div>
                </div>
              ))}
            </div>

            {selectedTemplate &&
              typeof document !== "undefined" &&
              createPortal(
                <div
                  className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm min-h-screen min-w-full"
                  style={{ top: 0, left: 0, right: 0, bottom: 0 }}
                  onClick={() => setSelectedTemplate(null)}
                  aria-modal
                  role="dialog"
                >
                  <div
                    className="bg-white rounded-2xl max-w-4xl w-full max-h-[90vh] overflow-hidden shadow-2xl ring-1 ring-neutral-200/50 flex flex-col"
                    onClick={(e) => e.stopPropagation()}
                  >
                    {/* ヘッダー */}
                    <div className="flex items-center justify-between px-5 py-4 bg-neutral-50 border-b border-neutral-200 shrink-0 gap-3">
                      <h3 className="font-semibold text-neutral-900 text-lg truncate flex-1 min-w-0">
                        {selectedTemplate.name || selectedTemplate.category || "プロンプト"}
                      </h3>
                      <div className="flex items-center gap-1">
                        {(editingStyle || editingSlots) && (
                          <button
                            type="button"
                            onClick={handleSaveJson}
                            disabled={saving}
                            className="flex items-center gap-2 px-3 py-2 text-sm font-medium text-white bg-neutral-900 hover:bg-neutral-800 rounded-lg disabled:opacity-50 shrink-0"
                          >
                            {saving ? (
                              <Loader2 className="w-4 h-4 animate-spin" />
                            ) : (
                              <Save className="w-4 h-4" />
                            )}
                            変更を保存
                          </button>
                        )}
                        <button
                          type="button"
                          onClick={() => setSelectedTemplate(null)}
                          className="p-2 hover:bg-white rounded-lg border border-transparent hover:border-neutral-200 transition-all shrink-0"
                          aria-label="閉じる"
                        >
                          <X className="w-5 h-5 text-neutral-500" />
                        </button>
                      </div>
                    </div>

                    <div className="p-5 overflow-y-auto flex-1 bg-neutral-50/50">
                      <div className="flex flex-col sm:flex-row gap-5">
                        {/* 左: スタイル・スロット（JSON表） */}
                        <div className="flex-1 min-w-0 space-y-4 order-2 sm:order-1">
                          {editingStyle && (
                            <section className="bg-white rounded-xl p-4 shadow-sm ring-1 ring-neutral-200/60">
                              <h4 className="flex items-center gap-2 text-sm font-semibold text-neutral-700 mb-3">
                                <Palette className="w-4 h-4 text-neutral-500" />
                                スタイル設定
                              </h4>
                              <div className="bg-neutral-50/80 rounded-lg p-3 border border-neutral-200/80">
                                <StyleJsonEditor
                                  style={editingStyle}
                                  onChange={setEditingStyle}
                                />
                              </div>
                            </section>
                          )}
                          {editingSlots?.textSlots?.length ? (
                            <section className="bg-white rounded-xl p-4 shadow-sm ring-1 ring-neutral-200/60">
                              <h4 className="flex items-center gap-2 text-sm font-semibold text-neutral-700 mb-3">
                                <Type className="w-4 h-4 text-neutral-500" />
                                テキストスロット
                              </h4>
                              <div className="bg-neutral-50/80 rounded-lg p-3 border border-neutral-200/80">
                                <SlotsJsonEditor
                                  slots={editingSlots}
                                  onChange={setEditingSlots}
                                />
                              </div>
                            </section>
                          ) : null}
                          {(selectedTemplate.prompt_text || selectedTemplate.base_prompt) && (
                            <section className="bg-white rounded-xl p-4 shadow-sm ring-1 ring-neutral-200/60">
                              <div className="flex items-center justify-between mb-3">
                                <h4 className="text-sm font-semibold text-neutral-700">プロンプト</h4>
                                <button
                                  type="button"
                                  onClick={() =>
                                    handleCopyPrompt(
                                      selectedTemplate.prompt_text || selectedTemplate.base_prompt || ""
                                    )
                                  }
                                  className={`flex items-center gap-1.5 px-2.5 py-1.5 text-xs font-medium rounded-lg transition-colors ${
                                    copied
                                      ? "text-green-600 bg-green-50"
                                      : "text-neutral-600 hover:text-neutral-900 hover:bg-neutral-100"
                                  }`}
                                >
                                  {copied ? (
                                    <>
                                      <CopyCheck className="w-3.5 h-3.5" />
                                      コピーしました
                                    </>
                                  ) : (
                                    <>
                                      <Copy className="w-3.5 h-3.5" />
                                      コピー
                                    </>
                                  )}
                                </button>
                              </div>
                              <pre className="text-sm text-neutral-800 whitespace-pre-wrap break-words bg-neutral-50 rounded-lg p-4 max-h-48 overflow-y-auto font-sans border border-neutral-200/80">
                                {selectedTemplate.prompt_text || selectedTemplate.base_prompt}
                              </pre>
                            </section>
                          )}
                        </div>

                        {/* 右: 画像・カテゴリカード・保存ボタン */}
                        <div className="flex flex-col gap-4 shrink-0 w-[180px] sm:w-[200px] order-1 sm:order-2">
                          {(selectedTemplate.sample_image_url || selectedTemplate.image_urls?.[0]) && (
                            <div className="aspect-[9/16] w-full rounded-xl overflow-hidden bg-white shadow-sm ring-1 ring-neutral-200/60 flex items-center justify-center shrink-0">
                              <img
                                src={selectedTemplate.sample_image_url || selectedTemplate.image_urls?.[0] || ""}
                                alt=""
                                className="w-full h-full object-contain object-center"
                              />
                            </div>
                          )}
                          <div className="bg-white rounded-xl p-4 shadow-sm ring-1 ring-neutral-200/60 space-y-3">
                            {selectedTemplate.category && (
                              <div>
                                <p className="text-[11px] font-medium text-neutral-400 uppercase tracking-wider mb-0.5">カテゴリ</p>
                                <p className="text-sm font-medium text-neutral-800 break-words">{selectedTemplate.category}</p>
                              </div>
                            )}
                            {selectedTemplate.memo && (
                              <div>
                                <p className="text-[11px] font-medium text-neutral-400 uppercase tracking-wider mb-0.5">メモ</p>
                                <p className="text-sm text-neutral-700 leading-relaxed break-words">{selectedTemplate.memo}</p>
                              </div>
                            )}
                          </div>
                          {(selectedTemplate.style_json && selectedTemplate.slots_json?.textSlots?.length) && (
                            <button
                              type="button"
                              onClick={() => setShowGenerateModal(true)}
                              className="flex items-center justify-center gap-2 px-4 py-3 bg-neutral-900 text-white text-sm font-medium rounded-lg hover:bg-neutral-800 transition-colors w-full"
                            >
                              <Sparkles className="w-4 h-4" />
                              このデザインで生成
                            </button>
                          )}
                          {(selectedTemplate.sample_image_url || selectedTemplate.image_urls?.[0]) && (
                            <button
                              type="button"
                              onClick={handleRegenerate}
                              disabled={regenerating}
                              className="flex items-center justify-center gap-2 px-4 py-2.5 text-sm font-medium text-neutral-600 hover:text-neutral-900 hover:bg-neutral-100 rounded-lg border border-neutral-200 disabled:opacity-50 transition-colors w-full"
                            >
                              {regenerating ? (
                                <Loader2 className="w-4 h-4 animate-spin" />
                              ) : (
                                <RefreshCw className="w-4 h-4" />
                              )}
                              再生成
                            </button>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                </div>,
                document.body
              )}

            {/* プロンプト生成モーダル（別枠） */}
            {selectedTemplate &&
              showGenerateModal &&
              (selectedTemplate.style_json && selectedTemplate.slots_json?.textSlots?.length) &&
              typeof document !== "undefined" &&
              createPortal(
                <div
                  className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm"
                  onClick={() => setShowGenerateModal(false)}
                  aria-modal
                  role="dialog"
                >
                  <div
                    className="bg-white rounded-2xl max-w-2xl w-full max-h-[90vh] overflow-hidden shadow-2xl flex flex-col"
                    onClick={(e) => e.stopPropagation()}
                  >
                    <div className="flex items-center justify-between px-6 py-5 border-b border-neutral-200 shrink-0">
                      <h3 className="font-semibold text-neutral-900 flex items-center gap-2 text-lg">
                        <Sparkles className="w-5 h-5 text-neutral-500" />
                        このデザインでプロンプトを生成
                      </h3>
                      <button
                        type="button"
                        onClick={() => setShowGenerateModal(false)}
                        className="p-2 hover:bg-neutral-100 rounded-lg transition-colors"
                        aria-label="閉じる"
                      >
                        <X className="w-5 h-5 text-neutral-500" />
                      </button>
                    </div>
                    <div className="p-6 sm:p-8 overflow-y-auto flex-1 space-y-5">
                      <div>
                        <label className="block text-sm font-medium text-neutral-700 mb-2">メインコピー *</label>
                        <input
                          type="text"
                          value={promptGenMessage}
                          onChange={(e) => setPromptGenMessage(e.target.value)}
                          placeholder="例：本気の出会いから、始めよう。"
                          className="w-full border-2 border-neutral-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-neutral-400 focus:border-transparent"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-neutral-700 mb-2">サブコピー</label>
                        <input
                          type="text"
                          value={promptGenSubMessage}
                          onChange={(e) => setPromptGenSubMessage(e.target.value)}
                          placeholder="例：無料で始められるマッチングアプリ"
                          className="w-full border-2 border-neutral-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-neutral-400 focus:border-transparent"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-neutral-700 mb-2">追加テキスト（1行1項目）</label>
                        <textarea
                          value={promptGenAdditionalText}
                          onChange={(e) => setPromptGenAdditionalText(e.target.value)}
                          placeholder={"例：\n無料マッチ\n結婚前提\n2分で登録"}
                          rows={4}
                          className="w-full border-2 border-neutral-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-neutral-400 focus:border-transparent resize-none"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-neutral-700 mb-2">アスペクト比</label>
                        <div className="grid grid-cols-3 gap-2 sm:grid-cols-6">
                          {ASPECT_RATIOS.map((ar) => (
                            <button
                              key={ar.id}
                              type="button"
                              onClick={() => setPromptGenAspectRatio(ar.id)}
                              disabled={generatingPrompt}
                              className={`flex flex-col items-center justify-center gap-1.5 rounded-xl border px-3 py-4 transition-colors ${
                                promptGenAspectRatio === ar.id
                                  ? "border-neutral-900 bg-neutral-900 text-white"
                                  : "border-neutral-200 bg-white text-neutral-700 hover:border-neutral-300 disabled:opacity-50"
                              }`}
                              title={ar.label}
                            >
                              <AspectRatioIcon
                                ratio={ar.id}
                                className={promptGenAspectRatio === ar.id ? "text-white" : "text-neutral-700"}
                              />
                              {ar.id !== "custom" && (
                                <span className="text-[10px] font-medium">{ar.id}</span>
                              )}
                            </button>
                          ))}
                        </div>
                        {promptGenAspectRatio === "custom" && (
                          <input
                            type="text"
                            value={promptGenCustomAspectRatio}
                            onChange={(e) => setPromptGenCustomAspectRatio(e.target.value)}
                            placeholder="例: 3:4, 21:9"
                            disabled={generatingPrompt}
                            className="mt-2 w-full rounded-xl border border-neutral-200 bg-white px-4 py-3 text-sm text-neutral-900 placeholder:text-neutral-400 disabled:opacity-60"
                          />
                        )}
                      </div>
                      <div>
                        <span className="block text-sm font-medium text-neutral-700 mb-2">生成モード</span>
                        <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                          <button
                            type="button"
                            onClick={() => {
                              setPromptGenExcludePerson(false);
                              setOverlayMode(false);
                            }}
                            disabled={generatingPrompt}
                            className={`flex flex-col items-start gap-0.5 rounded-xl border px-3 py-2.5 text-left transition-colors ${
                              !overlayMode && !promptGenExcludePerson
                                ? "border-neutral-900 bg-neutral-900 text-white"
                                : "border-neutral-200 bg-white text-neutral-700 hover:border-neutral-300 disabled:opacity-50"
                            }`}
                          >
                            <span className="font-medium text-xs">通常</span>
                            <span className={`text-[11px] leading-tight ${!overlayMode && !promptGenExcludePerson ? "text-white/90" : "text-neutral-500"}`}>
                              人物あり・テキストあり
                            </span>
                          </button>
                          <button
                            type="button"
                            onClick={() => {
                              setPromptGenExcludePerson(false);
                              setOverlayMode(true);
                            }}
                            disabled={generatingPrompt}
                            className={`flex flex-col items-start gap-0.5 rounded-xl border px-3 py-2.5 text-left transition-colors ${
                              overlayMode
                                ? "border-neutral-900 bg-neutral-900 text-white"
                                : "border-neutral-200 bg-white text-neutral-700 hover:border-neutral-300 disabled:opacity-50"
                            }`}
                          >
                            <span className="font-medium text-xs">人物あり・テキストなし</span>
                            <span className={`text-[11px] leading-tight ${overlayMode ? "text-white/90" : "text-neutral-500"}`}>
                              ベース画像のみ。後からテキストを追加可。
                            </span>
                          </button>
                          <button
                            type="button"
                            onClick={() => {
                              setPromptGenExcludePerson(true);
                              setOverlayMode(false);
                            }}
                            disabled={generatingPrompt}
                            className={`flex flex-col items-start gap-0.5 rounded-xl border px-3 py-2.5 text-left transition-colors ${
                              promptGenExcludePerson
                                ? "border-neutral-900 bg-neutral-900 text-white"
                                : "border-neutral-200 bg-white text-neutral-700 hover:border-neutral-300 disabled:opacity-50"
                            }`}
                          >
                            <span className="font-medium text-xs">人物なし・テキストあり</span>
                            <span className={`text-[11px] leading-tight ${promptGenExcludePerson ? "text-white/90" : "text-neutral-500"}`}>
                              テキストと装飾のみ。背景なし。
                            </span>
                          </button>
                        </div>
                      </div>
                      <button
                        type="button"
                        onClick={handleGeneratePrompt}
                        disabled={generatingPrompt || !promptGenMessage.trim()}
                        className="w-full flex items-center justify-center gap-2 px-4 py-3.5 bg-neutral-900 text-white text-sm font-medium rounded-xl hover:bg-neutral-800 disabled:opacity-50 transition-colors"
                      >
                        {generatingPrompt ? (
                          <>
                            <Loader2 className="w-4 h-4 animate-spin" />
                            生成中…
                          </>
                        ) : (
                          <>
                            <Sparkles className="w-4 h-4" />
                            プロンプトを生成
                          </>
                        )}
                      </button>
                      {generatedPrompt && (
                        <div className="pt-5 border-t border-neutral-200">
                          <div className="flex items-center justify-between mb-3">
                            <span className="text-sm font-medium text-neutral-700">生成されたプロンプト</span>
                            <button
                              type="button"
                              onClick={() => handleCopyPrompt(generatedPrompt)}
                              className={`flex items-center gap-1.5 px-2.5 py-1.5 text-sm rounded-lg transition-colors ${
                                copied
                                  ? "text-green-600 bg-green-50"
                                  : "text-neutral-600 hover:text-neutral-900 hover:bg-neutral-100"
                              }`}
                            >
                              {copied ? (
                                <>
                                  <CopyCheck className="w-4 h-4" />
                                  コピーしました
                                </>
                              ) : (
                                <>
                                  <Copy className="w-4 h-4" />
                                  コピー
                                </>
                              )}
                            </button>
                          </div>
                          <pre className="text-sm text-neutral-800 whitespace-pre-wrap break-words bg-neutral-50 rounded-xl p-4 max-h-64 overflow-y-auto font-sans border border-neutral-200">
                            {generatedPrompt}
                          </pre>
                        </div>
                      )}
                    </div>
                  </div>
                </div>,
                document.body
              )}
          </div>
        )}
      </div>
    </div>
  );
}
