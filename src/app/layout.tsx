import type { Metadata } from "next";

import { AppShell } from "@/components/layout/app-shell";
import { AnalyticsProvider } from "@/context/analytics-context";

import "./globals.css";

export const metadata: Metadata = {
  title: "Levi's Sales and Inventory Analytics",
  description: "Enterprise analytics shell for MBA business analytics workflows."
};

export default function RootLayout({
  children
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body>
        <AnalyticsProvider>
          <AppShell>{children}</AppShell>
        </AnalyticsProvider>
      </body>
    </html>
  );
}
