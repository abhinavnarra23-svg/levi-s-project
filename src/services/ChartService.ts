import type {
  ChartDatum,
  ForecastRow,
  ModelMetricRow,
  MonthlySalesRow,
  SalesInventoryRow
} from "@/types/analytics";

function monthLabel(year: string, monthNumber: number, month: string) {
  return `${month.slice(0, 3)} ${year}`.trim() || String(monthNumber);
}

function sortDescending(data: ChartDatum[], key: string) {
  return [...data].sort((a, b) => Number(b[key]) - Number(a[key]));
}

function groupSum(rows: SalesInventoryRow[], labelKey: keyof SalesInventoryRow, valueKey: keyof SalesInventoryRow) {
  const map = new Map<string, number>();

  rows.forEach((row) => {
    const label = String(row[labelKey] || "Unknown");
    map.set(label, (map.get(label) ?? 0) + Number(row[valueKey] ?? 0));
  });

  return Array.from(map, ([name, value]) => ({ name, value }));
}

function topBy(rows: SalesInventoryRow[], labelKey: keyof SalesInventoryRow, valueKey: keyof SalesInventoryRow, limit = 10) {
  return sortDescending(groupSum(rows, labelKey, valueKey), "value").slice(0, limit);
}

function ageingBucket(days: number) {
  if (days <= 30) return "0-30 days";
  if (days <= 60) return "31-60 days";
  if (days <= 90) return "61-90 days";
  if (days <= 180) return "91-180 days";
  return "180+ days";
}

function priceBucket(mrp: number) {
  if (mrp < 1000) return "<1K";
  if (mrp < 2000) return "1K-2K";
  if (mrp < 4000) return "2K-4K";
  return "4K+";
}

function percentageChange(current: number, previous: number) {
  if (!previous) return 0;
  return ((current - previous) / previous) * 100;
}

