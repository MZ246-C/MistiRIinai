import { createContext, useCallback, useContext, useEffect, useState, ReactNode } from "react";
import { api, ApiError } from "@/lib/api";

interface AuthState {
  status: "loading" | "authenticated" | "unauthenticated";
  login: (password: string) => Promise<void>;
  logout: () => Promise<void>;
  error: string | null;
  clearError: () => void;
}

const AuthContext = createContext<AuthState | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [status, setStatus] = useState<AuthState["status"]>("loading");
  const [error, setError] = useState<string | null>(null);

  const checkSession = useCallback(async () => {
    try {
      const res = await api.get<{ authenticated: boolean }>("/auth-session");
      setStatus(res.authenticated ? "authenticated" : "unauthenticated");
    } catch {
      setStatus("unauthenticated");
    }
  }, []);

  useEffect(() => {
    checkSession();
  }, [checkSession]);

  // Re-check session when the tab regains focus, so an expired session in
  // another tab / after a long idle period is reflected promptly.
  useEffect(() => {
    const onFocus = () => {
      if (status === "authenticated") checkSession();
    };
    window.addEventListener("focus", onFocus);
    return () => window.removeEventListener("focus", onFocus);
  }, [checkSession, status]);

  const login = useCallback(async (password: string) => {
    setError(null);
    try {
      await api.post("/auth-login", { password });
      setStatus("authenticated");
    } catch (err) {
      const message =
        err instanceof ApiError ? err.message : "Something went wrong. Please try again.";
      setError(message);
      throw err;
    }
  }, []);

  const logout = useCallback(async () => {
    try {
      await api.post("/auth-logout");
    } finally {
      setStatus("unauthenticated");
    }
  }, []);

  const clearError = useCallback(() => setError(null), []);

  return (
    <AuthContext.Provider value={{ status, login, logout, error, clearError }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within AuthProvider");
  return ctx;
}
