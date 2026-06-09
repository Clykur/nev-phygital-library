import { useEffect } from "react";
import { installGoogleAuthConsoleHints } from "@/lib/google-auth-debug";
import { supabaseBrowserConfigured } from "@/lib/supabase-client";

/** Dev-only: enriches GSI_LOGGER / 403 console noise when using the GIS iframe (not Supabase OAuth). */
export function GoogleAuthDebugBootstrap() {
  useEffect(() => {
    if (supabaseBrowserConfigured()) return;
    return installGoogleAuthConsoleHints();
  }, []);
  return null;
}
