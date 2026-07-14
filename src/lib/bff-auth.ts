import { NextResponse } from "next/server";
import {
  ACCESS_TOKEN_COOKIE,
  isAdminRole,
  isPortalRole,
  isTrainerRole,
  USER_ROLE_COOKIE,
} from "@/lib/auth-cookies";

export async function requireAdminSession(): Promise<NextResponse | null> {
  const { cookies } = await import("next/headers");
  const jar = await cookies();
  const token = jar.get(ACCESS_TOKEN_COOKIE)?.value;

  if (!token) {
    return NextResponse.json(
      { success: false, message: "Unauthorized" },
      { status: 401 },
    );
  }

  const role = jar.get(USER_ROLE_COOKIE)?.value;
  if (role && !isAdminRole(role)) {
    return NextResponse.json(
      { success: false, message: "Tidak memiliki hak akses admin" },
      { status: 403 },
    );
  }

  return null;
}

export async function requireTrainerSession(): Promise<NextResponse | null> {
  const { cookies } = await import("next/headers");
  const jar = await cookies();
  const token = jar.get(ACCESS_TOKEN_COOKIE)?.value;

  if (!token) {
    return NextResponse.json(
      { success: false, message: "Unauthorized" },
      { status: 401 },
    );
  }

  const role = jar.get(USER_ROLE_COOKIE)?.value;
  if (role && !isTrainerRole(role)) {
    return NextResponse.json(
      { success: false, message: "Tidak memiliki hak akses pelatih" },
      { status: 403 },
    );
  }

  return null;
}

export async function setUserRoleCookie(role: string) {
  const { cookies } = await import("next/headers");
  const jar = await cookies();
  const secure = process.env.NODE_ENV === "production";

  if (isPortalRole(role)) {
    jar.set(USER_ROLE_COOKIE, role, {
      httpOnly: true,
      secure,
      sameSite: "lax",
      path: "/",
      maxAge: 60 * 60 * 24,
    });
  }
}

export async function clearUserRoleCookie() {
  const { cookies } = await import("next/headers");
  const jar = await cookies();
  jar.delete(USER_ROLE_COOKIE);
}

export function queryFromUrl(url: URL) {
  const params: Record<string, string> = {};
  url.searchParams.forEach((v, k) => {
    params[k] = v;
  });
  return params;
}
