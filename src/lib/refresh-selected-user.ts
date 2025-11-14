import { UserWithAgent } from "@/db/actions/admin/get-all-users";

/**
 * Fetches fresh user data from the server, including updated portfolio status.
 * Used to refresh the selected user in the admin context after operations that may change portfolio status.
 * 
 * @param userId - The ID of the user to refresh
 * @returns The updated user data or null if fetch fails
 */
export async function refreshSelectedUser(userId: string): Promise<UserWithAgent | null> {
  try {
    const response = await fetch(`/api/admin/users/${userId}`);
    
    if (!response.ok) {
      console.error('Failed to refresh user data:', response.statusText);
      return null;
    }
    
    const updatedUser = await response.json();
    return updatedUser;
  } catch (error) {
    console.error('Error refreshing selected user:', error);
    return null;
  }
}

