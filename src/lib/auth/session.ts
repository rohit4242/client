/**
 * Authentication Session Utilities
 * 
 * Centralized auth session management for server actions
 */

import { auth as betterAuth } from "@/lib/auth";
import { headers } from "next/headers";

/**
 * Get current authenticated session
 * 
 * @returns Session object or null if not authenticated
 * @throws Error if authentication check fails
 */
export async function getSession() {
    try {
        const session = await betterAuth.api.getSession({
            headers: await headers(),
        });
        return session;
    } catch (error) {
        console.error("Session check failed:", error);
        return null;
    }
}

/**
 * Get current authenticated user or throw error
 * 
 * @returns User object
 * @throws Error if not authenticated
 */
export async function requireAuth() {
    const session = await getSession();
    if (!session?.user) {
        throw new Error("Unauthorized - Authentication required");
    }
    return session.user;
}

/**
 * Check if user has required role
 * 
 * @param requiredRole - Role required for access
 * @returns True if user has required role
 * @throws Error if not authenticated
 */
export async function hasRole(requiredRole: "ADMIN" | "AGENT" | "CUSTOMER") {
    const user = await requireAuth();
    return user.role === requiredRole;
}

/**
 * Require user to have specific role
 * 
 * @param requiredRole - Role required for access
 * @throws Error if user doesn't have required role
 */
export async function requireRole(requiredRole: "ADMIN" | "AGENT" | "CUSTOMER") {
    const user = await requireAuth();
    if (user.role !== requiredRole) {
        throw new Error(`Unauthorized - ${requiredRole} role required`);
    }
    return user;
}

/**
 * Check if user has any of the specified roles
 * 
 * @param roles - Array of acceptable roles
 * @returns True if user has any of the roles
 */
export async function hasAnyRole(roles: ("ADMIN" | "AGENT" | "CUSTOMER")[]) {
    const user = await requireAuth();
    return roles.includes(user.role as "ADMIN" | "AGENT" | "CUSTOMER");
}

/**
 * Require user to have any of the specified roles
 * 
 * @param roles - Array of acceptable roles
 * @throws Error if user doesn't have any of the roles
 */
export async function requireAnyRole(roles: ("ADMIN" | "AGENT" | "CUSTOMER")[]) {
    const user = await requireAuth();
    if (!roles.includes(user.role as "ADMIN" | "AGENT" | "CUSTOMER")) {
        throw new Error(`Unauthorized - One of these roles required: ${roles.join(", ")}`);
    }
    return user;
}
