"use client";

import { motion } from "framer-motion";
import { memo } from "react";

type PageHeaderProps = {
  eyebrow: string;
  title: string;
  description: string;
};

export const PageHeader = memo(function PageHeader({ eyebrow, title, description }: PageHeaderProps) {
  return (
    <motion.div
      className="space-y-3"
      initial={{ opacity: 0, y: 18 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.45, ease: "easeOut" }}
    >
      <p className="text-sm font-semibold uppercase tracking-[0.18em] text-brand-red">
        {eyebrow}
      </p>
      <div className="max-w-4xl space-y-3">
        <h1 className="text-4xl font-bold tracking-normal text-slate-950 dark:text-white lg:text-[48px]">
          {title}
        </h1>
        <p className="text-base leading-7 text-slate-600 dark:text-slate-300">
          {description}
        </p>
      </div>
    </motion.div>
  );
});
