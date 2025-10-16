import { NextResponse } from "next/server";
import { assignCustomerToAgent } from "@/db/actions/admin/assign-customer-to-agent";
import { isAdmin } from "@/lib/auth-utils";

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ userId: string }> }
) {
  try {
    const admin = await isAdmin();

    if (!admin) {
      return NextResponse.json(
        { error: "Unauthorized: Admin access required" },
        { status: 403 }
      );
    }

    const { userId } = await params;
    const body = await request.json();
    const { agentId } = body;

    const result = await assignCustomerToAgent(userId, agentId);

    if (!result.success) {
      return NextResponse.json({ error: result.error }, { status: 400 });
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error in PATCH /api/admin/users/[userId]/assign-agent:", error);
    return NextResponse.json(
      { error: "Failed to assign customer to agent" },
      { status: 500 }
    );
  }
}

