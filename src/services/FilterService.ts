import type { FilterKey, FilterOptions, FilterState, SalesInventoryRow } from "@/types/analytics";

export const defaultFilters: FilterState = {
  department: "All",
  month: "All",
  productName: "All",
  season: "All",
  size: "All",
  storeName: "All",
  year: "All"
};

const filterKeys: FilterKey[] = [
  "year",
  "month",
  "storeName",
  "productName",
  "department",
  "season",
  "size"
];

function uniqueSorted(rows: SalesInventoryRow[], key: FilterKey) {
  return Array.from(new Set(rows.map((row) => String(row[key] ?? "").trim()).filter(Boolean))).sort(
    (a, b) => a.localeCompare(b, undefined, { numeric: true })
  );
}

export const FilterService = {
  filterRows(rows: SalesInventoryRow[], filters: FilterState) {
    const activeFilters = filterKeys.filter((key) => filters[key] !== "All");
    if (!activeFilters.length) return rows;

    return rows.filter((row) => {
      for (const key of activeFilters) {
        if (String(row[key]) !== filters[key]) return false;
      }
      return true;
    });
  },

  getOptions(rows: SalesInventoryRow[]): FilterOptions {
    return filterKeys.reduce<FilterOptions>((options, key) => {
      options[key] = uniqueSorted(rows, key);
      return options;
    }, {} as FilterOptions);
  }
};
