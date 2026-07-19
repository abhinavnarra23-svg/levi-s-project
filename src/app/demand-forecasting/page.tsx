"use client";

import {
  Activity,
  ArrowDownRight,
  ArrowUpRight,
  BadgeIndianRupee,
  BarChart3,
  BrainCircuit,
  CalendarRange,
  Clock,
  Minus,
  PackageCheck,
  Sparkles,
  Target,
  TrendingDown,
  TrendingUp,
  type LucideIcon
} from "lucide-react";
import { motion } from "framer-motion";
import dynamic from "next/dynamic";
import { memo, useEffect, useMemo, useState } from "react";
import {
  Area,
  AreaChart,
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  LabelList,
  Legend,
  Line,
  LineChart,
  ReferenceDot,
  ReferenceArea,
  ReferenceLine,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis
} from "recharts";

import { ChartCard } from "@/components/charts/chart-card";
import { LoadingSkeleton } from "@/components/ui/loading-skeleton";
import { useAnalytics } from "@/context/analytics-context";
import { formatNumber } from "@/lib/formatters";
import { DataService } from "@/services/DataService";
import { ForecastAllocationService } from "@/services/ForecastAllocationService";
import {
  loadForecastExcelData,
  type ForecastExcelData,
  type ForecastModelComparisonRow
} from "@/services/ForecastExcelService";
import type { MonthlySalesRow } from "@/types/analytics";

const ForecastExecutiveRibbon = dynamic(
  () => import("@/components/charts/forecast-breakdown-charts").then((module) => module.ForecastExecutiveRibbon),
  {
    loading: () => <LoadingSkeleton />,
    ssr: false
  }
);

const ForecastBreakdownCharts = dynamic(
  () => import("@/components/charts/forecast-breakdown-charts").then((module) => module.ForecastBreakdownCharts),
  {
    loading: () => <div className="xl:col-span-2"><LoadingSkeleton /></div>,
    ssr: false
  }
);

type ChartPoint = {
  date: string;
  forecastDemand?: number;
  forecastSales?: number;
  growth?: number;
  historicalSales?: number;
  labelDx?: number;
  labelDy?: number;
  name: string;
};

type ExportRow = Record<string, string | number>;

type ForecastTableRow = ExportRow & {
  demandChange: number;
  forecastDemand: string;
  forecastSales: string;
  growth: number;
  month: string;
  planningSignal: "Increase Inventory" | "Maintain Inventory" | "Reduce Inventory";
  trendIndicator: string;
};

const axisStyle = {
  fill: "#000000",
  fontSize: 12,
  fontWeight: 500
};

const forecastXAxisProps = {
  dataKey: "name",
  height: 46,
  interval: 0,
  minTickGap: 0,
  padding: { left: 10, right: 10 },
  tick: { ...axisStyle, fontSize: 11, fontWeight: 500 },
  tickLine: false,
  tickMargin: 10
} as const;

const colors = {
  blue: "#669BBC",
  green: "#003049",
  grey: "#6B7280",
  navy: "#003049",
  red: "#C1121F"
};

const SALES_MODEL_NAME = "Gradient Boosting Regressor";
const SALES_MODEL_EVALUATION_ROWS: ForecastModelComparisonRow[] = [
  { forecast: "Sales", model: "Gradient Boosting", rmse: 964.76, mae: 673.70, mape: 34.65, r2: 0.4655 },
  { forecast: "Sales", model: "XGBoost", rmse: 1024.15, mae: 717.41, mape: 36.73, r2: 0.3976 },
  { forecast: "Sales", model: "Random Forest", rmse: 1028.52, mae: 739.45, mape: 37.55, r2: 0.3925 },
  { forecast: "Sales", model: "Linear Regression", rmse: 1078.19, mae: 863.96, mape: 40.43, r2: 0.3324 }
];

const SALES_MODEL_SELECTION_NOTE =
  "Selected based on the best overall performance across RMSE, MAE, MAPE and R² among the evaluated regression models.";
const DEMAND_MODEL_SELECTION_NOTE =
  "Selected as the best demand forecasting model based on the lowest RMSE and strongest overall predictive performance among the evaluated regression models.";

function monthLabel(date: string) {
  const parsed = new Date(date);
  if (Number.isNaN(parsed.getTime())) return "";
  return new Intl.DateTimeFormat("en-IN", { month: "short", year: "numeric" }).format(parsed);
}

function formatPercent(value: number) {
  return `${value.toFixed(2)}%`;
}

function formatCompactCurrency(value: number) {
  const abs = Math.abs(value);
  const formatter = new Intl.NumberFormat("en-IN", {
    currency: "INR",
    maximumFractionDigits: 2,
    style: "currency"
  });
  if (abs >= 10000000) return `${formatter.format(value / 10000000)} Cr`;
  if (abs >= 100000) return `${formatter.format(value / 100000)} L`;
  return formatter.format(value);
}

function trendIndicator(current: number, previous?: number) {
  if (previous === undefined) return "Stable";
  if (current > previous) return "Increase";
  if (current < previous) return "Decrease";
  return "Stable";
}

function bestModel(rows: ForecastModelComparisonRow[], forecast: string) {
  return [...rows]
    .filter((row) => row.forecast.toLowerCase() === forecast.toLowerCase())
    .sort((a, b) => a.rmse - b.rmse)[0];
}

function recommendationFromTrend(growth: number) {
  if (growth > 5) return "Increase inventory before the peak month.";
  if (growth < -5) return "Limit new intake and rebalance stock.";
  return "Maintain steady replenishment.";
}

function planningSignal(growth: number): ForecastTableRow["planningSignal"] {
  if (growth > 5) return "Increase Inventory";
  if (growth < -5) return "Reduce Inventory";
  return "Maintain Inventory";
}

function chartExport(data: ChartPoint[]): ExportRow[] {
  return data.map((row) => ({
    date: row.date,
    forecastDemand: row.forecastDemand ?? "",
    forecastSales: row.forecastSales ?? "",
    historicalSales: row.historicalSales ?? "",
    month: row.name
  }));
}

function uniqueChartPoints(points: Array<ChartPoint | undefined>) {
  const seen = new Set<string>();
  return points.filter((point): point is ChartPoint => {
    if (!point) return false;
    const key = `${point.name}-${point.forecastSales ?? point.forecastDemand ?? ""}`;
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  });
}

