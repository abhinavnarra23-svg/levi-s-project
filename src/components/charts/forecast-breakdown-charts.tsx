"use client";

import { motion } from "framer-motion";
import { Building2, CalendarRange, PackageSearch, Store, TrendingUp, type LucideIcon } from "lucide-react";
import { memo, useMemo } from "react";
import {
  Bar,
  BarChart,
  CartesianGrid,
  LabelList,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis
} from "recharts";

import { ChartCard } from "@/components/charts/chart-card";
import { formatNumber } from "@/lib/formatters";
import type { ForecastBreakdownDatum, ForecastBreakdowns } from "@/services/ForecastAllocationService";

type Metric = "forecastDemand" | "forecastSales";
type Dimension = "Department" | "Season" | "Store";
type MonthlyForecast = {
  forecastDemand?: number;
  forecastSales?: number;
  name: string;
};

const palette = {
  grid: "#E5E7EB",
  navy: "#003049",
  red: "#C1121F"
};

const axisStyle = { fill: "#000000", fontSize: 12, fontWeight: 600 };
const seasonOrder = ["Summer", "Monsoon", "Winter", "Spring"];

function compactCurrency(value: number) {
  const formatter = new Intl.NumberFormat("en-IN", {
    currency: "INR",
    maximumFractionDigits: 2,
    style: "currency"
  });
  const absolute = Math.abs(value);
  if (absolute >= 10000000) return `${formatter.format(value / 10000000)} Cr`;
  if (absolute >= 100000) return `${formatter.format(value / 100000)} L`;
  return formatter.format(value);
}

function metricValue(item: ForecastBreakdownDatum, metric: Metric) {
  return Number(item[metric] ?? 0);
}

function metricLabel(metric: Metric) {
  return metric === "forecastSales" ? "Sales" : "Demand";
}

function metricFormatter(metric: Metric, value: number) {
  return metric === "forecastSales" ? compactCurrency(value) : formatNumber(value);
}

function metricColor(metric: Metric) {
  return metric === "forecastSales" ? palette.red : palette.navy;
}

function forecastHorizon(monthlyForecast: MonthlyForecast[]) {
  const first = monthlyForecast[0]?.name;
  const last = monthlyForecast.at(-1)?.name;
  return first && last ? `${first} – ${last}` : "the 12-month forecast horizon";
}

function EmptyForecast() {
  return (
    <div className="grid h-[420px] place-items-center rounded-2xl border border-dashed border-slate-200 text-sm font-semibold text-slate-950 dark:border-slate-700 dark:text-white">
      No forecast breakdown is available for the current filters.
    </div>
  );
}

function BreakdownTooltip({
  active,
  metric,
  payload,
  total
}: {
  active?: boolean;
  metric: Metric;
  payload?: Array<{ payload?: ForecastBreakdownDatum; value?: number }>;
  total: number;
}) {
  if (!active || !payload?.length || !payload[0]?.payload) return null;
  const row = payload[0].payload;
  const value = Number(payload[0].value ?? row[metric]);
  const share = total ? (value / total) * 100 : 0;

  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-4 text-sm text-slate-950 shadow-panel dark:border-slate-700 dark:bg-slate-950 dark:text-white">
      <p className="font-bold">{row.name}</p>
      <p className="mt-2 font-semibold">Forecast {metricLabel(metric)}: {metricFormatter(metric, value)}</p>
      <p className="font-semibold">Contribution: {share.toFixed(1)}%</p>
    </div>
  );
}

function ExecutiveForecastCard({
  datum,
  icon: Icon,
  label
}: {
  datum?: ForecastBreakdownDatum;
  icon: LucideIcon;
  label: string;
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
          <p className="text-sm font-medium text-slate-500 dark:text-slate-400">{label}</p>
          <div className="mt-2 flex items-center gap-2">
            <p className="truncate text-2xl font-black text-slate-950 dark:text-white">{datum?.name ?? "N/A"}</p>
            <TrendingUp className="h-4 w-4 shrink-0 text-brand-ink dark:text-brand-blue" />
          </div>
        </div>
        <div className="grid h-11 w-11 shrink-0 place-items-center rounded-2xl bg-red-50 text-brand-red dark:bg-red-500/10">
          <Icon className="h-5 w-5" />
        </div>
      </div>
      <div className="mt-3 grid grid-cols-2 gap-2 text-xs">
        <div className="rounded-xl bg-slate-50 px-2.5 py-2 dark:bg-slate-950/60">
          <p className="text-slate-500 dark:text-slate-400">Sales</p>
          <p className="mt-1 truncate font-black text-slate-950 dark:text-white">{compactCurrency(Number(datum?.forecastSales ?? 0))}</p>
        </div>
        <div className="rounded-xl bg-slate-50 px-2.5 py-2 dark:bg-slate-950/60">
          <p className="text-slate-500 dark:text-slate-400">Demand</p>
          <p className="mt-1 truncate font-black text-slate-950 dark:text-white">{formatNumber(Number(datum?.forecastDemand ?? 0))}</p>
        </div>
      </div>
    </motion.article>
  );
}

