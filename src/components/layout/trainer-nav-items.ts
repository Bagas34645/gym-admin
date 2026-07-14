import { Dumbbell, LayoutDashboard } from "lucide-react";
import type { LucideIcon } from "lucide-react";

export interface TrainerNavItem {
  title: string;
  href: string;
  icon: LucideIcon;
}

export const trainerNavItems: TrainerNavItem[] = [
  { title: "Dashboard", href: "/trainer", icon: LayoutDashboard },
  { title: "Program Latihan", href: "/trainer/workout-plans", icon: Dumbbell },
];