function smartLabelData(data: ChartPoint[], dataKey: "forecastDemand" | "forecastSales") {
  const values = data.map((row) => Number(row[dataKey] ?? 0));
  const max = Math.max(...values);
  const min = Math.min(...values);
  const range = Math.max(1, max - min);
  const average = values.length ? values.reduce((total, value) => total + value, 0) / values.length : 0;
  const highIndex = values.indexOf(max);
  const lowIndex = values.indexOf(min);

  return data.map((row, index) => {
    const value = values[index];
    let labelDy = index % 2 === 0 ? -16 : -30;
    let labelDx = 0;

    if (index === highIndex) {
      labelDy = -16;
      labelDx = index === data.length - 1 ? -10 : 0;
    } else if (index === lowIndex) {
      labelDy = -22;
      labelDx = index === 0 ? 10 : 0;
    } else if (Math.abs(value - average) / range < 0.1) {
      labelDy = value >= average ? -28 : -36;
    }

    const previousValue = values[index - 1];
    if (previousValue !== undefined && Math.abs(value - previousValue) / range < 0.08) {
      labelDy += index % 2 === 0 ? -8 : -10;
      labelDx = index % 2 === 0 ? -8 : 8;
    }

    if (dataKey === "forecastDemand") labelDy -= 10;

    return { ...row, labelDx, labelDy };
  });
}

function CustomTooltip({
  active,
  label,
  payload
}: {
  active?: boolean;
  label?: string;
  payload?: Array<{ color?: string; dataKey?: string; name?: string; value?: number }>;
}) {
  if (!active || !payload?.length) return null;

  return (
    <div className="min-w-52 rounded-2xl border border-slate-200 bg-white p-4 text-[13px] leading-6 shadow-panel dark:border-slate-700 dark:bg-slate-950">
      <p className="text-sm font-bold text-slate-950 dark:text-white">{label}</p>
      <div className="mt-2 space-y-1.5">
        {payload
          .filter((item) => item.value !== undefined && item.value !== null)
          .map((item) => {
            const key = String(item.dataKey ?? item.name ?? "");
            const isDemand = key.toLowerCase().includes("demand");
            return (
              <p className="flex items-center justify-between gap-5 font-semibold text-slate-950 dark:text-white" key={`${key}-${item.value}`}>
                <span className="mr-2 inline-block h-2.5 w-2.5 rounded-full" style={{ backgroundColor: item.color }} />
                <span>{item.name ?? key}</span>
                <span className="font-bold text-slate-950 dark:text-white">{isDemand ? formatNumber(Number(item.value)) : formatCompactCurrency(Number(item.value))}</span>
              </p>
            );
          })}
      </div>
    </div>
  );
}

const ForecastHero = memo(function ForecastHero() {
  return (
    <motion.section
      className="rounded-3xl border border-slate-200/90 bg-white p-6 shadow-panel dark:border-slate-800 dark:bg-slate-900/80"
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.35, ease: "easeOut" }}
    >
      <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
        <div className="max-w-4xl">
          <p className="text-sm font-semibold text-brand-red">Predictive Analytics</p>
          <h1 className="mt-2 text-4xl font-bold tracking-normal text-slate-950 dark:text-white lg:text-[44px]">
            Forecast Analytics
          </h1>
          <p className="mt-3 max-w-3xl text-sm leading-6 text-slate-600 dark:text-slate-300">
            AI-powered sales and demand forecasting with department, all-store and seasonal analysis for inventory planning and business decisions.
          </p>
        </div>
      </div>
    </motion.section>
  );
});

function ForecastValueLabel({
  dataKey,
  formatter,
  payload,
  value,
  x,
  y
}: {
  dataKey: "forecastDemand" | "forecastSales";
  formatter: (value: number) => string;
  payload?: ChartPoint & { labelDx?: number; labelDy?: number };
  value?: string | number;
  x?: string | number;
  y?: string | number;
}) {
  const xPosition = Number(x ?? 0) + Number(payload?.labelDx ?? 0);
  const yPosition = Math.max(14, Number(y ?? 0) + Number(payload?.labelDy ?? -18));

  return (
    <text fill="#000000" fontSize={11} fontWeight={600} textAnchor="middle" x={xPosition} y={yPosition}>
      {formatter(Number(value ?? payload?.[dataKey] ?? 0))}
    </text>
  );
}

function GrowthValueLabel({
  value,
  width,
  x,
  y
}: {
  value?: string | number;
  width?: string | number;
  x?: string | number;
  y?: string | number;
}) {
  const numericValue = Number(value ?? 0);
  const xPosition = Number(x ?? 0) + Number(width ?? 0) / 2;
  const barTop = Number(y ?? 0);
  const negativeOffset = 8;
  const positiveOffset = 8;
  const yPosition = numericValue < 0 ? barTop + negativeOffset : Math.max(barTop - positiveOffset, 14);
  const sign = numericValue > 0 ? "+" : "";

  return (
    <text
      dominantBaseline={numericValue < 0 ? "hanging" : "auto"}
      fill="#000000"
      fontSize={11}
      fontWeight={600}
      textAnchor="middle"
      x={xPosition}
      y={yPosition}
    >
      {sign}{formatPercent(numericValue)}
    </text>
  );
}

