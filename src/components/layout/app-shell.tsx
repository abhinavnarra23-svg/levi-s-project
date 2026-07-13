"use client";

import { useEffect, useState, type ReactNode } from "react";

import { Sidebar } from "@/components/layout/sidebar";
import { TopNavbar } from "@/components/layout/top-navbar";

type AppShellProps = {
  children: ReactNode;
};

export function AppShell({ children }: AppShellProps) {
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);
  const [isMobileSidebarOpen, setIsMobileSidebarOpen] = useState(false);
  const [isDarkMode, setIsDarkMode] = useState(false);

  useEffect(() => {
    document.documentElement.classList.toggle("dark", isDarkMode);
  }, [isDarkMode]);

  return (
    <div className="min-h-screen bg-brand-canvas text-brand-ink transition-colors dark:bg-slate-950 dark:text-slate-100">
      <Sidebar
        collapsed={isSidebarCollapsed}
        mobileOpen={isMobileSidebarOpen}
        onCollapseToggle={() => setIsSidebarCollapsed((value) => !value)}
        onMobileClose={() => setIsMobileSidebarOpen(false)}
      />
      <div
        className="flex min-h-screen flex-col transition-[padding] duration-300 ease-out lg:pl-[280px] lg:data-[collapsed=true]:pl-[92px]"
        data-collapsed={isSidebarCollapsed}
      >
        <TopNavbar
          isDarkMode={isDarkMode}
          onMobileMenu={() => setIsMobileSidebarOpen(true)}
          onThemeToggle={() => setIsDarkMode((value) => !value)}
        />
        <main className="flex-1 px-4 py-8 sm:px-6 lg:px-8">
          <div className="mx-auto w-full max-w-[1440px]">{children}</div>
        </main>
      </div>
    </div>
  );
}
