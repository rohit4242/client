import { NextResponse } from "next/server";
import { getUserWithRole } from "@/lib/auth-utils";

export async function GET() {
  try {
    // TODO: Implement actual authentication and get the real userId
    const userId = "mock-customer-id"; // Placeholder for development

    const user = await getUserWithRole();

    if (!user) {
      return NextResponse.json({ error: "User profile not found" }, { status: 404 });
    }

    return NextResponse.json(user);
  } catch (error) {
    console.error("Error fetching user profile:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
