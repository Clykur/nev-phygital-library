import { apiFetch } from "@/lib/api";
import { setRuntimeSupabaseConfig } from "@/lib/supabase-client";

export type PublicAuthConfig = {
  mode: "supabase" | "legacy";
  email: boolean;
  google: "supabase_oauth" | "unavailable";
  sessionExchangePath: string;
  googleExchangePath: string;
  supabaseUrl?: string;
  supabaseAnonKey?: string;
};

let loadPromise: Promise<PublicAuthConfig | null> | null = null;

/** Loads Supabase public keys from the API when Vite env vars are unset (e.g. Vercel production). */
export async function ensureRuntimeAuthConfig(): Promise<PublicAuthConfig | null> {
  if (loadPromise) return loadPromise;

  loadPromise = (async () => {
    try {
      const cfg = await apiFetch<PublicAuthConfig>("/api/auth/config");
      if (
        cfg.mode === "supabase" &&
        cfg.google === "supabase_oauth" &&
        cfg.supabaseUrl?.trim() &&
        cfg.supabaseAnonKey?.trim()
      ) {
        setRuntimeSupabaseConfig(cfg.supabaseUrl.trim(), cfg.supabaseAnonKey.trim());
      }
      return cfg;
    } catch {
      return null;
    }
  })();

  return loadPromise;
}
