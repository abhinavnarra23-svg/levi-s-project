"use client";

import { motion } from "framer-motion";
import type { LucideIcon } from "lucide-react";
import { memo } from "react";

import { cn } from "@/lib/utils";

type KpiCardProps = {
  label: string;
  value: string;
  change: string;
  tone?: "success" | "warning" | "danger" | "neutral";
  icon: LucideIcon;
};

const toneClasses = {
  danger: "bg-red-50 text-red-600 dark:bg-red-500/10 dark:text-red-300",
  neutral: "bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-300",
  success: "bg-brand-blue/15 text-brand-ink dark:bg-brand-blue/15 dark:text-brand-blue",
  warning: "bg-amber-50 text-amber-600 dark:bg-amber-500/10 dark:text-amber-300"
};

const toneTextClasses = {
  danger: "text-red-600 dark:text-red-300",
  neutral: "text-slate-500 dark:text-slate-400",
  success: "text-brand-ink dark:text-brand-blue",
  warning: "text-amber-600 dark:text-amber-300"
};

export const KpiCard = memo(function KpiCard({
  label,
  value,
  change,
  tone = "neutral",
  icon: Icon
}: KpiCardProps) {
  return (
    <motion.div
      className="h-full rounded-3xl border border-slate-200/90 bg-white p-5 shadow-panel transition-shadow duration-300 dark:border-slate-800 dark:bg-slate-900/80"
      initial={{ opacity: 0, y: 18 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, amount: 0.25 }}
      whileHover={{ y: -4 }}
      transition={{ duration: 0.25, ease: "easeOut" }}
    >
      <div className="flex items-start justify-between gap-4">
        <div className="space-y-3">
          <p className="text-sm font-medium text-slate-500 dark:text-slate-400">
            {label}
          </p>
          <p className="text-3xl font-bold tracking-normal text-slate-950 dark:text-white">
            {value}
          </p>
        </div>
        <div className={cn("grid h-11 w-11 place-items-center rounded-2xl", toneClasses[tone])}>
          <Icon className="h-5 w-5" />
        </div>
      </div>
      <p className={cn("mt-4 text-sm font-semibold", toneTextClasses[tone])}>
        {change}
      </p>
    </motion.div>
  );
});
