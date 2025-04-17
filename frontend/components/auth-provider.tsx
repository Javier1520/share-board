"use client";
import React from "react";

// Minimal AuthContext for token state
export interface AuthContextType {
  access: string | null;
  refresh: string | null;
  setTokens: (access: string, refresh: string) => void;
  clearTokens: () => void;
}

export const AuthContext = React.createContext<AuthContextType | undefined>(
  undefined
);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [access, setAccess] = React.useState<string | null>(
    typeof window !== "undefined" ? localStorage.getItem("access") : null
  );
  const [refresh, setRefresh] = React.useState<string | null>(
    typeof window !== "undefined" ? localStorage.getItem("refresh") : null
  );

  const setTokens = (access: string, refresh: string) => {
    setAccess(access);
    setRefresh(refresh);
    if (typeof window !== "undefined") {
      localStorage.setItem("access", access);
      localStorage.setItem("refresh", refresh);
    }
  };
  const clearTokens = () => {
    setAccess(null);
    setRefresh(null);
    if (typeof window !== "undefined") {
      localStorage.removeItem("access");
      localStorage.removeItem("refresh");
    }
  };

  return (
    <AuthContext.Provider value={{ access, refresh, setTokens, clearTokens }}>
      {children}
    </AuthContext.Provider>
  );
}
