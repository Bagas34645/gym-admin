import {
  LayoutDashboard,
  Users,
  Package,
  CreditCard,
  ClipboardCheck,
  CloudSun,
  Dumbbell,
  BarChart3,
  Bell,
  MessageSquare,
  MessageCircle,
  type LucideIcon,
} from "lucide-react";

export interface NavItem {
  title: string;
  href: string;
  icon: LucideIcon;
}

export const navItems: NavItem[] = [
  { title: "Dashboard", href: "/", icon: LayoutDashboard },
  { title: "Anggota", href: "/members", icon: Users },
  { title: "Paket", href: "/packages", icon: Package },
  { title: "Membership", href: "/memberships", icon: CreditCard },
  { title: "Absensi", href: "/attendance", icon: ClipboardCheck },
  { title: "Cuaca", href: "/weather", icon: CloudSun },
  { title: "Pelatih", href: "/trainers", icon: Dumbbell },
  { title: "Laporan", href: "/reports", icon: BarChart3 },
  { title: "Notifikasi", href: "/notifications", icon: Bell },
  { title: "Chat", href: "/chat", icon: MessageSquare },
  { title: "Feedback", href: "/feedback", icon: MessageCircle },
];
