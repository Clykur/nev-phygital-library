import { createClient, type SupabaseClient } from "@supabase/supabase-js";

let client: SupabaseClient | null = null;
let runtimeUrl: string | null = null;
let runtimeAnon: string | null = null;

export function setRuntimeSupabaseConfig(url: string, anonKey: string): void {
  runtimeUrl = url.trim();
  runtimeAnon = anonKey.trim();
  client = null;
}

function resolveSupabaseCredentials(): { url: string; anon: string } | null {
  const url =
    runtimeUrl?.trim() || (import.meta.env.VITE_SUPABASE_URL as string | undefined)?.trim() || "";
  const anon =
    runtimeAnon?.trim() ||
    (import.meta.env.VITE_SUPABASE_ANON_KEY as string | undefined)?.trim() ||
    "";
  if (!url || !anon) return null;
  return { url, anon };
}

export function supabaseBrowserConfigured(): boolean {
  return resolveSupabaseCredentials() !== null;
}

export function getSupabaseBrowserClient(): SupabaseClient {
  const creds = resolveSupabaseCredentials();
  if (!creds) {
    throw new Error(
      "Supabase is not configured. Set VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY locally, or ensure the API exposes /api/auth/config.",
    );
  }
  if (!client) {
    client = createClient(creds.url, creds.anon, {
      auth: {
        detectSessionInUrl: true,
        flowType: "pkce",
        persistSession: true,
      },
    });
  }
  return client;
}
