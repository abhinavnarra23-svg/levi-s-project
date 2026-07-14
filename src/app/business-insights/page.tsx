"use client";

import { useMemo } from "react";
import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  ComposedChart,
  LabelList,
  Legend,
  Line,
  ResponsiveContainer,
  Scatter,
  ScatterChart,
  Tooltip,
  XAxis,
  YAxis,
  ZAxis
} from "recharts";

import { ChartCard } from "@/components/charts/chart-card";
import { FilterPanel } from "@/components/ui/filter-panel";
import { LoadingSkeleton } from "@/components/ui/loading-skeleton";
import { PageHeader } from "@/components/ui/page-header";
import { useAnalytics } from "@/context/analytics-context";
import { formatCurrency, formatNumber, formatPercent } from "@/lib/formatters";
import type { SalesInventoryRow } from "@/types/analytics";

const COLORS = {
  blue: "#669BBC",
  cream: "#FDF0D5",
  darkRed: "#780000",
  green: "#003049",
  grey: "#6B7280",
  lightBlue: "#FDF0D5",
  orange: "#FDF0D5",
  red: "#C1121F",
  slate: "#003049"
};

type NamedValue = {
  contribution?: number;
  label?: string;
  name: string;
  value: number;
};

type AgeingBucketDatum = {
  bucket: string;
  fullName: string;
  inventory: number;
  quantity: number;
  revenue: number;
};

const axisStyle = {
  fill: "#000000",
  fontSize: 12,
  fontWeight: 500
};

function sum(rows: SalesInventoryRow[], key: keyof SalesInventoryRow) {
  return rows.reduce((total, row) => total + Number(row[key] ?? 0), 0);
}

function percentage(value: number, total: number) {
  return total ? (value / total) * 100 : 0;
}

function average(values: number[]) {
  const valid = values.filter((value) => Number.isFinite(value));
  return valid.length ? valid.reduce((total, value) => total + value, 0) / valid.length : 0;
}

function groupSum(rows: SalesInventoryRow[], key: keyof SalesInventoryRow, valueKey: keyof SalesInventoryRow) {
  const map = new Map<string, number>();
  rows.forEach((row) => {
    const label = String(row[key] || "Unknown");
    map.set(label, (map.get(label) ?? 0) + Number(row[valueKey] ?? 0));
  });
  return Array.from(map, ([name, value]) => ({ name, value })).sort((a, b) => b.value - a.value);
}

function compactCurrency(value: number) {
  const absolute = Math.abs(value);
  if (absolute >= 10000000) return `₹${(value / 10000000).toFixed(2)} Cr`;
  if (absolute >= 100000) return `₹${(value / 100000).toFixed(1)} L`;
  return formatCurrency(value);
}

function movementBucketLabel(days: number) {
  if (days <= 30) return "Fast";
  if (days <= 90) return "Moderate";
  if (days <= 150) return "Slow";
  return "Dead Stock";
}

function pearson(x: number[], y: number[]) {
  const length = Math.min(x.length, y.length);
  if (!length) return 0;
  const xMean = average(x.slice(0, length));
  const yMean = average(y.slice(0, length));
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
  return denominator ? Number((numerator / denominator).toFixed(2)) : 0;
}

function buildAgeingBucketData(rows: SalesInventoryRow[]): AgeingBucketDatum[] {
  const order = [
    { bucket: "Fast", fullName: "Fast Moving" },
    { bucket: "Moderate", fullName: "Moderate Moving" },
    { bucket: "Slow", fullName: "Slow Moving" },
    { bucket: "Dead Stock", fullName: "Dead Stock" }
  ];
  const map = new Map(order.map((item) => [item.bucket, { ...item, inventory: 0, quantity: 0, revenue: 0 }]));

  rows.forEach((row) => {
    const bucket = movementBucketLabel(row.ageingDays);
    const current = map.get(bucket);
    if (!current) return;
    current.inventory += row.stock;
    current.quantity += row.quantity;
    current.revenue += row.amount;
  });

  return order.map((item) => map.get(item.bucket) ?? { ...item, inventory: 0, quantity: 0, revenue: 0 });
}

