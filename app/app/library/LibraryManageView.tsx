"use client";

import { useState, useEffect, useRef, useMemo } from "react";
import { createPortal } from "react-dom";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Upload, Loader2, Trash2, Sparkles, X, Copy, CopyCheck, RefreshCw, Save, Palette, Type, Search, ExternalLink, MessageSquare, ClipboardPaste, ImagePlus } from "lucide-react";
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

/** ライブラリ用コピーフォーマットをパース */
function parseLibraryBulkFormat(text: string): {
  message: string;
  subMessage: string;
  additionalText: string;
} {
  const MAIN = "【メインコピー】";
  const SUB = "【サブコピー】";
  const ADD = "【追加テキスト】";

  const mainIdx = text.indexOf(MAIN);
  const subIdx = text.indexOf(SUB);
  const addIdx = text.indexOf(ADD);

  let message = "";
  let subMessage = "";
  let additionalText = "";

  if (mainIdx >= 0) {
    const start = mainIdx + MAIN.length;
    const end = subIdx >= 0 ? subIdx : addIdx >= 0 ? addIdx : text.length;
    message = text.slice(start, end).trim();
  }
  if (subIdx >= 0) {
    const start = subIdx + SUB.length;
    const end = addIdx >= 0 ? addIdx : text.length;
    subMessage = text.slice(start, end).trim();
  }
  if (addIdx >= 0) {
    additionalText = text.slice(addIdx + ADD.length).trim();
  }

  if (mainIdx < 0 && subIdx < 0 && addIdx < 0 && text.trim()) {
    message = text.trim();
  }

  return { message, subMessage, additionalText };
}

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

