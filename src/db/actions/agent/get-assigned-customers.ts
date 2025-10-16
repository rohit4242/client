"use server";

import { isAgent, getUserWithRole } from "@/lib/auth-utils";
import db from "@/db";

export interface AssignedCustomer {
  id: string;
  name: string;
  email: string;
  image: string | null;
  createdAt: string;
  hasPortfolio: boolean;
  portfolioId?: string;
}

export async function getAssignedCustomers(): Promise<AssignedCustomer[]> {
  try {
    const agent = await isAgent();

    if (!agent) {
      throw new Error("Unauthorized: Agent access required");
    }

    const currentUser = await getUserWithRole();

    if (!currentUser) {
      throw new Error("User not found");
    }

    // Get only customers assigned to this agent
    const customers = await db.user.findMany({
      where: {
        role: "CUSTOMER",
        agentId: currentUser.id, // Only customers assigned to this agent
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
    console.error("Error fetching assigned customers:", error);
    return [];
  }
}

