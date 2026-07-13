"use client";

import { motion } from "framer-motion";
import {
  ArrowDownRight,
  ArrowUpRight,
  Download,
  Filter,
  ImageDown,
  Minus,
  RotateCcw,
  TrendingDown
} from "lucide-react";
import { memo, useMemo, useRef, type ReactNode } from "react";
import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  LabelList,
  Legend,
  Pie,
  PieChart,
  ResponsiveContainer,
  Scatter,
  ScatterChart,
  Tooltip,
  XAxis,
  YAxis,
  ZAxis
} from "recharts";

import { LoadingSkeleton } from "@/components/ui/loading-skeleton";
import { useAnalytics } from "@/context/analytics-context";
import { ChartService } from "@/services/ChartService";
import { KPIService } from "@/services/KPIService";
import type { ChartDatum, FilterKey, KpiRecord, SalesInventoryRow } from "@/types/analytics";

type InventoryDatum = Record<string, string | number | boolean>;

const filterFields: Array<[FilterKey, string]> = [
  ["year", "Year"],
  ["month", "Month"],
  ["storeName", "Store Name"],
  ["productName", "Product Name"],
  ["department", "Department"],
  ["season", "Season"],
  ["size", "Size"]
];

const axisStyle = {
  fill: "#000000",
  fontSize: 12,
  fontWeight: 500
};

const palette = {
  blue: "#2563EB",
  darkOrange: "#EA580C",
  green: "#16A34A",
  grey: "#94A3B8",
  orange: "#F59E0B",
  red: "#C41230",
  yellow: "#EAB308"
};

const ageingOrder = ["fast", "moderate", "slow", "dead"];
const ageingDisplay: Record<string, string> = {
  dead: "Dead Stock (150+ Days)",
  fast: "Fast Moving (0-30 Days)",
  moderate: "Moderate Moving (31-90 Days)",
  slow: "Slow Moving (91-150 Days)"
};
const ageingColors: Record<string, string> = {
  dead: palette.red,
  fast: palette.green,
  moderate: palette.blue,
  slow: palette.orange
};
const sizeOrder = ["S", "M", "L", "XL", "2XL", "30", "32", "34", "36", "38"];

function formatNumber(value: number) {
  return new Intl.NumberFormat("en-IN", { maximumFractionDigits: 0 }).format(value);
}

function formatPercent(value: number) {
  return `${Number(value ?? 0).toFixed(1)}%`;
}

function csvEscape(value: string | number | boolean) {
  return `"${String(value ?? "").replace(/"/g, '""')}"`;
}

function truncateLabel(value: string, maxLength = 24) {
  return value.length > maxLength ? `${value.slice(0, maxLength - 1)}...` : value;
}

function totalValue(data: InventoryDatum[], key = "value") {
  return data.reduce((total, row) => total + Number(row[key] ?? 0), 0);
}

function enrichPercentages(data: ChartDatum[]) {
  const total = totalValue(data as InventoryDatum[]);
  const enriched = data.map((item) => ({
    ...item,
    displayPercentage: 0,
    percentage: total ? (Number(item.value ?? 0) / total) * 100 : 0
  })) as InventoryDatum[];

  const nonZero = enriched.filter((item) => Number(item.value ?? 0) > 0);
  if (!nonZero.length) return enriched;

  nonZero.forEach((item) => {
    item.displayPercentage = Number(Number(item.percentage ?? 0).toFixed(1));
  });
  const displayedTotal = nonZero.reduce((total, item) => total + Number(item.displayPercentage ?? 0), 0);
  const adjustment = Number((100 - displayedTotal).toFixed(1));
  const largest = nonZero.reduce((best, item) => (Number(item.value ?? 0) > Number(best.value ?? 0) ? item : best), nonZero[0]);
  largest.displayPercentage = Number(Math.max(0, Number(largest.displayPercentage ?? 0) + adjustment).toFixed(1));

  return enriched;
}

function ageingCategory(days: number) {
  if (days <= 30) return "fast";
  if (days <= 90) return "moderate";
  if (days <= 150) return "slow";
  return "dead";
}

