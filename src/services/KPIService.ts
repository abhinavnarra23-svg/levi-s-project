import {
  AlertTriangle,
  BadgeIndianRupee,
  Boxes,
  BrainCircuit,
  CalendarRange,
  Gauge,
  Package,
  PackageCheck,
  Store,
  TrendingDown,
  TrendingUp
} from "lucide-react";

import { formatCurrency, formatNumber, formatPercent } from "@/lib/formatters";
import type { ForecastRow, InsightRecord, KpiRecord, ModelMetricRow, SalesInventoryRow } from "@/types/analytics";

function sum(rows: SalesInventoryRow[], key: keyof SalesInventoryRow) {
  return rows.reduce((total, row) => total + Number(row[key] ?? 0), 0);
}

function uniqueCount(rows: SalesInventoryRow[], key: keyof SalesInventoryRow) {
  return new Set(rows.map((row) => String(row[key]).trim()).filter(Boolean)).size;
}

function productAgeingBucket(ageingDays: number) {
  if (ageingDays <= 30) return "Fast";
  if (ageingDays <= 90) return "Moderate";
  if (ageingDays <= 150) return "Slow";
  return "Dead";
}

function productAgeingSnapshot(rows: SalesInventoryRow[]) {
  const products = new Map<string, number>();
  rows.forEach((row) => {
    const productName = String(row.productName ?? "").trim();
    if (!productName) return;
    products.set(productName, Math.max(products.get(productName) ?? 0, Number(row.ageingDays ?? 0)));
  });
  return Array.from(products, ([productName, ageingDays]) => ({
    ageingDays,
    productName,
    movementType: productAgeingBucket(ageingDays)
  }));
}

function averageProductAgeing(rows: SalesInventoryRow[]) {
  const products = productAgeingSnapshot(rows);
  if (!products.length) return 0;
  return products.reduce((total, product) => total + product.ageingDays, 0) / products.length;
}

function movementProductCount(rows: SalesInventoryRow[], movement: string) {
  return productAgeingSnapshot(rows).filter((product) => product.movementType === movement).length;
}

function topValue(rows: SalesInventoryRow[], labelKey: keyof SalesInventoryRow, valueKey: keyof SalesInventoryRow) {
  const map = new Map<string, number>();
  rows.forEach((row) => {
    const label = String(row[labelKey] || "Unknown");
    map.set(label, (map.get(label) ?? 0) + Number(row[valueKey] ?? 0));
  });
  return Array.from(map, ([label, value]) => ({ label, value })).sort((a, b) => b.value - a.value)[0] ?? { label: "N/A", value: 0 };
}

function selectedModel(metrics: ModelMetricRow[]) {
  return metrics.find((row) => row.model.toLowerCase() === "xgboost") ?? metrics[0];
}

