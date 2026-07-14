import { NextResponse } from "next/server";
import axios from "axios";
import { isPortalRole } from "@/lib/auth-cookies";
import { setUserRoleCookie } from "@/lib/bff-auth";
import { setTokens } from "@/lib/laravel-client";
import type { ApiErrorBody, ApiSuccess, LoginResponse, UserProfile } from "@/lib/types/api";

const API_URL = process.env.API_URL ?? "http://localhost:8000/v1";

export async function POST(request: Request) {
  const body = await request.json();

  try {
    const loginRes = await axios.post<ApiSuccess<LoginResponse>>(
      `${API_URL}/auth/login`,
      body,
    );
    const loginData = loginRes.data;
    if (!loginData.success) {
      return NextResponse.json(loginData, { status: 401 });
    }

    const { access_token, refresh_token } = loginData.data;
    await setTokens(access_token, refresh_token);

    const meRes = await axios.get<ApiSuccess<UserProfile>>(`${API_URL}/auth/me`, {
      headers: { Authorization: `Bearer ${access_token}` },
    });

    const profile = meRes.data.data;
    if (!isPortalRole(profile.role)) {
      const { clearTokens } = await import("@/lib/laravel-client");
      const { clearUserRoleCookie } = await import("@/lib/bff-auth");
      await clearTokens();
      await clearUserRoleCookie();
      return NextResponse.json(
        {
          success: false,
          message: "Tidak memiliki hak akses. Hanya admin atau pelatih yang dapat masuk.",
        } satisfies ApiErrorBody,
        { status: 403 },
      );
    }

    await setUserRoleCookie(profile.role);

    return NextResponse.json({
      success: true,
      message: loginData.message,
      data: profile,
    });
  } catch (error) {
    if (axios.isAxiosError(error) && error.response?.data) {
      return NextResponse.json(error.response.data, {
        status: error.response.status,
      });
    }
    return NextResponse.json(
      { success: false, message: "Login gagal" },
      { status: 500 },
    );
  }
}
