"use client";

import { authApi } from "@/lib/api-client";
import { APP_ROUTES } from "@/lib/constants";
import type { LoginPayload, RegisterPayload, User } from "@/lib/types";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useRouter } from "next/navigation";
import { createContext, useContext, useState } from "react";

interface AuthContextValue {
  user: User | null;
  loading: boolean;
  loggingOut: boolean;
  login: (payload: LoginPayload) => Promise<void>;
  register: (payload: RegisterPayload) => Promise<void>;
  logout: () => Promise<void>;
  refresh: () => Promise<void>;
}

const AuthContext = createContext<AuthContextValue | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const queryClient = useQueryClient();
  const router = useRouter();
  const [loggingOut, setLoggingOut] = useState(false);

  const { data: user, isLoading } = useQuery({
    queryKey: ["session"],
    queryFn: authApi.session,
  });

  async function login(payload: LoginPayload) {
    await authApi.login(payload);
    await queryClient.invalidateQueries({ queryKey: ["session"] });
    router.push(APP_ROUTES.dashboard);
  }

  async function register(payload: RegisterPayload) {
    await authApi.register(payload);
    await queryClient.invalidateQueries({ queryKey: ["session"] });
    router.push(APP_ROUTES.dashboard);
  }

  async function logout() {
    try {
      setLoggingOut(true);
      await authApi.logout();
      await queryClient.clear();
      router.push(APP_ROUTES.login);
    } finally {
      setLoggingOut(false);
    }
  }

  async function refresh() {
    await queryClient.invalidateQueries({ queryKey: ["session"] });
  }

  const value = {
    user: user || null,
    loading: isLoading,
    loggingOut,
    login,
    register,
    logout,
    refresh,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used within AuthProvider");
  }
  return context;
}
