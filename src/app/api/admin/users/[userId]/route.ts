import { NextRequest, NextResponse } from "next/server";
import { isAdmin } from "@/lib/auth-utils";
import db from "@/db";
import { UserWithAgent } from "@/db/actions/admin/get-all-users";

/**
 * GET /api/admin/users/[userId]
 * Fetch a single user's current data including fresh portfolio status.
 * Used for refreshing selected user context after operations that may change user data.
 */
export async function GET(
  request: NextRequest,
  { params }: { params: { userId: string } }
) {
  try {
    const admin = await isAdmin();
    
    if (!admin) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
    }

    const { userId } = params;

    // Fetch user with fresh portfolio information
    const user = await db.user.findUnique({
      where: { id: userId },
      include: {
        portfolios: {
          select: {
            id: true,
          },
          take: 1,
        },
        agent: {
          select: {
            id: true,
            name: true,
          },
        },
        _count: {
          select: {
            customers: true, // Count assigned customers for agents
          },
        },
      },
    });

    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    // Transform to UserWithAgent format
    const userData: UserWithAgent = {
      id: user.id,
      name: user.name,
      email: user.email,
      image: user.image,
      role: user.role as "ADMIN" | "AGENT" | "CUSTOMER",
      createdAt: user.createdAt.toISOString(),
      hasPortfolio: user.portfolios.length > 0,
      portfolioId: user.portfolios[0]?.id,
      agentId: user.agentId,
      agentName: user.agent?.name,
      customerCount: user._count.customers,
    };

    return NextResponse.json(userData);
  } catch (error) {
    console.error("Error fetching user:", error);
    return NextResponse.json(
      { error: "Failed to fetch user" },
      { status: 500 }
    );
  }
}

