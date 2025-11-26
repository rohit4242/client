import { NextRequest, NextResponse } from "next/server";
import { monitorPositions } from "@/lib/signal-bot/position-monitor";

/**
 * Cron endpoint to monitor positions for take profit and stop loss
 * 
 * This endpoint should be called periodically (e.g., every 30 seconds)
 * by a cron service like Vercel Cron, or an external service
 * 
 * Example with Vercel Cron in vercel.json:
 * {
 *   "crons": [{
 *     "path": "/api/cron/monitor-positions",
 *     "schedule": "* * * * *"  // Every minute
 *   }]
 * }
 * 
 * Or call manually from frontend every 30s
 */
export async function GET(request: NextRequest) {
  try {
    // Optional: Add authentication to prevent abuse
    const authHeader = request.headers.get("authorization");
    const cronSecret = process.env.CRON_SECRET;

    // If CRON_SECRET is set, validate it
    if (cronSecret && authHeader !== `Bearer ${cronSecret}`) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      );
    }

    console.log("⏰ Cron job: Starting position monitoring...");

    // Run the monitor
    await monitorPositions();

    return NextResponse.json({
      success: true,
      message: "Position monitoring completed successfully",
      timestamp: new Date().toISOString(),
    });

  } catch (error) {
    console.error("Error in position monitoring cron:", error);
    
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : "Unknown error",
        timestamp: new Date().toISOString(),
      },
      { status: 500 }
    );
  }
}

/**
 * POST endpoint for manual triggering
 */
export async function POST(request: NextRequest) {
  return GET(request);
}

