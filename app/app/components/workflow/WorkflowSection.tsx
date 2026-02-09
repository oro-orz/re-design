import Link from "next/link";
import { ExternalLink } from "lucide-react";

type WorkflowSectionProps = {
  id: string;
  index: number;
  title: string;
  description: string;
  imageSrc: string;
  imageAlt: string;
  cta?: { label: string; href: string; external?: boolean };
  onImageClick?: () => void;
};

export function WorkflowSection({
  id,
  index,
  title,
  description,
  imageSrc,
  imageAlt,
  cta,
  onImageClick,
}: WorkflowSectionProps) {
  return (
    <section
      id={id}
      className="rounded-xl border border-neutral-200 bg-white p-6 shadow-sm"
    >
      <h2 className="mb-4 border-b border-neutral-200 pb-3 text-base font-semibold text-neutral-900">
        {index}. {title}
      </h2>
      <p className="mb-4 text-sm text-neutral-500">{description}</p>
      {imageSrc ? (
        <button
          type="button"
          onClick={onImageClick}
          className="mt-4 w-full overflow-hidden rounded-lg border border-neutral-200 text-left focus:outline-none focus:ring-2 focus:ring-neutral-400 focus:ring-offset-2"
        >
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={imageSrc}
            alt={imageAlt}
            className="h-auto w-full object-contain"
          />
        </button>
      ) : (
        <div className="mt-4 rounded-lg border border-dashed border-neutral-200 bg-neutral-50 py-8 text-center text-sm text-neutral-400">
          画像未配置
        </div>
      )}
      {cta && (
        <div className="mt-4 flex justify-end">
          {cta.external ? (
            <a
              href={cta.href}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1.5 rounded-lg bg-neutral-900 px-4 py-2.5 text-sm font-medium text-white hover:bg-neutral-800 transition-colors"
            >
              {cta.label}
              <ExternalLink className="w-4 h-4 shrink-0" />
            </a>
          ) : (
            <Link
              href={cta.href}
              className="inline-flex items-center gap-1.5 rounded-lg bg-neutral-900 px-4 py-2.5 text-sm font-medium text-white hover:bg-neutral-800 transition-colors"
            >
              {cta.label}
            </Link>
          )}
        </div>
      )}
    </section>
  );
}
