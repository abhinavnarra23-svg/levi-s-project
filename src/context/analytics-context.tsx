"use client";

import {
  createContext,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode
} from "react";

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

export function AnalyticsProvider({ children }: { children: ReactNode }) {
  const [data, setData] = useState<AnalyticsData | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [filters, setFilters] = useState<FilterState>(defaultFilters);

  useEffect(() => {
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
      resetFilters: () => setFilters(defaultFilters),
      setFilter: (key, selectedValue) =>
        setFilters((current) => ({ ...current, [key]: selectedValue }))
    }),
    [data, error, filteredRows, filterOptions, filters]
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
