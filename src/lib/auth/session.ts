/**
 * Authentication Session Utilities
 * 
 * Centralized auth session management for server actions
 */

import { auth as betterAuth } from "@/lib/auth";
import { headers } from "next/headers";
import { User, UserRole } from "@prisma/client";

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
export async function requireAuth(): Promise<User> {
    const session = await getSession();
    if (!session?.user) {
        throw new Error("Unauthorized - Authentication required");
    }
    return session.user as unknown as User;
}

/**
 * Check if user has required role
 * 
 * @param requiredRole - Role required for access
 * @returns True if user has required role
 * @throws Error if not authenticated
 */
export async function hasRole(requiredRole: UserRole) {
    const user = await requireAuth();
    return user.role === requiredRole;
}

/**
 * Require user to have specific role
 * 
 * @param requiredRole - Role required for access
 * @throws Error if user doesn't have required role
 */
export async function requireRole(requiredRole: UserRole) {
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
export async function hasAnyRole(roles: UserRole[]) {
    const user = await requireAuth();
    return roles.includes(user.role);
}

/**
 * Require user to have any of the specified roles
 * 
 * @param roles - Array of acceptable roles
 * @throws Error if user doesn't have any of the roles
 */
export async function requireAnyRole(roles: (UserRole | string)[]) {
    const user = await requireAuth();
    // Allow string comparison for flexibility, but prefer enum
    const userRole = user.role as unknown as string;
    const allowedRoles = roles.map(r => r.toString());

    if (!allowedRoles.includes(userRole)) {
        throw new Error(`Unauthorized - One of these roles required: ${roles.join(", ")}`);
    }
    return user;
}
