import { Loader2 } from "lucide-react";
import { useEffect, useState, type ReactNode } from "react";
import { ensureRuntimeAuthConfig } from "@/lib/runtime-auth-config";
import { supabaseBrowserConfigured } from "@/lib/supabase-client";

type AuthBootstrapProps = {
  children: (opts: { useSupabaseGoogle: boolean }) => ReactNode;
};

/** Fetches /api/auth/config so production can use Supabase OAuth without baking VITE_SUPABASE_* into Vercel. */
export function AuthBootstrap({ children }: AuthBootstrapProps) {
  const [ready, setReady] = useState(supabaseBrowserConfigured());

  useEffect(() => {
    if (supabaseBrowserConfigured()) {
      setReady(true);
      return;
    }
    let cancelled = false;
    void ensureRuntimeAuthConfig().finally(() => {
      if (!cancelled) setReady(true);
    });
    return () => {
      cancelled = true;
    };
  }, []);

  if (!ready) {
    return (
      <div className="flex min-h-[100dvh] flex-col items-center justify-center gap-3 bg-background text-muted-foreground">
        <Loader2 className="h-8 w-8 animate-spin" />
        <p className="text-sm">Loading…</p>
      </div>
    );
  }

  return <>{children({ useSupabaseGoogle: supabaseBrowserConfigured() })}</>;
}
