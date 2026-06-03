import { NextRequest, NextResponse } from "next/server";
import { laravelMultipart, laravelRequest } from "@/lib/laravel-client";

type RouteContext = { params: Promise<{ path: string[] }> };

async function resolvePath(ctx: RouteContext) {
  const { path } = await ctx.params;
  return `/admin/${path.join("/")}`;
}

function queryFromUrl(url: URL) {
  const params: Record<string, string> = {};
  url.searchParams.forEach((v, k) => {
    params[k] = v;
  });
  return params;
}

export async function GET(request: NextRequest, ctx: RouteContext) {
  try {
    const path = await resolvePath(ctx);
    const result = await laravelRequest("GET", path, {
      params: queryFromUrl(request.nextUrl),
    });
    return NextResponse.json({
      success: true,
      message: result.message,
      data: result.data,
      meta: result.meta,
    });
  } catch (error) {
    const err = error as Error & { status?: number; errors?: Record<string, string[]> };
    return NextResponse.json(
      { success: false, message: err.message, errors: err.errors },
      { status: err.status ?? 500 },
    );
  }
}

export async function POST(request: NextRequest, ctx: RouteContext) {
  try {
    const path = await resolvePath(ctx);
    const contentType = request.headers.get("content-type") ?? "";

    if (contentType.includes("multipart/form-data")) {
      const formData = await request.formData();
      const result = await laravelMultipart(path, formData);
      return NextResponse.json({ success: true, message: result.message, data: result.data });
    }

    const body = await request.json().catch(() => undefined);
    const result = await laravelRequest("POST", path, { data: body });
    return NextResponse.json(
      { success: true, message: result.message, data: result.data, meta: result.meta },
      { status: result.status === 201 ? 201 : 200 },
    );
  } catch (error) {
    const err = error as Error & { status?: number; errors?: Record<string, string[]> };
    return NextResponse.json(
      { success: false, message: err.message, errors: err.errors },
      { status: err.status ?? 500 },
    );
  }
}

export async function PUT(request: NextRequest, ctx: RouteContext) {
  try {
    const path = await resolvePath(ctx);
    const body = await request.json();
    const result = await laravelRequest("PUT", path, { data: body });
    return NextResponse.json({
      success: true,
      message: result.message,
      data: result.data,
    });
  } catch (error) {
    const err = error as Error & { status?: number; errors?: Record<string, string[]> };
    return NextResponse.json(
      { success: false, message: err.message, errors: err.errors },
      { status: err.status ?? 500 },
    );
  }
}

export async function DELETE(_request: NextRequest, ctx: RouteContext) {
  try {
    const path = await resolvePath(ctx);
    const result = await laravelRequest("DELETE", path);
    return NextResponse.json({
      success: true,
      message: result.message,
      data: result.data,
    });
  } catch (error) {
    const err = error as Error & { status?: number; errors?: Record<string, string[]> };
    return NextResponse.json(
      { success: false, message: err.message, errors: err.errors },
      { status: err.status ?? 500 },
    );
  }
}
