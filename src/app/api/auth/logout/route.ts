import { NextResponse } from "next/server";
import { clearUserRoleCookie } from "@/lib/bff-auth";
import { clearTokens, getTokens, laravelRequest } from "@/lib/laravel-client";

export async function POST() {
  const tokens = await getTokens();
  try {
    if (tokens.refresh) {
      await laravelRequest("POST", "/auth/logout", {
        data: { refresh_token: tokens.refresh },
        retry: false,
      });
    }
  } catch {
    // ignore
  }
  await clearTokens();
  await clearUserRoleCookie();
  return NextResponse.json({ success: true, message: "Logout berhasil" });
}
