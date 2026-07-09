"use client";

import { Area, AreaChart, CartesianGrid, XAxis, YAxis } from "recharts";
import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
  type ChartConfig,
} from "@/components/ui/chart";
import { formatChartDate, formatCompactNumber } from "@/lib/format";
import { ChartEmptyState } from "@/components/charts/chart-empty-state";
import type { DashboardGroupBy } from "@/components/charts/chart-config";

export function AnalyticsAreaChart({
  data,
  config,
  groupBy = "day",
  valueFormatter,
  heightClassName = "h-[300px]",
}: {
  data: { date: string; value: number }[];
  config: ChartConfig;
  groupBy?: DashboardGroupBy;
  valueFormatter?: (value: number) => string;
  heightClassName?: string;
}) {
  if (!data.length) {
    return <ChartEmptyState />;
  }

  const chartData = data.map((item) => ({
    date: item.date,
    value: Number(item.value),
  }));

  return (
    <ChartContainer config={config} className={`aspect-auto w-full ${heightClassName}`}>
      <AreaChart data={chartData} margin={{ top: 8, right: 8, left: 0, bottom: 0 }}>
        <defs>
          <linearGradient id="fillValue" x1="0" y1="0" x2="0" y2="1">
            <stop offset="5%" stopColor="var(--color-value)" stopOpacity={0.35} />
            <stop offset="95%" stopColor="var(--color-value)" stopOpacity={0.02} />
          </linearGradient>
        </defs>
        <CartesianGrid vertical={false} strokeDasharray="3 3" />
        <XAxis
          dataKey="date"
          tickLine={false}
          axisLine={false}
          tickMargin={8}
          minTickGap={24}
          tickFormatter={(value) => formatChartDate(String(value), groupBy)}
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
                formatChartDate(String(value), groupBy)
              }
              formatter={(value) =>
                valueFormatter
                  ? valueFormatter(Number(value))
                  : Number(value).toLocaleString("id-ID")
              }
            />
          }
        />
        <Area
          type="monotone"
          dataKey="value"
          stroke="var(--color-value)"
          fill="url(#fillValue)"
          strokeWidth={2}
          dot={false}
          activeDot={{ r: 4 }}
        />
      </AreaChart>
    </ChartContainer>
  );
}