function ExecutiveKpiCard({
  description,
  icon: Icon,
  label,
  sparkline = "up",
  tone,
  trend = "neutral",
  value
}: {
  description: string;
  icon: typeof BrainCircuit;
  label: string;
  sparkline?: "down" | "flat" | "up";
  tone: string;
  trend?: "down" | "neutral" | "up";
  value: string;
}) {
  const toneClass: Record<string, string> = {
    danger: "bg-red-50 text-brand-red dark:bg-red-500/10",
    info: "bg-blue-50 text-blue-600 dark:bg-blue-500/10",
    neutral: "bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-300",
    success: "bg-brand-blue/15 text-brand-ink dark:bg-brand-blue/15 dark:text-brand-blue",
    warning: "bg-amber-50 text-amber-600 dark:bg-amber-500/10"
  };
  const TrendIcon = trend === "up" ? ArrowUpRight : trend === "down" ? ArrowDownRight : Minus;
  const trendClass = trend === "up" ? "text-brand-ink dark:text-brand-blue" : trend === "down" ? "text-red-600" : "text-slate-500";
  const points = sparkline === "down" ? "0,18 18,12 36,15 54,8 72,14 90,4" : sparkline === "flat" ? "0,12 18,11 36,13 54,12 72,13 90,11" : "0,18 18,15 36,16 54,10 72,12 90,4";

  return (
    <motion.article
      className="flex h-full min-h-[126px] flex-col justify-between rounded-3xl border border-slate-200/90 bg-white p-4 shadow-panel transition duration-300 hover:-translate-y-0.5 hover:border-red-100 hover:shadow-xl dark:border-slate-800 dark:bg-slate-900/80"
      initial={{ opacity: 0, y: 14 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, amount: 0.2 }}
      transition={{ duration: 0.25, ease: "easeOut" }}
    >
      <div className="flex items-start justify-between gap-4">
        <div className="min-w-0">
          <p className="text-sm font-medium text-slate-500 dark:text-slate-400">{label}</p>
          <div className="mt-2 flex items-center gap-2">
            <p className="truncate text-2xl font-black text-slate-950 dark:text-white">{value}</p>
            <TrendIcon className={`h-4 w-4 shrink-0 ${trendClass}`} />
          </div>
        </div>
        <div className={`grid h-11 w-11 shrink-0 place-items-center rounded-2xl ${toneClass[tone] ?? toneClass.neutral}`}>
          <Icon className="h-5 w-5" />
        </div>
      </div>
      <div className="mt-3 flex items-end justify-between gap-3">
        <p className="text-xs leading-5 text-slate-500 dark:text-slate-400">{description}</p>
        <svg className="h-7 w-20 shrink-0" viewBox="0 0 90 24">
          <polyline fill="none" points={points} stroke={tone === "danger" ? colors.red : tone === "warning" ? colors.navy : tone === "success" ? colors.green : colors.blue} strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" />
        </svg>
      </div>
    </motion.article>
  );
}

function SelectedModelsKpiCard({
  demandModel,
  salesModel
}: {
  demandModel: string;
  salesModel: string;
}) {
  return (
    <motion.article
      className="flex h-full min-h-[126px] flex-col justify-between rounded-3xl border border-slate-200/90 bg-white p-4 shadow-panel transition duration-300 hover:-translate-y-0.5 hover:border-red-100 hover:shadow-xl dark:border-slate-800 dark:bg-slate-900/80"
      initial={{ opacity: 0, y: 14 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, amount: 0.2 }}
      transition={{ duration: 0.25, ease: "easeOut" }}
    >
      <div className="flex items-start justify-between gap-4">
        <div className="min-w-0">
          <p className="text-sm font-medium text-slate-500 dark:text-slate-400">Selected Forecast Models</p>
          <p className="mt-2 text-xl font-black text-slate-950 dark:text-white">Sales + Demand</p>
        </div>
        <div className="grid h-11 w-11 shrink-0 place-items-center rounded-2xl bg-blue-50 text-blue-600 dark:bg-blue-500/10">
          <BrainCircuit className="h-5 w-5" />
        </div>
      </div>
      <div className="mt-3 grid grid-cols-2 gap-2">
        <div className="rounded-2xl bg-blue-50 px-3 py-2 dark:bg-blue-500/10">
          <div className="mb-1 flex items-center gap-1.5 text-[11px] font-bold uppercase tracking-wide text-blue-600">
            <BadgeIndianRupee className="h-3.5 w-3.5" />
            Sales
          </div>
          <p className="truncate text-sm font-black text-slate-950 dark:text-white">{salesModel}</p>
        </div>
        <div className="rounded-2xl bg-amber-50 px-3 py-2 dark:bg-amber-500/10">
          <div className="mb-1 flex items-center gap-1.5 text-[11px] font-bold uppercase tracking-wide text-amber-600">
            <PackageCheck className="h-3.5 w-3.5" />
            Demand
          </div>
          <p className="truncate text-sm font-black text-slate-950 dark:text-white">{demandModel}</p>
        </div>
      </div>
    </motion.article>
  );
}

function ForecastVsActualChart({ data, forecastStart }: { data: ChartPoint[]; forecastStart: string }) {
  const hasHistorical = data.some((item) => Number(item.historicalSales ?? 0) > 0);
  const forecastPoints = data.filter((item) => Number(item.forecastSales ?? 0) > 0);
  const firstForecast = forecastPoints[0];
  const lastForecast = forecastPoints.at(-1);
  const highestForecast = [...forecastPoints].sort((a, b) => Number(b.forecastSales ?? 0) - Number(a.forecastSales ?? 0))[0];
  const lowestForecast = [...forecastPoints].sort((a, b) => Number(a.forecastSales ?? 0) - Number(b.forecastSales ?? 0))[0];
  const lastPoint = data.at(-1)?.name;
  const importantPoints = uniqueChartPoints([firstForecast, highestForecast, lowestForecast, lastForecast]);
  const labelPositions = ["top", "top", "bottom", "bottom"] as const;

  return (
    <ChartCard exportData={chartExport(data)} title={hasHistorical ? "Forecast vs Historical Sales" : "12-Month Sales Forecast"}>
      <div className="h-72">
        <ResponsiveContainer height="100%" width="100%">
          <LineChart data={data} margin={{ bottom: 8, left: 12, right: 24, top: 22 }}>
            <CartesianGrid stroke="#E5E7EB" strokeDasharray="4 4" strokeOpacity={0.75} vertical={false} />
            {forecastStart && lastPoint ? <ReferenceArea fill="#C1121F" fillOpacity={0.055} x1={forecastStart} x2={lastPoint} /> : null}
            <XAxis dataKey="name" minTickGap={18} tick={{ ...axisStyle, fontSize: 13 }} tickLine={false} />
            <YAxis tick={{ ...axisStyle, fontSize: 13 }} tickFormatter={(value) => formatCompactCurrency(Number(value))} tickLine={false} width={82} />
            <Tooltip content={<CustomTooltip />} />
            <Legend iconType="circle" wrapperStyle={{ color: "#000000", fontSize: 13, fontWeight: 500, paddingTop: 8 }} />
            <ReferenceLine label={{ fill: "#000000", fontSize: 12, fontWeight: 700, position: "insideTop", value: "Forecast Begins" }} stroke={colors.grey} strokeDasharray="5 5" x={forecastStart} />
            {hasHistorical ? <Line connectNulls dataKey="historicalSales" dot={false} name="Historical Sales" stroke={colors.grey} strokeOpacity={0.72} strokeWidth={4} type="monotone" /> : null}
            <Line connectNulls dataKey="forecastSales" dot={{ fill: "#fff", r: 4, stroke: colors.red, strokeWidth: 2 }} name="Forecast Sales" stroke={colors.red} strokeWidth={4} type="monotone" />
            {importantPoints.map((point, index) => (
              <ReferenceDot
                fill={colors.red}
                ifOverflow="extendDomain"
                key={`${point?.name}-${index}`}
                label={{ fill: "#000000", fontSize: 10, fontWeight: 700, offset: 10, position: labelPositions[index] ?? "top", value: formatCompactCurrency(Number(point?.forecastSales ?? 0)) }}
                r={5}
                stroke="#fff"
                strokeWidth={2}
                x={point?.name}
                y={point?.forecastSales}
              />
            ))}
          </LineChart>
        </ResponsiveContainer>
      </div>
    </ChartCard>
  );
}

