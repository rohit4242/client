"use server";

import db from "@/db";

export interface PortfolioSummary {
  id: string;
  name: string;
  currentBalance: number;
}

export interface UserWithPortfolios {
  id: string;
  name: string;
  email: string;
  role: "ADMIN" | "AGENT" | "CUSTOMER";
  image: string | null;
  portfolios: PortfolioSummary[];
}

/**
 * Get user by email address with portfolio information
 * @param email - User's email address
 * @returns User with portfolios or null if not found
 */
export async function getUserByEmail(
  email: string
): Promise<UserWithPortfolios | null> {
  try {
    const user = await db.user.findUnique({
      where: { email },
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        image: true,
        portfolios: {
          select: {
            id: true,
            name: true,
            currentBalance: true,
          },
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
      role: user.role as "ADMIN" | "AGENT" | "CUSTOMER",
      image: user.image,
      portfolios: user.portfolios.map((portfolio) => ({
        id: portfolio.id,
        name: portfolio.name,
        currentBalance: portfolio.currentBalance,
      })),
    };
  } catch (error) {
    console.error("Error fetching user by email:", error);
    throw error;
  }
}