export const ChartService = {
  ageingDistribution(rows: SalesInventoryRow[]) {
    const map = new Map<string, number>();
    rows.forEach((row) => map.set(ageingBucket(row.ageingDays), (map.get(ageingBucket(row.ageingDays)) ?? 0) + row.stock));
    return Array.from(map, ([name, value]) => ({ name, value }));
  },

  correlationHeatmap(rows: SalesInventoryRow[]) {
    const pairs = [
      ["Ageing vs Sales", "ageingDays", "quantity"],
      ["Stock vs Revenue", "stock", "amount"],
      ["Quantity vs Revenue", "quantity", "amount"],
      ["Ageing vs Stock", "ageingDays", "stock"]
    ] as const;

    return pairs.map(([name, xKey, yKey]) => ({
      name,
      value: this.correlation(rows.map((row) => Number(row[xKey])), rows.map((row) => Number(row[yKey])))
    }));
  },

  correlation(x: number[], y: number[]) {
    const length = Math.min(x.length, y.length);
    if (!length) return 0;
    const xMean = x.reduce((sum, value) => sum + value, 0) / length;
    const yMean = y.reduce((sum, value) => sum + value, 0) / length;
    let numerator = 0;
    let xDenominator = 0;
    let yDenominator = 0;

    for (let index = 0; index < length; index += 1) {
      const xDelta = x[index] - xMean;
      const yDelta = y[index] - yMean;
      numerator += xDelta * yDelta;
      xDenominator += xDelta ** 2;
      yDenominator += yDelta ** 2;
    }

    const denominator = Math.sqrt(xDenominator * yDenominator);
    return denominator ? Number((numerator / denominator).toFixed(3)) : 0;
  },

  dailyRevenue(rows: SalesInventoryRow[]) {
    return groupSum(rows, "billDate", "amount")
      .sort((a, b) => String(a.name).localeCompare(String(b.name)))
      .slice(-60);
  },

  departmentRevenue(rows: SalesInventoryRow[]) {
    return topBy(rows, "department", "amount", 10);
  },

  forecastTrend(forecastRows: ForecastRow[]) {
    return forecastRows.map((row) => ({
      name: row.date,
      predicted: row.forecastDemand
    }));
  },

  heatmap(rows: SalesInventoryRow[], xKey: keyof SalesInventoryRow, yKey: keyof SalesInventoryRow, valueKey: keyof SalesInventoryRow) {
    const map = new Map<string, { x: string; y: string; z: number }>();
    rows.forEach((row) => {
      const x = String(row[xKey] || "Unknown");
      const y = String(row[yKey] || "Unknown");
      const key = `${x}|${y}`;
      const existing = map.get(key);
      map.set(key, { x, y, z: (existing?.z ?? 0) + Number(row[valueKey] ?? 0) });
    });
    return sortDescending(Array.from(map.values()).map((item) => ({ name: `${item.y} ${item.x}`, ...item })), "z").slice(0, 24);
  },

  inventoryDistribution(rows: SalesInventoryRow[]) {
    const map = new Map<string, number>();
    rows.forEach((row) => {
      const label = row.stock <= 0 ? "Out of Stock" : row.stock < 5 ? "Low Stock" : row.ageingDays > 180 ? "Aged Stock" : "Available";
      map.set(label, (map.get(label) ?? 0) + row.stock);
    });
    return Array.from(map, ([name, value]) => ({ name, value }));
  },

  monthlyGrowth(rows: SalesInventoryRow[]) {
    const monthly = this.monthlyRevenue(rows);
    return monthly.map((item, index) => ({
      name: item.name,
      value: Number(percentageChange(Number(item.value), Number(monthly[index - 1]?.value ?? 0)).toFixed(2))
    }));
  },

  monthlyRevenue(rows: SalesInventoryRow[]) {
    const map = new Map<string, { order: number; value: number }>();
    rows.forEach((row) => {
      const name = monthLabel(row.year, row.monthNumber, row.month);
      const order = Number(row.year) * 100 + row.monthNumber;
      const existing = map.get(name);
      map.set(name, { order, value: (existing?.value ?? 0) + row.amount });
    });
    return Array.from(map, ([name, item]) => ({ name, value: item.value, order: item.order }))
      .sort((a, b) => a.order - b.order)
      .map(({ name, value }) => ({ name, value }));
  },

  monthlySalesFile(rows: MonthlySalesRow[]) {
    return rows.map((row) => ({ name: row.date, value: row.sales }));
  },

  movementProducts(rows: SalesInventoryRow[], movement: string) {
    return topBy(
      rows.filter((row) => row.movementType.toLowerCase().includes(movement.toLowerCase())),
      "productName",
      "quantity",
      10
    );
  },

  modelComparison(rows: ModelMetricRow[]) {
    return rows.map((row) => ({
      mae: row.mae,
      mape: row.mape,
      name: row.model,
      r2: row.r2,
      rmse: row.rmse
    }));
  },

  priceRange(rows: SalesInventoryRow[]) {
    const map = new Map<string, number>();
    rows.forEach((row) => map.set(priceBucket(row.mrp), (map.get(priceBucket(row.mrp)) ?? 0) + row.amount));
    return Array.from(map, ([name, value]) => ({ name, value }));
  },

  revenueBy(rows: SalesInventoryRow[], key: keyof SalesInventoryRow, limit = 20) {
    return topBy(rows, key, "amount", limit);
  },

  scatter(rows: SalesInventoryRow[], xKey: keyof SalesInventoryRow, yKey: keyof SalesInventoryRow, limit = 400) {
    return rows.slice(0, limit).map((row, index) => ({
      name: String(index + 1),
      x: Number(row[xKey] ?? 0),
      y: Number(row[yKey] ?? 0),
      z: 80
    }));
  },

  stockBy(rows: SalesInventoryRow[], key: keyof SalesInventoryRow, limit = 20) {
    return topBy(rows, key, "stock", limit);
  },

  weeklyRevenue(rows: SalesInventoryRow[]) {
    return groupSum(rows, "day", "amount");
  },

  yearlyRevenue(rows: SalesInventoryRow[]) {
    return groupSum(rows, "year", "amount").sort((a, b) => String(a.name).localeCompare(String(b.name)));
  },

  yoyGrowth(rows: SalesInventoryRow[]) {
    const yearly = this.yearlyRevenue(rows);
    return yearly.map((item, index) => ({
      name: item.name,
      value: Number(percentageChange(Number(item.value), Number(yearly[index - 1]?.value ?? 0)).toFixed(2))
    }));
  }
};
