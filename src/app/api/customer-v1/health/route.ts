import { NextRequest, NextResponse } from "next/server";

export async function GET(_req: NextRequest) {
    console.log("health check endpoint hit")
    return NextResponse.json({ success: true, status: "ok" }, { status: 200 });
}


