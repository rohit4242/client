import { NextResponse } from "next/server";
import { getUserByEmail } from "@/db/actions/customer/get-user-by-email";

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { email } = body;

    console.log("body", body);

    // Validate email is provided
    if (!email || typeof email !== "string") {
      return NextResponse.json(
        { error: "Email is required" },
        { status: 400 }
      );
    }

    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return NextResponse.json(
        { error: "Invalid email format" },
        { status: 400 }
      );
    }

    // Fetch user by email
    const user = await getUserByEmail(email);

    // Return 404 if user not found
    if (!user) {
      return NextResponse.json(
        { error: "User not found" },
        { status: 404 }
      );
    }

    // Return user with portfolio information
    return NextResponse.json({ user }, { status: 200 });
  } catch (error) {
    console.error("Error in mobile login endpoint:", error);
    return NextResponse.json(
      { error: "Internal Server Error" },
      { status: 500 }
    );
  }
}