function buildMovementContributionData(bucketData: AgeingBucketDatum[]) {
  return [
    bucketData.reduce<Record<string, string | number>>((row, item) => {
      row[item.bucket] = item.revenue;
      return row;
    }, { name: "Revenue" }),
    bucketData.reduce<Record<string, string | number>>((row, item) => {
      row[item.bucket] = item.inventory;
      return row;
    }, { name: "Inventory" })
  ];
}

function buildMonthlySalesQuantityTrend(rows: SalesInventoryRow[]) {
  const map = new Map<string, { name: string; order: number; quantity: number; revenue: number }>();
  rows.forEach((row) => {
    const order = Number(row.year) * 100 + row.monthNumber;
    const name = `${String(row.month || "").slice(0, 3)} ${row.year}`.trim();
    const current = map.get(name) ?? { name, order, quantity: 0, revenue: 0 };
    current.quantity += row.quantity;
    current.revenue += row.amount;
    map.set(name, current);
  });

  return Array.from(map.values()).sort((a, b) => a.order - b.order);
}

function buildCorrelationMatrix(rows: SalesInventoryRow[]) {
  const metrics = [
    { key: "amount", label: "Revenue", values: rows.map((row) => row.amount) },
    { key: "quantity", label: "Quantity Sold", values: rows.map((row) => row.quantity) },
    { key: "stock", label: "Inventory", values: rows.map((row) => row.stock) },
    { key: "ageingDays", label: "Ageing Days", values: rows.map((row) => row.ageingDays) },
    { key: "transferQty", label: "Transfer Qty", values: rows.map(() => 0) },
    { key: "transferOutQty", label: "Transfer Out Qty", values: rows.map(() => 0) },
    { key: "salesQuantity", label: "Sales Qty", values: rows.map((row) => row.quantity) }
  ];

  return metrics.flatMap((rowMetric) =>
    metrics.map((columnMetric) => ({
      column: columnMetric.label,
      name: `${rowMetric.label} vs ${columnMetric.label}`,
      row: rowMetric.label,
      value: pearson(rowMetric.values, columnMetric.values)
    }))
  );
}

function buildMatrix(rows: SalesInventoryRow[]) {
  const map = new Map<string, { department: string; name: string; revenue: number; store: string; stock: number }>();
  rows.forEach((row) => {
    const store = row.storeName || "Unknown";
    const department = row.department || "Unknown";
    const key = `${store}|${department}`;
    const existing = map.get(key) ?? { department, name: `${store} / ${department}`, revenue: 0, stock: 0, store };
    existing.revenue += row.amount;
    existing.stock += row.stock;
    map.set(key, existing);
  });
  return Array.from(map.values()).sort((a, b) => b.revenue - a.revenue).slice(0, 30);
}

function contributionData(rows: SalesInventoryRow[], key: keyof SalesInventoryRow, limit = 10) {
  const total = sum(rows, "amount");
  return groupSum(rows, key, "amount")
    .slice(0, limit)
    .map((item, index) => ({
      ...item,
      contribution: percentage(item.value, total),
      label: compactCurrency(item.value),
      rank: index + 1
    }));
}

type BusinessTooltipPayload = {
  payload?: Record<string, unknown>;
};

function BusinessTooltip({
  active,
  payload,
  label
}: {
  active?: boolean;
  label?: string | number;
  payload?: BusinessTooltipPayload[];
}) {
  if (!active || !payload?.length) return null;
  const item = payload[0]?.payload ?? {};
  return (
    <div className="rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm shadow-xl dark:border-slate-700 dark:bg-slate-950">
      <p className="font-semibold text-slate-950 dark:text-white">{String(item.name ?? label ?? "")}</p>
      {"bucket" in item ? <p className="text-slate-600 dark:text-slate-300">Ageing Bucket: {String(item.fullName ?? "")}</p> : null}
      {"revenue" in item ? <p className="text-slate-600 dark:text-slate-300">Revenue: {compactCurrency(Number(item.revenue ?? 0))}</p> : null}
      {"value" in item ? <p className="text-slate-600 dark:text-slate-300">Revenue: {compactCurrency(Number(item.value ?? 0))}</p> : null}
      {"inventory" in item ? <p className="text-slate-600 dark:text-slate-300">Inventory: {formatNumber(Number(item.inventory ?? 0))}</p> : null}
      {"quantity" in item ? <p className="text-slate-600 dark:text-slate-300">Quantity: {formatNumber(Number(item.quantity ?? 0))}</p> : null}
      {"stock" in item ? <p className="text-slate-600 dark:text-slate-300">Inventory: {formatNumber(Number(item.stock ?? 0))}</p> : null}
      {"contribution" in item ? <p className="text-slate-600 dark:text-slate-300">Contribution: {formatPercent(Number(item.contribution ?? 0))}</p> : null}
      {"department" in item ? <p className="text-slate-600 dark:text-slate-300">Department: {String(item.department ?? "")}</p> : null}
    </div>
  );
}

