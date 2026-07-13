import {
  BarChart3,
  Boxes,
  BrainCircuit,
  CheckCircle2,
  FileText,
  GitBranch,
  GraduationCap,
  Home,
  Layers3,
  LineChart,
  Medal,
  PackageCheck,
  Sparkles,
  Trophy,
  type LucideIcon
} from "lucide-react";
import type { ReactNode } from "react";

import { PageHeader } from "@/components/ui/page-header";
import { SectionHeader } from "@/components/ui/section-header";

const problemStatement =
  "Levi's operates across multiple retail stores and generates large volumes of sales and inventory data. However, changing customer demand, seasonal variations, and inventory ageing make it difficult to maintain optimal stock levels and ensure product availability across stores. These challenges can lead to excess inventory, accumulation of slow-moving and dead stock, inefficient inventory utilization, and difficulties in meeting customer demand, ultimately affecting overall business performance and operational decision-making.";

const objectives = [
  "Evaluate inventory availability and ageing patterns across stores and products.",
  "Identify fast-moving, slow-moving and dead-stock products.",
  "Analyze sales performance across stores, products, seasons and time periods.",
  "Examine the relationship between inventory ageing, stock availability and sales performance.",
  "Forecast future sales and product demand using machine learning models."
];

const technologyGroups = [
  { items: ["Python"], title: "Programming" },
  { items: ["Pandas", "NumPy"], title: "Data Processing" },
  { items: ["Scikit-Learn", "Random Forest", "XGBoost", "Gradient Boosting", "Linear Regression"], title: "Machine Learning" },
  { items: ["React", "Next.js", "TypeScript", "Tailwind CSS", "Framer Motion"], title: "Frontend" },
  { items: ["Recharts"], title: "Visualization" },
  { items: ["Microsoft Excel"], title: "Data Source" }
];

const workflow = [
  "Raw Retail Dataset",
  "Data Cleaning",
  "Exploratory Data Analysis",
  "Feature Engineering",
  "Relationship Analysis",
  "Machine Learning Model Development",
  "Model Evaluation",
  "Sales Forecasting",
  "Demand Forecasting",
  "Interactive Dashboard"
];

const modelGroups = [
  {
    models: [
      { best: true, name: "Random Forest" },
      { best: false, name: "XGBoost" },
      { best: false, name: "Gradient Boosting" },
      { best: false, name: "Linear Regression" }
    ],
    title: "Sales Forecast Models"
  },
  {
    models: [
      { best: true, name: "XGBoost" },
      { best: false, name: "Gradient Boosting" },
      { best: false, name: "Random Forest" },
      { best: false, name: "Linear Regression" }
    ],
    title: "Demand Forecast Models"
  }
];

const modules = [
  {
    icon: Home,
    purpose: "Project overview and navigation.",
    title: "Home"
  },
  {
    icon: Boxes,
    purpose: "Inventory availability, stock movement, ageing analysis and dead-stock identification.",
    title: "Inventory Analytics"
  },
  {
    icon: BarChart3,
    purpose: "Revenue trends, seasonal analysis, product performance, store comparison and sales KPIs.",
    title: "Sales Analytics"
  },
  {
    icon: GitBranch,
    purpose: "Relationship analysis between inventory ageing, inventory availability, sales quantity and revenue using comparative visualizations.",
    title: "Relationship Analytics"
  },
  {
    icon: LineChart,
    purpose: "Sales forecasting, demand forecasting, forecast comparison and machine learning prediction results.",
    title: "Forecast Analytics"
  },
  {
    icon: FileText,
    purpose: "Project documentation, objectives, workflow, methodology, technologies.",
    title: "About Project"
  }
];

const datasetOverview = [
  { label: "Brand", value: "Levi's" },
  { label: "Stores", value: "5" },
  { label: "Products", value: "9,366" },
  { label: "Years Covered", value: "2021-2026" },
  { label: "Forecast Horizon", value: "12 Months" },
  { label: "Sales Forecast Model", value: "Random Forest" },
  { label: "Demand Forecast Model", value: "XGBoost" }
];

