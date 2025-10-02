"use server";

import { cookies } from "next/headers";
import db from "@/db";
import { isAdmin } from "./auth-utils";

const SELECTED_USER_COOKIE = "selected_user_id";

/**
 * Server-side utility to get the currently selected user for admin
 * Reads from cookie set by client-side context
 */
export async function getSelectedUser() {
  try {
    const admin = await isAdmin();
    
    if (!admin) {
      return null;
    }

    const cookieStore = await cookies();
    const selectedUserId = cookieStore.get(SELECTED_USER_COOKIE)?.value;

    if (!selectedUserId) {
      return null;
    }

    // Fetch the selected user's details
    const user = await db.user.findUnique({
      where: {
        id: selectedUserId,
        role: "CUSTOMER",
      },
      select: {
        id: true,
        name: true,
        email: true,
        image: true,
        portfolios: {
          select: {
            id: true,
          },
          take: 1,
        },
      },
    });

    if (!user) {
      return null;
    }

    return {
      id: user.id,
      name: user.name,
      email: user.email,
      image: user.image,
      portfolioId: user.portfolios[0]?.id || null,
      hasPortfolio: user.portfolios.length > 0,
    };
  } catch (error) {
    console.error("Error getting selected user:", error);
    return null;
  }
}

/**
 * Set the selected user cookie (called from server actions)
 */
export async function setSelectedUserCookie(userId: string | null) {
  const cookieStore = await cookies();
  
  if (userId === null) {
    cookieStore.delete(SELECTED_USER_COOKIE);
  } else {
    cookieStore.set(SELECTED_USER_COOKIE, userId, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      maxAge: 60 * 60 * 24 * 30, // 30 days
    });
  }
}

