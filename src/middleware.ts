import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import {
  ACCESS_TOKEN_COOKIE,
  isAdminRole,
  isTrainerRole,
  portalHomeForRole,
  USER_ROLE_COOKIE,
} from "@/lib/auth-cookies";

const publicPaths = ["/login", "/kiosk"];

const adminOnlyPrefixes = [
  "/members",
  "/memberships",
  "/packages",
  "/attendance",
  "/trainers",
  "/reports",
  "/notifications",
  "/chat",
  "/feedback",
  "/account",
];

function isAdminDashboardPath(pathname: string): boolean {
  if (pathname === "/") return true;
  return adminOnlyPrefixes.some((prefix) => pathname.startsWith(prefix));
}

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;
  const token = request.cookies.get(ACCESS_TOKEN_COOKIE)?.value;
  const role = request.cookies.get(USER_ROLE_COOKIE)?.value;
  const isPublic = publicPaths.some((p) => pathname.startsWith(p));
  const isApi = pathname.startsWith("/api");

  const requestHeaders = new Headers(request.headers);
  const clientIp = request.headers.get("x-forwarded-for")?.split(",")[0]?.trim()
    || request.headers.get("x-real-ip")
    || request.ip;
  if (clientIp && !requestHeaders.get("x-real-ip")) {
    requestHeaders.set("x-real-ip", clientIp);
  }

  if (isApi) {
    return NextResponse.next({ request: { headers: requestHeaders } });
  }

  if (!token && !isPublic) {
    const login = new URL("/login", request.url);
    login.searchParams.set("from", pathname);
    return NextResponse.redirect(login);
  }

  if (token && pathname === "/login") {
    return NextResponse.redirect(new URL(portalHomeForRole(role ?? "admin"), request.url));
  }

  // Portal pelatih: /trainer atau /trainer/... (bukan /trainers admin)
  const isTrainerPortal =
    pathname === "/trainer" || pathname.startsWith("/trainer/");
  if (token && isTrainerPortal && !isTrainerRole(role ?? "")) {
    return NextResponse.redirect(new URL("/", request.url));
  }

  if (token && isAdminDashboardPath(pathname) && !isAdminRole(role ?? "")) {
    return NextResponse.redirect(new URL("/trainer", request.url));
  }

  return NextResponse.next({ request: { headers: requestHeaders } });
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico|.*\\..*).*)"],
};