const developerDetails = [
  { label: "Developer", value: "Narra Abhinav" },
  { label: "Program", value: "MBA Business Analytics" },
  { label: "University", value: "Anurag University" },
  { label: "Internship", value: "Business Analytics Intern, Sri Devi Group" },
  { label: "Major Project", value: "Levi's Sales and Inventory Analytics" },
  { label: "Best Sales Forecast Model", value: "Random Forest" },
  { label: "Best Demand Forecast Model", value: "XGBoost" },
  { label: "Dataset", value: "Retail Sales & Inventory" }
];

const highlights = [
  { description: "Interactive sales performance analysis across stores, products, seasons and time periods.", icon: BarChart3, title: "Sales Analytics" },
  { description: "Inventory availability, stock movement, ageing analysis and dead-stock identification.", icon: Boxes, title: "Inventory Analytics" },
  { description: "Relationship analysis between inventory ageing, stock availability, sales quantity and revenue.", icon: GitBranch, title: "Relationship Analytics" },
  { description: "Sales and demand forecasting with model evaluation and forecast comparison.", icon: LineChart, title: "Forecast Analytics" },
  { description: "Machine learning prediction workflow using evaluated regression models.", icon: Sparkles, title: "Machine Learning Prediction" },
  { description: "Interactive dashboard experience for analyzing retail sales, inventory and forecasting outcomes.", icon: BrainCircuit, title: "Interactive Business Intelligence Dashboard" }
];

const methodology = [
  "Data Collection",
  "Data Cleaning",
  "Exploratory Data Analysis",
  "Feature Engineering",
  "Relationship Analysis",
  "Machine Learning",
  "Model Evaluation",
  "Sales Forecasting",
  "Demand Forecasting",
  "Interactive Dashboard"
];

const achievements = [
  "Developed a complete Sales and Inventory Analytics platform for Levi's.",
  "Built Inventory Analytics for stock availability, ageing and dead-stock identification.",
  "Developed Sales Analytics with revenue, seasonal and store-level analysis.",
  "Performed Relationship Analytics between inventory ageing, stock availability, sales quantity and revenue.",
  "Compared multiple machine learning algorithms for forecasting.",
  "Selected Random Forest as the best Sales Forecast model.",
  "Selected XGBoost as the best Demand Forecast model.",
  "Generated 12-month Sales and Demand forecasts.",
  "Integrated forecasting into an interactive business intelligence dashboard."
];

function PremiumCard({
  children,
  className = ""
}: {
  children: ReactNode;
  className?: string;
}) {
  return (
    <section className={`rounded-3xl border border-slate-200/90 bg-white p-8 shadow-panel dark:border-slate-800 dark:bg-slate-900/80 ${className}`}>
      {children}
    </section>
  );
}

function IconCard({
  description,
  icon: Icon,
  title
}: {
  description: string;
  icon: LucideIcon;
  title: string;
}) {
  return (
    <div className="rounded-3xl border border-slate-200/90 bg-slate-50 p-5 transition duration-300 hover:-translate-y-0.5 hover:border-red-200 hover:bg-white hover:shadow-xl dark:border-slate-800 dark:bg-slate-950/70 dark:hover:bg-slate-900">
      <div className="mb-4 grid h-12 w-12 place-items-center rounded-2xl bg-red-50 text-brand-red dark:bg-red-500/10">
        <Icon className="h-6 w-6" />
      </div>
      <h3 className="text-base font-semibold text-slate-950 dark:text-white">{title}</h3>
      <p className="mt-2 text-sm leading-6 text-slate-600 dark:text-slate-300">{description}</p>
    </div>
  );
}

