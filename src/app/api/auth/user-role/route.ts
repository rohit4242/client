import { getUserWithRole } from "@/lib/auth-utils";
import { NextResponse } from "next/server";

export async function GET() {
  try {
    const user = await getUserWithRole();

    if (!user) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      );
    }

    return NextResponse.json({ role: user.role });
  } catch (error) {
    console.error("Error fetching user role:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