function buildAgeingData(rows: SalesInventoryRow[]) {
  const productAgeing = new Map<string, number>();
  rows.forEach((row) => {
    const productName = String(row.productName ?? "").trim();
    if (!productName) return;
    productAgeing.set(productName, Math.max(productAgeing.get(productName) ?? 0, Number(row.ageingDays ?? 0)));
  });

  const map = new Map<string, number>();
  productAgeing.forEach((ageingDays) => {
    const bucket = ageingCategory(ageingDays);
    map.set(bucket, (map.get(bucket) ?? 0) + 1);
  });

  return ageingOrder.map((bucket) => ({
    color: ageingColors[bucket],
    metricLabel: "Products",
    name: ageingDisplay[bucket],
    percentage: 0,
    rawName: bucket,
    value: map.get(bucket) ?? 0
  }));
}

function buildInventoryStatusData(rows: SalesInventoryRow[]) {
  const productStock = new Map<string, number>();
  rows.forEach((row) => {
    const productName = String(row.productName ?? "").trim();
    if (!productName) return;
    productStock.set(productName, (productStock.get(productName) ?? 0) + Number(row.stock ?? 0));
  });

  const statusTotals = {
    available: 0,
    low: 0,
    out: 0
  };

  productStock.forEach((stock) => {
    if (stock <= 0) {
      statusTotals.out += 1;
    } else if (stock < 5) {
      statusTotals.low += 1;
    } else {
      statusTotals.available += 1;
    }
  });

  return [
    { color: palette.green, metricLabel: "Products", name: "Available", percentage: 0, rawName: "available", value: statusTotals.available },
    { color: palette.orange, metricLabel: "Products", name: "Low Stock", percentage: 0, rawName: "low", value: statusTotals.low },
    { color: palette.red, metricLabel: "Products", name: "Out Of Stock", percentage: 0, rawName: "out", value: statusTotals.out }
  ];
}

function sortSizes(data: InventoryDatum[]) {
  return [...data].sort((a, b) => {
    const aIndex = sizeOrder.indexOf(String(a.name));
    const bIndex = sizeOrder.indexOf(String(b.name));
    if (aIndex !== -1 || bIndex !== -1) {
      return (aIndex === -1 ? sizeOrder.length : aIndex) - (bIndex === -1 ? sizeOrder.length : bIndex);
    }
    return String(a.name).localeCompare(String(b.name), undefined, { numeric: true });
  });
}

function averageAgeingFor(rows: SalesInventoryRow[], department: string, store: string) {
  const matches = rows.filter((row) => row.department === department && row.storeName === store);
  if (!matches.length) return 0;
  return matches.reduce((total, row) => total + row.ageingDays, 0) / matches.length;
}

function applyInventoryFilters(rows: SalesInventoryRow[], filters: Record<FilterKey, string>) {
  return rows.filter((row) =>
    filterFields.every(([key]) => filters[key] === "All" || String(row[key]) === filters[key])
  );
}

const InventoryPageHeader = memo(function InventoryPageHeader() {
  return (
    <motion.div
      animate={{ opacity: 1, y: 0 }}
      className="space-y-2"
      initial={{ opacity: 0, y: 14 }}
      transition={{ duration: 0.38, ease: "easeOut" }}
    >
      <p className="text-xs font-semibold uppercase tracking-[0.18em] text-brand-red">
        Inventory Optimization
      </p>
      <div className="max-w-4xl space-y-2">
        <h1 className="text-4xl font-bold tracking-normal text-slate-950 dark:text-white lg:text-[44px]">
          Inventory Analytics
        </h1>
        <p className="max-w-3xl text-sm leading-6 text-slate-600 dark:text-slate-300">
          Operational view for availability, ageing, store inventory, stock movement, slow movers, fast movers, and dead-stock risk.
        </p>
      </div>
    </motion.div>
  );
});

