"use client";

import { Bar, BarChart, CartesianGrid, XAxis, YAxis } from "recharts";
import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
  type ChartConfig,
} from "@/components/ui/chart";
import { formatChartDate, formatCompactNumber } from "@/lib/format";
import { ChartEmptyState } from "@/components/charts/chart-empty-state";
import type { DashboardGroupBy } from "@/components/charts/chart-config";
import { cn } from "@/lib/utils";

export function AnalyticsBarChart({
  data,
  config,
  dataKey = "value",
  categoryKey = "label",
  groupBy = "day",
  valueFormatter,
  heightClassName = "h-[280px]",
}: {
  data: Record<string, string | number>[];
  config: ChartConfig;
  dataKey?: string;
  categoryKey?: string;
  groupBy?: DashboardGroupBy;
  valueFormatter?: (value: number) => string;
  heightClassName?: string;
}) {
  if (!data.length) {
    return <ChartEmptyState />;
  }

  return (
    <ChartContainer config={config} className={cn("aspect-auto w-full", heightClassName)}>
      <BarChart data={data} margin={{ top: 8, right: 8, left: 0, bottom: 0 }}>
        <CartesianGrid vertical={false} strokeDasharray="3 3" />
        <XAxis
          dataKey={categoryKey}
          tickLine={false}
          axisLine={false}
          tickMargin={8}
          minTickGap={16}
          tickFormatter={(value) =>
            categoryKey === "date"
              ? formatChartDate(String(value), groupBy)
              : String(value)
          }
        />
        <YAxis
          tickLine={false}
          axisLine={false}
          tickMargin={8}
          width={48}
          tickFormatter={(value) => formatCompactNumber(Number(value))}
        />
        <ChartTooltip
          content={
            <ChartTooltipContent
              labelFormatter={(value) =>
                categoryKey === "date"
                  ? formatChartDate(String(value), groupBy)
                  : String(value)
              }
              formatter={(value) =>
                valueFormatter
                  ? valueFormatter(Number(value))
                  : Number(value).toLocaleString("id-ID")
              }
            />
          }
        />
        <Bar
          dataKey={dataKey}
          fill="var(--color-count, var(--color-value))"
          radius={[4, 4, 0, 0]}
        />
      </BarChart>
    </ChartContainer>
  );
}
