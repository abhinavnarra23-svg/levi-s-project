export function LoadingSkeleton() {
  return (
    <div className="animate-pulse rounded-3xl border border-slate-200/90 bg-white p-6 shadow-panel dark:border-slate-800 dark:bg-slate-900">
      <div className="h-5 w-40 rounded-full bg-slate-200 dark:bg-slate-800" />
      <div className="mt-6 h-64 rounded-2xl bg-slate-100 dark:bg-slate-800" />
    </div>
  );
}
