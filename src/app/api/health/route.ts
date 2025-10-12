import { NextResponse } from "next/server";

/**
 * Health check endpoint for monitoring and Docker health checks
 * Returns 200 OK if the application is running
 */
export async function GET() {
  try {
    return NextResponse.json(
      {
        status: "healthy",
        timestamp: new Date().toISOString(),
        uptime: process.uptime(),
      },
      { status: 200 }
    );
  } catch (error) {
    return NextResponse.json(
      {
        status: "unhealthy",
        error: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 }
    );
  }
}