function SingleForecastTrendChart({
  color,
  data,
  dataKey,
  formatter,
  title,
  valueLabel
}: {
  color: string;
  data: ChartPoint[];
  dataKey: "forecastDemand" | "forecastSales";
  formatter: (value: number) => string;
  title: string;
  valueLabel: string;
}) {
  const values = data.map((row) => Number(row[dataKey] ?? 0));
  const average = values.length ? values.reduce((total, value) => total + value, 0) / values.length : 0;
  const labeledData = smartLabelData(data, dataKey);
  const highest = [...labeledData].sort((a, b) => Number(b[dataKey] ?? 0) - Number(a[dataKey] ?? 0))[0];
  const lowest = [...labeledData].sort((a, b) => Number(a[dataKey] ?? 0) - Number(b[dataKey] ?? 0))[0];
  const gradientId = dataKey === "forecastSales" ? "salesForecastGradient" : "demandForecastGradient";
  const forecastMonths = data.map((row) => row.name);

  return (
    <ChartCard exportData={chartExport(data)} title={title}>
      <div className="h-72">
        <ResponsiveContainer height="100%" width="100%">
          <AreaChart data={labeledData} margin={{ bottom: 30, left: 16, right: 34, top: 48 }}>
            <defs>
              <linearGradient id={gradientId} x1="0" x2="0" y1="0" y2="1">
                <stop offset="5%" stopColor={color} stopOpacity={0.24} />
                <stop offset="95%" stopColor={color} stopOpacity={0.02} />
              </linearGradient>
            </defs>
            <CartesianGrid stroke="#E5E7EB" strokeDasharray="4 4" strokeOpacity={0.75} vertical={false} />
            <XAxis {...forecastXAxisProps} ticks={forecastMonths} />
            <YAxis tick={{ ...axisStyle, fontSize: 13 }} tickFormatter={(value) => formatter(Number(value))} tickLine={false} width={82} />
            <Tooltip content={<CustomTooltip />} />
            <ReferenceLine
              label={{ fill: "#000000", fontSize: 11, fontWeight: 600, position: "insideTopRight", value: `Avg ${formatter(average)}` }}
              stroke={colors.grey}
              strokeDasharray="5 5"
              y={average}
            />
            <Area
              activeDot={{ fill: color, r: 7, stroke: "#fff", strokeWidth: 2 }}
              dataKey={dataKey}
              dot={{ fill: "#fff", r: 4, stroke: color, strokeWidth: 2 }}
              fill={`url(#${gradientId})`}
              name={valueLabel}
              stroke={color}
              strokeWidth={4}
              type="monotone"
            >
              <LabelList content={<ForecastValueLabel dataKey={dataKey} formatter={formatter} />} dataKey={dataKey} />
            </Area>
            {[highest, lowest].filter(Boolean).map((point, index) => (
              <ReferenceDot
                fill={color}
                ifOverflow="extendDomain"
                key={`${title}-${point?.name}-${index}`}
                label={{ fill: "#000000", fontSize: 11, fontWeight: 800, offset: 32, position: index === 0 ? "top" : "bottom", value: index === 0 ? "High" : "Low" }}
                r={6}
                stroke="#fff"
                strokeWidth={2}
                x={point?.name}
                y={point?.[dataKey]}
              />
            ))}
          </AreaChart>
        </ResponsiveContainer>
      </div>
    </ChartCard>
  );
}

function SalesDemandChart({ data }: { data: ChartPoint[] }) {
  const peakSales = [...data].sort((a, b) => Number(b.forecastSales ?? 0) - Number(a.forecastSales ?? 0))[0];
  const peakDemand = [...data].sort((a, b) => Number(b.forecastDemand ?? 0) - Number(a.forecastDemand ?? 0))[0];
  const forecastMonths = data.map((row) => row.name);

  return (
    <ChartCard exportData={chartExport(data)} title="Sales Forecast vs Demand Forecast">
      <div className="h-72">
        <ResponsiveContainer height="100%" width="100%">
          <LineChart data={data} margin={{ bottom: 30, left: 12, right: 24, top: 22 }}>
            <CartesianGrid stroke="#E5E7EB" strokeDasharray="4 4" strokeOpacity={0.75} vertical={false} />
            <XAxis {...forecastXAxisProps} ticks={forecastMonths} />
            <YAxis yAxisId="sales" tick={{ ...axisStyle, fontSize: 13 }} tickFormatter={(value) => formatCompactCurrency(Number(value))} tickLine={false} width={82} />
            <YAxis orientation="right" yAxisId="demand" tick={{ ...axisStyle, fontSize: 13 }} tickFormatter={(value) => formatNumber(Number(value))} tickLine={false} width={64} />
            <Tooltip content={<CustomTooltip />} />
            <Legend iconType="circle" wrapperStyle={{ color: "#000000", fontSize: 13, fontWeight: 500, paddingTop: 8 }} />
            <Line activeDot={{ r: 7, stroke: "#fff", strokeWidth: 2 }} dataKey="forecastSales" dot={{ fill: "#fff", r: 4, stroke: colors.red, strokeWidth: 2 }} name="Sales Forecast" stroke={colors.red} strokeWidth={4} type="monotone" yAxisId="sales" />
            <Line activeDot={{ r: 7, stroke: "#fff", strokeWidth: 2 }} dataKey="forecastDemand" dot={{ fill: "#fff", r: 4, stroke: colors.navy, strokeWidth: 2 }} name="Demand Forecast" stroke={colors.navy} strokeWidth={4} type="monotone" yAxisId="demand" />
            <ReferenceDot
              fill={colors.red}
              ifOverflow="extendDomain"
              label={{ fill: "#000000", fontSize: 11, fontWeight: 700, position: "top", value: "Peak Sales" }}
              r={6}
              stroke="#fff"
              strokeWidth={2}
              x={peakSales?.name}
              y={peakSales?.forecastSales}
              yAxisId="sales"
            />
            <ReferenceDot
              fill={colors.navy}
              ifOverflow="extendDomain"
              label={{ fill: "#000000", fontSize: 11, fontWeight: 700, position: "bottom", value: "Peak Demand" }}
              r={6}
              stroke="#fff"
              strokeWidth={2}
              x={peakDemand?.name}
              y={peakDemand?.forecastDemand}
              yAxisId="demand"
            />
          </LineChart>
        </ResponsiveContainer>
      </div>
    </ChartCard>
  );
}

