"use client";

import { MODES, type ModeId } from "@/lib/constants";

type Props = {
  value: ModeId | null;
  onChange: (mode: ModeId) => void;
  disabled?: boolean;
};

export function ModeSelect({ value, onChange, disabled }: Props) {
  return (
    <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
      {MODES.map((m) => (
        <button
          key={m.id}
          type="button"
          onClick={() => !disabled && onChange(m.id)}
          disabled={disabled}
          className={`rounded-xl border px-4 py-3 text-left text-sm font-medium transition-colors ${
            value === m.id
              ? "border-neutral-900 bg-neutral-900 text-white"
              : "border-neutral-200 bg-white text-neutral-700 hover:border-neutral-300 disabled:opacity-50"
          }`}
        >
          {m.label}
        </button>
      ))}
    </div>
  );
}
