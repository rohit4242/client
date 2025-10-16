"use server";

import { isAdmin } from "@/lib/auth-utils";
import db from "@/db";

export interface UserWithAgent {
  id: string;
  name: string;
  email: string;
  image: string | null;
  role: "ADMIN" | "AGENT" | "CUSTOMER";
  createdAt: string;
  hasPortfolio: boolean;
  portfolioId?: string;
  agentId?: string | null;
  agentName?: string | null;
  customerCount?: number; // For agents: count of assigned customers
}

export async function getAllUsers(): Promise<UserWithAgent[]> {
  try {
    const admin = await isAdmin();

    if (!admin) {
      throw new Error("Unauthorized: Admin access required");
    }

    // Get all users with their agent information
    const users = await db.user.findMany({
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
      orderBy: {
        createdAt: "desc",
      },
    });

    return users.map((user) => ({
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
    }));
  } catch (error) {
    console.error("Error fetching all users:", error);
    return [];
  }
}

export async function getAllAgents(): Promise<{ id: string; name: string; email: string; customerCount: number }[]> {
  try {
    const admin = await isAdmin();

    if (!admin) {
      throw new Error("Unauthorized: Admin access required");
    }

    const agents = await db.user.findMany({
      where: {
        role: "AGENT",
      },
      include: {
        _count: {
          select: {
            customers: true,
          },
        },
      },
      orderBy: {
        name: "asc",
      },
    });

    return agents.map((agent) => ({
      id: agent.id,
      name: agent.name,
      email: agent.email,
      customerCount: agent._count.customers,
    }));
  } catch (error) {
    console.error("Error fetching agents:", error);
    return [];
  }
}

