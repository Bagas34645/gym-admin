import { NextRequest, NextResponse } from "next/server";
import { getTokens } from "@/lib/laravel-client";
import { requireAdminSession } from "@/lib/bff-auth";

const API_URL = process.env.API_URL ?? "http://localhost:8000/v1";

export async function POST(request: NextRequest) {
  const denied = await requireAdminSession();
  if (denied) return denied;

  const tokens = await getTokens();
  if (!tokens.access) {
    return NextResponse.json(
      { success: false, message: "Unauthorized" },
      { status: 401 },
    );
  }

  const form = await request.formData();
  const socketId = form.get("socket_id")?.toString();
  const channelName = form.get("channel_name")?.toString();

  if (!socketId || !channelName) {
    return NextResponse.json(
      { success: false, message: "Invalid broadcasting auth payload" },
      { status: 422 },
    );
  }

  const upstream = await fetch(`${API_URL}/broadcasting/auth`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${tokens.access}`,
      Accept: "application/json",
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      socket_id: socketId,
      channel_name: channelName,
    }),
  });

  const body = await upstream.text();

  return new NextResponse(body, {
    status: upstream.status,
    headers: {
      "Content-Type": upstream.headers.get("Content-Type") ?? "application/json",
    },
  });
}
