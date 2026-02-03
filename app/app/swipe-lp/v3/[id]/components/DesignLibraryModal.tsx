"use client";

import { useEffect } from "react";

interface Template {
  id: string;
  name: string;
  sample_image_url: string | null;
  image_urls?: string[] | null;
  category: string | null;
}

interface DesignLibraryModalProps {
  isOpen: boolean;
  onClose: () => void;
  recommended: Template[];
  others: Template[];
  selectedId: string | null;
  onSelect: (id: string) => void;
  /** 別の候補を出すボタン用 */
  onMoreCandidates?: () => void;
}

function TemplateCard({
  t,
  selectedId,
  onSelect,
  onClose,
}: {
  t: Template;
  selectedId: string | null;
  onSelect: (id: string) => void;
  onClose: () => void;
}) {
  return (
    <button
      type="button"
      onClick={() => {
        onSelect(t.id);
        onClose();
      }}
      className={`text-left rounded-xl border-2 overflow-hidden transition-colors ${
        selectedId === t.id
          ? "border-neutral-900 ring-2 ring-neutral-900 ring-offset-2"
          : "border-neutral-200 hover:border-neutral-400"
      }`}
    >
      <div className="aspect-[9/16] bg-neutral-100 flex items-center justify-center overflow-hidden">
        {(t.sample_image_url || t.image_urls?.[0]) ? (
          <img
            src={t.sample_image_url || t.image_urls?.[0] || ""}
            alt={t.name}
            className="w-full h-full object-contain object-center"
          />
        ) : (
          <span className="text-neutral-400 text-sm">{t.name}</span>
        )}
      </div>
      <div className="p-3">
        <p className="font-medium text-sm truncate">{t.name}</p>
        {t.category && (
          <p className="text-xs text-neutral-500">{t.category}</p>
        )}
      </div>
    </button>
  );
}

export function DesignLibraryModal({
  isOpen,
  onClose,
  recommended,
  others,
  selectedId,
  onSelect,
  onMoreCandidates,
}: DesignLibraryModalProps) {
  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    if (isOpen) {
      document.addEventListener("keydown", handleEscape);
      document.body.style.overflow = "hidden";
    }
    return () => {
      document.removeEventListener("keydown", handleEscape);
      document.body.style.overflow = "";
    };
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50"
      onClick={onClose}
    >
      <div
        className="bg-white rounded-2xl shadow-xl max-w-2xl w-full max-h-[80vh] overflow-hidden flex flex-col"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between p-4 border-b">
          <h3 className="text-lg font-bold">デザインを選ぶ</h3>
          <button
            type="button"
            onClick={onClose}
            className="p-2 hover:bg-neutral-100 rounded-lg"
          >
            ✕
          </button>
        </div>
        <div className="p-4 overflow-y-auto flex-1 space-y-6">
          {recommended.length > 0 && (
            <div>
              <div className="flex items-center justify-between mb-3">
                <h4 className="text-sm font-bold text-neutral-700">
                  おすすめ（このスライド向け）
                </h4>
                {onMoreCandidates && (
                  <button
                    type="button"
                    onClick={onMoreCandidates}
                    className="text-xs text-blue-600 hover:underline"
                  >
                    別の候補を出す
                  </button>
                )}
              </div>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
                {recommended.map((t) => (
                  <TemplateCard
                    key={t.id}
                    t={t}
                    selectedId={selectedId}
                    onSelect={onSelect}
                    onClose={onClose}
                  />
                ))}
              </div>
            </div>
          )}
          {others.length > 0 && (
            <div>
              <h4 className="text-sm font-bold text-neutral-700 mb-3">
                その他
              </h4>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
                {others.map((t) => (
                  <TemplateCard
                    key={t.id}
                    t={t}
                    selectedId={selectedId}
                    onSelect={onSelect}
                    onClose={onClose}
                  />
                ))}
              </div>
            </div>
          )}
          {recommended.length === 0 && others.length === 0 && (
            <p className="text-sm text-neutral-500 text-center py-8">
              テンプレートが登録されていません。ライブラリ管理から登録してください。
            </p>
          )}
        </div>
      </div>
    </div>
  );
}