function InventoryFilterPanel() {
  const { data, filters, resetFilters, setFilter } = useAnalytics();
  const options = useMemo(
    () => {
      const baseRows = data?.salesInventory ?? [];
      return (
      filterFields.reduce<Record<string, string[]>>((acc, [key]) => {
        acc[key] = Array.from(new Set(baseRows.map((row) => String(row[key] ?? "").trim()).filter(Boolean))).sort(
          (a, b) => a.localeCompare(b, undefined, { numeric: true })
        );
        return acc;
      }, {})
      );
    },
    [data?.salesInventory]
  );
  const activeFilters = filterFields
    .filter(([key]) => filters[key] !== "All")
    .map(([key, label]) => ({ key, label, value: filters[key] }));

  return (
    <section className="relative block w-full rounded-3xl border border-slate-200/90 bg-white p-3 shadow-panel transition-shadow duration-300 dark:border-slate-800 dark:bg-slate-900/80">
      <div className="mb-2 flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-2 text-sm font-semibold text-slate-800 dark:text-slate-100">
          <Filter className="h-4 w-4 text-brand-red" />
          Filters
          <span className="rounded-full bg-red-50 px-2.5 py-1 text-xs font-semibold text-brand-red dark:bg-red-500/10">
            {activeFilters.length} Selected
          </span>
        </div>
      </div>
      {activeFilters.length ? (
        <div className="mb-2 flex flex-wrap gap-2">
          {activeFilters.map((filter) => (
            <button
              className="rounded-full border border-red-100 bg-red-50 px-3 py-1 text-xs font-semibold text-brand-red transition duration-200 hover:-translate-y-0.5 hover:bg-red-100 focus:outline-none focus:ring-2 focus:ring-brand-red/30 dark:border-red-500/20 dark:bg-red-500/10"
              key={filter.key}
              onClick={() => setFilter(filter.key, "All")}
              type="button"
            >
              {filter.label}: {filter.value} x
            </button>
          ))}
        </div>
      ) : null}
      <div className="grid gap-2 md:grid-cols-4 xl:grid-cols-8">
        {filterFields.map(([key, label]) => (
          <label className="space-y-0.5" key={key}>
            <span className="text-xs font-medium text-slate-500 dark:text-slate-400">
              {label}
            </span>
            <select
              className="h-9 w-full rounded-2xl border border-slate-200 bg-slate-50 px-3 text-sm text-slate-700 outline-none transition duration-200 hover:border-slate-300 focus:border-brand-blue focus:bg-white focus:ring-4 focus:ring-blue-100 dark:border-slate-700 dark:bg-slate-950 dark:text-slate-200"
              onChange={(event) => setFilter(key, event.target.value)}
              value={filters[key]}
            >
              <option value="All">All</option>
              {(options[key] ?? []).map((option) => (
                <option key={option}>{option}</option>
              ))}
            </select>
          </label>
        ))}
        <div className="flex items-end">
          <button
            className="inline-flex h-9 w-full items-center justify-center gap-2 rounded-2xl border border-slate-200 bg-slate-50 px-4 text-xs font-semibold text-slate-600 transition duration-200 hover:-translate-y-0.5 hover:border-red-200 hover:bg-red-50 hover:text-brand-red focus:outline-none focus:ring-2 focus:ring-brand-red/30 dark:border-slate-700 dark:bg-slate-950 dark:text-slate-300"
            onClick={resetFilters}
            type="button"
          >
            <RotateCcw className="h-3.5 w-3.5" />
            Reset
          </button>
        </div>
      </div>
    </section>
  );
}