export function LibraryManageView() {
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
  const [showRegenerateConfirm, setShowRegenerateConfirm] = useState(false);
  const [copied, setCopied] = useState(false);
  const [bulkPasteStatus, setBulkPasteStatus] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [sortBy, setSortBy] = useState<"created_at" | "name" | "category">("created_at");
  const [sortOrder, setSortOrder] = useState<"desc" | "asc">("desc");
  const [filterCategory, setFilterCategory] = useState<string>("");
  const [filterSubcategory, setFilterSubcategory] = useState<string>("");

  const [editingCategory, setEditingCategory] = useState("");
  const [editingSubcategory, setEditingSubcategory] = useState("");
  const router = useRouter();

  useEffect(() => {
    if (selectedTemplate) {
      setEditingStyle(selectedTemplate.style_json ?? null);
      setEditingSlots(selectedTemplate.slots_json ?? null);
      setEditingCategory(selectedTemplate.category ?? "");
      setEditingSubcategory(selectedTemplate.subcategory ?? "");
      setGeneratedPrompt(null);
      setCopied(false);
    } else {
      setEditingStyle(null);
      setEditingSlots(null);
      setEditingCategory("");
      setEditingSubcategory("");
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

  const uniqueCategories = useMemo(() => {
    const set = new Set<string>();
    templates.forEach((t) => {
      if (t.category?.trim()) set.add(t.category.trim());
    });
    return Array.from(set).sort();
  }, [templates]);

  const uniqueSubcategories = useMemo(() => {
    const set = new Set<string>();
    templates.forEach((t) => {
      if (t.subcategory?.trim()) set.add(t.subcategory.trim());
    });
    return Array.from(set).sort();
  }, [templates]);

  const filteredAndSortedTemplates = useMemo(() => {
    let list = templates.filter((t) => {
      if (filterCategory && (t.category?.trim() || "") !== filterCategory) return false;
      if (filterSubcategory && (t.subcategory?.trim() || "") !== filterSubcategory) return false;
      if (!searchQuery.trim()) return true;
      const q = searchQuery.trim().toLowerCase();
      return (
        (t.name || "").toLowerCase().includes(q) ||
        (t.category || "").toLowerCase().includes(q) ||
        (t.subcategory || "").toLowerCase().includes(q) ||
        (t.memo || "").toLowerCase().includes(q)
      );
    });
    list = [...list].sort((a, b) => {
      let cmp = 0;
      if (sortBy === "created_at") {
        const aAt = a.created_at ? new Date(a.created_at).getTime() : 0;
        const bAt = b.created_at ? new Date(b.created_at).getTime() : 0;
        cmp = aAt - bAt;
      } else if (sortBy === "name") {
        cmp = (a.name || "").localeCompare(b.name || "");
      } else {
        cmp = (a.category || "").localeCompare(b.category || "");
      }
      return sortOrder === "desc" ? -cmp : cmp;
    });
    return list;
  }, [templates, searchQuery, filterCategory, filterSubcategory, sortBy, sortOrder]);

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

  const handleBulkPaste = async () => {
    setBulkPasteStatus(null);
    try {
      const text = await navigator.clipboard.readText();
      if (!text?.trim()) {
        setBulkPasteStatus("クリップボードが空です。SwipeLPで「ライブラリ用にコピー」してからお試しください。");
        return;
      }
      const { message, subMessage, additionalText } = parseLibraryBulkFormat(text);
      setPromptGenMessage(message);
      setPromptGenSubMessage(subMessage);
      setPromptGenAdditionalText(additionalText);
      setBulkPasteStatus("一括で入力しました。");
      setTimeout(() => setBulkPasteStatus(null), 2500);
    } catch (err) {
      setBulkPasteStatus("クリップボードの読み取りに失敗しました。ブラウザの権限を確認してください。");
    }
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

  /** スタイル・スロット・カテゴリのいずれかが実際に変更されているか */
  const hasUnsavedChanges = useMemo(() => {
    if (!selectedTemplate) return false;
    const styleChanged =
      editingStyle != null &&
      JSON.stringify(editingStyle) !== JSON.stringify(selectedTemplate.style_json ?? {});
    const slotsChanged =
      editingSlots != null &&
      JSON.stringify(editingSlots) !== JSON.stringify(selectedTemplate.slots_json ?? {});
    const metaChanged =
      editingCategory !== (selectedTemplate.category ?? "") ||
      editingSubcategory !== (selectedTemplate.subcategory ?? "");
    return styleChanged || slotsChanged || metaChanged;
  }, [
    selectedTemplate,
    editingStyle,
    editingSlots,
    editingCategory,
    editingSubcategory,
  ]);

  const handleSaveJson = async () => {
    if (!selectedTemplate?.id) return;
    if (!hasUnsavedChanges) return;
    setSaving(true);
    setError(null);
    const updates: Parameters<typeof updatePromptTemplate>[1] = {};
    if (editingStyle != null) updates.style_json = editingStyle;
    if (editingSlots != null) updates.slots_json = editingSlots;
    updates.category = editingCategory.trim() || null;
    updates.subcategory = editingSubcategory.trim() || null;
    const { template: updated, error: err } = await updatePromptTemplate(selectedTemplate.id, updates);
    if (err) setError(err);
    else {
      if (updated) setSelectedTemplate(updated);
      load();
    }
    setSaving(false);
  };

  return (
    <div className="min-h-screen bg-neutral-100 flex flex-col">
      {/* 共通ヘッダー */}
      <header className="shrink-0 flex items-center justify-between min-h-[52px] px-4 py-2 bg-white border-b border-neutral-200">
        <div className="flex items-center gap-2 min-w-0">
          <div className="min-w-0">
            <h1 className="text-sm font-bold text-neutral-900 leading-tight">Re:Design</h1>
            <p className="text-[10px] text-neutral-500 leading-tight">参考デザインからスライド画像を生成します</p>
          </div>
        </div>
        <div className="flex items-center gap-1.5 shrink-0">
          <Link
            href="/overlay-mode/new"
            className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-md bg-white border border-neutral-200 text-xs font-medium text-neutral-700 hover:bg-neutral-50 hover:border-neutral-300 transition-colors"
          >
            <ImagePlus className="w-3 h-3 shrink-0" />
            ベース生成
          </Link>
          <Link
            href="/feedback"
            className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-md bg-white border border-neutral-200 text-xs font-medium text-neutral-700 hover:bg-neutral-50 hover:border-neutral-300 transition-colors"
          >
            <MessageSquare className="w-3 h-3 shrink-0" />
            フィードバック
          </Link>
          <a
            href="https://gemini.google.com/app"
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-md bg-white border border-neutral-200 text-xs font-medium text-neutral-700 hover:bg-neutral-50 hover:border-neutral-300 transition-colors"
          >
            NanoBanana
            <ExternalLink className="w-3 h-3 shrink-0" />
          </a>
          <a
            href="https://chatgpt.com/"
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-md bg-white border border-neutral-200 text-xs font-medium text-neutral-700 hover:bg-neutral-50 hover:border-neutral-300 transition-colors"
          >
            DALL·E 3
            <ExternalLink className="w-3 h-3 shrink-0" />
          </a>
        </div>
      </header>

      <div className="flex flex-1 min-h-0">
      {/* 左サイドメニュー */}
      <aside className="w-64 shrink-0 border-r border-neutral-200 bg-white flex flex-col overflow-y-auto">
        <div className="p-4 space-y-4">
          {/* 検索窓 */}
          <div>
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-neutral-400 pointer-events-none" />
              <input
                type="search"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="名前・カテゴリ・メモ"
                className="w-full pl-9 pr-3 py-2 rounded-xl border border-neutral-200 bg-white text-sm text-neutral-900 placeholder:text-neutral-400 focus:outline-none focus:ring-2 focus:ring-neutral-400 focus:border-transparent"
              />
            </div>
            {/* カテゴリ・サブカテゴリタグ */}
            <label className="block text-xs font-medium text-neutral-500 uppercase tracking-wider mt-3 mb-2">カテゴリ</label>
            <div className="flex flex-wrap gap-1.5">
              <button
                type="button"
                onClick={() => { setFilterCategory(""); setFilterSubcategory(""); }}
                className={`rounded-full px-2.5 py-1 text-xs font-medium transition-colors ${
                  !filterCategory && !filterSubcategory
                    ? "bg-neutral-900 text-white"
                    : "bg-neutral-100 text-neutral-600 hover:bg-neutral-200"
                }`}
              >
                すべて
              </button>
              {uniqueCategories.map((c) => (
                <button
                  key={`cat-${c}`}
                  type="button"
                  onClick={() => { setFilterCategory(filterCategory === c ? "" : c); setFilterSubcategory(""); }}
                  className={`rounded-full px-2.5 py-1 text-xs font-medium transition-colors ${
                    filterCategory === c
                      ? "bg-neutral-900 text-white"
                      : "bg-neutral-100 text-neutral-600 hover:bg-neutral-200"
                  }`}
                >
                  {c}
                </button>
              ))}
              {uniqueSubcategories.map((s) => (
                <button
                  key={`sub-${s}`}
                  type="button"
                  onClick={() => { setFilterSubcategory(filterSubcategory === s ? "" : s); setFilterCategory(""); }}
                  className={`rounded-full px-2.5 py-1 text-xs font-medium transition-colors ${
                    filterSubcategory === s
                      ? "bg-neutral-900 text-white"
                      : "bg-neutral-100 text-neutral-500 hover:bg-neutral-200"
                  }`}
                >
                  {s}
                </button>
              ))}
            </div>
          </div>

          {/* ソート */}
          <div className="space-y-3">
            <label className="block text-xs font-medium text-neutral-500 uppercase tracking-wider mb-2">ソート</label>
            <div className="space-y-2">
              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value as "created_at" | "name" | "category")}
                className="w-full rounded-xl border border-neutral-200 bg-white px-3 py-2 text-sm text-neutral-800 focus:outline-none focus:ring-2 focus:ring-neutral-400"
              >
                <option value="created_at">作成日</option>
                <option value="name">名前</option>
                <option value="category">カテゴリ</option>
              </select>
              <select
                value={sortOrder}
                onChange={(e) => setSortOrder(e.target.value as "desc" | "asc")}
                className="w-full rounded-xl border border-neutral-200 bg-white px-3 py-2 text-sm text-neutral-800 focus:outline-none focus:ring-2 focus:ring-neutral-400"
              >
                <option value="desc">新しい順</option>
                <option value="asc">古い順</option>
              </select>
            </div>
          </div>

          {/* アップロード */}
          <form onSubmit={handleSubmit} className="space-y-2">
            <label className="block text-xs font-medium text-neutral-500 uppercase tracking-wider">アップロード</label>
            <div className="relative border-2 border-dashed border-neutral-300 rounded-xl min-h-[100px] flex flex-wrap gap-1 p-3 cursor-pointer hover:border-neutral-400 transition-colors">
              {files.length > 0 ? (
                files.map((f, i) => (
                  <div key={i} className="w-12 h-12 rounded-lg overflow-hidden bg-neutral-100 flex-shrink-0 pointer-events-none">
                    <img src={URL.createObjectURL(f)} alt="" className="w-full h-full object-cover" />
                  </div>
                ))
              ) : (
                <div className="flex flex-col items-center justify-center gap-1 text-neutral-500 w-full py-4 pointer-events-none">
                  <Upload className="w-8 h-8" />
                  <span className="text-xs">画像を選択</span>
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
              className="w-full bg-neutral-900 text-white py-2.5 rounded-xl text-sm font-medium hover:bg-neutral-800 disabled:opacity-50 flex items-center justify-center gap-2"
            >
              {generating ? <Loader2 className="w-4 h-4 animate-spin" /> : <Sparkles className="w-4 h-4" />}
              {generating ? "生成中…" : "テンプレ生成"}
            </button>
          </form>
        </div>
      </aside>

      {/* 右: 一覧エリア */}
      <main className="flex-1 min-w-0 flex flex-col overflow-hidden">
        <div className="flex-1 overflow-y-auto p-4">
        {error && (
          <div className="mb-4 bg-red-50 border border-red-200 rounded-xl p-4">
            <p className="text-sm text-red-800">{error}</p>
          </div>
        )}

        {loading ? (
          <div className="flex justify-center py-20">
            <Loader2 className="w-10 h-10 animate-spin text-neutral-400" />
          </div>
        ) : (
          <div
            className="columns-2 sm:columns-3 md:columns-4 lg:columns-5 gap-3"
            style={{ columnFill: "balance" }}
          >
            {filteredAndSortedTemplates.map((t) => (
              <div
                key={t.id}
                role="button"
                tabIndex={0}
                onClick={() => setSelectedTemplate(t)}
                onKeyDown={(e) => e.key === "Enter" && setSelectedTemplate(t)}
                className="break-inside-avoid mb-3 rounded-xl overflow-hidden bg-neutral-100 hover:opacity-95 transition-opacity cursor-pointer group"
              >
                <div className="relative w-full overflow-hidden rounded-xl">
                  {(t.sample_image_url || t.image_urls?.[0]) ? (
                    <img
                      src={t.sample_image_url || t.image_urls?.[0] || ""}
                      alt=""
                      className="w-full h-auto block"
                    />
                  ) : (
                    <div className="w-full aspect-[9/16] flex items-center justify-center text-neutral-400 text-xs">No image</div>
                  )}
                  <button
                    type="button"
                    onClick={(e) => handleDelete(e, t.id)}
                    className="absolute top-1.5 right-1.5 p-1.5 bg-black/50 text-white rounded-md opacity-0 group-hover:opacity-100 transition-opacity hover:bg-black/70 z-10"
                    aria-label="削除"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
        {!loading && filteredAndSortedTemplates.length === 0 && (
          <div className="text-center py-16 text-neutral-500 text-sm">
            {templates.length === 0 ? "テンプレートがありません。左から画像をアップロードしてください。" : "条件に一致するテンプレートがありません。"}
          </div>
        )}
        </div>
      </main>
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
                        {hasUnsavedChanges && (
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
                        {(selectedTemplate.sample_image_url || selectedTemplate.image_urls?.[0]) && (
                          <button
                            type="button"
                            onClick={() => setShowRegenerateConfirm(true)}
                            disabled={regenerating}
                            className="flex items-center gap-2 px-3 py-2 text-sm font-medium text-neutral-600 hover:text-neutral-900 hover:bg-white rounded-lg border border-transparent hover:border-neutral-200 transition-all shrink-0 disabled:opacity-50"
                          >
                            {regenerating ? (
                              <Loader2 className="w-4 h-4 animate-spin" />
                            ) : (
                              <RefreshCw className="w-4 h-4" />
                            )}
                            スタイルを再生成
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
                            <div>
                              <p className="text-[11px] font-medium text-neutral-400 uppercase tracking-wider mb-1">カテゴリ</p>
                              <input
                                type="text"
                                value={editingCategory}
                                onChange={(e) => setEditingCategory(e.target.value)}
                                placeholder="例: 婚活"
                                className="w-full rounded-lg border border-neutral-200 px-3 py-2 text-sm text-neutral-800 focus:outline-none focus:ring-2 focus:ring-neutral-400"
                              />
                            </div>
                            <div>
                              <p className="text-[11px] font-medium text-neutral-400 uppercase tracking-wider mb-1">サブカテゴリ</p>
                              <input
                                type="text"
                                value={editingSubcategory}
                                onChange={(e) => setEditingSubcategory(e.target.value)}
                                placeholder="例: 問題提起型"
                                className="w-full rounded-lg border border-neutral-200 px-3 py-2 text-sm text-neutral-800 focus:outline-none focus:ring-2 focus:ring-neutral-400"
                              />
                            </div>
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
                              プロンプトを生成
                            </button>
                          )}
                          {(selectedTemplate.sample_image_url || selectedTemplate.image_urls?.[0]) && (
                            <button
                              type="button"
                              onClick={() => {
                                const url = selectedTemplate.sample_image_url || selectedTemplate.image_urls?.[0] || "";
                                if (url) {
                                  router.push(`/overlay-mode/new?imageUrl=${encodeURIComponent(url)}`);
                                  setSelectedTemplate(null);
                                }
                              }}
                              className="flex items-center justify-center gap-2 px-4 py-2.5 text-sm font-medium text-neutral-600 hover:text-neutral-900 hover:bg-neutral-100 rounded-lg border border-neutral-200 transition-colors w-full"
                            >
                              <ImagePlus className="w-4 h-4" />
                              オーバーレイを生成
                            </button>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                </div>,
                document.body
              )}

            {/* スタイル再生成の確認モーダル */}
            {selectedTemplate &&
              showRegenerateConfirm &&
              typeof document !== "undefined" &&
              createPortal(
                <div
                  className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm"
                  onClick={() => setShowRegenerateConfirm(false)}
                  aria-modal
                  role="dialog"
                >
                  <div
                    className="bg-white rounded-2xl max-w-sm w-full shadow-2xl p-6 space-y-4 text-center"
                    onClick={(e) => e.stopPropagation()}
                  >
                    <p className="text-sm text-neutral-700">
                      スタイルを再生成しますか？<br />
                      設定が上書きされます。
                    </p>
                    <div className="flex gap-2 justify-center">
                      <button
                        type="button"
                        onClick={() => setShowRegenerateConfirm(false)}
                        className="px-4 py-2.5 text-sm font-medium text-neutral-700 bg-white border border-neutral-200 rounded-lg hover:bg-neutral-50 transition-colors"
                      >
                        キャンセル
                      </button>
                      <button
                        type="button"
                        onClick={async () => {
                          setShowRegenerateConfirm(false);
                          await handleRegenerate();
                        }}
                        disabled={regenerating}
                        className="flex items-center gap-2 px-4 py-2.5 text-sm font-medium text-white bg-neutral-900 rounded-lg hover:bg-neutral-800 disabled:opacity-50 transition-colors"
                      >
                        {regenerating ? (
                          <Loader2 className="w-4 h-4 animate-spin" />
                        ) : (
                          <RefreshCw className="w-4 h-4" />
                        )}
                        再生成する
                      </button>
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
                      <button
                        type="button"
                        onClick={handleBulkPaste}
                        disabled={generatingPrompt}
                        className="w-full flex items-center justify-center gap-2 px-4 py-3 border-2 border-neutral-200 rounded-xl text-sm font-medium text-neutral-700 hover:border-neutral-400 hover:bg-neutral-50 disabled:opacity-50 transition-colors"
                      >
                        <ClipboardPaste className="w-4 h-4" />
                        一括貼り付け（SwipeLPからコピーした内容を入力）
                      </button>
                      {bulkPasteStatus && (
                        <p className={`text-sm ${bulkPasteStatus.includes("失敗") || bulkPasteStatus.includes("空") ? "text-amber-600" : "text-green-600"}`}>
                          {bulkPasteStatus}
                        </p>
                      )}
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
  );
}
