export type UserRole = "member" | "admin" | "super_admin";

export interface PaginationMeta {
  page: number;
  per_page: number;
  total: number;
}

export interface ApiSuccess<T> {
  success: true;
  message: string;
  data: T;
  meta?: PaginationMeta;
}

export interface ApiErrorBody {
  success: false;
  message: string;
  error_code?: string;
  errors?: Record<string, string[]>;
}

export interface UserProfile {
  id: string;
  name: string;
  email: string;
  phone: string;
  role: UserRole;
  profile_photo_url?: string | null;
  age?: number | null;
  height_cm?: number | null;
  weight_kg?: number | null;
  fitness_goal?: string | null;
  membership_status?: string;
}

export interface LoginResponse {
  access_token: string;
  refresh_token: string;
  token_type: string;
  expires_in: number;
  member: { id: string; name: string; membership_status: string };
}

export interface DashboardSummary {
  members: {
    total: number;
    active: number;
    inactive: number;
    new_this_month: number;
  };
  attendance: { today: number; this_week: number; this_month: number };
  revenue: { today: number; this_month: number; growth_percent: number };
}

export interface DashboardStats {
  metric: string;
  period: string;
  group_by: string;
  timeline: { date: string; value: number }[];
}

export interface ReportTimelinePoint {
  date: string;
  value: number;
}

export interface MembersReport {
  from: string;
  to: string;
  total: number;
  members: unknown[];
  timeline: ReportTimelinePoint[];
}

export interface AttendanceReport {
  from: string;
  to: string;
  total: number;
  records: unknown[];
  timeline: ReportTimelinePoint[];
}

export interface FinanceReport {
  total_revenue: number;
  by_payment_method: Record<string, number>;
  timeline: { date: string; revenue: number }[];
}

export interface MemberListItem {
  id: string;
  name: string;
  email: string;
  phone: string;
  membership_status: string;
  expired_date?: string | null;
}

export interface MembershipPackage {
  id: string;
  name: string;
  type: string;
  duration_days: number;
  price: number;
  description?: string | null;
  benefits?: string[] | null;
  status: string;
}
