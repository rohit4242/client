import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { headers } from "next/headers";
import { getPositions } from "@/features/position/actions/get-positions";
import { PositionStatus } from "@prisma/client";

export async function GET(request: NextRequest) {
  try {
    const session = await auth.api.getSession({
      headers: await headers(),
    });

    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const userId = searchParams.get("userId");
    const status = searchParams.get("status");
    const symbol = searchParams.get("symbol");
    const exchange = searchParams.get("exchange");
    const limit = searchParams.get("limit");

    const filters = {
      ...(status && { status: status as PositionStatus }),
      ...(symbol && { symbol }),
      ...(exchange && { exchange }),
      ...(limit && { limit: parseInt(limit) }),
    };

    const { positions, total } = await getPositions({ ...filters, userId: userId || session.user.id });

    return NextResponse.json({
      success: true,
      data: positions,
      count: total,
    });
  } catch (error) {
    console.error("Error fetching positions:", error);
    return NextResponse.json(
      {
        error: "Internal server error",
        message: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 }
    );
  }
}