function InventoryKpiCard({ kpi }: { kpi: KpiRecord }) {
  const Icon = kpi.icon;
  const trend = {
    danger: { className: "bg-red-50 text-red-600 dark:bg-red-500/10 dark:text-red-300", icon: ArrowDownRight },
    neutral: { className: "bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-300", icon: Minus },
    success: { className: "bg-emerald-50 text-emerald-600 dark:bg-emerald-500/10 dark:text-emerald-300", icon: ArrowUpRight },
    warning: { className: "bg-amber-50 text-amber-600 dark:bg-amber-500/10 dark:text-amber-300", icon: TrendingDown }
  }[kpi.tone ?? "neutral"];
  const TrendIcon = trend.icon;

  return (
    <article className="h-full min-h-[138px] rounded-3xl border border-slate-200/90 bg-white p-3.5 shadow-panel transition duration-300 hover:-translate-y-0.5 hover:border-red-100 hover:shadow-xl dark:border-slate-800 dark:bg-slate-900/80">
      <div className="flex h-full items-start justify-between gap-4">
        <div className="min-w-0">
          <p className="truncate text-sm font-medium text-slate-500 dark:text-slate-400">
            {kpi.label}
          </p>
          <p className="mt-1 truncate text-[27px] font-black leading-tight tracking-normal text-slate-950 dark:text-white">
            {kpi.value}
          </p>
          <p className="mt-1 text-xs font-semibold text-slate-500/80 dark:text-slate-400/80">
            {kpi.change}
          </p>
        </div>
        <div className="flex shrink-0 flex-col items-end gap-2">
          <div className="grid h-10 w-10 place-items-center rounded-2xl bg-red-50 text-brand-red dark:bg-red-500/10">
            <Icon className="h-5 w-5" />
          </div>
          <div className={`grid h-6 w-6 place-items-center rounded-xl ${trend.className}`}>
            <TrendIcon className="h-3.5 w-3.5" />
          </div>
        </div>
      </div>
    </article>
  );
}

function InventoryChartCard({
  children,
  data,
  title
}: {
  children: ReactNode;
  data: InventoryDatum[];
  title: string;
}) {
  const chartRef = useRef<HTMLDivElement | null>(null);

  function downloadCsv() {
    if (!data.length) return;
    const columns = Object.keys(data[0]);
    const csv = [columns.join(","), ...data.map((row) => columns.map((column) => csvEscape(row[column])).join(","))].join("\n");
    const blob = new Blob([csv], { type: "text/csv;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `${title.toLowerCase().replace(/[^a-z0-9]+/g, "-")}.csv`;
    link.click();
    URL.revokeObjectURL(url);
  }

  function downloadPng() {
    const svg = chartRef.current?.querySelector("svg");
    if (!svg) return;
    const serialized = new XMLSerializer().serializeToString(svg);
    const image = new Image();
    const svgBlob = new Blob([serialized], { type: "image/svg+xml;charset=utf-8" });
    const url = URL.createObjectURL(svgBlob);
    image.onload = () => {
      const canvas = document.createElement("canvas");
      canvas.width = Math.max(svg.clientWidth, 900);
      canvas.height = Math.max(svg.clientHeight, 360);
      const context = canvas.getContext("2d");
      if (!context) return;
      context.fillStyle = "#FFFFFF";
      context.fillRect(0, 0, canvas.width, canvas.height);
      context.drawImage(image, 0, 0, canvas.width, canvas.height);
      URL.revokeObjectURL(url);
      const png = canvas.toDataURL("image/png");
      const link = document.createElement("a");
      link.href = png;
      link.download = `${title.toLowerCase().replace(/[^a-z0-9]+/g, "-")}.png`;
      link.click();
    };
    image.src = url;
  }

  return (
    <section className="rounded-3xl border border-slate-200/90 bg-white p-[18px] shadow-panel transition duration-300 hover:-translate-y-0.5 hover:border-red-100 hover:shadow-xl dark:border-slate-800 dark:bg-slate-900/80">
      <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
        <h3 className="text-lg font-semibold text-slate-950 dark:text-white">{title}</h3>
        <div className="flex gap-2">
          <button className="grid h-8 w-8 place-items-center rounded-xl border border-slate-200 bg-slate-50 text-slate-500 shadow-sm transition duration-200 hover:-translate-y-0.5 hover:border-red-200 hover:bg-red-50 hover:text-brand-red focus:outline-none focus:ring-2 focus:ring-brand-red/30" onClick={downloadCsv} title="Download CSV" type="button">
            <Download className="h-3.5 w-3.5" />
          </button>
          <button className="grid h-8 w-8 place-items-center rounded-xl border border-slate-200 bg-slate-50 text-slate-500 shadow-sm transition duration-200 hover:-translate-y-0.5 hover:border-red-200 hover:bg-red-50 hover:text-brand-red focus:outline-none focus:ring-2 focus:ring-brand-red/30" onClick={downloadPng} title="Download PNG" type="button">
            <ImageDown className="h-3.5 w-3.5" />
          </button>
        </div>
      </div>
      <div className="h-80" ref={chartRef}>
        {children}
      </div>
    </section>
  );
}

function InventoryTooltip({
  active,
  label,
  payload
}: {
  active?: boolean;
  label?: string;
  payload?: Array<{ payload: InventoryDatum; value: number }>;
}) {
  if (!active || !payload?.length) return null;
  const row = payload[0].payload;
  const value = Number(row.value ?? payload[0].value ?? 0);
  const metricLabel = String(row.metricLabel ?? "Inventory Count");
  const contribution = Number(row.displayPercentage ?? row.percentage ?? 0);

  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-4 text-sm leading-6 shadow-panel">
      <p className="max-w-72 font-semibold text-slate-950">{label ?? row.name}</p>
      <p className="mt-2 text-slate-600">
        {metricLabel}: {formatNumber(value)}
      </p>
      {"percentage" in row ? <p className="text-slate-600">Contribution: {formatPercent(contribution)}</p> : null}
    </div>
  );
}

function HeatmapTooltip({
  active,
  payload
}: {
  active?: boolean;
  payload?: Array<{ payload: InventoryDatum }>;
}) {
  if (!active || !payload?.length) return null;
  const row = payload[0].payload;

  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-4 text-sm leading-6 shadow-panel">
      <p className="font-semibold text-slate-950">{row.y}</p>
      <p className="mt-2 text-slate-600">Department: {row.x}</p>
      <p className="text-slate-600">Inventory Count: {formatNumber(Number(row.z ?? 0))}</p>
      <p className="text-slate-600">Average Ageing: {Number(row.averageAgeing ?? 0).toFixed(1)} Days</p>
    </div>
  );
}