export const KPIService = {
  aboutTools() {
    return ["Python", "Pandas", "NumPy", "Scikit-learn", "XGBoost", "React", "Next.js", "Tailwind", "Recharts"];
  },

  forecastKpis(metrics: ModelMetricRow[], forecast: ForecastRow[]): KpiRecord[] {
    const model = selectedModel(metrics);
    const accuracy = model ? Math.max(0, 100 - model.mape) : 0;

    return [
      { label: "Selected Model", value: "XGBoost", change: "Exported result", tone: "neutral", icon: BrainCircuit },
      { label: "Forecast Accuracy", value: formatPercent(accuracy), change: "100 - MAPE", tone: "success", icon: Gauge },
      { label: "MAE", value: formatNumber(model?.mae ?? 0), change: "Mean absolute error", tone: "neutral", icon: Gauge },
      { label: "RMSE", value: formatNumber(model?.rmse ?? 0), change: "Root mean squared error", tone: "neutral", icon: Gauge },
      { label: "MAPE", value: formatPercent(model?.mape ?? 0), change: "Mean absolute percentage error", tone: "warning", icon: Gauge },
      { label: "Forecast Horizon", value: `${forecast.length} months`, change: "CSV rows", tone: "neutral", icon: CalendarRange }
    ];
  },

  homeStats(rows: SalesInventoryRow[], metrics: ModelMetricRow[]) {
    return [
      { label: "Stores", value: formatNumber(uniqueCount(rows, "storeName")) },
      { label: "Products", value: formatNumber(uniqueCount(rows, "productName")) },
      { label: "Total Revenue", value: formatCurrency(sum(rows, "amount")) },
      { label: "Total Inventory", value: formatNumber(sum(rows, "stock")) },
      { label: "Forecast Model", value: selectedModel(metrics)?.model ?? "XGBoost" }
    ];
  },

  inventoryKpis(rows: SalesInventoryRow[]): KpiRecord[] {
    const totalInventory = sum(rows, "stock");

    return [
      { label: "Current Stock", value: formatNumber(totalInventory), change: "Current Inventory Available", tone: "neutral", icon: Boxes },
      { label: "Average Inventory Ageing", value: `${averageProductAgeing(rows).toFixed(1)} Days`, change: "Average Inventory Age", tone: "warning", icon: CalendarRange },
      { label: "Fast Moving", value: formatNumber(movementProductCount(rows, "Fast")), change: "Fast Moving Products", tone: "success", icon: TrendingUp },
      { label: "Slow Moving", value: formatNumber(movementProductCount(rows, "Slow")), change: "Slow Moving Products", tone: "warning", icon: TrendingDown },
      { label: "Dead Stock", value: formatNumber(movementProductCount(rows, "Dead")), change: "Dead Stock Products", tone: "danger", icon: AlertTriangle }
    ];
  },

  insights(rows: SalesInventoryRow[]): InsightRecord[] {
    const highestRevenueStore = topValue(rows, "storeName", "amount");
    const highestRevenueProduct = topValue(rows, "productName", "amount");
    const highestRevenueDepartment = topValue(rows, "department", "amount");
    const highestInventoryStore = topValue(rows, "storeName", "stock");
    const highestInventoryProduct = topValue(rows, "productName", "stock");
    const highestDeadStockProduct = topValue(rows.filter((row) => row.movementType.toLowerCase().includes("dead")), "productName", "stock");
    const highestDeadStockStore = topValue(rows.filter((row) => row.movementType.toLowerCase().includes("dead")), "storeName", "stock");
    const fastestMovingProduct = topValue(rows.filter((row) => row.movementType.toLowerCase().includes("fast")), "productName", "quantity");
    const slowestMovingProduct = topValue(rows.filter((row) => row.movementType.toLowerCase().includes("slow")), "productName", "stock");
    const highestAgeingStore = topValue(rows, "storeName", "ageingDays");
    const highestSeason = topValue(rows, "season", "amount");
    const lowestSeason = Array.from(
      rows.reduce((map, row) => map.set(row.season, (map.get(row.season) ?? 0) + row.amount), new Map<string, number>()),
      ([label, value]) => ({ label, value })
    ).sort((a, b) => a.value - b.value)[0] ?? { label: "N/A", value: 0 };

    return [
      { title: "Highest Revenue Store", value: highestRevenueStore.label, detail: formatCurrency(highestRevenueStore.value) },
      { title: "Highest Revenue Product", value: highestRevenueProduct.label, detail: formatCurrency(highestRevenueProduct.value) },
      { title: "Highest Revenue Department", value: highestRevenueDepartment.label, detail: formatCurrency(highestRevenueDepartment.value) },
      { title: "Highest Inventory Store", value: highestInventoryStore.label, detail: `${formatNumber(highestInventoryStore.value)} units` },
      { title: "Highest Inventory Product", value: highestInventoryProduct.label, detail: `${formatNumber(highestInventoryProduct.value)} units` },
      { title: "Highest Dead Stock Product", value: highestDeadStockProduct.label, detail: `${formatNumber(highestDeadStockProduct.value)} units` },
      { title: "Highest Dead Stock Store", value: highestDeadStockStore.label, detail: `${formatNumber(highestDeadStockStore.value)} units` },
      { title: "Fastest Moving Product", value: fastestMovingProduct.label, detail: `${formatNumber(fastestMovingProduct.value)} units sold` },
      { title: "Slowest Moving Product", value: slowestMovingProduct.label, detail: `${formatNumber(slowestMovingProduct.value)} units in stock` },
      { title: "Highest Ageing Store", value: highestAgeingStore.label, detail: `${formatNumber(highestAgeingStore.value)} ageing days score` },
      { title: "Highest Selling Season", value: highestSeason.label, detail: formatCurrency(highestSeason.value) },
      { title: "Lowest Selling Season", value: lowestSeason.label, detail: formatCurrency(lowestSeason.value) }
    ];
  },

  recommendations(rows: SalesInventoryRow[]) {
    const insights = this.insights(rows);
    const value = (title: string) => insights.find((item) => item.title === title)?.value ?? "selected areas";

    return [
      `Increase replenishment in ${value("Highest Revenue Store")} because it leads revenue performance.`,
      `Prioritise high-demand product ${value("Fastest Moving Product")} for availability planning.`,
      `Reduce ageing stock in ${value("Highest Ageing Store")} through promotions and markdowns.`,
      `Transfer excess inventory from ${value("Highest Inventory Store")} to high-performing stores.`,
      `Monitor slow-moving product ${value("Slowest Moving Product")} before the next buying cycle.`
    ];
  },

  salesKpis(rows: SalesInventoryRow[]): KpiRecord[] {
    const revenue = sum(rows, "amount");
    const quantity = sum(rows, "quantity");
    return [
      { label: "Total Revenue", value: formatCurrency(revenue), change: "Filtered CSV", tone: "success", icon: BadgeIndianRupee },
      { label: "Units Sold", value: formatNumber(quantity), change: "Total quantity", tone: "success", icon: PackageCheck },
      { label: "Average Selling Price", value: formatCurrency(quantity ? revenue / quantity : 0), change: "Revenue / units", tone: "neutral", icon: Gauge },
      { label: "Best Store", value: topValue(rows, "storeName", "amount").label, change: "By revenue", tone: "neutral", icon: Store },
      { label: "Best Product", value: topValue(rows, "productName", "amount").label, change: "By revenue", tone: "neutral", icon: Package },
      { label: "Best Department", value: topValue(rows, "department", "amount").label, change: "By revenue", tone: "neutral", icon: Boxes }
    ];
  }
};
