import { NextRequest, NextResponse } from "next/server";
import db from "@/db";

const CORS_HEADERS: Record<string, string> = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET,OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Authorization",
};

export async function OPTIONS() {
  return new NextResponse(null, { status: 204, headers: CORS_HEADERS });
}

export async function GET(_req: NextRequest) {
  const startedAt = new Date();
  let dbStatus: "up" | "down" = "up";
  try {
    // Light-weight DB ping
    await db.$queryRaw`SELECT 1`;
  } catch (_err) {
    dbStatus = "down";
  }

  return NextResponse.json(
    {
      success: true,
      status: "ok",
      db: dbStatus,
      time: startedAt.toISOString(),
    },
    { headers: CORS_HEADERS }
  );
}


