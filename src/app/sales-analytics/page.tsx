"use client";

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
import { motion } from "framer-motion";
import { memo, useMemo, useRef, type ReactNode } from "react";
import {
  Area,
  AreaChart,
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  LabelList,
  Line,
  LineChart,
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

type SalesDatum = Record<string, string | number | boolean>;

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
  blue: "#669BBC",
  deepRed: "#780000",
  green: "#003049",
  grey: "#94A3B8",
  lightBlue: "#669BBC",
  mediumBlue: "#669BBC",
  orange: "#FDF0D5",
  red: "#C1121F",
  softBlue: "#FDF0D5",
  teal: "#003049"
};

const departmentColors = [
  "#C1121F",
  "#669BBC",
  "#003049",
  "#FDF0D5",
  "#7C3AED",
  "#003049",
  "#DC2626",
  "#6B7280",
  "#669BBC",
  "#780000"
];

function trimCompactDecimals(formatted: string) {
  return formatted.replace(/\.00(?= )/, "").replace(/(\.\d)0(?= )/, "$1");
}

function formatCurrency(value: number) {
  if (Math.abs(value) >= 10000000) return trimCompactDecimals(`\u20B9${(value / 10000000).toFixed(2)} Cr`);
  if (Math.abs(value) >= 100000) return trimCompactDecimals(`\u20B9${(value / 100000).toFixed(2)} L`);
  return new Intl.NumberFormat("en-IN", {
    currency: "INR",
    maximumFractionDigits: 0,
    style: "currency"
  }).format(value);
}

function compactCurrencyFromText(value: string) {
  const numericValue = Number(value.replace(/[^\d.-]/g, ""));
  return value.includes("\u20B9") && Number.isFinite(numericValue) ? formatCurrency(numericValue) : value;
}

function formatNumber(value: number) {
  return new Intl.NumberFormat("en-IN", { maximumFractionDigits: 0 }).format(value);
}

function formatPercent(value: number) {
  return `${Number(value ?? 0).toFixed(1)}%`;
}

function csvEscape(value: string | number | boolean) {
  return `"${String(value ?? "").replace(/"/g, '""')}"`;
}

function totalValue(data: SalesDatum[], key = "value") {
  return data.reduce((total, row) => total + Number(row[key] ?? 0), 0);
}

function groupQuantity(rows: SalesInventoryRow[], key: keyof SalesInventoryRow) {
  const map = new Map<string, number>();
  rows.forEach((row) => {
    const label = String(row[key] || "Unknown");
    map.set(label, (map.get(label) ?? 0) + row.quantity);
  });
  return map;
}

function enrichRevenueData(data: ChartDatum[], rows: SalesInventoryRow[], key: keyof SalesInventoryRow): SalesDatum[] {
  const quantityMap = groupQuantity(rows, key);
  const revenueTotal = totalValue(data as SalesDatum[]);

  return data.map((item) => ({
    ...item,
    percentage: revenueTotal ? (Number(item.value ?? 0) / revenueTotal) * 100 : 0,
    quantity: quantityMap.get(String(item.name)) ?? 0
  })) as SalesDatum[];
}

function truncateLabel(value: string, maxLength = 24) {
  return value.length > maxLength ? `${value.slice(0, maxLength - 1)}...` : value;
}

const weekdayOrder = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];

function weekdayIndex(value: string) {
  const normalized = value.toLowerCase();
  const index = weekdayOrder.findIndex((day) => day.toLowerCase() === normalized);
  return index === -1 ? weekdayOrder.length : index;
}

function rankedSizeColor(_: SalesDatum, index: number) {
  if (index < 3) return palette.red;
  if (index < 6) return palette.blue;
  return palette.lightBlue;
}

function rankedStoreColor(_: SalesDatum, index: number, data: SalesDatum[]) {
  if (index === 0) return palette.red;
  if (index === 1) return palette.blue;
  if (index === 2) return palette.mediumBlue;
  if (index === data.length - 1) return palette.grey;
  return palette.lightBlue;
}

