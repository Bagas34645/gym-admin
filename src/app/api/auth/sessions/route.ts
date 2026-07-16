import { NextResponse } from "next/server";
import { getTokens, laravelRequest } from "@/lib/laravel-client";
import type { LoginSession } from "@/lib/types/api";

export async function GET() {
  const tokens = await getTokens();
  if (!tokens.access) {
    return NextResponse.json(
      { success: false, message: "Tidak terautentikasi" },
      { status: 401 },
    );
  }

  try {
    const { data, message } = await laravelRequest<LoginSession[]>(
      "GET",
      "/auth/sessions",
      {
        params: tokens.refresh
          ? { current_refresh_token: tokens.refresh }
          : undefined,
      },
    );
    return NextResponse.json({ success: true, message, data });
  } catch (error) {
    const err = error as Error & { status?: number };
    return NextResponse.json(
      { success: false, message: err.message ?? "Gagal memuat sesi login" },
      { status: err.status ?? 500 },
    );
  }
}