function SalesAgeingTrendCard({ data }: { data: AgeingBucketDatum[] }) {
  return (
    <ChartCard
      title="Sales vs Ageing Trend"
      description="Revenue and quantity sold by ageing bucket, showing how sales performance changes as inventory ages."
      exportData={data}
    >
      <div className="h-80">
        <ResponsiveContainer height="100%" width="100%">
          <ComposedChart data={data} margin={{ bottom: 12, left: 6, right: 18, top: 18 }}>
            <CartesianGrid stroke="#E5E7EB" strokeDasharray="3 3" vertical={false} />
            <XAxis dataKey="bucket" tick={axisStyle} tickLine={false} />
            <YAxis tick={axisStyle} tickFormatter={(value) => compactCurrency(Number(value))} tickLine={false} yAxisId="revenue" />
            <YAxis orientation="right" tick={axisStyle} tickFormatter={(value) => formatNumber(Number(value))} tickLine={false} yAxisId="quantity" />
            <Tooltip content={<BusinessTooltip />} />
            <Legend wrapperStyle={{ color: "#000000", fontWeight: 500 }} />
            <Line
              activeDot={{ r: 7 }}
              dataKey="revenue"
              dot={{ r: 5 }}
              name="Revenue"
              stroke={COLORS.red}
              strokeWidth={3}
              type="monotone"
              yAxisId="revenue"
            />
            <Line
              activeDot={{ r: 7 }}
              dataKey="quantity"
              dot={{ r: 5 }}
              name="Quantity Sold"
              stroke={COLORS.blue}
              strokeWidth={3}
              type="monotone"
              yAxisId="quantity"
            />
          </ComposedChart>
        </ResponsiveContainer>
      </div>
    </ChartCard>
  );
}

function MovementContributionCard({ data }: { data: AgeingBucketDatum[] }) {
  const highestRevenueBucket = [...data].sort((a, b) => b.revenue - a.revenue)[0]?.bucket;
  const chartData = buildMovementContributionData(data);
  const lastVisibleBucketIndex = data.reduce(
    (lastIndex, item, index) => (item.revenue > 0 || item.inventory > 0 ? index : lastIndex),
    -1
  );
  const bucketColors: Record<string, string> = {
    "Dead Stock": highestRevenueBucket === "Dead Stock" ? COLORS.red : COLORS.darkRed,
    Fast: highestRevenueBucket === "Fast" ? COLORS.red : COLORS.green,
    Moderate: highestRevenueBucket === "Moderate" ? COLORS.red : COLORS.blue,
    Slow: highestRevenueBucket === "Slow" ? COLORS.red : COLORS.orange
  };

  return (
    <ChartCard
      title="Revenue Contribution by Inventory Category"
      description="Stacked comparison of revenue and inventory across movement categories, with the highest revenue contributor highlighted."
      exportData={data}
    >
      <div className="h-80">
        <ResponsiveContainer height="100%" width="100%">
          <BarChart data={chartData} layout="vertical" margin={{ bottom: 12, left: 22, right: 26, top: 18 }}>
            <CartesianGrid horizontal={false} stroke="#E5E7EB" strokeDasharray="3 3" />
            <XAxis tick={axisStyle} tickFormatter={(value) => (Number(value) > 100000 ? compactCurrency(Number(value)) : formatNumber(Number(value)))} tickLine={false} type="number" />
            <YAxis dataKey="name" tick={axisStyle} tickLine={false} type="category" width={86} />
            <Tooltip />
            <Legend wrapperStyle={{ color: "#000000", fontWeight: 500 }} />
            {data.map((item, index) => (
              <Bar
                dataKey={item.bucket}
                fill={bucketColors[item.bucket]}
                key={item.bucket}
                radius={index === lastVisibleBucketIndex ? [0, 10, 10, 0] : [0, 0, 0, 0]}
                stackId="movement"
                stroke={bucketColors[item.bucket] === COLORS.cream ? COLORS.darkRed : undefined}
                strokeWidth={bucketColors[item.bucket] === COLORS.cream ? 1 : 0}
              />
            ))}
          </BarChart>
        </ResponsiveContainer>
      </div>
    </ChartCard>
  );
}

