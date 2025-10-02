"use client";

import { createContext, useContext, useState, useEffect, ReactNode } from "react";
import { Customer } from "@/db/actions/admin/get-customers";

interface SelectedUserContextType {
  selectedUser: Customer | null;
  setSelectedUser: (user: Customer | null) => void;
  clearSelectedUser: () => void;
}

const SelectedUserContext = createContext<SelectedUserContextType | undefined>(
  undefined
);

export function SelectedUserProvider({ children }: { children: ReactNode }) {
  const [selectedUser, setSelectedUserState] = useState<Customer | null>(null);

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

  const setSelectedUser = (user: Customer | null) => {
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

  return (
    <SelectedUserContext.Provider
      value={{ selectedUser, setSelectedUser, clearSelectedUser }}
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

