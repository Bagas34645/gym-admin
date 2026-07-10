import { NextResponse } from "next/server";
import { getTokens } from "@/lib/laravel-client";

export async function GET() {
  const tokens = await getTokens();
  
  if (!tokens.access) {
    return NextResponse.json(
      { success: false, message: "Unauthorized" },
      { status: 401 }
    );
  }

  return NextResponse.json({
    success: true,
    data: {
      token: tokens.access,
    },
  });
}
