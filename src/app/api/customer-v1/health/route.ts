import { NextRequest, NextResponse } from "next/server";

export async function GET(_req: NextRequest) {
    return NextResponse.json({ success: true, status: "ok" }, { status: 200 });
}


