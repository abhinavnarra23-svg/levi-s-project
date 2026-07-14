"use client";

import { motion } from "framer-motion";
import { useMemo, type ReactNode } from "react";
import {
  ArrowRight,
  BarChart3,
  Boxes,
  BrainCircuit,
  CheckCircle2,
  Crown,
  Database,
  Gauge,
  Layers3,
  LineChart,
  PackageCheck,
  PieChart,
  SearchCheck,
  Sparkles,
  TrendingUp
} from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { useAnalytics } from "@/context/analytics-context";
import { KPIService } from "@/services/KPIService";

const sectionMotion = {
  initial: { opacity: 0, y: 28 },
  whileInView: { opacity: 1, y: 0 },
  viewport: { once: true, amount: 0.18 },
  transition: { duration: 0.55, ease: "easeOut" }
} as const;

const objectives = [
  {
    title: "Inventory Availability",
    description: "Monitor inventory availability and ageing across stores and products.",
    icon: PackageCheck
  },
  {
    title: "Stock Movement",
    description: "Identify fast-moving, slow-moving and dead-stock products.",
    icon: Boxes
  },
  {
    title: "Sales Performance",
    description: "Analyze revenue trends across products, stores, seasons and time.",
    icon: TrendingUp
  },
  {
    title: "Relationship Analysis",
    description: "Study the relationship between inventory ageing, stock availability and sales performance.",
    icon: SearchCheck
  },
  {
    title: "Demand Forecasting",
    description: "Forecast future sales and demand with department, store and season-level analysis.",
    icon: LineChart
  }
];

const stack = [
  "Python",
  "Pandas",
  "NumPy",
  "Scikit-Learn",
  "Random Forest",
  "XGBoost",
  "Gradient Boosting",
  "Linear Regression",
  "React",
  "Next.js",
  "Tailwind",
  "Recharts",
  "Power BI",
  "Excel"
];

const workflow = [
  "Raw Data",
  "Data Cleaning",
  "Exploratory Data Analysis",
  "Feature Engineering",
  "Machine Learning Models",
  "Model Evaluation",
  "Sales Forecasting",
  "Demand Forecasting",
  "Interactive Dashboard"
];

const features = [
  {
    title: "Sales Analytics",
    icon: BarChart3,
    items: ["Revenue trends", "Store comparison", "Product analysis", "Interactive KPIs"]
  },
  {
    title: "Inventory Analytics",
    icon: Boxes,
    items: ["Inventory ageing", "Stock movement", "Dead stock detection", "Availability analysis"]
  },
  {
    title: "Forecast Analytics",
    icon: LineChart,
    items: ["Department forecasts", "All-store forecasts", "Season forecasts", "Model comparison"]
  },
  {
    title: "Relationship Analytics",
    icon: BrainCircuit,
    items: ["Sales relationships", "Inventory relationships", "Ageing analysis", "Revenue patterns"]
  },
  {
    title: "Interactive Visualizations",
    icon: PieChart,
    items: ["Professional charts", "Forecast trends", "Comparisons", "Interactive tables"]
  },
  {
    title: "Responsive Dashboard",
    icon: Gauge,
    items: ["Desktop optimized", "Tablet compatible", "Responsive layout", "Modern UI"]
  }
];

const intelligenceCards = [
  {
    title: "Sales Intelligence",
    copy: "Revenue trends, product performance, store comparisons and growth analytics."
  },
  {
    title: "Inventory Control",
    copy: "Inventory ageing, stock movement, availability and dead-stock analysis."
  },
  {
    title: "Forecast Analytics",
    copy: "Machine Learning sales and demand forecasts analyzed across departments, all stores and seasons."
  }
];