function GrowthChart({ data }: { data: ChartPoint[] }) {
  return (
    <ChartCard className="xl:col-span-2" exportData={chartExport(data)} title="Monthly Forecast Growth (%)">
      <div className="h-64">
        <ResponsiveContainer height="100%" width="100%">
          <BarChart data={data} margin={{ bottom: 28, left: 6, right: 18, top: 24 }}>
            <CartesianGrid stroke="#E5E7EB" strokeDasharray="3 3" strokeOpacity={0.75} vertical={false} />
            <XAxis dataKey="name" tick={axisStyle} tickLine={false} />
            <YAxis tick={axisStyle} tickFormatter={(value) => formatPercent(Number(value))} tickLine={false} width={70} />
            <Tooltip
              content={({ active, label, payload }) =>
                active && payload?.length ? (
                  <div className="rounded-2xl border border-slate-200 bg-white p-4 text-sm shadow-panel dark:border-slate-700 dark:bg-slate-950">
                    <p className="font-semibold text-slate-950 dark:text-white">{label}</p>
                    <p className="mt-2 font-semibold text-slate-950 dark:text-white">Growth: {formatPercent(Number(payload[0].value ?? 0))}</p>
                  </div>
                ) : null
              }
            />
            <Bar animationDuration={700} dataKey="growth" minPointSize={3} name="Forecast Growth" radius={[10, 10, 0, 0]}>
              {data.map((item, index) => (
                <Cell fill={Number(item.growth ?? 0) === 0 ? colors.grey : Number(item.growth ?? 0) > 0 ? colors.green : colors.red} key={`${item.name}-${index}`} />
              ))}
              <LabelList content={<GrowthValueLabel />} dataKey="growth" />
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </div>
    </ChartCard>
  );
}

