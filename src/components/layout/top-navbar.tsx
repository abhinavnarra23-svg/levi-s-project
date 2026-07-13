"use client";

import { Bell, Menu, Moon, Search, Sun } from "lucide-react";

import { IconButton } from "@/components/ui/icon-button";

type TopNavbarProps = {
  isDarkMode: boolean;
  onMobileMenu: () => void;
  onThemeToggle: () => void;
};

export function TopNavbar({
  isDarkMode,
  onMobileMenu,
  onThemeToggle
}: TopNavbarProps) {
  return (
    <header className="sticky top-0 z-30 border-b border-slate-200/80 bg-white/[0.92] shadow-sm shadow-slate-950/[0.03] backdrop-blur-xl dark:border-slate-800 dark:bg-slate-950/[0.86]">
      <div className="mx-auto flex min-h-[76px] w-full max-w-[1440px] flex-wrap items-center gap-3 px-4 py-3 sm:px-6 lg:px-8">
        <IconButton className="lg:hidden" label="Open navigation" onClick={onMobileMenu}>
          <Menu className="h-5 w-5" />
        </IconButton>

        <div className="min-w-0 flex-1">
          <p className="truncate text-base font-semibold text-slate-950 dark:text-white">
            Levi&apos;s Sales and Inventory Analytics
          </p>
          <p className="hidden text-sm text-slate-500 dark:text-slate-400 sm:block">
            Home / Enterprise analytics workspace
          </p>
        </div>

        <label className="relative order-last flex w-full items-center md:order-none md:max-w-sm">
          <Search className="pointer-events-none absolute left-3 h-4 w-4 text-slate-400" />
          <input
            aria-label="Search"
            className="h-11 w-full rounded-2xl border border-slate-200 bg-white pl-10 pr-4 text-sm text-slate-700 shadow-sm outline-none transition duration-200 placeholder:text-slate-400 hover:border-slate-300 focus:border-brand-blue focus:ring-4 focus:ring-blue-100 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-200 dark:focus:border-brand-blue dark:focus:ring-blue-500/15"
            placeholder="Search workspace"
            type="search"
          />
        </label>

        <IconButton label="Notifications">
          <Bell className="h-5 w-5" />
        </IconButton>
        <IconButton label={isDarkMode ? "Use light theme" : "Use dark theme"} onClick={onThemeToggle}>
          {isDarkMode ? <Sun className="h-5 w-5" /> : <Moon className="h-5 w-5" />}
        </IconButton>
        <button
          aria-label="Profile"
          title="Profile"
          className="grid h-10 w-10 place-items-center rounded-full bg-brand-red text-sm font-semibold text-white shadow-sm ring-4 ring-red-50 transition duration-200 hover:-translate-y-0.5 hover:scale-[1.03] focus:outline-none focus:ring-4 focus:ring-brand-red/20 dark:ring-slate-800"
          type="button"
        >
          BA
        </button>
      </div>
    </header>
  );
}
