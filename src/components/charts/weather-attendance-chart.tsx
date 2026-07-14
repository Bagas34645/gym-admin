"use client";

import {
  CartesianGrid,
  Legend,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import type { WeatherAttendanceItem } from "@/lib/types/weather";

function CustomTooltip({
  active,
  payload,
}: {
  active?: boolean;
  payload?: { payload: WeatherAttendanceItem }[];
}) {
  if (!active || !payload?.length) return null;
  const item = payload[0]?.payload;
  if (!item) return null;

  return (
    <div className="rounded-lg border bg-popover p-3 text-xs shadow-md">
      <p className="mb-1 font-medium">{item.weather_date}</p>
      <p>
        Pengunjung: <span className="font-medium">{item.visitor_count}</span>
      </p>
      <p>
        Suhu: {item.temperature_min}&deg; - {item.temperature_max}&deg;
        (rata-rata {item.temperature_avg}&deg;)
      </p>
      <p>Cuaca: {item.weather_category}</p>
      <p>Curah Hujan: {item.precipitation_mm} mm</p>
      <p>Angin: {item.wind_speed_kmh} km/h</p>
      {item.is_weekend && <p className="mt-1 text-primary">Akhir pekan</p>}
    </div>
  );
}

export function WeatherAttendanceChart({
  data,
}: {
  data: WeatherAttendanceItem[];
}) {
  if (!data.length) {
    return (
      <p className="py-12 text-center text-sm text-muted-foreground">
        Tidak ada data untuk periode ini
      </p>
    );
  }

  return (
    <ResponsiveContainer width="100%" height={320}>
      <LineChart data={data}>
        <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
        <XAxis dataKey="weather_date" tick={{ fontSize: 12 }} />
        <YAxis yAxisId="left" tick={{ fontSize: 12 }} />
        <YAxis yAxisId="right" orientation="right" tick={{ fontSize: 12 }} />
        <Tooltip content={<CustomTooltip />} />
        <Legend wrapperStyle={{ fontSize: 12 }} />
        <Line
          yAxisId="left"
          type="monotone"
          dataKey="visitor_count"
          name="Pengunjung"
          stroke="var(--chart-1)"
          strokeWidth={2}
          dot={false}
        />
        <Line
          yAxisId="right"
          type="monotone"
          dataKey="temperature_avg"
          name="Suhu Rata-rata (°C)"
          stroke="var(--chart-5)"
          strokeWidth={2}
          dot={false}
        />
      </LineChart>
    </ResponsiveContainer>
  );
}
