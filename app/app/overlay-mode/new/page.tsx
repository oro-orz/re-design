// app/overlay-mode/new/page.tsx
"use client";

import { useState, useEffect, useRef, Suspense } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { Users, Library, MessageSquare, ExternalLink, Upload, Loader2, Sparkles } from "lucide-react";
import { uploadAndGenerateBase } from "@/actions/overlay-mode";
import { listPromptTemplates } from "@/actions/library";
import { BaseImageResult } from "@/app/components/overlay-mode/BaseImageResult";
import type {
  BaseImageMode,
  TargetPerson,
  TextRemovalMode,
} from "@/types/overlay-mode";
import type { PromptTemplate } from "@/types/swipe-lp-v3";

type ImageSource = "upload" | "library";

function NewOverlayModeContent() {
  const [imageSource, setImageSource] = useState<ImageSource>("upload");
  const [file, setFile] = useState<File | null>(null);
  const [preview, setPreview] = useState<string | null>(null);
  const [libraryImageUrl, setLibraryImageUrl] = useState<string | null>(null);
  const [templates, setTemplates] = useState<PromptTemplate[]>([]);
  const [templatesLoading, setTemplatesLoading] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<{
    referenceImageUrl: string;
    baseImageUrl: string;
  } | null>(null);

  const [mode, setMode] = useState<BaseImageMode>("text-removal");
  const [textRemovalMode, setTextRemovalMode] = useState<TextRemovalMode>("preserve");
  const [changePerson, setChangePerson] = useState(false);
  const [targetPerson, setTargetPerson] = useState<TargetPerson>("30代女性ママ");

  const hasImage = !!file || !!libraryImageUrl;
  const searchParams = useSearchParams();
  const hasAppliedInitialUrl = useRef(false);

  useEffect(() => {
    if (imageSource !== "library" || templates.length > 0) return;
    setTemplatesLoading(true);
    listPromptTemplates()
      .then(({ templates: t, error: e }) => {
        if (e) setError(e);
        else setTemplates(t ?? []);
      })
      .finally(() => setTemplatesLoading(false));
  }, [imageSource, templates.length]);

  // ライブラリから「オーバーレイを生成」で飛んできた場合: imageUrl で事前選択（初回のみ）
  useEffect(() => {
    const url = searchParams.get("imageUrl");
    if (!url?.trim() || hasAppliedInitialUrl.current) return;
    hasAppliedInitialUrl.current = true;
    setImageSource("library");
    setLibraryImageUrl(url.trim());
    setPreview(url.trim());
    setFile(null);
  }, [searchParams]);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0];
    if (selectedFile) {
      setFile(selectedFile);
      setLibraryImageUrl(null);
      const reader = new FileReader();
      reader.onload = () => setPreview(reader.result as string);
      reader.readAsDataURL(selectedFile);
      setResult(null);
      setError(null);
    }
  };

  const handleSelectLibraryImage = (template: PromptTemplate) => {
    const url = template.sample_image_url || template.image_urls?.[0];
    if (!url) return;
    setLibraryImageUrl(url);
    setPreview(url);
    setFile(null);
    setResult(null);
    setError(null);
  };

  const handleGenerate = async () => {
    if (!hasImage) return;
    setLoading(true);
    setError(null);
    try {
      const formData = new FormData();
      if (libraryImageUrl) {
        formData.append("imageUrl", libraryImageUrl);
      } else if (file) {
        formData.append("image", file);
      }
      formData.append("mode", mode);
      formData.append("textRemovalMode", textRemovalMode);
      formData.append("changePerson", String(changePerson));
      formData.append("targetPerson", targetPerson);
      const response = await uploadAndGenerateBase(formData);
      if (response.error) throw new Error(response.error);
      setResult({
        referenceImageUrl: response.referenceImageUrl!,
        baseImageUrl: response.baseImageUrl!,
      });
    } catch (err) {
      setError(err instanceof Error ? err.message : "エラーが発生しました");
    } finally {
      setLoading(false);
    }
  };

  const handleDownload = () => {
    if (!result) return;
    const link = document.createElement("a");
    link.href = result.baseImageUrl;
    link.download = `overlay-base-${Date.now()}.png`;
    link.click();
  };

  const handleReset = () => {
    setResult(null);
    setFile(null);
    setPreview(null);
    setLibraryImageUrl(null);
  };

  const optionsSection = hasImage && !loading ? (
    <div className="space-y-4">
      <div className="rounded-xl border border-neutral-200 bg-white p-4 space-y-4">
        <div className="flex items-center gap-2">
          <Users className="h-4 w-4 text-neutral-500" />
          <h3 className="text-sm font-semibold text-neutral-800">オプション設定</h3>
        </div>
        <div>
          <p className="text-xs font-medium text-neutral-600 mb-2">ベース画像の作り方</p>
          <div className="space-y-2">
            <label className="flex items-start gap-3 cursor-pointer">
              <input
                type="radio"
                name="baseMode"
                value="text-removal"
                checked={mode === "text-removal"}
                onChange={() => setMode("text-removal")}
                className="mt-1 h-4 w-4 text-neutral-600 focus:ring-neutral-400"
              />
              <div className="flex-1">
                <span className="font-medium text-neutral-800 text-sm">テキストを削除する</span>
                <p className="text-xs text-neutral-500">元画像の装飾を維持しつつテキストだけ削除</p>
              </div>
            </label>
            <label className="flex items-start gap-3 cursor-pointer">
              <input
                type="radio"
                name="baseMode"
                value="rebuild"
                checked={mode === "rebuild"}
                onChange={() => setMode("rebuild")}
                className="mt-1 h-4 w-4 text-neutral-600 focus:ring-neutral-400"
              />
              <div className="flex-1">
                <span className="font-medium text-neutral-800 text-sm">ベースを再構築する</span>
                <p className="text-xs text-neutral-500">レイアウト・トンマナのみ維持し、人物＋背景のみ生成</p>
              </div>
            </label>
          </div>
        </div>
        {mode === "rebuild" ? (
          <div className="space-y-2">
            <label className="block text-xs font-medium text-neutral-600">生成する人物</label>
            <select
              value={targetPerson}
              onChange={(e) => setTargetPerson(e.target.value as TargetPerson)}
              className="w-full rounded-xl border border-neutral-200 bg-white px-3 py-2 text-sm text-neutral-800 focus:outline-none focus:ring-2 focus:ring-neutral-400"
            >
              <option value="30代女性ママ">30代女性（ママ）</option>
              <option value="30代男性ビジネスマン">30代男性（ビジネスマン）</option>
              <option value="40代女性キャリア">40代女性（キャリア）</option>
              <option value="20代女性若手">20代女性（若手）</option>
              <option value="30代男性カジュアル">30代男性（カジュアル）</option>
              <option value="40代男性経営者">40代男性（経営者）</option>
            </select>
            <p className="text-[11px] text-neutral-500">再構築時に配置する人物のタイプです</p>
          </div>
        ) : (
          <>
            <div>
              <p className="text-xs font-medium text-neutral-600 mb-2">テキスト削除の強度</p>
              <div className="space-y-2">
                <label className="flex items-start gap-3 cursor-pointer">
                  <input
                    type="radio"
                    name="textRemovalMode"
                    value="preserve"
                    checked={textRemovalMode === "preserve"}
                    onChange={() => setTextRemovalMode("preserve")}
                    className="mt-1 h-4 w-4 text-neutral-600 focus:ring-neutral-400"
                  />
                  <div className="flex-1">
                    <span className="font-medium text-neutral-800 text-sm">装飾を残す</span>
                    <p className="text-xs text-neutral-500">テキストを削除。リボン・枠は残る</p>
                  </div>
                </label>
                <label className="flex items-start gap-3 cursor-pointer">
                  <input
                    type="radio"
                    name="textRemovalMode"
                    value="aggressive"
                    checked={textRemovalMode === "aggressive"}
                    onChange={() => setTextRemovalMode("aggressive")}
                    className="mt-1 h-4 w-4 text-neutral-600 focus:ring-neutral-400"
                  />
                  <div className="flex-1">
                    <span className="font-medium text-neutral-800 text-sm">完全に削除</span>
                    <p className="text-xs text-neutral-500">テキストを完全に削除。複雑な場合は装飾ごと削除</p>
                  </div>
                </label>
              </div>
            </div>
            <label className="flex items-start gap-3 cursor-pointer">
              <input
                type="checkbox"
                checked={changePerson}
                onChange={(e) => setChangePerson(e.target.checked)}
                className="mt-1 h-4 w-4 rounded border-neutral-300 text-neutral-600 focus:ring-neutral-400"
              />
              <div className="flex-1">
                <span className="font-medium text-neutral-800 text-sm">人物を変更する</span>
                <p className="text-xs text-neutral-500 mt-0.5">画像内の人物を指定したターゲットに置き換えます</p>
              </div>
            </label>
            {changePerson && (
              <div className="ml-6 space-y-2">
                <label className="block text-xs font-medium text-neutral-600">ターゲット選択</label>
                <select
                  value={targetPerson}
                  onChange={(e) => setTargetPerson(e.target.value as TargetPerson)}
                  className="w-full rounded-xl border border-neutral-200 bg-white px-3 py-2 text-sm text-neutral-800 focus:outline-none focus:ring-2 focus:ring-neutral-400"
                >
                  <option value="30代女性ママ">30代女性（ママ）</option>
                  <option value="30代男性ビジネスマン">30代男性（ビジネスマン）</option>
                  <option value="40代女性キャリア">40代女性（キャリア）</option>
                  <option value="20代女性若手">20代女性（若手）</option>
                  <option value="30代男性カジュアル">30代男性（カジュアル）</option>
                  <option value="40代男性経営者">40代男性（経営者）</option>
                </select>
                <p className="text-[11px] text-neutral-500">人物の服装や雰囲気がターゲットに合わせて変更されます</p>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  ) : undefined;

  return (
    <div className="min-h-screen bg-neutral-50">
      <header className="sticky top-0 z-10 shrink-0 flex items-center justify-between min-h-[52px] px-4 py-2 bg-white border-b border-neutral-200">
        <div className="flex items-center gap-2 min-w-0">
          <div className="min-w-0">
            <h1 className="text-sm font-bold text-neutral-900 leading-tight">Re:Design</h1>
            <p className="text-[10px] text-neutral-500 leading-tight">ベース画像を生成</p>
          </div>
        </div>
        <div className="flex items-center gap-1.5 shrink-0">
          <Link
            href="/"
            className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-md bg-white border border-neutral-200 text-xs font-medium text-neutral-700 hover:bg-neutral-50 hover:border-neutral-300 transition-colors"
          >
            <Sparkles className="w-3 h-3 shrink-0" />
            プロンプト生成
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

      <main className="grid min-h-[calc(100vh-53px)] grid-cols-1 lg:grid-cols-2">
        {/* 左: 参考画像（アップロード or ライブラリ一覧で左画面いっぱい） */}
        <aside className="flex flex-col min-h-0 border-r border-neutral-200 bg-white">
          <div className="shrink-0 p-4 border-b border-neutral-200">
            <div className="flex gap-2">
              <button
                type="button"
                onClick={() => {
                  setImageSource("upload");
                  setLibraryImageUrl(null);
                  setPreview(null);
                }}
                className={`flex-1 inline-flex items-center justify-center gap-1.5 rounded-xl border px-3 py-2.5 text-sm font-medium transition-colors ${
                  imageSource === "upload"
                    ? "border-neutral-900 bg-neutral-900 text-white"
                    : "border-neutral-200 bg-white text-neutral-700 hover:border-neutral-300"
                }`}
              >
                <Upload className="w-4 h-4" />
                画像をアップロード
              </button>
              <button
                type="button"
                onClick={() => {
                  setImageSource("library");
                  setFile(null);
                  setPreview(null);
                }}
                className={`flex-1 inline-flex items-center justify-center gap-1.5 rounded-xl border px-3 py-2.5 text-sm font-medium transition-colors ${
                  imageSource === "library"
                    ? "border-neutral-900 bg-neutral-900 text-white"
                    : "border-neutral-200 bg-white text-neutral-700 hover:border-neutral-300"
                }`}
              >
                <Library className="w-4 h-4" />
                ライブラリから選択
              </button>
            </div>
          </div>

          {imageSource === "upload" && (
            <div className="p-4 overflow-y-auto">
              <label className="flex flex-col items-center justify-center min-h-[200px] border-2 border-dashed border-neutral-300 rounded-xl cursor-pointer hover:border-neutral-400 transition-colors p-4">
                <input
                  type="file"
                  accept="image/*"
                  onChange={handleFileChange}
                  className="hidden"
                />
                {preview ? (
                  <img
                    src={preview}
                    alt="プレビュー"
                    className="max-h-[180px] rounded-lg object-contain"
                  />
                ) : (
                  <div className="text-center space-y-2">
                    <Upload className="h-10 w-10 text-neutral-400 mx-auto" />
                    <p className="text-sm text-neutral-600">クリックして参考画像を選択</p>
                    <p className="text-xs text-neutral-500">PNG / JPG / WEBP</p>
                  </div>
                )}
              </label>
            </div>
          )}

          {imageSource === "library" && (
            <div className="flex-1 min-h-0 overflow-y-auto p-4">
              {templatesLoading ? (
                <div className="flex items-center justify-center py-20">
                  <Loader2 className="h-10 w-10 animate-spin text-neutral-400" />
                </div>
              ) : templates.length === 0 ? (
                <p className="rounded-xl border border-neutral-200 bg-neutral-50 px-4 py-8 text-center text-sm text-neutral-500">
                  ライブラリにテンプレートがありません。トップで画像をアップロードしてテンプレートを生成してください。
                </p>
              ) : (
                <div
                  className="columns-2 sm:columns-3 md:columns-4 lg:columns-5 gap-3"
                  style={{ columnFill: "balance" } as React.CSSProperties}
                >
                  {templates.map((t) => {
                    const src = t.sample_image_url || t.image_urls?.[0];
                    if (!src) return null;
                    const isSelected = libraryImageUrl === src;
                    return (
                      <button
                        key={t.id}
                        type="button"
                        onClick={() => handleSelectLibraryImage(t)}
                        className={`break-inside-avoid mb-3 rounded-xl overflow-hidden border-2 transition-colors w-full bg-neutral-100 ${
                          isSelected
                            ? "border-neutral-900 ring-2 ring-neutral-900 ring-offset-2"
                            : "border-neutral-200 hover:border-neutral-300"
                        }`}
                      >
                        <img
                          src={src}
                          alt=""
                          className="w-full h-auto block"
                        />
                      </button>
                    );
                  })}
                </div>
              )}
            </div>
          )}
        </aside>

        {/* 右: オプション設定・生成ボタン・結果 */}
        <section className="overflow-y-auto bg-neutral-50">
          <div className="mx-auto max-w-md p-6 space-y-6">
            {optionsSection}

            {hasImage && !loading && (
              <button
                type="button"
                onClick={handleGenerate}
                className="inline-flex w-full items-center justify-center gap-2 rounded-lg bg-neutral-900 px-4 py-2.5 text-sm font-medium text-white transition-colors hover:bg-neutral-800 disabled:opacity-50"
              >
                {mode === "rebuild"
                  ? "ベースを再構築"
                  : changePerson
                    ? `${targetPerson}版ベース画像を生成`
                    : "ベース画像を生成"}
              </button>
            )}
            {loading && (
              <div className="flex items-center justify-center gap-2 text-neutral-600 py-4">
                <Loader2 className="h-5 w-5 animate-spin" />
                <span className="text-sm">AI生成中...</span>
              </div>
            )}
            {error && (
              <p className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
                {error}
              </p>
            )}
            {result && (
              <BaseImageResult
                result={result}
                onDownload={handleDownload}
                onReset={handleReset}
              />
            )}
            {!result && !hasImage && (
              <div className="rounded-xl border border-neutral-200 bg-white px-4 py-3 space-y-2">
                <h3 className="text-sm font-semibold text-neutral-800">使い方</h3>
                <ol className="space-y-1.5 text-xs text-neutral-600">
                  <li>1. 画像をアップロードまたは、テンプレートから1枚選択</li>
                  <li>2. AIがベース画像を生成</li>
                  <li>3. ダウンロードして、Canvaでテキスト編集</li>
                </ol>
              </div>
            )}
          </div>
        </section>
      </main>
    </div>
  );
}

export default function NewOverlayModePage() {
  return (
    <Suspense fallback={<div className="flex min-h-screen items-center justify-center bg-neutral-50 text-neutral-500 text-sm">読み込み中...</div>}>
      <NewOverlayModeContent />
    </Suspense>
  );
}
