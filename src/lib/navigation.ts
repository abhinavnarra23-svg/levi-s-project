import {
  BarChart3,
  Boxes,
  BrainCircuit,
  Home,
  Info,
  LineChart
} from "lucide-react";

import type { NavigationItem } from "@/types/navigation";

export const navigationItems: NavigationItem[] = [
  {
    title: "Home",
    href: "/",
    icon: Home
  },
  {
    title: "Inventory Analytics",
    href: "/inventory-analytics",
    icon: Boxes
  },
  {
    title: "Sales Analytics",
    href: "/sales-analytics",
    icon: BarChart3
  },
  {
    title: "Relationship Analytics",
    href: "/business-insights",
    icon: BrainCircuit
  },
  {
    title: "Forecast Analytics",
    href: "/demand-forecasting",
    icon: LineChart
  },
  {
    title: "About Project",
    href: "/about-project",
    icon: Info
  }
];