function GoldBadge() {
  return (
    <span className="inline-flex items-center gap-1 rounded-full border border-amber-200 bg-amber-50 px-2.5 py-1 text-xs font-semibold text-amber-700 dark:border-amber-500/30 dark:bg-amber-500/10 dark:text-amber-300">
      <Trophy className="h-3.5 w-3.5" />
      Best Model
    </span>
  );
}

export default function AboutProjectPage() {
  return (
    <div className="space-y-10">
      <PageHeader
        eyebrow="MBA Business Analytics"
        title="Levi's Sales and Inventory Analytics"
        description="An end-to-end Business Analytics platform developed to analyze sales performance, inventory availability, stock movement, relationship analysis, and machine learning-based sales and demand forecasting for strategic retail decision-making."
      />

      <PremiumCard>
        <SectionHeader title="Problem Statement" />
        <p className="mt-5 max-w-6xl text-base leading-8 text-slate-600 dark:text-slate-300">
          {problemStatement}
        </p>
      </PremiumCard>

      <section className="grid gap-6 lg:grid-cols-[1fr_1.1fr]">
        <PremiumCard>
          <SectionHeader title="Objectives" />
          <div className="mt-6 space-y-4">
            {objectives.map((objective) => (
              <div className="flex gap-3 rounded-2xl border border-slate-100 bg-slate-50 p-4 dark:border-slate-800 dark:bg-slate-950/70" key={objective}>
                <CheckCircle2 className="mt-0.5 h-5 w-5 shrink-0 text-brand-red" />
                <p className="text-sm leading-6 text-slate-600 dark:text-slate-300">{objective}</p>
              </div>
            ))}
          </div>
        </PremiumCard>

        <PremiumCard>
          <SectionHeader title="Technology Stack" />
          <div className="mt-6 grid gap-4 md:grid-cols-2">
            {technologyGroups.map((group) => (
              <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4 dark:border-slate-800 dark:bg-slate-950" key={group.title}>
                <p className="text-sm font-semibold text-slate-950 dark:text-white">{group.title}</p>
                <div className="mt-3 flex flex-wrap gap-2">
                  {group.items.map((item) => (
                    <span className="rounded-full border border-slate-200 bg-white px-3 py-1.5 text-xs font-medium text-slate-600 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-300" key={item}>
                      {item}
                    </span>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </PremiumCard>
      </section>

      <PremiumCard>
        <SectionHeader title="Analytics Workflow" />
        <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-4 xl:grid-cols-6">
          {workflow.map((step, index) => (
            <div className="relative rounded-2xl border border-slate-200 bg-slate-50 p-4 dark:border-slate-800 dark:bg-slate-950" key={step}>
              <Layers3 className="mb-3 h-5 w-5 text-brand-red" />
              <p className="text-sm font-semibold text-slate-800 dark:text-slate-100">{step}</p>
              {index < workflow.length - 1 ? (
                <span className="absolute -right-3 top-1/2 hidden h-6 w-6 -translate-y-1/2 items-center justify-center rounded-full bg-white text-xs font-bold text-brand-red shadow-sm dark:bg-slate-900 xl:flex">
                  -
                </span>
              ) : null}
            </div>
          ))}
        </div>
      </PremiumCard>

      <section className="grid gap-6 lg:grid-cols-2">
        {modelGroups.map((group) => (
          <PremiumCard key={group.title}>
            <SectionHeader title={group.title} />
            <div className="mt-6 space-y-3">
              {group.models.map((model) => (
                <div className={`flex items-center justify-between gap-4 rounded-2xl border p-4 ${model.best ? "border-amber-200 bg-amber-50/70 dark:border-amber-500/30 dark:bg-amber-500/10" : "border-slate-200 bg-slate-50 dark:border-slate-800 dark:bg-slate-950"}`} key={model.name}>
                  <div className="flex items-center gap-3">
                    <Medal className={`h-5 w-5 ${model.best ? "text-amber-500" : "text-slate-400"}`} />
                    <p className="text-sm font-semibold text-slate-800 dark:text-slate-100">{model.name}</p>
                  </div>
                  {model.best ? <GoldBadge /> : null}
                </div>
              ))}
            </div>
          </PremiumCard>
        ))}
      </section>

      <PremiumCard>
        <SectionHeader title="Application Modules" />
        <div className="mt-6 grid gap-5 md:grid-cols-2 xl:grid-cols-4">
          {modules.map((module) => (
            <IconCard description={module.purpose} icon={module.icon} key={module.title} title={module.title} />
          ))}
        </div>
      </PremiumCard>

      <section className="grid gap-6 lg:grid-cols-[1fr_0.9fr]">
        <PremiumCard>
          <SectionHeader title="Dataset Overview" />
          <div className="mt-6 grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
            {datasetOverview.map((item) => (
              <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4 dark:border-slate-800 dark:bg-slate-950" key={item.label}>
                <p className="text-sm font-medium text-slate-500 dark:text-slate-400">{item.label}</p>
                <p className="mt-2 text-xl font-semibold text-slate-950 dark:text-white">{item.value}</p>
              </div>
            ))}
          </div>
        </PremiumCard>

        <PremiumCard>
          <SectionHeader title="Developer" />
          <div className="mt-6 flex items-start gap-4">
            <div className="grid h-14 w-14 shrink-0 place-items-center rounded-2xl bg-red-50 text-brand-red dark:bg-red-500/10">
              <GraduationCap className="h-7 w-7" />
            </div>
            <div>
              <h2 className="text-3xl font-semibold text-slate-950 dark:text-white">Narra Abhinav</h2>
              <div className="mt-5 grid gap-3">
                {developerDetails.map((item) => (
                  <div className="flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-slate-100 bg-slate-50 px-4 py-3 dark:border-slate-800 dark:bg-slate-950/70" key={item.label}>
                    <span className="text-sm font-medium text-slate-500 dark:text-slate-400">{item.label}</span>
                    <span className="text-sm font-semibold text-slate-900 dark:text-white">{item.value}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </PremiumCard>
      </section>

      <PremiumCard>
        <SectionHeader title="Project Highlights" />
        <div className="mt-6 grid gap-5 md:grid-cols-2 xl:grid-cols-3">
          {highlights.map((highlight) => (
            <IconCard description={highlight.description} icon={highlight.icon} key={highlight.title} title={highlight.title} />
          ))}
        </div>
      </PremiumCard>

      <PremiumCard>
        <SectionHeader title="Analytics Methodology" />
        <div className="mt-6 rounded-3xl border border-slate-100 bg-slate-50 p-5 dark:border-slate-800 dark:bg-slate-950/70">
          <div className="flex flex-wrap items-center gap-3">
            {methodology.map((step, index) => (
              <div className="flex items-center gap-3" key={step}>
                <span className="rounded-full border border-slate-200 bg-white px-4 py-2 text-sm font-semibold text-slate-700 shadow-sm dark:border-slate-700 dark:bg-slate-900 dark:text-slate-200">
                  {step}
                </span>
                {index < methodology.length - 1 ? <span className="text-brand-red">-</span> : null}
              </div>
            ))}
          </div>
        </div>
      </PremiumCard>

      <PremiumCard>
        <SectionHeader title="Key Achievements" />
        <div className="mt-6 grid gap-4 md:grid-cols-2">
          {achievements.map((achievement) => (
            <div className="flex gap-3 rounded-2xl border border-slate-100 bg-slate-50 p-4 dark:border-slate-800 dark:bg-slate-950/70" key={achievement}>
              <PackageCheck className="mt-0.5 h-5 w-5 shrink-0 text-brand-red" />
              <p className="text-sm leading-6 text-slate-600 dark:text-slate-300">{achievement}</p>
            </div>
          ))}
        </div>
      </PremiumCard>
    </div>
  );
}
