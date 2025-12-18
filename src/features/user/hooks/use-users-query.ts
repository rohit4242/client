/**
 * useUsersQuery Hook
 */

import { useQuery } from "@tanstack/react-query";
import { queryKeys } from "@/lib/query/query-keys";
import { getUsers } from "../actions/get-users";
import type { GetUsersInput } from "../types/user.types";

export interface UseUsersQueryOptions {
    staleTime?: number;
    enabled?: boolean;
}

export function useUsersQuery(
    filters?: GetUsersInput,
    options?: UseUsersQueryOptions
) {
    return useQuery({
        queryKey: queryKeys.users.list(filters),
        queryFn: () => getUsers(filters),
        staleTime: options?.staleTime ?? 60_000,
        enabled: options?.enabled ?? true,
    });
}