const IndependentForecastChart = memo(function IndependentForecastChart({
  data,
  descriptionOverride,
  dimension,
  horizon,
  horizontal = false,
  metric,
  sortOrder,
  titleOverride
}: {
  data: ForecastBreakdownDatum[];
  descriptionOverride?: string;
  dimension: Dimension;
  horizon: string;
  horizontal?: boolean;
  metric: Metric;
  sortOrder?: string[];
  titleOverride?: string;
}) {
  const sortedData = useMemo(() => [...data].sort((a, b) => {
    if (!sortOrder) return metricValue(b, metric) - metricValue(a, metric);
    const aIndex = sortOrder.indexOf(a.name);
    const bIndex = sortOrder.indexOf(b.name);
    if (aIndex === -1 && bIndex === -1) return a.name.localeCompare(b.name);
    if (aIndex === -1) return 1;
    if (bIndex === -1) return -1;
    return aIndex - bIndex;
  }), [data, metric, sortOrder]);
  const chartDataKey = useMemo(() => sortedData.map((item) => item.name).join("|"), [sortedData]);
  const metricTotal = useMemo(
    () => sortedData.reduce((sum, item) => sum + metricValue(item, metric), 0),
    [metric, sortedData]
  );
  const horizontalChartStyle = useMemo(
    () => ({ height: Math.max(420, sortedData.length * 92) }),
    [sortedData.length]
  );
  const categoryAxisWidth = useMemo(
    () => Math.max(116, ...sortedData.map((item) => item.name.length * 7.5 + 20)),
    [sortedData]
  );
  const exportData = useMemo(
    () => sortedData.map((item) => ({ name: item.name, forecastDemand: item.forecastDemand, forecastSales: item.forecastSales })),
    [sortedData]
  );
  const title = titleOverride ?? `${dimension}-wise 12-Month ${metricLabel(metric)} Forecast`;
  const description = descriptionOverride ?? `Aggregated Forecast: ${horizon}`;

  return (
    <ChartCard allowFullscreen emphasizeTitle description={description} exportData={exportData} title={title}>
      {!sortedData.length ? <EmptyForecast /> : horizontal ? (
        <div className="overflow-visible pr-1">
          <div style={horizontalChartStyle}>
            <ResponsiveContainer height="100%" width="100%">
              <BarChart data={sortedData} key={`${metric}-${chartDataKey}`} layout="vertical" margin={{ bottom: 8, left: 8, right: 72, top: 8 }}>
                <CartesianGrid horizontal={false} stroke={palette.grid} strokeDasharray="4 4" />
                <XAxis hide type="number" />
                <YAxis dataKey="name" interval={0} tick={axisStyle} tickLine={false} type="category" width={categoryAxisWidth} />
                <Tooltip content={<BreakdownTooltip metric={metric} total={metricTotal} />} />
                <Bar animationDuration={600} dataKey={metric} fill={metricColor(metric)} name={`Forecast ${metricLabel(metric)}`} radius={[0, 8, 8, 0]}>
                  <LabelList formatter={(value: unknown) => metricFormatter(metric, Number(value))} position="right" style={{ fill: "#000000", fontSize: 10, fontWeight: 700 }} />
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      ) : (
        <div className="h-[420px]">
          <ResponsiveContainer height="100%" width="100%">
            <BarChart data={sortedData} margin={{ bottom: 70, left: 8, right: 12, top: 32 }}>
              <CartesianGrid stroke={palette.grid} strokeDasharray="4 4" vertical={false} />
              <XAxis dataKey="name" height={82} interval={0} tick={{ ...axisStyle, fontSize: 10 }} tickLine={false} angle={-30} textAnchor="end" />
              <YAxis tick={axisStyle} tickFormatter={(value) => metricFormatter(metric, Number(value))} tickLine={false} width={78} />
              <Tooltip content={<BreakdownTooltip metric={metric} total={metricTotal} />} />
              <Bar animationDuration={600} dataKey={metric} fill={metricColor(metric)} name={`Forecast ${metricLabel(metric)}`} radius={[8, 8, 0, 0]}>
                <LabelList formatter={(value: unknown) => metricFormatter(metric, Number(value))} position="top" style={{ fill: "#000000", fontSize: 9, fontWeight: 700 }} />
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>
      )}
    </ChartCard>
  );
});

