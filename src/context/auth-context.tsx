import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from "react";
import { apiFetch } from "@/lib/api";
import { logGoogleBackendAuthFailure, logGoogleBackendAuthSuccess } from "@/lib/google-auth-debug";
import { getSupabaseBrowserClient, supabaseBrowserConfigured } from "@/lib/supabase-client";
import {
  clearSupabaseGoogleOAuthContext,
  readSupabaseGoogleOAuthContext,
  stripAuthParamsFromUrl,
  urlLooksLikeSupabaseAuthCallback,
  waitForSupabaseOAuthReturnSession,
} from "@/lib/supabase-google-oauth";
import type { HubKindValue } from "@/lib/hub-display";
import type { AuthUser } from "@/lib/rbac";

const STORAGE_KEY = "phygital_token";

export type RegisterPayload =
  | {
      name: string;
      email: string;
      password: string;
      phone?: string;
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

      phone?: string;
      address?: string;
      city?: string;
      district?: string;
      state?: string;
      postalCode?: string;
    }
  | {
      name: string;
      email: string;
      password: string;
      accountType: "super_admin";
      hubName?: string;
      hubLocation?: string;
      hubKind?: string;
    };

type AuthContextValue = {
  token: string | null;
  user: AuthUser | null;
  loading: boolean;
  /** Set after Supabase Google redirect completes; App applies portal rules then clears. */
  oauthLandingSegment: "students" | "colleges" | null;
  clearOauthLandingSegment: () => void;
  login: (email: string, password: string) => Promise<AuthUser>;
  loginGoogle: (payload: {
    token: string;
    accountType?: string;
    hubLocation?: string;
    hubName?: string;
    hubKind?: string;
  }) => Promise<AuthUser>;
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
  const [oauthLandingSegment, setOauthLandingSegment] = useState<"students" | "colleges" | null>(
    null,
  );
  const supabaseOAuthExchangeRef = useRef(false);

  const clearOauthLandingSegment = useCallback(() => {
    setOauthLandingSegment(null);
  }, []);

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

  useEffect(() => {
    if (!supabaseBrowserConfigured()) return;

    const shouldHandleOAuthReturn =
      urlLooksLikeSupabaseAuthCallback() || readSupabaseGoogleOAuthContext() !== null;
    if (!shouldHandleOAuthReturn) return;

    const supabase = getSupabaseBrowserClient();

    const exchangeForAppSession = async (accessToken: string) => {
      if (supabaseOAuthExchangeRef.current) return;
      supabaseOAuthExchangeRef.current = true;

      const ctx = readSupabaseGoogleOAuthContext();
      const body = {
        accessToken,
        ...(ctx?.meta?.accountType ? { accountType: ctx.meta.accountType } : {}),
        ...(ctx?.meta?.hubLocation ? { hubLocation: ctx.meta.hubLocation } : {}),
        ...(ctx?.meta?.hubName ? { hubName: ctx.meta.hubName } : {}),
        ...(ctx?.meta?.hubKind ? { hubKind: ctx.meta.hubKind } : {}),
      };

      try {
        const data = await apiFetch<{ token: string; user: AuthUser }>("/api/auth/session", {
          method: "POST",
          body: JSON.stringify(body),
        });
        localStorage.setItem(STORAGE_KEY, data.token);
        setToken(data.token);
        setUser(data.user);
        if (ctx?.landingSegment) setOauthLandingSegment(ctx.landingSegment);
        logGoogleBackendAuthSuccess(ctx?.meta?.accountType ?? "supabase-oauth");
        clearSupabaseGoogleOAuthContext();
        stripAuthParamsFromUrl();
        void supabase.auth.signOut();
      } catch (error) {
        supabaseOAuthExchangeRef.current = false;
        logGoogleBackendAuthFailure("supabase-oauth", error);
      }
    };

    void (async () => {
      const session = await waitForSupabaseOAuthReturnSession();
      stripAuthParamsFromUrl();
      if (!session?.access_token) {
        logGoogleBackendAuthFailure(
          "supabase-oauth",
          "No Supabase session after Google redirect. Try signing in again from the same browser tab.",
        );
        return;
      }
      await exchangeForAppSession(session.access_token);
    })();
  }, []);

  const login = useCallback(async (email: string, password: string) => {
    const data = await apiFetch<{ token: string; user: AuthUser }>("/api/auth/login", {
      method: "POST",
      body: JSON.stringify({ email: email.trim().toLowerCase(), password }),
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

            phone: payload.phone,
            address: payload.address,
            city: payload.city,
            district: payload.district,
            state: payload.state,
            postalCode: payload.postalCode,
          }
        : payload.accountType === "super_admin"
          ? {
              name: payload.name,
              email: payload.email,
              password: payload.password,
              accountType: "super_admin" as const,
              hubName: payload.hubName,
              hubLocation: payload.hubLocation,
              hubKind: payload.hubKind,
            }
          : {
              name: payload.name,
              email: payload.email,
              password: payload.password,
              ...("phone" in payload && payload.phone ? { phone: payload.phone } : {}),
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

  const loginGoogle = useCallback(
    async (payload: {
      token: string;
      accountType?: string;
      hubLocation?: string;
      hubName?: string;
      hubKind?: string;
    }) => {
      const context = payload.accountType ?? "existing-user";
      try {
        const data = await apiFetch<{ token: string; user: AuthUser }>("/api/auth/google", {
          method: "POST",
          body: JSON.stringify(payload),
        });
        localStorage.setItem(STORAGE_KEY, data.token);
        setToken(data.token);
        setUser(data.user);
        logGoogleBackendAuthSuccess(context);
        return data.user;
      } catch (error) {
        logGoogleBackendAuthFailure(context, error);
        throw error;
      }
    },
    [],
  );

  const logout = useCallback(() => {
    if (supabaseBrowserConfigured()) {
      void getSupabaseBrowserClient().auth.signOut();
    }
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
      oauthLandingSegment,
      clearOauthLandingSegment,
      login,
      loginGoogle,
      register,
      logout,
      refreshUser,
      activateDemoPremium,
    }),
    [
      token,
      user,
      loading,
      oauthLandingSegment,
      clearOauthLandingSegment,
      login,
      loginGoogle,
      register,
      logout,
      refreshUser,
      activateDemoPremium,
    ],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth(): AuthContextValue {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within AuthProvider");
  return ctx;
}
