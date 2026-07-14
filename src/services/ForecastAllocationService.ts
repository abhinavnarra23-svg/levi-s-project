import type { SalesInventoryRow } from "@/types/analytics";

export type ForecastBreakdownDatum = {
  forecastDemand: number;
  forecastSales: number;
  name: string;
};

export type ForecastBreakdowns = {
  departments: ForecastBreakdownDatum[];
  seasons: ForecastBreakdownDatum[];
  stores: ForecastBreakdownDatum[];
};

type BreakdownKey = "department" | "season" | "storeName";

function allocateForecast(
  rows: SalesInventoryRow[],
  key: BreakdownKey,
  totalForecastSales: number,
  totalForecastDemand: number
): ForecastBreakdownDatum[] {
  const grouped = new Map<string, { demandWeight: number; salesWeight: number }>();

  for (const row of rows) {
    const name = String(row[key] ?? "").trim();
    if (!name) continue;
    const current = grouped.get(name) ?? { demandWeight: 0, salesWeight: 0 };
    current.salesWeight += Number(row.amount) || 0;
    current.demandWeight += Number(row.quantity) || 0;
    grouped.set(name, current);
  }

  const weights = Array.from(grouped, ([name, value]) => ({ name, ...value }));
  const salesWeightTotal = weights.reduce((total, item) => total + item.salesWeight, 0);
  const demandWeightTotal = weights.reduce((total, item) => total + item.demandWeight, 0);

  if (!weights.length || (!salesWeightTotal && !demandWeightTotal)) return [];

  const allocated = weights.map((item) => ({
    forecastDemand: demandWeightTotal ? totalForecastDemand * (item.demandWeight / demandWeightTotal) : 0,
    forecastSales: salesWeightTotal ? totalForecastSales * (item.salesWeight / salesWeightTotal) : 0,
    name: item.name
  }));

  // Reconcile floating-point residue so every dimensional view equals the model totals exactly.
  if (allocated.length) {
    allocated[0].forecastSales += totalForecastSales - allocated.reduce((total, item) => total + item.forecastSales, 0);
    allocated[0].forecastDemand += totalForecastDemand - allocated.reduce((total, item) => total + item.forecastDemand, 0);
  }

  return allocated;
}

function allocateStoreForecast(
  rows: SalesInventoryRow[],
  totalForecastSales: number,
  totalForecastDemand: number
) {
  const uniqueStores = new Set(
    rows.map((row) => String(row.storeName ?? "").trim()).filter(Boolean)
  );
  const storeForecast = allocateForecast(
    rows,
    "storeName",
    totalForecastSales,
    totalForecastDemand
  ).sort((a, b) => b.forecastSales - a.forecastSales);

  if (storeForecast.length !== uniqueStores.size) {
    throw new Error(
      `Store forecast aggregation mismatch: expected ${uniqueStores.size}, received ${storeForecast.length}`
    );
  }

  return storeForecast;
}

export const ForecastAllocationService = {
  build(
    rows: SalesInventoryRow[],
    totalForecastSales: number,
    totalForecastDemand: number
  ): ForecastBreakdowns {
    return {
      departments: allocateForecast(rows, "department", totalForecastSales, totalForecastDemand),
      seasons: allocateForecast(rows, "season", totalForecastSales, totalForecastDemand),
      stores: allocateStoreForecast(rows, totalForecastSales, totalForecastDemand)
    };
  }
};