const machineLearningModels = [
  { badge: "Gold Badge", model: "Random Forest", role: "Sales Forecast", tone: "bg-amber-100 text-amber-800 dark:bg-amber-500/15 dark:text-amber-200" },
  { badge: "Gold Badge", model: "XGBoost", role: "Demand Forecast", tone: "bg-amber-100 text-amber-800 dark:bg-amber-500/15 dark:text-amber-200" },
  { badge: "Silver Badge", model: "Gradient Boosting", role: "Alternative Trained Model", tone: "bg-slate-200 text-slate-700 dark:bg-slate-700 dark:text-slate-200" },
  { badge: "Bronze Badge", model: "Linear Regression", role: "Baseline Regression Model", tone: "bg-orange-100 text-orange-800 dark:bg-orange-500/15 dark:text-orange-200" }
];

function SectionHeading({
  eyebrow,
  title,
  description
}: {
  eyebrow: string;
  title: string;
  description?: string;
}) {
  return (
    <div className="max-w-3xl space-y-3">
      <p className="text-sm font-semibold uppercase tracking-[0.18em] text-brand-red">
        {eyebrow}
      </p>
      <h2 className="text-3xl font-semibold tracking-normal text-slate-950 dark:text-white">
        {title}
      </h2>
      {description ? (
        <p className="text-base leading-7 text-slate-600 dark:text-slate-300">
          {description}
        </p>
      ) : null}
    </div>
  );
}

function PremiumCard({
  children,
  className = ""
}: {
  children: ReactNode;
  className?: string;
}) {
  return (
    <motion.div
      className={`rounded-3xl border border-slate-200 bg-white p-6 shadow-panel transition-shadow dark:border-slate-800 dark:bg-slate-900/80 ${className}`}
      whileHover={{ y: -6, scale: 1.01 }}
      transition={{ duration: 0.2, ease: "easeOut" }}
    >
      {children}
    </motion.div>
  );
}