function MonthlySalesQuantityTrendCard({ data }: { data: Array<{ name: string; order: number; quantity: number; revenue: number }> }) {
  return (
    <ChartCard
      title="Monthly Sales vs Quantity Trend"
      description="Monthly revenue and quantity sold trend for understanding sales performance movement over time."
      exportData={data}
    >
      <div className="h-80">
        <ResponsiveContainer height="100%" width="100%">
          <ComposedChart data={data} margin={{ bottom: 12, left: 6, right: 18, top: 18 }}>
            <CartesianGrid stroke="#E5E7EB" strokeDasharray="3 3" vertical={false} />
            <XAxis dataKey="name" tick={axisStyle} tickLine={false} />
            <YAxis tick={axisStyle} tickFormatter={(value) => compactCurrency(Number(value))} tickLine={false} yAxisId="revenue" />
            <YAxis orientation="right" tick={axisStyle} tickFormatter={(value) => formatNumber(Number(value))} tickLine={false} yAxisId="quantity" />
            <Tooltip content={<BusinessTooltip />} />
            <Legend wrapperStyle={{ color: "#000000", fontWeight: 500 }} />
            <Line activeDot={{ r: 7 }} dataKey="revenue" dot={false} name="Revenue" stroke={COLORS.green} strokeWidth={3} type="monotone" yAxisId="revenue" />
            <Line activeDot={{ r: 7 }} dataKey="quantity" dot={false} name="Quantity Sold" stroke={COLORS.orange} strokeWidth={3} type="monotone" yAxisId="quantity" />
          </ComposedChart>
        </ResponsiveContainer>
      </div>
    </ChartCard>
  );
}

function CorrelationHeatmapCard({ data }: { data: Array<{ column: string; name: string; row: string; value: number }> }) {
  const rows = Array.from(new Set(data.map((item) => item.row)));
  const columns = Array.from(new Set(data.map((item) => item.column)));
  const lookup = new Map(data.map((item) => [`${item.row}|${item.column}`, item.value]));

  function color(value: number) {
    if (value > 0.65) return "bg-red-600 text-white";
    if (value > 0.25) return "bg-red-100 text-red-800";
    if (value < -0.65) return "bg-blue-700 text-white";
    if (value < -0.25) return "bg-blue-100 text-blue-800";
    return "bg-slate-100 text-black dark:bg-slate-800 dark:text-white";
  }

  return (
    <ChartCard title="KPI Relationship Matrix" description="Correlation strength across revenue, quantity sold, inventory, ageing, transfer, and sales quantity metrics." exportData={data}>
      <div className="overflow-x-auto pb-1">
        <div className="min-w-[860px]">
          <div className="grid" style={{ gridTemplateColumns: `170px repeat(${columns.length}, minmax(92px, 1fr))` }}>
            <div />
            {columns.map((column) => (
              <div className="px-2 pb-3 text-center text-xs font-bold text-black dark:text-white" key={column}>
                {column}
              </div>
            ))}
            {rows.map((row) => (
              <div className="contents" key={row}>
                <div className="flex items-center pr-4 text-sm font-bold text-black dark:text-white">{row}</div>
                {columns.map((column) => {
                  const value = lookup.get(`${row}|${column}`) ?? 0;
                  return (
                    <div className={`m-1.5 rounded-2xl px-3 py-4 text-center text-sm font-bold transition hover:-translate-y-0.5 hover:shadow-lg ${color(value)}`} key={`${row}-${column}`} title={`${row} vs ${column}: ${value.toFixed(2)}`}>
                      {value.toFixed(2)}
                    </div>
                  );
                })}
              </div>
            ))}
          </div>
        </div>
      </div>
    </ChartCard>
  );
}

