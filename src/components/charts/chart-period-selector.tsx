"use client";

import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import {
  PERIOD_OPTIONS,
  type DashboardPeriod,
} from "@/components/charts/chart-config";

export function ChartPeriodSelector({
  value,
  onChange,
}: {
  value: DashboardPeriod;
  onChange: (period: DashboardPeriod) => void;
}) {
  return (
    <div className="grid w-full grid-cols-2 gap-1 rounded-lg border bg-muted/40 p-1 sm:flex sm:flex-wrap">
      {PERIOD_OPTIONS.map((option) => (
        <Button
          key={option.value}
          type="button"
          variant="ghost"
          size="sm"
          className={cn(
            "h-8 px-2.5 text-xs sm:h-7",
            value === option.value &&
              "bg-background text-foreground shadow-sm hover:bg-background",
          )}
          onClick={() => onChange(option.value)}
        >
          {option.label}
        </Button>
      ))}
    </div>
  );
}