function ForecastTable({ rows }: { rows: ForecastTableRow[] }) {
  const [query, setQuery] = useState("");
  const [sortKey, setSortKey] = useState<"demandChange" | "growth" | "month">("month");
  const badgeClass = {
    "Decrease": "bg-red-50 text-red-700 dark:bg-red-500/10 dark:text-red-300",
    "Increase": "bg-brand-blue/15 text-brand-ink dark:bg-brand-blue/15 dark:text-brand-blue",
    "Stable": "bg-blue-50 text-blue-700 dark:bg-blue-500/10 dark:text-blue-300",
    "Increase Inventory": "bg-brand-blue/15 text-brand-ink dark:bg-brand-blue/15 dark:text-brand-blue",
    "Maintain Inventory": "bg-blue-50 text-blue-700 dark:bg-blue-500/10 dark:text-blue-300",
    "Reduce Inventory": "bg-red-50 text-red-700 dark:bg-red-500/10 dark:text-red-300"
  };
  const visibleRows = useMemo(() => {
    const searched = rows.filter((row) =>
      [row.month, row.forecastSales, row.forecastDemand, row.trendIndicator, row.planningSignal]
        .join(" ")
        .toLowerCase()
        .includes(query.trim().toLowerCase())
    );
    return [...searched].sort((a, b) => {
      if (sortKey === "month") return String(a.date).localeCompare(String(b.date));
      return Number(b[sortKey]) - Number(a[sortKey]);
    });
  }, [query, rows, sortKey]);

  return (
    <ChartCard exportData={rows} title="Forecast Table">
      <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <input
          className="h-10 rounded-2xl border border-slate-200 bg-slate-50 px-4 text-sm text-slate-700 outline-none transition focus:border-red-200 focus:bg-white focus:ring-4 focus:ring-red-50 dark:border-slate-800 dark:bg-slate-950 dark:text-slate-200 dark:focus:ring-red-500/10"
          onChange={(event) => setQuery(event.target.value)}
          placeholder="Search forecast table"
          value={query}
        />
        <select
          className="h-10 rounded-2xl border border-slate-200 bg-slate-50 px-4 text-sm font-semibold text-slate-600 outline-none transition focus:border-red-200 focus:bg-white focus:ring-4 focus:ring-red-50 dark:border-slate-800 dark:bg-slate-950 dark:text-slate-200 dark:focus:ring-red-500/10"
          onChange={(event) => setSortKey(event.target.value as "demandChange" | "growth" | "month")}
          value={sortKey}
        >
          <option value="month">Sort by Month</option>
          <option value="growth">Sort by Sales Growth</option>
          <option value="demandChange">Sort by Demand Change</option>
        </select>
      </div>
      <div className="h-auto max-h-none overflow-visible rounded-2xl border border-slate-200 dark:border-slate-800">
        <table className="w-full text-left text-sm">
          <thead className="sticky top-0 bg-slate-50 text-slate-500 dark:bg-slate-950 dark:text-slate-400">
            <tr>
              {["Month", "Forecast Sales", "Forecast Demand", "MoM Growth %", "Demand Change %", "Trend", "Planning Signal"].map((column) => (
                <th className="px-4 py-3 font-semibold" key={column}>{column}</th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
            {visibleRows.map((row) => (
              <tr className="transition hover:bg-slate-50 dark:hover:bg-slate-950/70" key={String(row.date)}>
                <td className="px-4 py-3 text-slate-700 dark:text-slate-200">{row.month}</td>
                <td className="px-4 py-3 font-semibold text-slate-900 dark:text-white">{row.forecastSales}</td>
                <td className="px-4 py-3 text-slate-700 dark:text-slate-200">{row.forecastDemand}</td>
                <td className={`px-4 py-3 font-semibold ${Number(row.growth) >= 0 ? "text-brand-ink dark:text-brand-blue" : "text-red-600"}`}>{formatPercent(Number(row.growth))}</td>
                <td className={`px-4 py-3 font-semibold ${Number(row.demandChange) >= 0 ? "text-brand-ink dark:text-brand-blue" : "text-red-600"}`}>{formatPercent(Number(row.demandChange))}</td>
                <td className="px-4 py-3">
                  <span className={`rounded-full px-3 py-1 text-xs font-bold ${badgeClass[String(row.trendIndicator) as keyof typeof badgeClass] ?? badgeClass.Stable}`}>
                    {row.trendIndicator}
                  </span>
                </td>
                <td className="px-4 py-3">
                  <span className={`whitespace-nowrap rounded-full px-3 py-1 text-xs font-bold ${badgeClass[row.planningSignal]}`}>
                    {row.planningSignal}
                  </span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </ChartCard>
  );
}

function ModelEvaluation({ rows }: { rows: ForecastModelComparisonRow[] }) {
  const demandRows = useMemo(
    () => rows.filter((row) => row.forecast.trim().toLowerCase() === "demand").sort((a, b) => a.rmse - b.rmse),
    [rows]
  );
  const medalLabel = ["🥇 Gold", "🥈 Silver", "🥉 Bronze"];
  const medalClass = [
    "bg-amber-100 text-amber-800 dark:bg-amber-500/15 dark:text-amber-200",
    "bg-slate-200 text-slate-700 dark:bg-slate-700 dark:text-slate-200",
    "bg-orange-100 text-orange-800 dark:bg-orange-500/15 dark:text-orange-200"
  ];
  const rankClass = (index: number) =>
    index === 0
      ? "bg-brand-blue/20 text-brand-ink dark:bg-brand-blue/15 dark:text-brand-blue"
      : "bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-300";
  const rmseClass = (index: number) => index === 0 ? "text-brand-ink dark:text-brand-blue" : index === 1 ? "text-amber-700 dark:text-amber-300" : "text-red-700 dark:text-red-300";
  const mapeClass = (index: number, value: number) => index === 0 ? "text-brand-ink dark:text-brand-blue" : value < 30 ? "text-amber-700 dark:text-amber-300" : "text-red-700 dark:text-red-300";
  const r2Class = (value: number) => value >= 0 ? "text-brand-ink dark:text-brand-blue" : "text-slate-700 dark:text-slate-300";
  const renderTable = (title: string, tableRows: ForecastModelComparisonRow[], isSales = false) => (
    <div className="min-h-[252px] overflow-hidden rounded-2xl border border-slate-200 bg-white dark:border-slate-800 dark:bg-slate-900">
      <div className="bg-slate-50 px-4 py-3 text-sm font-bold text-slate-950 dark:bg-slate-950 dark:text-white">
        {title}
      </div>
      <table className="w-full text-left text-xs">
        <thead className="bg-white text-slate-500 dark:bg-slate-900 dark:text-slate-400">
          <tr>
            {["Rank", "Model", "RMSE", "MAE", "MAPE", "R²", "Status"].map((column) => (
              <th className="px-3 py-2 font-semibold" key={column}>{column}</th>
            ))}
          </tr>
        </thead>
        <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
          {tableRows.map((row, index) => (
            <tr className={`text-slate-700 transition dark:text-slate-200 ${index === 0 ? "border-l-4 border-brand-blue bg-brand-blue/10 shadow-sm dark:bg-brand-blue/10" : "hover:bg-slate-50 dark:hover:bg-slate-950/70"}`} key={`${title}-${row.model}-${index}`}>
              <td className="px-3 py-2">
                <span className={`rounded-full px-2 py-1 text-[10px] font-black ${rankClass(index)}`}>
                  #{index + 1}
                </span>
              </td>
              <td className="px-3 py-2 font-semibold">
                {row.model}
                {index < 3 ? <span className={`ml-2 rounded-full px-2 py-0.5 text-[10px] font-bold ${medalClass[index]}`}>{medalLabel[index]}</span> : null}
              </td>
              <td className={`px-3 py-2 font-bold ${rmseClass(index)}`}>{isSales ? row.rmse.toFixed(2) : formatNumber(row.rmse)}</td>
              <td className="px-3 py-2">{isSales ? row.mae.toFixed(2) : formatNumber(row.mae)}</td>
              <td className={`px-3 py-2 font-bold ${mapeClass(index, row.mape)}`}>{formatPercent(row.mape)}</td>
              <td className={`px-3 py-2 font-semibold ${r2Class(row.r2)}`}>{row.r2.toFixed(isSales ? 4 : 2)}</td>
              <td className="px-3 py-2">
                <span className={`rounded-full px-2 py-1 text-[10px] font-black ${index === 0 ? "bg-brand-blue/20 text-brand-ink" : "bg-slate-100 text-slate-600"}`}>
                  {index === 0 ? "Best Model" : "Trained Model"}
                </span>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );

  return (
    <ChartCard exportData={[...SALES_MODEL_EVALUATION_ROWS, ...demandRows].map((row) => ({ forecast: row.forecast, mae: row.mae, mape: row.mape, model: row.model, r2: row.r2, rmse: row.rmse }))} title="Model Evaluation">
      <div className="grid gap-4">
        {renderTable("Sales Models", SALES_MODEL_EVALUATION_ROWS, true)}
        {renderTable("Demand Models", demandRows)}
      </div>
    </ChartCard>
  );
}

function ForecastFooter({
  demandModel,
  horizon,
  salesModel
}: {
  demandModel: string;
  horizon: number;
  salesModel: string;
}) {
  const lastUpdated = new Intl.DateTimeFormat("en-IN", {
    dateStyle: "medium",
    timeStyle: "short"
  }).format(new Date());
  const configurationItems: Array<{
    icon: LucideIcon;
    label: string;
    value: string;
  }> = [
    { icon: TrendingUp, label: "Sales Model", value: salesModel },
    { icon: Target, label: "Demand Model", value: demandModel },
    { icon: CalendarRange, label: "Forecast Horizon", value: `${horizon} Months` },
    { icon: BrainCircuit, label: "Forecast Method", value: "Machine Learning" }
  ];

  return (
    <footer className="rounded-3xl border border-slate-200/90 bg-white p-8 text-sm text-slate-600 shadow-panel dark:border-slate-800 dark:bg-slate-900/80 dark:text-slate-300">
      <div className="mb-8">
        <h2 className="text-[28px] font-bold leading-tight tracking-normal text-slate-950 dark:text-white">
          Forecast Model Configuration
        </h2>
        <p className="mt-2 text-sm font-normal leading-6 text-slate-500 dark:text-slate-400">
          Machine Learning models and forecasting parameters used for prediction.
        </p>
      </div>

      <div className="grid overflow-hidden rounded-3xl border border-slate-200 dark:border-slate-800 md:grid-cols-2">
        {configurationItems.map((item) => {
          const Icon = item.icon;
          return (
            <div
              className="border-b border-slate-200 p-5 last:border-b-0 dark:border-slate-800 md:odd:border-r md:[&:nth-last-child(-n+2)]:border-b-0"
              key={item.label}
            >
              <div className="flex items-center gap-2.5 text-sm font-medium text-slate-500 dark:text-slate-400">
                <Icon className="h-[18px] w-[18px] shrink-0" />
                {item.label}
              </div>
              <p className="mt-3 text-xl font-bold leading-tight text-slate-950 dark:text-white">
                {item.value || "Pending"}
              </p>
              {item.label === "Sales Model" ? (
                <p className="mt-2 text-xs leading-5 text-slate-500 dark:text-slate-400">
                  {SALES_MODEL_SELECTION_NOTE}
                </p>
              ) : null}
              {item.label === "Demand Model" ? (
                <p className="mt-2 text-xs leading-5 text-slate-500 dark:text-slate-400">
                  {DEMAND_MODEL_SELECTION_NOTE}
                </p>
              ) : null}
            </div>
          );
        })}
        <div className="border-t border-slate-200 p-5 dark:border-slate-800 md:col-span-2">
          <div className="flex items-center gap-2.5 text-sm font-medium text-slate-500 dark:text-slate-400">
            <Clock className="h-[18px] w-[18px] shrink-0" />
            Last Updated
          </div>
          <p className="mt-3 text-xl font-bold leading-tight text-slate-950 dark:text-white">
            {lastUpdated}
          </p>
        </div>
      </div>
    </footer>
  );
}

export default function DemandForecastingPage() {
  const { data, isLoading: isBreakdownLoading } = useAnalytics();
  const [monthlySales, setMonthlySales] = useState<MonthlySalesRow[]>([]);
  const [excelData, setExcelData] = useState<ForecastExcelData | null>(null);
  const [excelError, setExcelError] = useState<string | null>(null);
  const [isExcelLoading, setIsExcelLoading] = useState(true);
  const [isMonthlySalesLoading, setIsMonthlySalesLoading] = useState(true);

  useEffect(() => {
    let isMounted = true;

    DataService.loadMonthlySalesData()
      .then((loadedMonthlySales) => {
        if (!isMounted) return;
        setMonthlySales(loadedMonthlySales);
      })
      .catch(() => {
        if (isMounted) setMonthlySales([]);
      })
      .finally(() => {
        if (isMounted) setIsMonthlySalesLoading(false);
      });

    loadForecastExcelData()
      .then((loadedData) => {
        if (!isMounted) return;
        setExcelData(loadedData);
        setExcelError(null);
      })
      .catch((loadError: unknown) => {
        if (!isMounted) return;
        setExcelError(loadError instanceof Error ? loadError.message : "Unable to load forecast Excel files.");
      })
      .finally(() => {
        if (isMounted) setIsExcelLoading(false);
      });
    return () => {
      isMounted = false;
    };
  }, []);

  const isPageLoading = isExcelLoading || isMonthlySalesLoading;

  const forecastRows = useMemo(
    () =>
      (excelData?.forecastResults ?? []).map((row, index, rows) => {
        const previous = rows[index - 1]?.forecastedSales;
        return {
          date: row.date,
          forecastDemand: row.forecastedDemand,
          forecastSales: row.forecastedSales,
          name: monthLabel(row.date),
          trendIndicator: trendIndicator(row.forecastedSales, previous)
        };
      }),
    [excelData]
  );

  const bestDemandModel = useMemo(() => bestModel(excelData?.modelComparison ?? [], "Demand"), [excelData]);

  const chartData = useMemo(() => {
    const historical = monthlySales.slice(-18).map((row) => ({
      date: row.date,
      historicalSales: row.sales,
      name: monthLabel(row.date)
    }));
    const forecast = forecastRows.map((row) => ({
      date: row.date,
      forecastSales: Number(row.forecastSales),
      name: String(row.name)
    }));
    return [...historical, ...forecast];
  }, [forecastRows, monthlySales]);

  const forecastLineData = useMemo(
    () =>
      forecastRows.map((row) => ({
        date: row.date,
        forecastDemand: Number(row.forecastDemand),
        forecastSales: Number(row.forecastSales),
        name: String(row.name)
      })),
    [forecastRows]
  );

  const lastHistoricalSalesBeforeForecast = useMemo(() => {
    const firstForecastDate = new Date(String(forecastRows[0]?.date ?? ""));
    const eligibleRows = monthlySales.filter((row) => {
      const parsedDate = new Date(row.date);
      return !Number.isNaN(parsedDate.getTime()) && !Number.isNaN(firstForecastDate.getTime()) && parsedDate < firstForecastDate;
    });
    return Number(eligibleRows.at(-1)?.sales ?? monthlySales.at(-1)?.sales ?? 0);
  }, [forecastRows, monthlySales]);

  const growthData = useMemo(
    () =>
      forecastRows.map((row, index) => {
        const previous = index === 0 ? lastHistoricalSalesBeforeForecast : Number(forecastRows[index - 1]?.forecastSales ?? row.forecastSales);
        const current = Number(row.forecastSales);
        return {
          date: row.date,
          growth: index === 0 || !previous ? 0 : ((current - previous) / previous) * 100,
          name: String(row.name)
        };
      }),
    [forecastRows, lastHistoricalSalesBeforeForecast]
  );

  const forecastSummary = useMemo(() => {
    let totalForecast = 0;
    let totalDemand = 0;
    let peakForecast = forecastRows[0];
    let lowestForecast = forecastRows[0];

    for (const row of forecastRows) {
      totalForecast += Number(row.forecastSales);
      totalDemand += Number(row.forecastDemand);
      if (!peakForecast || Number(row.forecastSales) > Number(peakForecast.forecastSales)) peakForecast = row;
      if (!lowestForecast || Number(row.forecastSales) < Number(lowestForecast.forecastSales)) lowestForecast = row;
    }

    return { lowestForecast, peakForecast, totalDemand, totalForecast };
  }, [forecastRows]);
  const { lowestForecast, peakForecast, totalDemand, totalForecast } = forecastSummary;
  const forecastBreakdowns = useMemo(() => {
    return ForecastAllocationService.build(
      data?.salesInventory ?? [],
      totalForecast,
      totalDemand
    );
  }, [data, totalDemand, totalForecast]);
  const averageForecast = forecastRows.length ? totalForecast / forecastRows.length : 0;
  const lastGrowth = Number(growthData.at(-1)?.growth ?? 0);
  const businessRecommendation = recommendationFromTrend(lastGrowth);

  const tableRows: ForecastTableRow[] = forecastRows.map((row, index) => {
    const previousSales = index === 0 ? lastHistoricalSalesBeforeForecast : Number(forecastRows[index - 1]?.forecastSales ?? row.forecastSales);
    const previousDemand = Number(forecastRows[index - 1]?.forecastDemand ?? row.forecastDemand);
    const currentSales = Number(row.forecastSales);
    const currentDemand = Number(row.forecastDemand);
    const growth = index === 0 || !previousSales ? 0 : ((currentSales - previousSales) / previousSales) * 100;
    const demandChange = index === 0 || !previousDemand ? 0 : ((currentDemand - previousDemand) / previousDemand) * 100;
    return {
      date: row.date,
      demandChange,
      forecastDemand: formatNumber(currentDemand),
      forecastSales: formatCompactCurrency(currentSales),
      growth,
      month: monthLabel(String(row.date)),
      planningSignal: planningSignal(growth),
      trendIndicator: String(row.trendIndicator)
    };
  });

  const kpis = bestDemandModel ? [
    { description: "Months covered by Excel forecast", icon: CalendarRange, label: "Forecast Horizon", sparkline: "flat" as const, tone: "neutral", trend: "neutral" as const, value: `${forecastRows.length} Months` },
    { description: "Total forecasted sales value", icon: BadgeIndianRupee, label: "Expected Sales", sparkline: lastGrowth >= 0 ? "up" as const : "down" as const, tone: "success", trend: lastGrowth >= 0 ? "up" as const : "down" as const, value: formatCompactCurrency(totalForecast) },
    { description: "Total forecasted product demand", icon: PackageCheck, label: "Expected Demand", sparkline: "up" as const, tone: "warning", trend: "up" as const, value: formatNumber(totalDemand) },
    { description: "Highest forecasted sales period", icon: TrendingUp, label: "Peak Forecast Month", sparkline: "up" as const, tone: "danger", trend: "up" as const, value: monthLabel(String(peakForecast.date)) },
    { description: "Average forecasted sales per month", icon: BarChart3, label: "Average Monthly Forecast", sparkline: "flat" as const, tone: "neutral", trend: "neutral" as const, value: formatCompactCurrency(averageForecast) },
    { description: "Lowest forecasted sales period", icon: TrendingDown, label: "Lowest Forecast Month", sparkline: "down" as const, tone: "neutral", trend: "down" as const, value: monthLabel(String(lowestForecast.date)) },
    { description: "Start replenishment before the peak", icon: Target, label: "Inventory Planning Month", sparkline: "up" as const, tone: "warning", trend: "up" as const, value: monthLabel(String(peakForecast.date)) }
  ] : [];

  return (
    <div className="space-y-8">
      <ForecastHero />
      {isPageLoading ? <LoadingSkeleton /> : null}
      {!isPageLoading && !excelData && excelError ? (
        <section className="rounded-3xl border border-amber-200 bg-amber-50 p-4 text-sm font-medium text-amber-800 dark:border-amber-500/20 dark:bg-amber-500/10 dark:text-amber-100">
          Forecast data is unavailable. Check the browser console for details.
        </section>
      ) : null}
      {!isPageLoading && excelData ? (
        <>
          <section className="grid gap-5 sm:grid-cols-2 xl:grid-cols-4">
            <SelectedModelsKpiCard
              demandModel={bestDemandModel?.model ?? ""}
              salesModel={SALES_MODEL_NAME}
            />
            {kpis.map((kpi) => (
              <ExecutiveKpiCard key={kpi.label} {...kpi} />
            ))}
          </section>
          <ForecastExecutiveRibbon
            breakdowns={forecastBreakdowns}
            isLoading={isBreakdownLoading}
            monthlyForecast={forecastLineData}
          />
          <section className="grid gap-6 xl:grid-cols-2">
            <ForecastVsActualChart data={chartData} forecastStart={String(forecastRows[0]?.name)} />
            <SingleForecastTrendChart
              color={colors.red}
              data={forecastLineData}
              dataKey="forecastSales"
              formatter={formatCompactCurrency}
              title="Sales Forecast Trend"
              valueLabel="Forecast Sales"
            />
            <SingleForecastTrendChart
              color={colors.navy}
              data={forecastLineData}
              dataKey="forecastDemand"
              formatter={formatNumber}
              title="Demand Forecast Trend"
              valueLabel="Forecast Demand"
            />
            <SalesDemandChart data={forecastLineData} />
            <ForecastBreakdownCharts
              breakdowns={forecastBreakdowns}
              isLoading={isBreakdownLoading}
              monthlyForecast={forecastLineData}
            />
            <GrowthChart data={growthData} />
            <ForecastTable rows={tableRows} />
            <ModelEvaluation rows={excelData.modelComparison} />
            <ChartCard className="xl:col-span-2" exportData={forecastLineData.map((row) => ({ demand: row.forecastDemand ?? "", month: row.name, sales: row.forecastSales ?? "" }))} title="Forecast Planning Signal">
              <div className="grid h-64 content-center gap-4">
                {[
                  { color: colors.green, icon: Activity, label: "Sales Outlook", value: formatCompactCurrency(totalForecast) },
                  { color: colors.navy, icon: BarChart3, label: "Demand Outlook", value: formatNumber(totalDemand) },
                  { color: colors.red, icon: Sparkles, label: "Inventory Recommendation", value: businessRecommendation }
                ].map((item) => {
                  const Icon = item.icon;
                  return (
                    <article className="flex items-center gap-4 rounded-2xl border border-slate-200 bg-slate-50 p-4 dark:border-slate-800 dark:bg-slate-950/50" key={item.label}>
                      <div className="grid h-12 w-12 place-items-center rounded-2xl bg-white shadow-sm dark:bg-slate-900" style={{ color: item.color }}>
                        <Icon className="h-5 w-5" />
                      </div>
                      <div>
                        <p className="text-sm font-semibold text-slate-500 dark:text-slate-400">{item.label}</p>
                        <p className="text-lg font-black leading-snug text-slate-950 dark:text-white">{item.value}</p>
                      </div>
                    </article>
                  );
                })}
              </div>
            </ChartCard>
          </section>
          <ForecastFooter
            demandModel={bestDemandModel?.model ?? ""}
            horizon={forecastRows.length}
            salesModel={SALES_MODEL_NAME}
          />
        </>
      ) : null}
    </div>
  );
}

