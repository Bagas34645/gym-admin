import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

const statusStyles: Record<string, string> = {
  active: "bg-emerald-100 text-emerald-800 dark:bg-emerald-900/30 dark:text-emerald-400",
  inactive: "bg-zinc-100 text-zinc-700 dark:bg-zinc-800 dark:text-zinc-300",
  expired: "bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-400",
  suspended: "bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400",
  pending: "bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400",
  manual_verified: "bg-emerald-100 text-emerald-800",
  auto_verified: "bg-sky-100 text-sky-800",
};

const labels: Record<string, string> = {
  active: "Aktif",
  inactive: "Tidak aktif",
  expired: "Kedaluwarsa",
  suspended: "Ditangguhkan",
  pending: "Menunggu",
  manual_verified: "Terverifikasi",
  auto_verified: "Otomatis",
  expiring_soon: "Segera berakhir",
};

export function StatusBadge({ status }: { status: string }) {
  const key = status.toLowerCase();
  return (
    <Badge variant="outline" className={cn("border-0 font-medium", statusStyles[key])}>
      {labels[key] ?? status}
    </Badge>
  );
}
