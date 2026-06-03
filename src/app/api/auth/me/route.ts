import { NextResponse } from "next/server";
import { isAdminRole } from "@/lib/auth-cookies";
import { clearTokens, getTokens, laravelRequest } from "@/lib/laravel-client";
import type { UserProfile } from "@/lib/types/api";

export async function GET() {
  const tokens = await getTokens();
  if (!tokens.access) {
    return NextResponse.json(
      { success: false, message: "Tidak terautentikasi" },
      { status: 401 },
    );
  }

  try {
    const { data } = await laravelRequest<UserProfile>("GET", "/auth/me");
    if (!isAdminRole(data.role)) {
      await clearTokens();
      return NextResponse.json(
        { success: false, message: "Tidak memiliki hak akses" },
        { status: 403 },
      );
    }
    return NextResponse.json({ success: true, message: "OK", data });
  } catch (error) {
    const err = error as Error & { status?: number };
    return NextResponse.json(
      { success: false, message: err.message ?? "Gagal memuat profil" },
      { status: err.status ?? 401 },
    );
  }
}