function DonutChart({
  colors,
  data,
  title,
  totalLabel
}: {
  colors: string[];
  data: InventoryDatum[];
  title: string;
  totalLabel: string;
}) {
  const visibleData = data.filter((item) => Number(item.value ?? 0) > 0);
  const total = totalValue(visibleData);

  return (
    <InventoryChartCard data={visibleData} title={title}>
      <ResponsiveContainer height="100%" width="100%">
        <PieChart>
          <Pie
            animationDuration={900}
            data={visibleData}
            dataKey="value"
            innerRadius={76}
            label={({ payload }) => formatPercent(Number(payload.displayPercentage ?? payload.percentage ?? 0))}
            outerRadius={116}
            paddingAngle={3}
          >
            {visibleData.map((item, index) => (
              <Cell fill={String(item.color ?? colors[index % colors.length])} key={`${item.name}-${index}`} />
            ))}
          </Pie>
          <text className="fill-slate-950 text-2xl font-black dark:fill-white" textAnchor="middle" x="50%" y="47%">
            {formatNumber(total)}
          </text>
          <text className="fill-black text-sm font-semibold dark:fill-white" textAnchor="middle" x="50%" y="56%">
            {totalLabel}
          </text>
          <Tooltip content={<InventoryTooltip />} />
          <Legend iconSize={10} wrapperStyle={{ color: "#000000", fontSize: 12, fontWeight: 500, paddingTop: 12 }} />
        </PieChart>
      </ResponsiveContainer>
    </InventoryChartCard>
  );
}

