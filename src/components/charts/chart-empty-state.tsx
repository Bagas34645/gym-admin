"use client";

import { AlertCircle, BarChart3 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

export function ChartEmptyState({
  message = "Tidak ada data untuk periode ini",
  compact = false,
}: {
  message?: string;
  compact?: boolean;
}) {
  return (
    <div
      className={cn(
        "flex flex-col items-center justify-center gap-2 text-center",
        compact ? "h-[200px]" : "h-[280px]",
      )}
    >
      <BarChart3 className="size-8 text-muted-foreground/50" />
      <p className="text-sm text-muted-foreground">{message}</p>
    </div>
  );
}

export function ChartErrorState({
  message = "Gagal memuat data grafik",
  onRetry,
}: {
  message?: string;
  onRetry?: () => void;
}) {
  return (
    <div className="flex h-[280px] flex-col items-center justify-center gap-3 text-center">
      <AlertCircle className="size-8 text-destructive/70" />
      <p className="text-sm text-muted-foreground">{message}</p>
      {onRetry && (
        <Button variant="outline" size="sm" onClick={onRetry}>
          Coba lagi
        </Button>
      )}
    </div>
  );
}
