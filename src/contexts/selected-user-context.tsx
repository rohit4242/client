"use client";

import { createContext, useContext, useState, useEffect, ReactNode } from "react";
import { UserWithAgent } from "@/db/actions/admin/get-all-users";
import { refreshSelectedUser as refreshUserData } from "@/lib/refresh-selected-user";

interface SelectedUserContextType {
  selectedUser: UserWithAgent | null;
  setSelectedUser: (user: UserWithAgent | null) => void;
  clearSelectedUser: () => void;
  refreshSelectedUser: () => Promise<void>;
}

const SelectedUserContext = createContext<SelectedUserContextType | undefined>(
  undefined
);

export function SelectedUserProvider({ children }: { children: ReactNode }) {
  const [selectedUser, setSelectedUserState] = useState<UserWithAgent | null>(null);

  // Load from localStorage on mount
  useEffect(() => {
    const stored = localStorage.getItem("selectedUser");
    if (stored) {
      try {
        const user = JSON.parse(stored);
        setSelectedUserState(user);
      } catch (error) {
        console.error("Error loading selected user:", error);
        localStorage.removeItem("selectedUser");
      }
    }
  }, []);

  const setSelectedUser = (user: UserWithAgent | null) => {
    setSelectedUserState(user);
    if (user) {
      localStorage.setItem("selectedUser", JSON.stringify(user));
      // Set cookie for server-side access
      document.cookie = `selected_user_id=${user.id};path=/;max-age=${60 * 60 * 24 * 30};samesite=lax`;
    } else {
      localStorage.removeItem("selectedUser");
      // Clear cookie
      document.cookie = "selected_user_id=;path=/;max-age=0";
    }
  };

  const clearSelectedUser = () => {
    setSelectedUserState(null);
    localStorage.removeItem("selectedUser");
    // Clear cookie
    document.cookie = "selected_user_id=;path=/;max-age=0";
  };

  const refreshSelectedUser = async () => {
    if (selectedUser?.id) {
      const freshUserData = await refreshUserData(selectedUser.id);
      if (freshUserData) {
        setSelectedUser(freshUserData);
      }
    }
  };

  return (
    <SelectedUserContext.Provider
      value={{ selectedUser, setSelectedUser, clearSelectedUser, refreshSelectedUser }}
    >
      {children}
    </SelectedUserContext.Provider>
  );
}

export function useSelectedUser() {
  const context = useContext(SelectedUserContext);
  if (context === undefined) {
    throw new Error("useSelectedUser must be used within SelectedUserProvider");
  }
  return context;
}

