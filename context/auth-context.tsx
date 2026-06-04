import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import { apiFetch } from "@/lib/api";
import type { HubKindValue } from "@/lib/hub-display";
import type { AuthUser } from "@/lib/rbac";

const STORAGE_KEY = "phygital_token";

export type RegisterPayload =
  | {
      name: string;
      email: string;
      password: string;
      accountType?: "user";
    }
  | {
      name: string;
      email: string;
      password: string;
      accountType: "hub";
      hubName: string;
      hubLocation: string;
      hubKind: HubKindValue;
    };

type AuthContextValue = {
  token: string | null;
  user: AuthUser | null;
  loading: boolean;
  login: (email: string, password: string) => Promise<AuthUser>;
  register: (payload: RegisterPayload) => Promise<AuthUser>;
  logout: () => void;
  refreshUser: () => Promise<void>;
  activateDemoPremium: (months?: number) => Promise<void>;
};

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [token, setToken] = useState<string | null>(null);
  const [user, setUser] = useState<AuthUser | null>(null);
  const [loading, setLoading] = useState(true);

  const refreshUser = useCallback(async () => {
    if (!token) {
      setUser(null);
      return;
    }
    const { user: next } = await apiFetch<{ user: AuthUser | null }>("/api/auth/me", {
      token,
    });
    if (!next) {
      localStorage.removeItem(STORAGE_KEY);
      setToken(null);
      setUser(null);
      return;
    }
    setUser(next);
  }, [token]);

  useEffect(() => {
    if (typeof window !== "undefined") {
      setToken(localStorage.getItem(STORAGE_KEY));
    }
  }, []);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      if (!token) {
        setUser(null);
        setLoading(false);
        return;
      }
      try {
        await refreshUser();
      } catch {
        if (!cancelled) {
          setToken(null);
          localStorage.removeItem(STORAGE_KEY);
          setUser(null);
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [token, refreshUser]);

  const login = useCallback(async (email: string, password: string) => {
    const data = await apiFetch<{ token: string; user: AuthUser }>("/api/auth/login", {
      method: "POST",
      body: JSON.stringify({ email, password }),
    });
    localStorage.setItem(STORAGE_KEY, data.token);
    setToken(data.token);
    setUser(data.user);
    return data.user;
  }, []);

  const register = useCallback(async (payload: RegisterPayload) => {
    const body =
      payload.accountType === "hub"
        ? {
            name: payload.name,
            email: payload.email,
            password: payload.password,
            accountType: "hub" as const,
            hubName: payload.hubName,
            hubLocation: payload.hubLocation,
            hubKind: payload.hubKind,
          }
        : {
            name: payload.name,
            email: payload.email,
            password: payload.password,
            accountType: "user" as const,
          };
    const data = await apiFetch<{
      token: string;
      user: AuthUser;
      registeredAs?: "student" | "hub";
    }>("/api/auth/register", {
      method: "POST",
      body: JSON.stringify(body),
    });
    localStorage.setItem(STORAGE_KEY, data.token);
    setToken(data.token);
    setUser(data.user);
    return data.user;
  }, []);

  const logout = useCallback(() => {
    localStorage.removeItem(STORAGE_KEY);
    setToken(null);
    setUser(null);
  }, []);

  const activateDemoPremium = useCallback(
    async (months = 1) => {
      if (!token) throw new Error("Not signed in");
      const data = await apiFetch<{ token: string; user: AuthUser }>(
        "/api/auth/billing/demo-premium",
        {
          method: "POST",
          token,
          body: JSON.stringify({ months }),
        },
      );
      localStorage.setItem(STORAGE_KEY, data.token);
      setToken(data.token);
      setUser(data.user);
    },
    [token],
  );

  const value = useMemo(
    () => ({
      token,
      user,
      loading,
      login,
      register,
      logout,
      refreshUser,
      activateDemoPremium,
    }),
    [token, user, loading, login, register, logout, refreshUser, activateDemoPremium],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth(): AuthContextValue {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within AuthProvider");
  return ctx;
}