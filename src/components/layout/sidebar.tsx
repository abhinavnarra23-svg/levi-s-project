"use client";

import { AnimatePresence, motion } from "framer-motion";
import { ChevronLeft, ChevronRight, X } from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";

import { IconButton } from "@/components/ui/icon-button";
import { navigationItems } from "@/lib/navigation";
import { cn } from "@/lib/utils";

type SidebarProps = {
  collapsed: boolean;
  mobileOpen: boolean;
  onCollapseToggle: () => void;
  onMobileClose: () => void;
};

function SidebarContent({
  collapsed,
  onCollapseToggle,
  onMobileClose,
  isMobile = false
}: Pick<SidebarProps, "collapsed" | "onCollapseToggle" | "onMobileClose"> & {
  isMobile?: boolean;
}) {
  const pathname = usePathname();

  return (
    <div className="flex h-full flex-col bg-brand-sidebar text-white">
      <div className="flex h-20 items-center justify-between border-b border-white/10 px-5">
        <Link
          aria-label="Levi's Sales and Inventory Analytics"
          className="group flex min-w-0 items-center gap-3"
          href="/"
          onClick={isMobile ? onMobileClose : undefined}
        >
          <span className="grid h-11 w-11 shrink-0 place-items-center rounded-2xl bg-brand-red text-sm font-bold shadow-lg shadow-red-950/25 transition-transform duration-300 group-hover:scale-105">
            LS
          </span>
          <span
            className={cn(
              "min-w-0 transition-opacity duration-200",
              collapsed && !isMobile ? "pointer-events-none opacity-0" : "opacity-100"
            )}
          >
            <span className="block truncate text-sm font-semibold leading-5">
              Levi&apos;s Analytics
            </span>
            <span className="block truncate text-xs text-slate-400">
              Sales and Inventory
            </span>
          </span>
        </Link>
        {isMobile ? (
          <IconButton
            className="border-white/10 bg-white/5 text-slate-300 hover:bg-white/10 hover:text-white"
            label="Close navigation"
            onClick={onMobileClose}
          >
            <X className="h-5 w-5" />
          </IconButton>
        ) : null}
      </div>

      <nav className="flex-1 space-y-2.5 px-3 py-5">
        {navigationItems.map((item) => {
          const Icon = item.icon;
          const isActive =
            item.href === "/" ? pathname === "/" : pathname.startsWith(item.href);

          return (
            <Link
              className={cn(
                "group flex h-12 items-center gap-3 rounded-2xl px-3 text-sm font-medium text-slate-300 transition-all duration-200 hover:translate-x-1 hover:bg-white/[0.08] hover:text-white focus:outline-none focus:ring-2 focus:ring-white/20",
                isActive &&
                  "bg-brand-red text-white shadow-lg shadow-red-950/25 hover:translate-x-0 hover:bg-brand-red",
                collapsed && !isMobile && "justify-center px-0"
              )}
              href={item.href}
              key={item.href}
              onClick={isMobile ? onMobileClose : undefined}
              title={collapsed && !isMobile ? item.title : undefined}
            >
              <Icon
                className={cn(
                  "h-5 w-5 shrink-0",
                  isActive ? "text-white" : "text-slate-400 group-hover:text-white"
                )}
              />
              <span
                className={cn(
                  "truncate transition-opacity duration-200",
                  collapsed && !isMobile
                    ? "pointer-events-none hidden opacity-0"
                    : "opacity-100"
                )}
              >
                {item.title}
              </span>
            </Link>
          );
        })}
      </nav>

      <div className="border-t border-white/10 p-4">
        {isMobile ? null : (
          <button
            className={cn(
              "flex h-11 w-full items-center justify-center gap-2 rounded-2xl border border-white/10 bg-white/5 text-sm font-medium text-slate-300 transition-all duration-200 hover:-translate-y-0.5 hover:bg-white/10 hover:text-white focus:outline-none focus:ring-2 focus:ring-white/20",
              collapsed && "px-0"
            )}
            onClick={onCollapseToggle}
            type="button"
          >
            {collapsed ? (
              <ChevronRight className="h-5 w-5" />
            ) : (
              <ChevronLeft className="h-5 w-5" />
            )}
            {collapsed ? null : <span>Collapse</span>}
          </button>
        )}
      </div>
    </div>
  );
}

export function Sidebar({
  collapsed,
  mobileOpen,
  onCollapseToggle,
  onMobileClose
}: SidebarProps) {
  return (
    <>
      <aside
        className={cn(
          "fixed inset-y-0 left-0 z-40 hidden overflow-hidden border-r border-slate-900/10 shadow-2xl shadow-slate-950/10 transition-[width] duration-300 ease-out lg:block",
          collapsed ? "w-[92px]" : "w-[280px]"
        )}
      >
        <SidebarContent
          collapsed={collapsed}
          onCollapseToggle={onCollapseToggle}
          onMobileClose={onMobileClose}
        />
      </aside>

      <AnimatePresence>
        {mobileOpen ? (
          <>
            <motion.button
              aria-label="Close navigation overlay"
              className="fixed inset-0 z-50 bg-slate-950/55 backdrop-blur-sm lg:hidden"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={onMobileClose}
              type="button"
            />
            <motion.aside
              className="fixed inset-y-0 left-0 z-50 w-[min(86vw,320px)] overflow-hidden shadow-2xl lg:hidden"
              initial={{ x: "-100%" }}
              animate={{ x: 0 }}
              exit={{ x: "-100%" }}
              transition={{ duration: 0.24, ease: "easeOut" }}
            >
              <SidebarContent
                collapsed={false}
                isMobile
                onCollapseToggle={onCollapseToggle}
                onMobileClose={onMobileClose}
              />
            </motion.aside>
          </>
        ) : null}
      </AnimatePresence>
    </>
  );
}