function seasonRevenueColor(item: SalesDatum) {
  const season = String(item.name).trim().toLowerCase();
  if (season === "winter") return palette.blue;
  if (season === "monsoon") return palette.teal;
  if (season === "summer") return palette.orange;
  if (season === "spring") return palette.red;
  return palette.blue;
}

function priceSegmentColor(item: SalesDatum) {
  const label = String(item.name).toLowerCase().replace(/\s/g, "");
  if (label === "2k-4k" || label.includes("2k-4k")) return palette.red;
  if (label === "1k-2k" || label.includes("1k-2k")) return palette.blue;
  if (label === "<1k" || label.includes("under1k") || label.includes("below1k")) return palette.orange;
  if (label === "4k+" || label.includes("4k+")) return palette.green;
  return palette.blue;
}

function weeklyPerformanceColor(item: SalesDatum, weeklyData: SalesDatum[]) {
  const values = weeklyData.map((row) => Number(row.value ?? 0));
  const maxValue = Math.max(...values);
  const minValue = Math.min(...values);
  const value = Number(item.value ?? 0);

  if (value === maxValue) return palette.red;
  if (value === minValue) return palette.orange;
  return palette.blue;
}

function growthPerformanceColor(value: number) {
  if (value > 0) return palette.green;
  if (value < 0) return palette.red;
  return "#6B7280";
}

function heatmapRevenueColor(value: number, maxValue: number) {
  const intensity = maxValue ? Math.sqrt(value / maxValue) : 0;
  if (intensity >= 0.72) return palette.deepRed;
  if (intensity >= 0.42) return palette.orange;
  if (intensity >= 0.18) return palette.lightBlue;
  return palette.softBlue;
}

const SalesPageHeader = memo(function SalesPageHeader() {
  return (
    <motion.div
      animate={{ opacity: 1, y: 0 }}
      className="space-y-2"
      initial={{ opacity: 0, y: 14 }}
      transition={{ duration: 0.38, ease: "easeOut" }}
    >
      <p className="text-xs font-semibold uppercase tracking-[0.18em] text-brand-red">
        Revenue Intelligence
      </p>
      <div className="max-w-4xl space-y-2">
        <h1 className="text-4xl font-bold tracking-normal text-slate-950 dark:text-white lg:text-[44px]">
          Sales Analytics
        </h1>
        <p className="max-w-3xl text-sm leading-6 text-slate-600 dark:text-slate-300">
          Detailed sales performance workspace covering revenue trends, stores, products, sizes, seasons, pricing, and growth signals.
        </p>
      </div>
    </motion.div>
  );
});

