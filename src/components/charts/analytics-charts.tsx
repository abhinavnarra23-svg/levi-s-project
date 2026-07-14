"use client";

import {
  Area,
  AreaChart,
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  ComposedChart,
  LabelList,
  Legend,
  Line,
  LineChart,
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

import { ChartCard } from "@/components/charts/chart-card";

type DataRecord = Record<string, string | number>;
type HeatmapDatum = {
  name?: string;
  season?: string;
  store?: string;
  value?: number;
  x?: string;
  y?: string;
  z?: number;
};

const colors = ["#C1121F", "#669BBC", "#003049", "#FDF0D5", "#6B7280"];

const axisStyle = {
  fill: "#000000",
  fontSize: 12,
  fontWeight: 500
};

export function TrendChart({
  title,
  description,
  data,
  dataKey,
  secondaryKey
}: {
  title: string;
  description?: string;
  data: DataRecord[];
  dataKey: string;
  secondaryKey?: string;
}) {
  return (
    <ChartCard title={title} description={description} exportData={data}>
      <div className="h-80">
        <ResponsiveContainer height="100%" width="100%">
          <LineChart data={data} margin={{ bottom: 8, left: 0, right: 12, top: 8 }}>
            <CartesianGrid stroke="#E5E7EB" strokeDasharray="3 3" vertical={false} />
            <XAxis dataKey="name" tick={axisStyle} tickLine={false} />
            <YAxis tick={axisStyle} tickLine={false} />
            <Tooltip />
            <Legend wrapperStyle={{ color: "#000000", fontWeight: 500 }} />
            <Line dataKey={dataKey} dot={false} stroke="#C1121F" strokeWidth={3} type="monotone" />
            {secondaryKey ? (
              <Line dataKey={secondaryKey} dot={false} stroke="#669BBC" strokeWidth={3} type="monotone" />
            ) : null}
          </LineChart>
        </ResponsiveContainer>
      </div>
    </ChartCard>
  );
}

export function AreaAnalyticsChart({
  title,
  description,
  data,
  dataKey
}: {
  title: string;
  description?: string;
  data: DataRecord[];
  dataKey: string;
}) {
  return (
    <ChartCard title={title} description={description} exportData={data}>
      <div className="h-80">
        <ResponsiveContainer height="100%" width="100%">
          <AreaChart data={data} margin={{ bottom: 8, left: 0, right: 12, top: 8 }}>
            <defs>
              <linearGradient id={`${dataKey}-gradient`} x1="0" x2="0" y1="0" y2="1">
                <stop offset="5%" stopColor="#C1121F" stopOpacity={0.28} />
                <stop offset="95%" stopColor="#C1121F" stopOpacity={0.02} />
              </linearGradient>
            </defs>
            <CartesianGrid stroke="#E5E7EB" strokeDasharray="3 3" vertical={false} />
            <XAxis dataKey="name" tick={axisStyle} tickLine={false} />
            <YAxis tick={axisStyle} tickLine={false} />
            <Tooltip />
            <Area dataKey={dataKey} fill={`url(#${dataKey}-gradient)`} stroke="#C1121F" strokeWidth={3} type="monotone" />
          </AreaChart>
        </ResponsiveContainer>
      </div>
    </ChartCard>
  );
}

export function BarAnalyticsChart({
  title,
  description,
  data,
  dataKey,
  color = "#669BBC"
}: {
  title: string;
  description?: string;
  data: DataRecord[];
  dataKey: string;
  color?: string;
}) {
  return (
    <ChartCard title={title} description={description} exportData={data}>
      <div className="h-80">
        <ResponsiveContainer height="100%" width="100%">
          <BarChart data={data} margin={{ bottom: 8, left: 0, right: 12, top: 8 }}>
            <CartesianGrid stroke="#E5E7EB" strokeDasharray="3 3" vertical={false} />
            <XAxis dataKey="name" tick={axisStyle} tickLine={false} />
            <YAxis tick={axisStyle} tickLine={false} />
            <Tooltip />
            <Bar dataKey={dataKey} fill={color} radius={[8, 8, 0, 0]}>
              <LabelList dataKey={dataKey} position="top" style={{ fill: "#000000", fontSize: 11, fontWeight: 600 }} />
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </div>
    </ChartCard>
  );
}

export function HorizontalBarChart({
  title,
  description,
  data,
  dataKey
}: {
  title: string;
  description?: string;
  data: DataRecord[];
  dataKey: string;
}) {
  return (
    <ChartCard title={title} description={description} exportData={data}>
      <div className="h-80">
        <ResponsiveContainer height="100%" width="100%">
          <BarChart data={data} layout="vertical" margin={{ bottom: 8, left: 28, right: 12, top: 8 }}>
            <CartesianGrid stroke="#E5E7EB" strokeDasharray="3 3" horizontal={false} />
            <XAxis tick={axisStyle} tickLine={false} type="number" />
            <YAxis dataKey="name" tick={axisStyle} tickLine={false} type="category" width={110} />
            <Tooltip />
            <Bar dataKey={dataKey} fill="#C1121F" radius={[0, 8, 8, 0]}>
              <LabelList dataKey={dataKey} position="right" style={{ fill: "#000000", fontSize: 11, fontWeight: 600 }} />
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </div>
    </ChartCard>
  );
}

export function PieAnalyticsChart({
  title,
  description,
  data
}: {
  title: string;
  description?: string;
  data: DataRecord[];
}) {
  return (
    <ChartCard title={title} description={description} exportData={data}>
      <div className="h-80">
        <ResponsiveContainer height="100%" width="100%">
          <PieChart>
            <Pie data={data} dataKey="value" innerRadius={68} outerRadius={104} paddingAngle={3}>
              {data.map((entry, index) => (
                <Cell fill={colors[index % colors.length]} key={String(entry.name)} />
              ))}
            </Pie>
            <Tooltip />
            <Legend wrapperStyle={{ color: "#000000", fontWeight: 500 }} />
          </PieChart>
        </ResponsiveContainer>
      </div>
    </ChartCard>
  );
}

export function ForecastChart({
  title,
  description,
  data
}: {
  title: string;
  description?: string;
  data: DataRecord[];
}) {
  return (
    <ChartCard title={title} description={description} exportData={data}>
      <div className="h-80">
        <ResponsiveContainer height="100%" width="100%">
          <ComposedChart data={data} margin={{ bottom: 8, left: 0, right: 12, top: 8 }}>
            <CartesianGrid stroke="#E5E7EB" strokeDasharray="3 3" vertical={false} />
            <XAxis dataKey="name" tick={axisStyle} tickLine={false} />
            <YAxis tick={axisStyle} tickLine={false} />
            <Tooltip />
            <Legend wrapperStyle={{ color: "#000000", fontWeight: 500 }} />
            {"upper" in (data[0] ?? {}) ? (
              <Area dataKey="upper" fill="#669BBC" fillOpacity={0.12} stroke="none" type="monotone" />
            ) : null}
            {"lower" in (data[0] ?? {}) ? (
              <Area dataKey="lower" fill="#FFFFFF" stroke="none" type="monotone" />
            ) : null}
            {"actual" in (data[0] ?? {}) ? (
              <Line dataKey="actual" dot={false} stroke="#C1121F" strokeWidth={3} type="monotone" />
            ) : null}
            <Line dataKey="predicted" dot={false} stroke="#669BBC" strokeDasharray="6 4" strokeWidth={3} type="monotone" />
          </ComposedChart>
        </ResponsiveContainer>
      </div>
    </ChartCard>
  );
}

export function HeatmapChart({
  title,
  description,
  data
}: {
  title: string;
  description?: string;
  data: HeatmapDatum[];
}) {
  const scatterData = data.map((item) => ({
    x: String(item.x ?? item.season ?? ""),
    y: String(item.y ?? item.store ?? ""),
    z: Number(item.z ?? item.value ?? 0)
  }));

  return (
    <ChartCard title={title} description={description} exportData={scatterData}>
      <div className="h-80">
        <ResponsiveContainer height="100%" width="100%">
          <ScatterChart margin={{ bottom: 8, left: 24, right: 12, top: 8 }}>
            <CartesianGrid stroke="#E5E7EB" strokeDasharray="3 3" />
            <XAxis allowDuplicatedCategory={false} dataKey="x" name="Season" tick={axisStyle} type="category" />
            <YAxis allowDuplicatedCategory={false} dataKey="y" name="Store" tick={axisStyle} type="category" width={120} />
            <ZAxis dataKey="z" range={[120, 820]} />
            <Tooltip cursor={{ strokeDasharray: "3 3" }} />
            <Scatter data={scatterData} fill="#C1121F" />
          </ScatterChart>
        </ResponsiveContainer>
      </div>
    </ChartCard>
  );
}

export function ScatterAnalyticsChart({
  title,
  description,
  data
}: {
  title: string;
  description?: string;
  data: Array<{ x: number; y: number; z?: number; name?: string }>;
}) {
  return (
    <ChartCard title={title} description={description} exportData={data}>
      <div className="h-80">
        <ResponsiveContainer height="100%" width="100%">
          <ScatterChart margin={{ bottom: 8, left: 0, right: 12, top: 8 }}>
            <CartesianGrid stroke="#E5E7EB" strokeDasharray="3 3" />
            <XAxis dataKey="x" tick={axisStyle} tickLine={false} type="number" />
            <YAxis dataKey="y" tick={axisStyle} tickLine={false} type="number" />
            <ZAxis dataKey="z" range={[60, 180]} />
            <Tooltip cursor={{ strokeDasharray: "3 3" }} />
            <Scatter data={data} fill="#C1121F" />
          </ScatterChart>
        </ResponsiveContainer>
      </div>
    </ChartCard>
  );
}

export function DataTableCard({
  title,
  rows
}: {
  title: string;
  rows: Array<Record<string, string | number>>;
}) {
  const columns = rows[0] ? Object.keys(rows[0]) : [];

  return (
    <ChartCard title={title} exportData={rows}>
      <div className="overflow-hidden rounded-2xl border border-slate-200 dark:border-slate-800">
        <table className="w-full text-left text-sm">
          <thead className="bg-slate-50 text-slate-500 dark:bg-slate-950 dark:text-slate-400">
            <tr>
              {columns.map((column) => (
                <th className="px-4 py-3 font-semibold capitalize" key={column}>
                  {column.replace(/([A-Z])/g, " $1")}
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
            {rows.map((row) => (
              <tr key={Object.values(row).join("-")}>
                {columns.map((column) => (
                  <td className="px-4 py-3 text-slate-700 dark:text-slate-200" key={column}>
                    {row[column]}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </ChartCard>
  );
}
