import { createClient, type SupabaseClient } from "@supabase/supabase-js";

let client: SupabaseClient | null = null;

export function supabaseBrowserConfigured(): boolean {
  const url = (import.meta.env.VITE_SUPABASE_URL as string | undefined)?.trim();
  const anon = (import.meta.env.VITE_SUPABASE_ANON_KEY as string | undefined)?.trim();
  return Boolean(url && anon);
}

export function getSupabaseBrowserClient(): SupabaseClient {
  const url = (import.meta.env.VITE_SUPABASE_URL as string | undefined)?.trim();
  const anon = (import.meta.env.VITE_SUPABASE_ANON_KEY as string | undefined)?.trim();
  if (!url || !anon) {
    throw new Error("VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY are required");
  }
  if (!client) {
    client = createClient(url, anon, {
      auth: {
        detectSessionInUrl: true,
        flowType: "pkce",
        persistSession: true,
      },
    });
  }
  return client;
}