function VerticalInventoryChart({
  barCategoryGap = "18%",
  barSize,
  bucketColors,
  colorBy,
  data,
  title
}: {
  barCategoryGap?: string;
  barSize?: number;
  bucketColors?: Record<string, string>;
  colorBy?: (item: InventoryDatum, index: number) => string;
  data: InventoryDatum[];
  title: string;
}) {
  const visibleData = data.filter((item) => Number(item.value ?? 0) > 0);

  return (
    <InventoryChartCard data={visibleData} title={title}>
      <ResponsiveContainer height="100%" width="100%">
        <BarChart barCategoryGap={barCategoryGap} data={visibleData} margin={{ bottom: 8, left: 8, right: 18, top: 24 }}>
          <CartesianGrid stroke="#E5E7EB" strokeDasharray="3 3" strokeOpacity={0.78} vertical={false} />
          <XAxis dataKey="name" tick={axisStyle} tickLine={false} />
          <YAxis tick={axisStyle} tickFormatter={(value) => formatNumber(Number(value))} tickLine={false} width={64} />
          <Tooltip content={<InventoryTooltip />} />
          <Bar animationDuration={700} barSize={barSize} dataKey="value" name="Inventory" radius={[14, 14, 0, 0]}>
            {visibleData.map((item, index) => (
              <Cell
                fill={bucketColors?.[String(item.rawName ?? item.name)] ?? colorBy?.(item, index) ?? palette.blue}
                key={`${item.name}-${index}`}
              />
            ))}
            <LabelList
              dataKey="value"
              formatter={(value) => formatNumber(Number(value ?? 0))}
              position="top"
              style={{ fill: "#000000", fontSize: 11, fontWeight: 600 }}
            />
          </Bar>
        </BarChart>
      </ResponsiveContainer>
    </InventoryChartCard>
  );
}

function HorizontalInventoryChart({
  data,
  highlightTop = false,
  title,
  topThreeRed = false
}: {
  data: InventoryDatum[];
  highlightTop?: boolean;
  title: string;
  topThreeRed?: boolean;
}) {
  const visibleData = data.filter((item) => Number(item.value ?? 0) > 0);

  return (
    <InventoryChartCard data={visibleData} title={title}>
      <ResponsiveContainer height="100%" width="100%">
        <BarChart barCategoryGap="14%" data={visibleData} layout="vertical" margin={{ bottom: 8, left: 108, right: 32, top: 14 }}>
          <CartesianGrid horizontal={false} stroke="#E5E7EB" strokeDasharray="3 3" strokeOpacity={0.78} />
          <XAxis dataKey="value" tick={axisStyle} tickFormatter={(value) => formatNumber(Number(value))} tickLine={false} type="number" />
          <YAxis
            dataKey="name"
            tick={{ ...axisStyle, width: 190 }}
            tickFormatter={(value) => truncateLabel(String(value))}
            tickLine={false}
            type="category"
            width={220}
          />
          <Tooltip content={<InventoryTooltip />} />
          <Bar animationDuration={700} dataKey="value" name="Inventory" radius={[0, 10, 10, 0]}>
            {visibleData.map((item, index) => (
              <Cell
                fill={topThreeRed && index < 3 ? "#9F1028" : highlightTop && index === 0 ? palette.red : palette.blue}
                key={`${item.name}-${index}`}
              />
            ))}
            <LabelList
              dataKey="value"
              formatter={(value) => formatNumber(Number(value ?? 0))}
              position="right"
              style={{ fill: "#000000", fontSize: 11, fontWeight: 600 }}
            />
          </Bar>
        </BarChart>
      </ResponsiveContainer>
    </InventoryChartCard>
  );
}

function InventoryHeatmapChart({ data }: { data: InventoryDatum[] }) {
  const maxValue = Math.max(...data.map((item) => Number(item.z ?? 0)), 1);

  return (
    <InventoryChartCard data={data} title="Inventory Bubble Matrix">
      <ResponsiveContainer height="100%" width="100%">
        <ScatterChart margin={{ bottom: 8, left: 28, right: 18, top: 12 }}>
          <CartesianGrid stroke="#E5E7EB" strokeDasharray="3 3" strokeOpacity={0.78} />
          <XAxis allowDuplicatedCategory={false} dataKey="x" name="Department" tick={axisStyle} tickLine={false} type="category" />
          <YAxis allowDuplicatedCategory={false} dataKey="y" name="Store" tick={axisStyle} tickFormatter={(value) => truncateLabel(String(value), 18)} tickLine={false} type="category" width={130} />
          <ZAxis dataKey="z" range={[520, 3200]} />
          <Tooltip content={<HeatmapTooltip />} cursor={{ stroke: "#CBD5E1", strokeDasharray: "3 3" }} />
          <Scatter data={data} fill={palette.red}>
            {data.map((item, index) => {
              const intensity = Math.sqrt(Number(item.z ?? 0) / maxValue);
              return (
                <Cell
                  fill={intensity > 0.65 ? palette.red : intensity > 0.32 ? palette.orange : palette.blue}
                  fillOpacity={Math.max(0.65, intensity)}
                  key={`${item.x}-${item.y}-${index}`}
                />
              );
            })}
          </Scatter>
        </ScatterChart>
      </ResponsiveContainer>
    </InventoryChartCard>
  );
}

