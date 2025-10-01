"use server";

import { auth } from "@/lib/auth";
import { headers } from "next/headers";
import db from "@/db";

export type UserRole = "ADMIN" | "CUSTOMER";

export interface UserWithRole {
  id: string;
  name: string;
  email: string;
  role: UserRole;
  image?: string | null;
}

/**
 * Get the current user with their role from the database
 * @returns User with role or null if not authenticated
 */
export async function getUserWithRole(): Promise<UserWithRole | null> {
  try {
    const session = await auth.api.getSession({
      headers: await headers(),
    });

    if (!session?.user) {
      return null;
    }

    // Fetch user from database to get the role
    const user = await db.user.findUnique({
      where: { id: session.user.id },
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        image: true,
      },
    });

    if (!user) {
      return null;
    }

    return {
      id: user.id,
      name: user.name,
      email: user.email,
      role: user.role as UserRole,
      image: user.image,
    };
  } catch (error) {
    console.error("Error getting user with role:", error);
    return null;
  }
}

/**
 * Check if the current user has admin role
 */
export async function isAdmin(): Promise<boolean> {
  const user = await getUserWithRole();
  return user?.role === "ADMIN";
}

/**
 * Check if the current user has customer role
 */
export async function isCustomer(): Promise<boolean> {
  const user = await getUserWithRole();
  return user?.role === "CUSTOMER";
}

