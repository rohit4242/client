import { NextResponse } from "next/server";
import { getAllSignals } from "@/db/actions/admin/get-all-signals";
import { isAdmin } from "@/lib/auth-utils";

export async function GET() {
  try {
    const admin = await isAdmin();

    if (!admin) {
      return NextResponse.json(
        { error: "Unauthorized: Admin access required" },
        { status: 403 }
      );
    }

    const signals = await getAllSignals();
    return NextResponse.json(signals);
  } catch (error) {
    console.error("Error in GET /api/admin/signals:", error);
    return NextResponse.json(
      { error: "Failed to fetch signals" },
      { status: 500 }
    );
  }
}