export function ForecastExecutiveRibbon({
  breakdowns,
  isLoading,
  monthlyForecast
}: {
  breakdowns: ForecastBreakdowns;
  isLoading: boolean;
  monthlyForecast: MonthlyForecast[];
}) {
  const executiveData = useMemo(() => {
    const highest = (data: ForecastBreakdownDatum[]) => data.reduce<ForecastBreakdownDatum | undefined>(
      (top, item) => !top || item.forecastSales > top.forecastSales ? item : top,
      undefined
    );
    const month = monthlyForecast.reduce<MonthlyForecast | undefined>(
      (top, item) => !top || Number(item.forecastSales ?? 0) > Number(top.forecastSales ?? 0) ? item : top,
      undefined
    );
    return {
      department: highest(breakdowns.departments),
      month: month ? { forecastDemand: Number(month.forecastDemand ?? 0), forecastSales: Number(month.forecastSales ?? 0), name: month.name } : undefined,
      season: highest(breakdowns.seasons),
      store: highest(breakdowns.stores)
    };
  }, [breakdowns, monthlyForecast]);

  if (isLoading) {
    return (
      <div className="grid gap-5 sm:grid-cols-2 xl:grid-cols-4">
        {Array.from({ length: 4 }, (_, index) => <div className="h-[126px] animate-pulse rounded-3xl bg-slate-200 dark:bg-slate-800" key={index} />)}
      </div>
    );
  }

  return (
    <div className="grid gap-5 sm:grid-cols-2 xl:grid-cols-4">
      <ExecutiveForecastCard datum={executiveData.store} icon={Store} label="Top Forecast Store" />
      <ExecutiveForecastCard datum={executiveData.department} icon={Building2} label="Top Forecast Department" />
      <ExecutiveForecastCard datum={executiveData.season} icon={PackageSearch} label="Peak Forecast Season" />
      <ExecutiveForecastCard datum={executiveData.month} icon={CalendarRange} label="Highest Forecast Month" />
    </div>
  );
}

export function ForecastBreakdownCharts({
  breakdowns,
  isLoading,
  monthlyForecast
}: {
  breakdowns: ForecastBreakdowns;
  isLoading: boolean;
  monthlyForecast: MonthlyForecast[];
}) {
  const horizon = useMemo(() => forecastHorizon(monthlyForecast), [monthlyForecast]);
  const storeForecast = breakdowns.stores;
  const departmentForecast = breakdowns.departments;
  const seasonForecast = breakdowns.seasons;
  const hasCompleteForecast = storeForecast.length > 0 && departmentForecast.length > 0 && seasonForecast.length > 0;

  if (isLoading || !hasCompleteForecast) {
    return (
      <>
        {Array.from({ length: 6 }, (_, index) => (
          <div className="h-[520px] animate-pulse rounded-3xl bg-slate-200 dark:bg-slate-800" key={index} />
        ))}
      </>
    );
  }

  return (
    <>
      <IndependentForecastChart data={departmentForecast} dimension="Department" horizon={horizon} metric="forecastSales" />
      <IndependentForecastChart data={departmentForecast} dimension="Department" horizon={horizon} metric="forecastDemand" />
      <IndependentForecastChart
        data={storeForecast}
        descriptionOverride={`Forecast aggregated across all Levi's stores (${horizon})`}
        dimension="Store"
        horizon={horizon}
        horizontal
        metric="forecastSales"
        titleOverride="Store-wise 12-Month Sales Forecast (All Stores)"
      />
      <IndependentForecastChart
        data={storeForecast}
        descriptionOverride={`Forecast aggregated across all Levi's stores (${horizon})`}
        dimension="Store"
        horizon={horizon}
        horizontal
        metric="forecastDemand"
        titleOverride="Store-wise 12-Month Demand Forecast (All Stores)"
      />
      <IndependentForecastChart
        data={seasonForecast}
        descriptionOverride={`Forecast aggregated by season (${horizon})`}
        dimension="Season"
        horizon={horizon}
        metric="forecastSales"
        sortOrder={seasonOrder}
      />
      <IndependentForecastChart
        data={seasonForecast}
        descriptionOverride={`Forecast aggregated by season (${horizon})`}
        dimension="Season"
        horizon={horizon}
        metric="forecastDemand"
        sortOrder={seasonOrder}
      />
    </>
  );
}
