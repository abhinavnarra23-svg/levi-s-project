import type { LucideIcon } from "lucide-react";

export type CsvRow = Record<string, string>;

export type SalesInventoryRow = {
  storeName: string;
  billDate: string;
  year: string;
  month: string;
  monthNumber: number;
  day: string;
  season: string;
  gender: string;
  quantity: number;
  amount: number;
  productName: string;
  department: string;
  mrp: number;
  size: string;
  state: string;
  stock: number;
  ageingDays: number;
  ageingCategory: string;
  movementType: string;
  revenuePerUnit: number;
};

export type MonthlySalesRow = {
  date: string;
  sales: number;
};

export type ForecastRow = {
  date: string;
  forecastDemand: number;
};

export type ModelMetricRow = {
  model: string;
  mae: number;
  rmse: number;
  mape: number;
  r2: number;
};

export type AnalyticsData = {
  salesInventory: SalesInventoryRow[];
  monthlySales: MonthlySalesRow[];
  forecastResults: ForecastRow[];
  modelMetrics: ModelMetricRow[];
};

export type FilterKey =
  | "year"
  | "month"
  | "storeName"
  | "productName"
  | "department"
  | "gender"
  | "season"
  | "size";

export type FilterState = Record<FilterKey, string>;

export type FilterOptions = Record<FilterKey, string[]>;

export type KpiTone = "success" | "warning" | "danger" | "neutral";

export type KpiRecord = {
  label: string;
  value: string;
  change: string;
  tone: KpiTone;
  icon: LucideIcon;
};

export type ChartDatum = Record<string, string | number>;

export type InsightRecord = {
  title: string;
  value: string;
  detail: string;
};
