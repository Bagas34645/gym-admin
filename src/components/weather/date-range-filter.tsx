"use client";

import { useState } from "react";
import { RotateCcw } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import type { WeatherFilterParams } from "@/lib/types/weather";

export function DateRangeFilter({
  startDate,
  endDate,
  onApply,
}: {
  startDate?: string;
  endDate?: string;
  onApply: (range: WeatherFilterParams) => void;
}) {
  const [draftStart, setDraftStart] = useState(startDate ?? "");
  const [draftEnd, setDraftEnd] = useState(endDate ?? "");

  const isInvalid = !!draftStart && !!draftEnd && draftStart > draftEnd;

  function handleApply() {
    if (isInvalid) return;
    onApply({
      start_date: draftStart || undefined,
      end_date: draftEnd || undefined,
    });
  }

  function handleReset() {
    setDraftStart("");
    setDraftEnd("");
    onApply({ start_date: undefined, end_date: undefined });
  }

  return (
    <div className="flex flex-wrap items-end gap-3">
      <div className="flex flex-col gap-1.5">
        <label
          className="text-xs font-medium text-muted-foreground"
          htmlFor="weather-start-date"
        >
          Dari Tanggal
        </label>
        <Input
          id="weather-start-date"
          type="date"
          value={draftStart}
          max={draftEnd || undefined}
          onChange={(e) => setDraftStart(e.target.value)}
          className="w-40"
        />
      </div>

      <div className="flex flex-col gap-1.5">
        <label
          className="text-xs font-medium text-muted-foreground"
          htmlFor="weather-end-date"
        >
          Sampai Tanggal
        </label>
        <Input
          id="weather-end-date"
          type="date"
          value={draftEnd}
          min={draftStart || undefined}
          onChange={(e) => setDraftEnd(e.target.value)}
          className="w-40"
        />
      </div>

      <Button onClick={handleApply} disabled={isInvalid}>
        Terapkan
      </Button>
      <Button variant="outline" onClick={handleReset}>
        <RotateCcw className="size-4" />
        Reset
      </Button>

      {isInvalid && (
        <p className="w-full text-xs text-destructive">
          Tanggal akhir tidak boleh lebih awal dari tanggal mulai.
        </p>
      )}
    </div>
  );
}
