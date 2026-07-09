import type { ChartConfig } from "@/components/ui/chart";

export type DashboardMetric = "members" | "attendance" | "revenue";
export type DashboardPeriod = "7d" | "30d" | "90d" | "1y";
export type DashboardGroupBy = "day" | "week" | "month";

export const PERIOD_OPTIONS: { value: DashboardPeriod; label: string }[] = [
  { value: "7d", label: "7 Hari" },
  { value: "30d", label: "30 Hari" },
  { value: "90d", label: "90 Hari" },
  { value: "1y", label: "1 Tahun" },
];

export const METRIC_LABELS: Record<DashboardMetric, string> = {
  members: "Anggota Baru",
  attendance: "Absensi",
  revenue: "Pendapatan",
};

export function resolveGroupBy(period: DashboardPeriod): DashboardGroupBy {
  if (period === "1y") return "month";
  if (period === "90d") return "week";
  return "day";
}

export function metricChartConfig(metric: DashboardMetric): ChartConfig {
  const colorMap: Record<DashboardMetric, string> = {
    members: "var(--color-chart-1)",
    attendance: "var(--color-chart-2)",
    revenue: "var(--color-chart-3)",
  };

  return {
    value: {
      label: METRIC_LABELS[metric],
      color: colorMap[metric],
    },
  };
}

export const MEMBER_STATUS_COLORS = {
  active: "oklch(0.55 0.17 145)",
  inactive: "oklch(0.58 0.2 25)",
} as const;

export const memberStatusChartConfig: ChartConfig = {
  active: { label: "Aktif", color: MEMBER_STATUS_COLORS.active },
  inactive: { label: "Tidak Aktif", color: MEMBER_STATUS_COLORS.inactive },
};

export const attendanceComparisonChartConfig: ChartConfig = {
  count: { label: "Jumlah", color: "var(--color-chart-2)" },
};

export function paymentMethodChartConfig(
  methods: string[],
): ChartConfig {
  const colors = [
    "var(--color-chart-1)",
    "var(--color-chart-2)",
    "var(--color-chart-3)",
    "var(--color-chart-4)",
    "var(--color-chart-5)",
  ];

  return Object.fromEntries(
    methods.map((method, index) => [
      method,
      {
        label: method,
        color: colors[index % colors.length],
      },
    ]),
  );
}
