import { NextResponse } from "next/server";
import { updateUserRole } from "@/db/actions/admin/update-user-role";
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
    const { role } = body;

    if (!role || !["ADMIN", "AGENT", "CUSTOMER"].includes(role)) {
      return NextResponse.json(
        { error: "Invalid role specified" },
        { status: 400 }
      );
    }

    const result = await updateUserRole(userId, role);

    if (!result.success) {
      return NextResponse.json({ error: result.error }, { status: 400 });
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error in PATCH /api/admin/users/[userId]/role:", error);
    return NextResponse.json(
      { error: "Failed to update user role" },
      { status: 500 }
    );
  }
}

