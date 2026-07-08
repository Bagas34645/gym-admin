import { NextResponse } from "next/server";
import { ACCESS_TOKEN_COOKIE } from "@/lib/auth-cookies";

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

  return null;
}

export function queryFromUrl(url: URL) {
  const params: Record<string, string> = {};
  url.searchParams.forEach((v, k) => {
    params[k] = v;
  });
  return params;
}
