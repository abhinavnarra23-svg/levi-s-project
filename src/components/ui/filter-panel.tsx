"use client";

import { Filter, RotateCcw } from "lucide-react";
import { memo } from "react";

import { useAnalytics } from "@/context/analytics-context";
import type { FilterKey } from "@/types/analytics";

const fields: Array<[FilterKey, string]> = [
  ["year", "Year"],
  ["month", "Month"],
  ["storeName", "Store Name"],
  ["productName", "Product Name"],
  ["department", "Department"],
  ["gender", "Gender"],
  ["season", "Season"],
  ["size", "Size"]
];

export const FilterPanel = memo(function FilterPanel() {
  const { filterOptions, filters, resetFilters, setFilter } = useAnalytics();

  return (
    <section className="rounded-3xl border border-slate-200/90 bg-white p-5 shadow-panel dark:border-slate-800 dark:bg-slate-900/80">
      <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-2 text-sm font-semibold text-slate-800 dark:text-slate-100">
          <Filter className="h-4 w-4 text-brand-red" />
          Global Filters
        </div>
        <button
          className="inline-flex h-9 items-center gap-2 rounded-xl border border-slate-200 bg-slate-50 px-3 text-xs font-semibold text-slate-600 transition duration-200 hover:-translate-y-0.5 hover:border-red-200 hover:bg-red-50 hover:text-brand-red focus:outline-none focus:ring-2 focus:ring-brand-red/30 dark:border-slate-700 dark:bg-slate-950 dark:text-slate-300"
          onClick={resetFilters}
          type="button"
        >
          <RotateCcw className="h-3.5 w-3.5" />
          Reset
        </button>
      </div>
      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        {fields.map(([key, label]) => (
          <label className="space-y-2" key={key}>
            <span className="text-sm font-medium text-slate-500 dark:text-slate-400">
              {label}
            </span>
            <select
              className="h-11 w-full rounded-2xl border border-slate-200 bg-slate-50 px-3 text-sm text-slate-700 outline-none transition duration-200 hover:border-slate-300 focus:border-brand-blue focus:bg-white focus:ring-4 focus:ring-blue-100 dark:border-slate-700 dark:bg-slate-950 dark:text-slate-200 dark:focus:bg-slate-950"
              onChange={(event) => setFilter(key, event.target.value)}
              value={filters[key]}
            >
              <option value="All">All</option>
              {(filterOptions[key] ?? []).map((option) => (
                <option key={option}>{option}</option>
              ))}
            </select>
          </label>
        ))}
      </div>
    </section>
  );
});
