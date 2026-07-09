"use client";

import { Cell, Label, Pie, PieChart } from "recharts";
import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
  type ChartConfig,
} from "@/components/ui/chart";
import { ChartEmptyState } from "@/components/charts/chart-empty-state";
import { formatCurrency } from "@/lib/format";
import { cn } from "@/lib/utils";

function getSliceLabel(config: ChartConfig, key: string): string {
  const item = config[key];
  if (item && typeof item.label === "string") return item.label;
  return key;
}

function PieChartLegend({
  data,
  config,
  total,
  formatValue,
}: {
  data: { name: string; value: number }[];
  config: ChartConfig;
  total: number;
  formatValue: (value: number) => string;
}) {
  return (
    <ul className="mt-4 w-full space-y-2">
      {data.map((item) => {
        const share = total > 0 ? Math.round((item.value / total) * 100) : 0;

        return (
          <li
            key={item.name}
            className="flex items-center justify-between gap-3 rounded-md border bg-muted/20 px-3 py-2"
          >
            <div className="flex min-w-0 items-center gap-2">
              <span
                className="size-2.5 shrink-0 rounded-full"
                style={{ backgroundColor: `var(--color-${item.name})` }}
              />
              <span className="truncate text-sm font-medium">
                {getSliceLabel(config, item.name)}
              </span>
            </div>
            <div className="shrink-0 text-right">
              <p className="text-sm font-semibold tabular-nums">
                {formatValue(item.value)}
              </p>
              <p className="text-xs text-muted-foreground tabular-nums">
                {share}% dari total
              </p>
            </div>
          </li>
        );
      })}
    </ul>
  );
}

export function AnalyticsPieChart({
  data,
  config,
  valueFormatter,
  innerRadius = 60,
  showTotal = false,
  totalLabel = "Total",
  compact = false,
  showLegend = false,
  strokeWidth = 2,
  separatorColor = "var(--card)",
  className,
}: {
  data: { name: string; value: number; fill?: string }[];
  config: ChartConfig;
  valueFormatter?: (value: number) => string;
  innerRadius?: number;
  showTotal?: boolean;
  totalLabel?: string;
  compact?: boolean;
  showLegend?: boolean;
  strokeWidth?: number;
  separatorColor?: string;
  className?: string;
}) {
  if (!data.length || data.every((item) => item.value === 0)) {
    return <ChartEmptyState compact={compact} />;
  }

  const total = data.reduce((sum, item) => sum + item.value, 0);
  const formatValue =
    valueFormatter ?? ((value: number) => value.toLocaleString("id-ID"));
  const chartInnerRadius = innerRadius ?? (compact ? 42 : 60);
  const chartOuterRadius = compact ? 68 : 100;

  return (
    <div className={cn("w-full", className)}>
      <ChartContainer
        config={config}
        initialDimension={
          compact ? { width: 220, height: 220 } : { width: 320, height: 280 }
        }
        className={cn(
          "mx-auto justify-center [&_.recharts-pie-sector]:stroke-[var(--card)] [&_.recharts-responsive-container]:!aspect-square",
          compact
            ? "aspect-square h-[220px] w-full max-w-[220px]"
            : "aspect-square h-[280px] w-full max-h-[280px]",
        )}
      >
        <PieChart>
          <ChartTooltip
            content={
              <ChartTooltipContent
                nameKey="name"
                labelFormatter={(_, payload) => {
                  const key = String(payload?.[0]?.payload?.name ?? "");
                  return getSliceLabel(config, key);
                }}
                formatter={(value, _name, item) => {
                  const key = String(item?.payload?.name ?? "");
                  const share =
                    total > 0
                      ? Math.round((Number(value) / total) * 100)
                      : 0;
                  return (
                    <span className="font-mono font-medium tabular-nums">
                      {formatValue(Number(value))} ({share}%)
                    </span>
                  );
                }}
              />
            }
          />
          <Pie
            data={data}
            dataKey="value"
            nameKey="name"
            innerRadius={chartInnerRadius}
            outerRadius={chartOuterRadius}
            paddingAngle={Math.min(6, Math.max(3, Math.round(strokeWidth / 2)))}
            stroke={separatorColor}
            strokeWidth={strokeWidth}
            isAnimationActive={false}
          >
            {data.map((entry) => (
              <Cell
                key={entry.name}
                fill={entry.fill ?? `var(--color-${entry.name})`}
                stroke={separatorColor}
                strokeWidth={strokeWidth}
              />
            ))}
            {showTotal && (
              <Label
                content={({ viewBox }) => {
                  if (!viewBox || !("cx" in viewBox) || !("cy" in viewBox)) {
                    return null;
                  }
                  return (
                    <text
                      x={viewBox.cx}
                      y={viewBox.cy}
                      textAnchor="middle"
                      dominantBaseline="middle"
                    >
                      <tspan
                        x={viewBox.cx}
                        y={viewBox.cy}
                        className={
                          compact
                            ? "fill-foreground text-base font-bold"
                            : "fill-foreground text-2xl font-bold"
                        }
                      >
                        {formatValue(total)}
                      </tspan>
                      <tspan
                        x={viewBox.cx}
                        y={(viewBox.cy ?? 0) + 20}
                        className="fill-muted-foreground text-xs"
                      >
                        {totalLabel}
                      </tspan>
                    </text>
                  );
                }}
              />
            )}
          </Pie>
        </PieChart>
      </ChartContainer>

      {showLegend && (
        <PieChartLegend
          data={data}
          config={config}
          total={total}
          formatValue={formatValue}
        />
      )}
    </div>
  );
}

export function AnalyticsPaymentPieChart({
  byMethod,
  compact = false,
  className,
}: {
  byMethod: Record<string, number>;
  compact?: boolean;
  className?: string;
}) {
  const entries = Object.entries(byMethod).filter(([, amount]) => amount > 0);

  if (!entries.length) {
    return <ChartEmptyState message="Tidak ada data pembayaran" />;
  }

  const colors = [
    "var(--color-chart-1)",
    "var(--color-chart-2)",
    "var(--color-chart-3)",
    "var(--color-chart-4)",
    "var(--color-chart-5)",
  ];

  const data = entries.map(([name, value], index) => ({
    name,
    value,
    fill: colors[index % colors.length],
  }));

  const config = Object.fromEntries(
    entries.map(([name], index) => [
      name,
      { label: name, color: colors[index % colors.length] },
    ]),
  );

  return (
    <AnalyticsPieChart
      data={data}
      config={config}
      valueFormatter={formatCurrency}
      showTotal
      totalLabel="Total"
      compact={compact}
      className={className}
    />
  );
}
