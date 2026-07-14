"use client";

import {
  Cell,
  Legend,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
} from "recharts";
import type { WeatherDistributionItem } from "@/lib/types/weather";
import { weatherCategoryColor } from "@/lib/types/weather";

export function WeatherDistributionChart({
  data,
}: {
  data: WeatherDistributionItem[];
}) {
  if (!data.length) {
    return (
      <p className="py-12 text-center text-sm text-muted-foreground">
        Tidak ada data untuk periode ini
      </p>
    );
  }

  return (
    <ResponsiveContainer width="100%" height={300}>
      <PieChart>
        <Pie
          data={data}
          dataKey="total_days"
          nameKey="weather_category"
          cx="50%"
          cy="50%"
          outerRadius={100}
          label={({ name, percent }) =>
            `${name} ${((percent ?? 0) * 100).toFixed(0)}%`
          }
        >
          {data.map((entry, index) => (
            <Cell
              key={entry.weather_category}
              fill={weatherCategoryColor(entry.weather_category, index)}
            />
          ))}
        </Pie>
        <Tooltip formatter={(value, name) => [`${value} hari`, name]} />
        <Legend wrapperStyle={{ fontSize: 12 }} />
      </PieChart>
    </ResponsiveContainer>
  );
}