function MatrixBubbleCard({ data }: { data: ReturnType<typeof buildMatrix> }) {
  const chartData = data.map((item) => ({
    ...item,
    x: item.department,
    y: item.store,
    z: item.revenue
  }));

  return (
    <ChartCard title="Inventory vs Revenue Matrix" description="Store and department combinations with bubble size based on revenue." exportData={chartData}>
      <div className="h-80">
        <ResponsiveContainer height="100%" width="100%">
          <ScatterChart margin={{ bottom: 12, left: 28, right: 18, top: 12 }}>
            <CartesianGrid stroke="#E5E7EB" strokeDasharray="3 3" />
            <XAxis allowDuplicatedCategory={false} dataKey="x" tick={axisStyle} type="category" />
            <YAxis allowDuplicatedCategory={false} dataKey="y" tick={axisStyle} type="category" width={118} />
            <ZAxis dataKey="z" range={[120, 1200]} />
            <Tooltip content={<BusinessTooltip />} />
            <Scatter data={chartData} fill={COLORS.red} fillOpacity={0.75} />
          </ScatterChart>
        </ResponsiveContainer>
      </div>
    </ChartCard>
  );
}

function ComparisonBarCard({ data, title }: { data: NamedValue[]; title: string }) {
  return (
    <ChartCard title={title} description="Sorted by revenue with top contributor highlighted." exportData={data}>
      <div className="h-80">
        <ResponsiveContainer height="100%" width="100%">
          <BarChart data={data} layout="vertical" margin={{ bottom: 8, left: 48, right: 42, top: 8 }}>
            <CartesianGrid horizontal={false} stroke="#E5E7EB" strokeDasharray="3 3" />
            <XAxis tick={axisStyle} tickFormatter={(value) => compactCurrency(Number(value))} tickLine={false} type="number" />
            <YAxis dataKey="name" tick={axisStyle} tickLine={false} type="category" width={132} />
            <Tooltip content={<BusinessTooltip />} />
            <Bar dataKey="value" radius={[0, 10, 10, 0]}>
              {data.map((entry, index) => (
                <Cell fill={index === 0 ? COLORS.red : COLORS.blue} key={entry.name} />
              ))}
              <LabelList dataKey="label" position="right" style={{ fill: "#000000", fontSize: 12, fontWeight: 700 }} />
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </div>
    </ChartCard>
  );
}

export default function RelationshipAnalyticsPage() {
  const { error, filteredRows, isLoading } = useAnalytics();

  const charts = useMemo(() => {
    const ageingBuckets = buildAgeingBucketData(filteredRows);

    return {
      ageingBuckets,
      correlation: buildCorrelationMatrix(filteredRows),
      department: contributionData(filteredRows, "department", 10),
      inventoryMatrix: buildMatrix(filteredRows),
      monthlySalesQuantity: buildMonthlySalesQuantityTrend(filteredRows),
      store: contributionData(filteredRows, "storeName", 10)
    };
  }, [filteredRows]);

  return (
    <div className="space-y-8">
      <PageHeader
        eyebrow="Relationship Analytics"
        title="Relationship Analytics"
        description="Analyze the relationships between sales, inventory, ageing, stock movement, departments, stores, and revenue to uncover business patterns and support strategic decision-making."
      />
      <FilterPanel />
      {error ? (
        <div className="rounded-3xl border border-red-200 bg-red-50 p-5 text-sm font-medium text-red-700">
          {error}
        </div>
      ) : null}
      {isLoading ? <LoadingSkeleton /> : null}

      <section className="space-y-6">
        <PageHeader
          eyebrow="Relationship Analysis"
          title="Inventory, Ageing and Revenue Relationships"
          description="Analytical views explaining how stock availability, sales quantity, revenue, and ageing interact across the business."
        />
        <div className="grid gap-6 xl:grid-cols-2">
          <SalesAgeingTrendCard data={charts.ageingBuckets} />
          <MovementContributionCard data={charts.ageingBuckets} />
          <MonthlySalesQuantityTrendCard data={charts.monthlySalesQuantity} />
          <CorrelationHeatmapCard data={charts.correlation} />
          <MatrixBubbleCard data={charts.inventoryMatrix} />
          <ComparisonBarCard data={charts.store} title="Store Revenue Comparison" />
          <ComparisonBarCard data={charts.department} title="Department Revenue Comparison" />
        </div>
      </section>
    </div>
  );
}

