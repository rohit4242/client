import { getUserWithRole } from "@/lib/auth-utils";
import { NextResponse } from "next/server";
import { forceCloseAllPositions } from "@/db/actions/position/force-close-positions";
import { UserRole } from "@prisma/client";

export async function POST(req: Request) {
    try {
        const user = await getUserWithRole();

        if (!user) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        // Check permissions - allow ADMIN and AGENT
        if (user.role !== UserRole.ADMIN && user.role !== UserRole.AGENT) {
            return NextResponse.json(
                { error: "Forbidden: Insufficient permissions" },
                { status: 403 }
            );
        }

        const body = await req.json().catch(() => ({}));
        const targetUserId = body.userId || user.id;

        const result = await forceCloseAllPositions(targetUserId);

        if (!result.success) {
            return NextResponse.json(
                { error: result.error || "Failed to force close positions" },
                { status: 500 }
            );
        }

        return NextResponse.json(result);
    } catch (error) {
        console.error("Error in force-close-all API:", error);
        return NextResponse.json(
            { error: "Internal Server Error" },
            { status: 500 }
        );
    }
}
