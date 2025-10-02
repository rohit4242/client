"use server";

import { isAdmin } from "@/lib/auth-utils";
import db from "@/db";

export interface Customer {
  id: string;
  name: string;
  email: string;
  image: string | null;
  createdAt: string;
  hasPortfolio: boolean;
  portfolioId?: string;
}

export async function getCustomers(): Promise<Customer[]> {
  try {
    const admin = await isAdmin();

    if (!admin) {
      throw new Error("Unauthorized: Admin access required");
    }

    // Get all users with CUSTOMER role
    const customers = await db.user.findMany({
      where: {
        role: "CUSTOMER",
      },
      include: {
        portfolios: {
          select: {
            id: true,
          },
          take: 1,
        },
      },
      orderBy: {
        createdAt: "desc",
      },
    });

    return customers.map((customer) => ({
      id: customer.id,
      name: customer.name,
      email: customer.email,
      image: customer.image,
      createdAt: customer.createdAt.toISOString(),
      hasPortfolio: customer.portfolios.length > 0,
      portfolioId: customer.portfolios[0]?.id,
    }));
  } catch (error) {
    console.error("Error fetching customers:", error);
    return [];
  }
}

export async function createCustomerPortfolio(userId: string): Promise<string | null> {
  try {
    const admin = await isAdmin();

    if (!admin) {
      throw new Error("Unauthorized: Admin access required");
    }

    // Check if user exists and is a customer
    const user = await db.user.findUnique({
      where: { id: userId, role: "CUSTOMER" },
    });

    if (!user) {
      throw new Error("Customer not found");
    }

    // Check if portfolio already exists
    const existingPortfolio = await db.portfolio.findFirst({
      where: { userId },
    });

    if (existingPortfolio) {
      return existingPortfolio.id;
    }

    // Create new portfolio
    const portfolio = await db.portfolio.create({
      data: {
        userId,
        name: `${user.name}'s Portfolio`,
        initialBalance: 0,
        currentBalance: 0,
      },
    });

    return portfolio.id;
  } catch (error) {
    console.error("Error creating customer portfolio:", error);
    return null;
  }
}

