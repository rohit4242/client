import { NextRequest, NextResponse } from "next/server";

import db from "@/db";
import { getPositions } from "@/db/actions/position";

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const email = searchParams.get("email");

    if (!email) {
      return NextResponse.json({ error: "Email is required" }, { status: 400 });
    }

    const user = await db.user.findUnique({
      where: { email },
    });

    if (!user) {
      return NextResponse.json(
        { success: false, error: "User not found" },
        { status: 404 }
      );
    }

    const positions = getPositions({ userId: user.id });

    if (!positions) {
      return NextResponse.json(
        { success: false, error: "Positions not found" },
        { status: 404 }
      );
    }

    return NextResponse.json({ success: true, positions });
  } catch (error) {
    console.error("Error fetching dashboard:", error);
    return NextResponse.json(
      { success: false, error: "Internal Server Error" },
      { status: 500 }
    );
  }
}
