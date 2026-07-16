import { NextResponse } from "next/server";
import { clearUserRoleCookie } from "@/lib/bff-auth";
import { clearTokens, getTokens, laravelRequest } from "@/lib/laravel-client";

export async function DELETE(
  _request: Request,
  context: { params: Promise<{ id: string }> },
) {
  const tokens = await getTokens();
  if (!tokens.access) {
    return NextResponse.json(
      { success: false, message: "Tidak terautentikasi" },
      { status: 401 },
    );
  }

  const { id } = await context.params;

  try {
    const { data, message } = await laravelRequest<{ was_current: boolean }>(
      "DELETE",
      `/auth/sessions/${id}`,
      {
        data: tokens.refresh
          ? { current_refresh_token: tokens.refresh }
          : undefined,
      },
    );

    if (data?.was_current) {
      await clearTokens();
      await clearUserRoleCookie();
    }

    return NextResponse.json({ success: true, message, data });
  } catch (error) {
    const err = error as Error & { status?: number };
    return NextResponse.json(
      { success: false, message: err.message ?? "Gagal menghapus sesi" },
      { status: err.status ?? 500 },
    );
  }
}
