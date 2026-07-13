import type { ReactNode } from "react";

type PageSurfaceProps = {
  title: string;
  eyebrow?: string;
  description?: string;
  children?: ReactNode;
};

export function PageSurface({
  title,
  eyebrow,
  description,
  children
}: PageSurfaceProps) {
  return (
    <section className="space-y-6">
      <div className="flex flex-col gap-3">
        {eyebrow ? (
          <span className="text-xs font-semibold uppercase tracking-[0.18em] text-brand-red">
            {eyebrow}
          </span>
        ) : null}
        <div className="max-w-3xl space-y-2">
          <h1 className="text-2xl font-semibold tracking-normal text-slate-950 dark:text-white sm:text-3xl">
            {title}
          </h1>
          {description ? (
            <p className="text-sm leading-6 text-slate-600 dark:text-slate-300 sm:text-base">
              {description}
            </p>
          ) : null}
        </div>
      </div>
      <div className="rounded-3xl border border-slate-200/90 bg-white p-6 shadow-panel dark:border-slate-800 dark:bg-slate-900/80 sm:p-8">
        {children ?? (
          <div className="min-h-72 rounded-xl border border-dashed border-slate-200 bg-slate-50/80 dark:border-slate-700 dark:bg-slate-950/40" />
        )}
      </div>
    </section>
  );
}
