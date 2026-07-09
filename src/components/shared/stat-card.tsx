import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import type { LucideIcon } from "lucide-react";
import { cn } from "@/lib/utils";

export function StatCard({
  title,
  value,
  description,
  icon: Icon,
  trend,
  className,
}: {
  title: string;
  value: string | number;
  description?: string;
  icon?: LucideIcon;
  trend?: { value: number; label?: string };
  className?: string;
}) {
  const trendPositive = trend && trend.value >= 0;
  const isLongValue = typeof value === "string" && value.length > 12;

  return (
    <Card className={cn("min-w-0", className)}>
      <CardHeader className="flex flex-row items-start justify-between gap-2 space-y-0 pb-2">
        <CardTitle className="text-sm font-medium leading-snug text-muted-foreground">
          {title}
        </CardTitle>
        {Icon && (
          <Icon className="size-4 shrink-0 text-muted-foreground" />
        )}
      </CardHeader>
      <CardContent className="space-y-2">
        <p
          className={cn(
            "font-bold leading-tight tracking-tight break-words",
            isLongValue ? "text-lg sm:text-xl" : "text-2xl",
          )}
        >
          {value}
        </p>

        {trend && (
          <div className="flex flex-wrap items-center gap-x-2 gap-y-1">
            <Badge
              variant="outline"
              className={cn(
                "h-auto shrink-0 px-2 py-0.5 text-[11px] font-semibold leading-none",
                trendPositive
                  ? "border-chart-2/30 bg-chart-2/10 text-chart-2"
                  : "border-destructive/30 bg-destructive/10 text-destructive",
              )}
            >
              {trendPositive ? "+" : ""}
              {trend.value}%
            </Badge>
            {trend.label && (
              <span className="text-xs leading-snug text-muted-foreground">
                {trend.label}
              </span>
            )}
          </div>
        )}

        {description && (
          <p className="text-xs leading-relaxed text-muted-foreground">
            {description}
          </p>
        )}
      </CardContent>
    </Card>
  );
}