function SalesFilterPanel() {
  const { filterOptions, filters, resetFilters, setFilter } = useAnalytics();
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
              {(filterOptions[key] ?? []).map((option) => (
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

function SalesKpiCard({ kpi }: { kpi: KpiRecord }) {
  const Icon = kpi.icon;
  const value = compactCurrencyFromText(kpi.value);
  const subtitleMap: Record<string, string> = {
    "Average Selling Price": "Pricing Efficiency",
    "Best Department": "Revenue Leader",
    "Best Product": "Top Selling Product",
    "Best Store": "Revenue Leader",
    "Total Revenue": "Total Revenue",
    "Units Sold": "Sales Volume"
  };
  const subtitle = kpi.change === "-" ? subtitleMap[kpi.label] ?? "Performance" : subtitleMap[kpi.label] ?? kpi.change;
  const trend = {
    danger: { className: "bg-red-50 text-red-600 dark:bg-red-500/10 dark:text-red-300", icon: ArrowDownRight },
    neutral: { className: "bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-300", icon: Minus },
    success: { className: "bg-brand-blue/15 text-brand-ink dark:bg-brand-blue/15 dark:text-brand-blue", icon: ArrowUpRight },
    warning: { className: "bg-amber-50 text-amber-600 dark:bg-amber-500/10 dark:text-amber-300", icon: TrendingDown }
  }[kpi.tone ?? "neutral"];
  const TrendIcon = trend.icon;

  return (
    <article className="h-full rounded-3xl border border-slate-200/90 bg-white p-3.5 shadow-panel transition duration-300 hover:-translate-y-0.5 hover:border-red-100 hover:shadow-xl dark:border-slate-800 dark:bg-slate-900/80">
      <div className="flex h-full items-start justify-between gap-4">
        <div className="min-w-0">
          <p className="truncate text-sm font-medium text-slate-500 dark:text-slate-400">
            {kpi.label}
          </p>
          <p className="mt-1 truncate text-[27px] font-black leading-tight tracking-normal text-slate-950 dark:text-white">
            {value}
          </p>
          <p className="mt-1 text-xs font-semibold text-slate-500 dark:text-slate-400">
            {subtitle}
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

function SalesChartCard({
  children,
  data,
  chartClassName = "h-80",
  title
}: {
  children: ReactNode;
  data: SalesDatum[];
  chartClassName?: string;
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
    <section className="rounded-3xl border border-slate-200/90 bg-white p-5 shadow-panel transition duration-300 hover:-translate-y-0.5 hover:border-red-100 hover:shadow-xl dark:border-slate-800 dark:bg-slate-900/80">
      <div className="mb-5 flex flex-wrap items-center justify-between gap-3">
        <h3 className="text-lg font-semibold text-slate-950 dark:text-white">{title}</h3>
        <div className="flex gap-2">
          <button className="grid h-9 w-9 place-items-center rounded-xl border border-slate-200 bg-slate-50 text-slate-500 shadow-sm transition duration-200 hover:-translate-y-0.5 hover:border-red-200 hover:bg-red-50 hover:text-brand-red focus:outline-none focus:ring-2 focus:ring-brand-red/30" onClick={downloadCsv} title="Download CSV" type="button">
            <Download className="h-4 w-4" />
          </button>
          <button className="grid h-9 w-9 place-items-center rounded-xl border border-slate-200 bg-slate-50 text-slate-500 shadow-sm transition duration-200 hover:-translate-y-0.5 hover:border-red-200 hover:bg-red-50 hover:text-brand-red focus:outline-none focus:ring-2 focus:ring-brand-red/30" onClick={downloadPng} title="Download PNG" type="button">
            <ImageDown className="h-4 w-4" />
          </button>
        </div>
      </div>
      <div className={chartClassName} ref={chartRef}>
        {children}
      </div>
    </section>
  );
}

function SalesTooltip({
  active,
  label,
  payload,
  percent = false
}: {
  active?: boolean;
  label?: string;
  payload?: Array<{ payload: SalesDatum; value: number }>;
  percent?: boolean;
}) {
  if (!active || !payload?.length) return null;
  const row = payload[0].payload;
  const value = Number(row.value ?? payload[0].value ?? 0);

  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-4 text-sm shadow-panel">
      <p className="max-w-72 font-semibold text-slate-950">{label ?? row.name}</p>
      <p className="mt-2 text-slate-600">
        {percent ? "Growth" : "Revenue"}: {percent ? formatPercent(value) : formatCurrency(value)}
      </p>
      {"quantity" in row ? <p className="text-slate-600">Quantity Sold: {formatNumber(Number(row.quantity))}</p> : null}
      {"percentage" in row ? <p className="text-slate-600">Contribution: {formatPercent(Number(row.percentage))}</p> : null}
    </div>
  );
}

function HeatmapTooltip({
  active,
  payload
}: {
  active?: boolean;
  payload?: Array<{ payload: SalesDatum }>;
}) {
  if (!active || !payload?.length) return null;
  const row = payload[0].payload;

  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-4 text-sm shadow-panel">
      <p className="font-semibold text-slate-950">{row.y}</p>
      <p className="mt-2 text-slate-600">Season: {row.x}</p>
      <p className="text-slate-600">Revenue: {formatCurrency(Number(row.z ?? 0))}</p>
    </div>
  );
}

function SalesLineChart({
  data,
  title,
  percent = false
}: {
  data: SalesDatum[];
  title: string;
  percent?: boolean;
}) {
  const gradientId = title.toLowerCase().replace(/[^a-z0-9]+/g, "-");
  const chartMargin = percent
    ? { bottom: 24, left: 8, right: 42, top: 34 }
    : { bottom: 8, left: 8, right: 18, top: 12 };

  if (!percent) {
    return (
      <SalesChartCard data={data} title={title}>
        <ResponsiveContainer height="100%" width="100%">
          <LineChart data={data} margin={chartMargin}>
            <CartesianGrid stroke="#E5E7EB" strokeDasharray="3 3" vertical={false} />
            <XAxis dataKey="name" tick={axisStyle} tickLine={false} />
            <YAxis tick={axisStyle} tickFormatter={(value) => formatCurrency(Number(value))} tickLine={false} width={72} />
            <Tooltip content={<SalesTooltip />} />
            <Line
              activeDot={{ r: 5 }}
              animationDuration={700}
              dataKey="value"
              dot={{ fill: palette.red, r: 2.5, strokeWidth: 1 }}
              name="Revenue"
              stroke={palette.red}
              strokeWidth={3.5}
              type="monotone"
            />
          </LineChart>
        </ResponsiveContainer>
      </SalesChartCard>
    );
  }

  return (
    <SalesChartCard data={data} title={title}>
      <ResponsiveContainer height="100%" width="100%">
        <AreaChart data={data} margin={chartMargin}>
          <defs>
            <linearGradient id={gradientId} x1="0" x2="0" y1="0" y2="1">
              <stop offset="5%" stopColor={palette.red} stopOpacity={0.34} />
              <stop offset="95%" stopColor={palette.red} stopOpacity={0.05} />
            </linearGradient>
          </defs>
          <CartesianGrid stroke="#E5E7EB" strokeDasharray="3 3" strokeOpacity={0.78} vertical={false} />
          <XAxis dataKey="name" tick={axisStyle} tickLine={false} />
          <YAxis tick={axisStyle} tickFormatter={(value) => (percent ? formatPercent(Number(value)) : formatCurrency(Number(value)))} tickLine={false} width={72} />
          <Tooltip content={<SalesTooltip percent={percent} />} />
          <Area animationDuration={950} dataKey="value" fill={`url(#${gradientId})`} stroke="none" type="monotone" />
          <Line activeDot={{ r: 5.5 }} animationDuration={950} dataKey="value" dot={{ fill: palette.red, r: 2.5, strokeWidth: 1 }} name={percent ? "Growth" : "Revenue"} stroke={palette.red} strokeWidth={4.25} type="monotone">
            {percent ? <LabelList content={<YoyGrowthLabel />} dataKey="value" /> : null}
          </Line>
        </AreaChart>
      </ResponsiveContainer>
    </SalesChartCard>
  );
}

function YoyGrowthLabel({
  value,
  x,
  y
}: {
  value?: string | number;
  x?: string | number;
  y?: string | number;
}) {
  const numericValue = Number(value ?? 0);
  const xPosition = Number(x ?? 0);
  const yPosition = Number(y ?? 0);
  const isNegative = numericValue < 0;
  const yOffset = isNegative ? 18 : -12;
  const labelY = Math.max(14, yPosition + yOffset);

  return (
    <text
      dominantBaseline={isNegative ? "hanging" : "auto"}
      fill="#000000"
      fontSize={12}
      fontWeight={600}
      textAnchor="middle"
      x={xPosition}
      y={labelY}
    >
      {formatPercent(numericValue)}
    </text>
  );
}

function VerticalRevenueChart({
  data,
  title,
  colorBy,
  barSize,
  showLabels = true
}: {
  data: SalesDatum[];
  title: string;
  colorBy?: (item: SalesDatum, index: number) => string;
  barSize?: number;
  showLabels?: boolean;
}) {
  return (
    <SalesChartCard data={data} title={title}>
      <ResponsiveContainer height="100%" width="100%">
        <BarChart data={data} margin={{ bottom: 8, left: 8, right: 18, top: 24 }}>
          <CartesianGrid stroke="#E5E7EB" strokeDasharray="3 3" strokeOpacity={0.78} vertical={false} />
          <XAxis dataKey="name" tick={axisStyle} tickLine={false} />
          <YAxis tick={axisStyle} tickFormatter={(value) => formatCurrency(Number(value))} tickLine={false} width={72} />
          <Tooltip content={<SalesTooltip />} />
          <Bar animationDuration={900} barSize={barSize} dataKey="value" name="Revenue" radius={[12, 12, 0, 0]}>
            {data.map((item, index) => (
              <Cell fill={colorBy?.(item, index) ?? palette.blue} key={`${item.name}-${index}`} />
            ))}
            {showLabels ? (
              <LabelList dataKey="value" formatter={(value) => formatCurrency(Number(value ?? 0))} position="top" style={{ fill: "#000000", fontSize: 12, fontWeight: 600 }} />
            ) : null}
          </Bar>
        </BarChart>
      </ResponsiveContainer>
    </SalesChartCard>
  );
}

function HorizontalRevenueChart({
  data,
  title,
  colorBy,
  dashboardVariant,
  highlightTop = false,
  highlightName
}: {
  data: SalesDatum[];
  title: string;
  colorBy?: (item: SalesDatum, index: number) => string;
  dashboardVariant?: "department" | "products" | "store";
  highlightTop?: boolean;
  highlightName?: string;
}) {
  const isDashboardSynced = Boolean(dashboardVariant);
  const chartMargin = dashboardVariant === "store"
    ? { bottom: 8, left: 84, right: 56, top: 12 }
    : dashboardVariant === "products"
      ? { bottom: 8, left: 88, right: 54, top: 12 }
      : dashboardVariant === "department"
        ? { bottom: 8, left: 70, right: 54, top: 12 }
        : { bottom: 8, left: 92, right: 64, top: 14 };
  const yAxisWidth = dashboardVariant === "store" ? 210 : dashboardVariant === "products" ? 220 : dashboardVariant === "department" ? 170 : 220;

  return (
    <SalesChartCard chartClassName={isDashboardSynced ? "h-80" : "h-[22.5rem]"} data={data} title={title}>
      <ResponsiveContainer height="100%" width="100%">
        <BarChart barCategoryGap={isDashboardSynced ? undefined : "14%"} data={data} layout="vertical" margin={chartMargin}>
          <CartesianGrid horizontal={false} stroke="#E5E7EB" strokeDasharray="3 3" />
          <XAxis
            domain={[0, "dataMax"]}
            scale="auto"
            tick={axisStyle}
            tickFormatter={(value) => formatCurrency(Number(value))}
            tickLine={false}
            type="number"
          />
          <YAxis
            dataKey="name"
            tick={axisStyle}
            tickFormatter={isDashboardSynced ? undefined : (value) => truncateLabel(String(value))}
            tickLine={false}
            type="category"
            width={yAxisWidth}
          />
          <Tooltip content={<SalesTooltip />} />
          <Bar animationDuration={700} dataKey="value" fill={palette.blue} name="Revenue" radius={[0, 8, 8, 0]}>
            {data.map((item, index) => (
              <Cell
                fill={
                  dashboardVariant === "department"
                    ? departmentColors[index % departmentColors.length]
                    : dashboardVariant === "products"
                      ? index < 3 ? palette.red : palette.blue
                      : colorBy
                        ? colorBy(item, index)
                        : (highlightName && String(item.name).toLowerCase().includes(highlightName.toLowerCase())) ||
                            (highlightTop && index === 0)
                          ? palette.red
                          : palette.blue
                }
                key={`${item.name}-${index}`}
              />
            ))}
            <LabelList
              dataKey="value"
              formatter={(value) => formatCurrency(Number(value ?? 0))}
              position="right"
              style={{ fill: "#000000", fontSize: 11, fontWeight: 600 }}
            />
          </Bar>
        </BarChart>
      </ResponsiveContainer>
    </SalesChartCard>
  );
}

function GrowthBarChart({ data, title }: { data: SalesDatum[]; title: string }) {
  return (
    <SalesChartCard data={data} title={title}>
      <ResponsiveContainer height="100%" width="100%">
        <BarChart data={data} margin={{ bottom: 8, left: 8, right: 18, top: 24 }}>
          <CartesianGrid stroke="#E5E7EB" strokeDasharray="3 3" strokeOpacity={0.78} vertical={false} />
          <XAxis dataKey="name" tick={axisStyle} tickLine={false} />
          <YAxis tick={axisStyle} tickFormatter={(value) => formatPercent(Number(value))} tickLine={false} width={72} />
          <Tooltip content={<SalesTooltip percent />} />
          <Bar animationDuration={900} dataKey="value" name="Growth" radius={[10, 10, 0, 0]}>
            {data.map((item, index) => (
              <Cell fill={growthPerformanceColor(Number(item.value ?? 0))} key={`${item.name}-${index}`} />
            ))}
          </Bar>
        </BarChart>
      </ResponsiveContainer>
    </SalesChartCard>
  );
}

function SalesHeatmapChart({ data }: { data: SalesDatum[] }) {
  const maxValue = Math.max(...data.map((item) => Number(item.z ?? 0)), 1);

  return (
    <SalesChartCard data={data} title="Store Revenue Bubble Matrix">
      <ResponsiveContainer height="100%" width="100%">
        <ScatterChart margin={{ bottom: 8, left: 28, right: 18, top: 12 }}>
          <CartesianGrid stroke="#E5E7EB" strokeDasharray="3 3" strokeOpacity={0.78} />
          <XAxis allowDuplicatedCategory={false} dataKey="x" name="Season" tick={axisStyle} tickLine={false} type="category" />
          <YAxis allowDuplicatedCategory={false} dataKey="y" name="Store" tick={axisStyle} tickFormatter={(value) => truncateLabel(String(value), 18)} tickLine={false} type="category" width={130} />
          <ZAxis dataKey="z" range={[360, 2350]} />
          <Tooltip content={<HeatmapTooltip />} cursor={{ stroke: "#CBD5E1", strokeDasharray: "3 3" }} />
          <Scatter data={data} fill={palette.red}>
            {data.map((item, index) => {
              const value = Number(item.z ?? 0);
              const intensity = Math.sqrt(value / maxValue);
              return (
                <Cell
                  fill={heatmapRevenueColor(value, maxValue)}
                  fillOpacity={Math.min(0.96, Math.max(0.58, 0.48 + intensity * 0.48))}
                  key={`${item.x}-${item.y}-${index}`}
                />
              );
            })}
          </Scatter>
        </ScatterChart>
      </ResponsiveContainer>
    </SalesChartCard>
  );
}

export default function SalesAnalyticsPage() {
  const { error, filteredRows, isLoading } = useAnalytics();
  const salesKpis = useMemo(() => KPIService.salesKpis(filteredRows), [filteredRows]);
  const charts = useMemo(() => {
    const monthly = ChartService.monthlyRevenue(filteredRows);
    const yearlyRaw = ChartService.yearlyRevenue(filteredRows);
    const yearMonthCounts = filteredRows.reduce((map, row) => {
      const months = map.get(row.year) ?? new Set<string>();
      months.add(row.month);
      map.set(row.year, months);
      return map;
    }, new Map<string, Set<string>>());
    const completedYears = Array.from(yearMonthCounts)
      .filter(([, months]) => months.size >= 12)
      .map(([year]) => Number(year));
    const latestCompletedYear = completedYears.length ? Math.max(...completedYears) : Math.max(...yearlyRaw.map((item) => Number(item.name)));

    return {
      department: enrichRevenueData(ChartService.revenueBy(filteredRows, "department", 10), filteredRows, "department"),
      heatmap: ChartService.heatmap(filteredRows, "season", "storeName", "amount").map((item) => ({ ...item, value: item.z })),
      monthly,
      monthlyGrowth: ChartService.monthlyGrowth(filteredRows),
      priceRange: ChartService.priceRange(filteredRows),
      product: enrichRevenueData(ChartService.revenueBy(filteredRows, "productName", 10), filteredRows, "productName"),
      season: enrichRevenueData(ChartService.revenueBy(filteredRows, "season", 10), filteredRows, "season"),
      size: enrichRevenueData(ChartService.revenueBy(filteredRows, "size", 10), filteredRows, "size"),
      store: enrichRevenueData(ChartService.revenueBy(filteredRows, "storeName", 10), filteredRows, "storeName"),
      weekly: enrichRevenueData(ChartService.weeklyRevenue(filteredRows), filteredRows, "day").sort(
        (a, b) => weekdayIndex(String(a.name)) - weekdayIndex(String(b.name))
      ),
      yearly: yearlyRaw.map((item) => ({
        ...item,
        isIncomplete: (yearMonthCounts.get(String(item.name))?.size ?? 0) < 12,
        isLatestCompleted: Number(item.name) === latestCompletedYear
      })),
      yoy: ChartService.yoyGrowth(filteredRows)
    };
  }, [filteredRows]);

  return (
    <div className="space-y-5">
      <SalesPageHeader />
      <SalesFilterPanel />
      {error ? (
        <div className="rounded-3xl border border-red-200 bg-red-50 p-5 text-sm font-medium text-red-700">
          {error}
        </div>
      ) : null}
      {isLoading ? <LoadingSkeleton /> : null}
      <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {salesKpis.map((kpi) => (
          <SalesKpiCard key={kpi.label} kpi={kpi} />
        ))}
      </section>
      <section className="grid gap-5 xl:grid-cols-2">
        <SalesLineChart data={charts.monthly} title="Monthly Revenue Trend" />
        <VerticalRevenueChart
          colorBy={(item) => (item.isLatestCompleted ? palette.red : item.isIncomplete ? palette.grey : palette.blue)}
          data={charts.yearly}
          title="Annual Revenue Performance"
        />
        <HorizontalRevenueChart colorBy={(item, index) => rankedStoreColor(item, index, charts.store)} dashboardVariant="store" data={charts.store} title="Store Revenue Performance" />
        <HorizontalRevenueChart dashboardVariant="products" data={charts.product} title="Top Revenue Products" />
        <HorizontalRevenueChart dashboardVariant="department" data={charts.department} title="Department Revenue Performance" />
        <VerticalRevenueChart colorBy={seasonRevenueColor} data={charts.season} title="Seasonal Revenue Distribution" />
        <HorizontalRevenueChart colorBy={rankedSizeColor} data={charts.size} title="Revenue by Product Size" />
        <VerticalRevenueChart barSize={56} colorBy={priceSegmentColor} data={charts.priceRange} title="Revenue by Price Segment" />
        <VerticalRevenueChart
          colorBy={(item) => weeklyPerformanceColor(item, charts.weekly)}
          data={charts.weekly}
          title="Weekly Sales Performance"
        />
        <GrowthBarChart data={charts.monthlyGrowth} title="Monthly Revenue Growth" />
        <SalesLineChart data={charts.yoy} percent title="Year-over-Year Revenue Growth" />
        <SalesHeatmapChart data={charts.heatmap} />
      </section>
    </div>
  );
}
