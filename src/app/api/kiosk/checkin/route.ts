import { NextRequest, NextResponse } from "next/server";

const API_URL = process.env.API_URL ?? "http://localhost:8000/v1";
const KIOSK_API_KEY = process.env.KIOSK_API_KEY ?? "";

export async function POST(request: NextRequest) {
  if (!KIOSK_API_KEY) {
    return NextResponse.json(
      { success: false, message: "Kiosk API key is not configured" },
      { status: 503 },
    );
  }

  try {
    const formData = await request.formData();
    const res = await fetch(`${API_URL}/kiosk/checkin`, {
      method: "POST",
      headers: {
        Accept: "application/json",
        "X-Kiosk-Api-Key": KIOSK_API_KEY,
      },
      body: formData,
    });

    const body = await res.json();
    return NextResponse.json(body, { status: res.status });
  } catch {
    return NextResponse.json(
      { success: false, message: "Gagal menghubungi server" },
      { status: 502 },
    );
  }
}
