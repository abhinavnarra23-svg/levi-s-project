"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode
} from "react";
import { usePathname } from "next/navigation";

import { DataService } from "@/services/DataService";
import { defaultFilters, FilterService } from "@/services/FilterService";
import type { AnalyticsData, FilterOptions, FilterState, SalesInventoryRow } from "@/types/analytics";

type AnalyticsContextValue = {
  data: AnalyticsData | null;
  error: string | null;
  filteredRows: SalesInventoryRow[];
  filterOptions: FilterOptions;
  filters: FilterState;
  isLoading: boolean;
  resetFilters: () => void;
  setFilter: (key: keyof FilterState, value: string) => void;
};

const AnalyticsContext = createContext<AnalyticsContextValue | null>(null);
const analyticsRoutes = new Set(["/demand-forecasting", "/inventory-analytics", "/sales-analytics"]);

export function AnalyticsProvider({ children }: { children: ReactNode }) {
  const pathname = usePathname();
  const shouldLoadAnalytics = analyticsRoutes.has(pathname);
  const [data, setData] = useState<AnalyticsData | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [filters, setFilters] = useState<FilterState>(defaultFilters);

  useEffect(() => {
    if (!shouldLoadAnalytics) return;

    let isMounted = true;

    DataService.loadAnalyticsData()
      .then((loadedData) => {
        if (isMounted) {
          setData(loadedData);
        }
      })
      .catch((caughtError: unknown) => {
        if (isMounted) {
          setError(caughtError instanceof Error ? caughtError.message : "Unable to load CSV data");
        }
      });

    return () => {
      isMounted = false;
    };
  }, [shouldLoadAnalytics]);

  const resetFilters = useCallback(() => setFilters(defaultFilters), []);
  const setFilter = useCallback((key: keyof FilterState, selectedValue: string) => {
    setFilters((current) =>
      current[key] === selectedValue ? current : { ...current, [key]: selectedValue }
    );
  }, []);

  const filterOptions = useMemo(
    () => FilterService.getOptions(data?.salesInventory ?? []),
    [data]
  );

  const filteredRows = useMemo(
    () => FilterService.filterRows(data?.salesInventory ?? [], filters),
    [data, filters]
  );

  const value = useMemo<AnalyticsContextValue>(
    () => ({
      data,
      error,
      filteredRows,
      filterOptions,
      filters,
      isLoading: !data && !error,
      resetFilters,
      setFilter
    }),
    [data, error, filteredRows, filterOptions, filters, resetFilters, setFilter]
  );

  return <AnalyticsContext.Provider value={value}>{children}</AnalyticsContext.Provider>;
}

export function useAnalytics() {
  const context = useContext(AnalyticsContext);

  if (!context) {
    throw new Error("useAnalytics must be used inside AnalyticsProvider");
  }

  return context;
}