export default function InventoryAnalyticsPage() {
  const { data, error, filters, isLoading } = useAnalytics();
  const filteredRows = useMemo(
    () => applyInventoryFilters(data?.salesInventory ?? [], filters),
    [data, filters]
  );
  const inventoryKpis = useMemo(() => KPIService.inventoryKpis(filteredRows), [filteredRows]);
  const charts = useMemo(() => {
    const availability = enrichPercentages(buildInventoryStatusData(filteredRows));
    const ageingBuckets = enrichPercentages(buildAgeingData(filteredRows));
    const heatmap = ChartService.heatmap(filteredRows, "department", "storeName", "stock").map((item) => ({
      ...item,
      averageAgeing: averageAgeingFor(filteredRows, String(item.x), String(item.y)),
      value: item.z
    }));

    return {
      ageing: ageingBuckets,
      availability,
      dead: ChartService.movementProducts(filteredRows, "Dead"),
      department: ChartService.stockBy(filteredRows, "department", 10),
      fast: ChartService.movementProducts(filteredRows, "Fast"),
      heatmap,
      product: ChartService.stockBy(filteredRows, "productName", 10),
      size: sortSizes(ChartService.stockBy(filteredRows, "size", 10)),
      slow: ChartService.movementProducts(filteredRows, "Slow"),
      store: ChartService.stockBy(filteredRows, "storeName", 10)
    };
  }, [filteredRows]);

  return (
    <div className="space-y-5">
      <InventoryPageHeader />
      <InventoryFilterPanel />
      {error ? (
        <div className="rounded-3xl border border-red-200 bg-red-50 p-5 text-sm font-medium text-red-700">
          {error}
        </div>
      ) : null}
      {isLoading ? <LoadingSkeleton /> : null}
      <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
        {inventoryKpis.map((kpi) => (
          <InventoryKpiCard key={kpi.label} kpi={kpi} />
        ))}
      </section>
      <section className="grid gap-5 xl:grid-cols-2">
        <DonutChart colors={[palette.green, palette.orange, palette.red]} data={charts.availability} title="Current Inventory" totalLabel="Total Products" />
        <VerticalInventoryChart
          colorBy={(item, index) =>
            String(item.name).toLowerCase().includes("gowin-warangal") || index === 0 ? palette.red : palette.blue
          }
          data={charts.store}
          title="Inventory by Store"
        />
        <HorizontalInventoryChart data={charts.product} highlightTop title="Top Products by Current Inventory" />
        <VerticalInventoryChart
          colorBy={(_, index) => (index === 0 ? palette.red : palette.blue)}
          data={charts.department}
          title="Inventory by Department"
        />
        <VerticalInventoryChart barCategoryGap="24%" barSize={54} bucketColors={ageingColors} data={charts.ageing} title="Ageing Bucket" />
        <DonutChart colors={ageingOrder.map((bucket) => ageingColors[bucket])} data={charts.ageing} title="Ageing Distribution" totalLabel="Total Products" />
        <InventoryHeatmapChart data={charts.heatmap} />
        <HorizontalInventoryChart data={charts.fast} highlightTop title="Top Fast Moving Products" />
        <HorizontalInventoryChart data={charts.slow} highlightTop title="Top Slow Moving Products" />
        <HorizontalInventoryChart data={charts.dead} title="Top Dead Stock Products" topThreeRed />
        <VerticalInventoryChart
          colorBy={(item) => (Number(item.value ?? 0) === Math.max(...charts.size.map((row) => Number(row.value ?? 0))) ? palette.red : palette.blue)}
          data={charts.size}
          title="Inventory by Size"
        />
      </section>
    </div>
  );
}
