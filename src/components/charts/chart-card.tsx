"use client";

import { motion } from "framer-motion";
import { Download, FileCode2, ImageDown, Maximize2 } from "lucide-react";
import { useRef, type ReactNode } from "react";

type ChartCardProps = {
  title: string;
  description?: string;
  children: ReactNode;
  className?: string;
  exportData?: Array<Record<string, string | number>>;
  allowFullscreen?: boolean;
  emphasizeTitle?: boolean;
};

export function ChartCard({
  title,
  description,
  children,
  className = "",
  exportData = [],
  allowFullscreen = false,
  emphasizeTitle = false
}: ChartCardProps) {
  const cardRef = useRef<HTMLElement | null>(null);

  function downloadCsv() {
    if (!exportData.length) return;
    const columns = Object.keys(exportData[0]);
    const csv = [
      columns.join(","),
      ...exportData.map((row) =>
        columns
          .map((column) => `"${String(row[column] ?? "").replace(/"/g, '""')}"`)
          .join(",")
      )
    ].join("\n");
    const blob = new Blob([csv], { type: "text/csv;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `${title.toLowerCase().replace(/[^a-z0-9]+/g, "-")}.csv`;
    link.click();
    URL.revokeObjectURL(url);
  }

  function downloadImage() {
    const svg = cardRef.current?.querySelector("svg");
    if (!svg) return;
    const serialized = new XMLSerializer().serializeToString(svg);
    const image = new Image();
    const svgBlob = new Blob([serialized], { type: "image/svg+xml;charset=utf-8" });
    const url = URL.createObjectURL(svgBlob);
    image.onload = () => {
      const canvas = document.createElement("canvas");
      canvas.width = image.width || 1200;
      canvas.height = image.height || 600;
      const context = canvas.getContext("2d");
      if (!context) return;
      context.fillStyle = "#ffffff";
      context.fillRect(0, 0, canvas.width, canvas.height);
      context.drawImage(image, 0, 0);
      URL.revokeObjectURL(url);
      const link = document.createElement("a");
      link.href = canvas.toDataURL("image/png");
      link.download = `${title.toLowerCase().replace(/[^a-z0-9]+/g, "-")}.png`;
      link.click();
    };
    image.src = url;
  }

  function downloadSvg() {
    const svg = cardRef.current?.querySelector("svg");
    if (!svg) return;
    const serialized = new XMLSerializer().serializeToString(svg);
    const blob = new Blob([serialized], { type: "image/svg+xml;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `${title.toLowerCase().replace(/[^a-z0-9]+/g, "-")}.svg`;
    link.click();
    URL.revokeObjectURL(url);
  }

  function openFullscreen() {
    void cardRef.current?.requestFullscreen();
  }

  return (
    <motion.section
      ref={cardRef}
      className={`rounded-3xl border border-slate-200/90 bg-white p-5 shadow-panel transition-shadow duration-300 dark:border-slate-800 dark:bg-slate-900/80 ${className}`}
      initial={{ opacity: 0, y: 18 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, amount: 0.18 }}
      whileHover={{ y: -3 }}
      transition={{ duration: 0.25, ease: "easeOut" }}
    >
      <div className="mb-5 flex flex-wrap items-start justify-between gap-3">
        <div>
          <h3 className={emphasizeTitle ? "text-xl font-bold text-black dark:text-white" : "text-lg font-semibold text-slate-950 dark:text-white"}>
            {title}
          </h3>
          {description ? (
            <p className={emphasizeTitle ? "mt-1 text-xs leading-5 text-slate-400 dark:text-slate-400" : "mt-1 text-sm leading-6 text-slate-500 dark:text-slate-400"}>
              {description}
            </p>
          ) : null}
        </div>
        <div className="flex items-center gap-2">
          {allowFullscreen ? (
            <button
              className="grid h-9 w-9 place-items-center rounded-xl border border-slate-200 bg-slate-50 text-slate-500 shadow-sm transition duration-200 hover:-translate-y-0.5 hover:border-red-200 hover:bg-red-50 hover:text-brand-red focus:outline-none focus:ring-2 focus:ring-brand-red/30 dark:border-slate-700 dark:bg-slate-950 dark:text-slate-300"
              onClick={openFullscreen}
              title="Open fullscreen"
              type="button"
            >
              <Maximize2 className="h-4 w-4" />
            </button>
          ) : null}
          <button
            className="grid h-9 w-9 place-items-center rounded-xl border border-slate-200 bg-slate-50 text-slate-500 shadow-sm transition duration-200 hover:-translate-y-0.5 hover:border-red-200 hover:bg-red-50 hover:text-brand-red focus:outline-none focus:ring-2 focus:ring-brand-red/30 dark:border-slate-700 dark:bg-slate-950 dark:text-slate-300"
            onClick={downloadCsv}
            title="Download CSV"
            type="button"
          >
            <Download className="h-4 w-4" />
          </button>
          <button
            className="grid h-9 w-9 place-items-center rounded-xl border border-slate-200 bg-slate-50 text-slate-500 shadow-sm transition duration-200 hover:-translate-y-0.5 hover:border-red-200 hover:bg-red-50 hover:text-brand-red focus:outline-none focus:ring-2 focus:ring-brand-red/30 dark:border-slate-700 dark:bg-slate-950 dark:text-slate-300"
            onClick={downloadImage}
            title="Download PNG"
            type="button"
          >
            <ImageDown className="h-4 w-4" />
          </button>
          <button
            className="grid h-9 w-9 place-items-center rounded-xl border border-slate-200 bg-slate-50 text-slate-500 shadow-sm transition duration-200 hover:-translate-y-0.5 hover:border-red-200 hover:bg-red-50 hover:text-brand-red focus:outline-none focus:ring-2 focus:ring-brand-red/30 dark:border-slate-700 dark:bg-slate-950 dark:text-slate-300"
            onClick={downloadSvg}
            title="Download SVG"
            type="button"
          >
            <FileCode2 className="h-4 w-4" />
          </button>
        </div>
      </div>
      {children}
    </motion.section>
  );
}