export default function HomePage() {
  const { data, filteredRows } = useAnalytics();
  const homeStats = useMemo(
    () => KPIService.homeStats(filteredRows, data?.modelMetrics ?? []),
    [data, filteredRows]
  );

  return (
    <div className="space-y-16 pb-8">
      <motion.section
        className="relative overflow-hidden rounded-[2rem] border border-slate-200 bg-white px-6 pb-12 pt-6 shadow-soft dark:border-slate-800 dark:bg-slate-900/80 sm:px-10 lg:px-14 lg:pb-16 lg:pt-6"
        initial={{ opacity: 0, y: 24 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.55, ease: "easeOut" }}
      >
        <div className="absolute inset-x-0 top-0 h-1 bg-brand-red" />
        <div className="grid gap-10 lg:grid-cols-[1.1fr_0.9fr] lg:items-center">
          <div className="flex max-w-4xl flex-col items-center text-center">
            <div className="mt-5 mb-4 flex w-full items-center justify-center">
              <Image
                alt="Levi's Logo"
                className="h-auto w-[140px] object-contain md:w-[170px] lg:w-[200px]"
                height={104}
                priority
                src="/images/levis-logo.png"
                width={200}
              />
            </div>
            <div className="mb-[18px] inline-flex items-center gap-2 rounded-full border border-red-100 bg-red-50 px-4 py-2 text-sm font-medium text-brand-red dark:border-red-500/20 dark:bg-red-500/10">
              <Sparkles className="h-4 w-4" />
              MBA Business Analytics Final Project
            </div>
            <div className="space-y-5">
              <h1 className="max-w-5xl text-4xl font-bold leading-tight tracking-normal text-slate-950 dark:text-white sm:text-5xl lg:text-[48px]">
                Levi&apos;s Sales and Inventory Analytics
              </h1>
              <p className="max-w-3xl text-base leading-8 text-slate-600 dark:text-slate-300 sm:text-lg">
                Enterprise Business Intelligence platform integrating Sales Analytics,
                Inventory Analytics and Machine Learning based Forecast Analytics for retail decision making.
              </p>
            </div>
            <div className="mt-8 flex flex-col items-center gap-3 sm:flex-row sm:justify-center">
              <motion.div whileHover={{ scale: 1.03 }} whileTap={{ scale: 0.98 }}>
                <Link
                  className="inline-flex h-12 items-center justify-center gap-2 rounded-2xl bg-brand-red px-6 text-sm font-semibold text-white shadow-lg shadow-red-900/20 transition hover:bg-red-700 focus:outline-none focus:ring-4 focus:ring-red-200"
                  href="/inventory-analytics"
                >
                  Explore Analytics
                  <ArrowRight className="h-4 w-4" />
                </Link>
              </motion.div>
              <motion.div whileHover={{ scale: 1.03 }} whileTap={{ scale: 0.98 }}>
                <Link
                  className="inline-flex h-12 items-center justify-center rounded-2xl border border-slate-200 bg-white px-6 text-sm font-semibold text-slate-700 shadow-sm transition hover:border-slate-300 hover:text-slate-950 focus:outline-none focus:ring-4 focus:ring-slate-200 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-200"
                  href="/about-project"
                >
                  About Project
                </Link>
              </motion.div>
            </div>
          </div>

          <div className="rounded-3xl border border-slate-200 bg-slate-50 p-5 shadow-inner dark:border-slate-800 dark:bg-slate-950/40">
            <div className="space-y-4 rounded-2xl bg-white p-5 shadow-panel dark:bg-slate-900">
              <div className="grid gap-3 sm:grid-cols-2">
                {homeStats.filter((stat) => stat.label !== "Forecast Model").map((stat) => (
                  <div className="rounded-2xl border border-slate-100 bg-slate-50 p-4 dark:border-slate-800 dark:bg-slate-950/50" key={stat.label}>
                    <p className="text-xs font-semibold uppercase tracking-[0.14em] text-slate-500 dark:text-slate-400">
                      {stat.label}
                    </p>
                    <p className="mt-2 text-xl font-bold text-slate-950 dark:text-white">
                      {stat.value}
                    </p>
                  </div>
                ))}
              </div>
              <div className="rounded-2xl border border-slate-100 bg-slate-50 p-4 dark:border-slate-800 dark:bg-slate-950/50">
                <p className="text-xs font-semibold uppercase tracking-[0.14em] text-slate-500 dark:text-slate-400">
                  Selected Forecast Models
                </p>
                <div className="mt-3 grid gap-2 sm:grid-cols-2">
                  <div className="rounded-2xl bg-blue-50 px-3 py-2 dark:bg-blue-500/10">
                    <p className="text-[11px] font-bold uppercase tracking-wide text-blue-600">Sales</p>
                    <p className="mt-1 text-sm font-black text-slate-950 dark:text-white">Random Forest</p>
                  </div>
                  <div className="rounded-2xl bg-amber-50 px-3 py-2 dark:bg-amber-500/10">
                    <p className="text-[11px] font-bold uppercase tracking-wide text-amber-600">Demand</p>
                    <p className="mt-1 text-sm font-black text-slate-950 dark:text-white">XGBoost</p>
                  </div>
                </div>
              </div>
              {intelligenceCards.map(({ title, copy }) => (
                <div
                  className="flex items-start gap-3 rounded-2xl border border-slate-100 p-4 dark:border-slate-800"
                  key={title}
                >
                  <CheckCircle2 className="mt-0.5 h-5 w-5 text-brand-red" />
                  <div>
                    <p className="text-sm font-semibold text-slate-950 dark:text-white">
                      {title}
                    </p>
                    <p className="mt-1 text-sm leading-6 text-slate-500 dark:text-slate-400">
                      {copy}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </motion.section>

      <motion.section className="space-y-8" id="problem-statement" {...sectionMotion}>
        <SectionHeading
          eyebrow="Project Overview"
          title="A decision workspace for retail analytics"
          description="The platform frames business questions around sales performance, inventory availability, and demand planning in a clean executive experience."
        />
        <PremiumCard>
          <div className="flex flex-col gap-5 lg:flex-row lg:items-start">
            <div className="grid h-14 w-14 shrink-0 place-items-center rounded-2xl bg-red-50 text-brand-red dark:bg-red-500/10">
              <Database className="h-7 w-7" />
            </div>
            <div className="space-y-3">
              <h3 className="text-lg font-semibold text-slate-950 dark:text-white">
                Problem Statement
              </h3>
              <p className="max-w-5xl text-base leading-8 text-slate-600 dark:text-slate-300">
                Levi&apos;s operates across multiple retail stores and generates large volumes of sales and inventory data.
                However, changing customer demand, seasonal variations, and inventory ageing make it difficult to maintain optimal stock levels and ensure product availability across stores.
                These challenges can lead to excess inventory, accumulation of slow-moving and dead stock, inefficient inventory utilization, and difficulties in meeting customer demand, ultimately affecting overall business performance and operational decision-making.
              </p>
            </div>
          </div>
        </PremiumCard>
      </motion.section>

      <motion.section className="space-y-8" {...sectionMotion}>
        <SectionHeading
          eyebrow="Objectives"
          title="Focused business questions, presented clearly"
        />
        <div className="grid gap-6 md:grid-cols-2 xl:grid-cols-5">
          {objectives.map((objective) => {
            const Icon = objective.icon;

            return (
              <PremiumCard className="min-h-56" key={objective.title}>
                <div className="space-y-5">
                  <div className="grid h-14 w-14 place-items-center rounded-2xl bg-slate-100 text-brand-red dark:bg-slate-800">
                    <Icon className="h-7 w-7" />
                  </div>
                  <div className="space-y-2">
                    <h3 className="text-lg font-semibold text-slate-950 dark:text-white">
                      {objective.title}
                    </h3>
                    <p className="text-sm leading-6 text-slate-500 dark:text-slate-400">
                      {objective.description}
                    </p>
                  </div>
                </div>
              </PremiumCard>
            );
          })}
        </div>
      </motion.section>

      <motion.section className="space-y-8" {...sectionMotion}>
        <SectionHeading
          eyebrow="Technology Stack"
          title="Analytics, machine learning, and modern interface tools"
        />
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4 xl:grid-cols-7">
          {stack.map((tool) => (
            <motion.div
              className="flex min-h-24 items-center justify-center rounded-2xl border border-slate-200 bg-white px-4 text-center text-sm font-semibold text-slate-700 shadow-sm transition dark:border-slate-800 dark:bg-slate-900 dark:text-slate-200"
              key={tool}
              whileHover={{ y: -5, scale: 1.02 }}
              transition={{ duration: 0.2, ease: "easeOut" }}
            >
              {tool}
            </motion.div>
          ))}
        </div>
      </motion.section>

      <motion.section className="space-y-8" {...sectionMotion}>
        <SectionHeading
          eyebrow="Project Workflow"
          title="From raw data to interactive intelligence"
        />
        <div className="overflow-x-auto rounded-3xl border border-slate-200 bg-white p-6 shadow-panel dark:border-slate-800 dark:bg-slate-900/80">
          <div className="flex min-w-[980px] items-center gap-4">
            {workflow.map((step, index) => (
              <div className="flex flex-1 items-center gap-4" key={step}>
                <div className="flex min-h-28 flex-1 flex-col items-center justify-center rounded-2xl border border-slate-200 bg-slate-50 px-4 text-center dark:border-slate-800 dark:bg-slate-950/40">
                  <Layers3 className="mb-3 h-5 w-5 text-brand-red" />
                  <p className="text-sm font-semibold text-slate-800 dark:text-slate-100">
                    {step}
                  </p>
                </div>
                {index < workflow.length - 1 ? (
                  <ArrowRight className="h-5 w-5 shrink-0 text-slate-300" />
                ) : null}
              </div>
            ))}
          </div>
        </div>
      </motion.section>

      <motion.section className="space-y-8" id="analytics-workspace" {...sectionMotion}>
        <SectionHeading
          eyebrow="Features"
          title="A foundation for a complete analytics suite"
        />
        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {features.map((feature) => {
            const Icon = feature.icon;

            return (
              <PremiumCard key={feature.title}>
                <div className="space-y-4">
                  <div className="flex items-center gap-4">
                  <div className="grid h-12 w-12 shrink-0 place-items-center rounded-2xl bg-red-50 text-brand-red dark:bg-red-500/10">
                    <Icon className="h-6 w-6" />
                  </div>
                  <h3 className="text-lg font-semibold text-slate-950 dark:text-white">
                    {feature.title}
                  </h3>
                  </div>
                  <div className="space-y-2">
                    {feature.items.map((item) => (
                      <p className="flex items-center gap-2 text-sm leading-6 text-slate-500 dark:text-slate-400" key={item}>
                        <CheckCircle2 className="h-4 w-4 shrink-0 text-brand-red" />
                        {item}
                      </p>
                    ))}
                  </div>
                </div>
              </PremiumCard>
            );
          })}
        </div>
      </motion.section>

      <motion.section className="space-y-8" {...sectionMotion}>
        <SectionHeading
          eyebrow="Machine Learning"
          title="Machine Learning Forecasting Engine"
          description="Forecast models selected after evaluating multiple regression algorithms."
        />
        <PremiumCard>
          <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
            {machineLearningModels.map((model) => (
              <div className="rounded-2xl border border-slate-100 bg-slate-50 p-4 dark:border-slate-800 dark:bg-slate-950/50" key={model.model}>
                <div className="mb-4 flex items-start justify-between gap-3">
                  <div className="grid h-11 w-11 place-items-center rounded-2xl bg-white text-brand-red shadow-sm dark:bg-slate-900">
                    <Crown className="h-5 w-5" />
                  </div>
                  <span className={`rounded-full px-2.5 py-1 text-[10px] font-black ${model.tone}`}>
                    {model.badge}
                  </span>
                </div>
                <p className="text-lg font-black text-slate-950 dark:text-white">{model.model}</p>
                <p className="mt-2 text-sm leading-6 text-slate-500 dark:text-slate-400">{model.role}</p>
              </div>
            ))}
          </div>
        </PremiumCard>
      </motion.section>

      <motion.footer
        className="rounded-3xl border border-slate-200 bg-white px-6 py-8 shadow-panel dark:border-slate-800 dark:bg-slate-900/80 sm:px-8"
        {...sectionMotion}
      >
        <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <p className="text-sm font-semibold uppercase tracking-[0.18em] text-brand-red">
              Developer
            </p>
            <h2 className="mt-2 text-3xl font-semibold text-slate-950 dark:text-white">
              Narra Abhinav
            </h2>
          </div>
          <div className="text-sm leading-6 text-slate-500 dark:text-slate-400 sm:text-right">
            <p>MBA Business Analytics</p>
            <p>Anurag University</p>
            <p>Academic Year 2026</p>
            <p>Levi&apos;s Sales and Inventory Analytics</p>
          </div>
        </div>
      </motion.footer>

      <motion.footer
        className="rounded-3xl border border-slate-200 bg-white px-6 py-6 text-sm shadow-panel dark:border-slate-800 dark:bg-slate-900/80 sm:px-8"
        {...sectionMotion}
      >
        <div className="flex flex-col gap-2 text-slate-500 dark:text-slate-400 sm:flex-row sm:items-center sm:justify-between">
          <p className="font-semibold text-slate-950 dark:text-white">Levi&apos;s Sales and Inventory Analytics</p>
          <p>Developed by Narra Abhinav</p>
          <p>MBA Business Analytics</p>
          <p>Machine Learning Forecasting Project</p>
          <p>© 2026</p>
        </div>
      </motion.footer>
    </div>
  );
}
