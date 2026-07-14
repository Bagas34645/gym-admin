export interface WeatherFilterParams {
  start_date?: string;
  end_date?: string;
  [key: string]: string | undefined;
}

export interface WeatherSummary {
  total_days: number;
  total_visitors: number;
  average_temperature: number;
  average_comfort_score: number;
  rainy_days: number;
}

export interface WeatherAttendanceItem {
  weather_date: string;
  visitor_count: number;
  comfort_score: number;
  temperature_avg: number;
  temperature_min: number;
  temperature_max: number;
  weather_category: string;
  weather_severity: string;
  precipitation_mm: number;
  wind_speed_kmh: number;
  is_weekend: boolean;
}

export interface WeatherDistributionItem {
  weather_category: string;
  total_days: number;
}

export interface WeatherRecord {
  weather_date: string;
  temperature: {
    avg: number;
    min: number;
    max: number;
  };
  precipitation: {
    mm: number;
  };
  comfort_score: number;
  weather: {
    category: string;
    severity: string;
  };
  wind: {
    speed_kmh: number;
  };
  day: {
    is_weekend: boolean;
  };
}

/** Colors keyed to Open-Meteo category strings from big-data-coregym ETL. */
export const WEATHER_CATEGORY_COLORS: Record<string, string> = {
  "Clear Sky": "#f59e0b",
  "Mainly Clear": "#fbbf24",
  "Partly Cloudy": "#94a3b8",
  Overcast: "#64748b",
  Fog: "#a8a29e",
  "Depositing Rime Fog": "#78716c",
  "Light Drizzle": "#60a5fa",
  "Moderate Drizzle": "#3b82f6",
  "Dense Drizzle": "#2563eb",
  "Light Rain": "#3b82f6",
  "Moderate Rain": "#2563eb",
  "Heavy Rain": "#1d4ed8",
  "Light Snow": "#e2e8f0",
  "Moderate Snow": "#cbd5e1",
  "Heavy Snow": "#94a3b8",
  "Rain Shower": "#3b82f6",
  "Heavy Rain Shower": "#1d4ed8",
  "Violent Rain Shower": "#1e3a8a",
  Thunderstorm: "#6366f1",
};

export const WEATHER_CATEGORY_BADGE_CLASS: Record<string, string> = {
  "Clear Sky": "bg-amber-100 text-amber-800",
  "Mainly Clear": "bg-amber-100 text-amber-800",
  "Partly Cloudy": "bg-slate-100 text-slate-800",
  Overcast: "bg-slate-100 text-slate-800",
  Fog: "bg-stone-100 text-stone-800",
  "Depositing Rime Fog": "bg-stone-100 text-stone-800",
  "Light Drizzle": "bg-blue-100 text-blue-800",
  "Moderate Drizzle": "bg-blue-100 text-blue-800",
  "Dense Drizzle": "bg-blue-100 text-blue-800",
  "Light Rain": "bg-blue-100 text-blue-800",
  "Moderate Rain": "bg-blue-100 text-blue-800",
  "Heavy Rain": "bg-blue-200 text-blue-900",
  "Light Snow": "bg-slate-100 text-slate-700",
  "Moderate Snow": "bg-slate-100 text-slate-700",
  "Heavy Snow": "bg-slate-200 text-slate-800",
  "Rain Shower": "bg-blue-100 text-blue-800",
  "Heavy Rain Shower": "bg-blue-200 text-blue-900",
  "Violent Rain Shower": "bg-indigo-100 text-indigo-900",
  Thunderstorm: "bg-indigo-100 text-indigo-800",
};

const FALLBACK_COLORS = [
  "#f59e0b",
  "#94a3b8",
  "#3b82f6",
  "#6366f1",
  "#10b981",
  "#ef4444",
];

export function weatherCategoryColor(category: string, index = 0): string {
  return (
    WEATHER_CATEGORY_COLORS[category] ??
    FALLBACK_COLORS[index % FALLBACK_COLORS.length]
  );
}
