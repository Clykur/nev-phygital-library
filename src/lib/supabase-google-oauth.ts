import type { Session } from "@supabase/supabase-js";
import { getSupabaseBrowserClient } from "@/lib/supabase-client";

export type SupabaseGoogleOAuthMeta = {
  accountType?: string;
  hubLocation?: string;
  hubName?: string;
  hubKind?: string;
};

const META_KEY = "phygital_supabase_google_oauth_meta";
const PORTAL_KEY = "phygital_supabase_google_oauth_portal";

export function saveSupabaseGoogleOAuthContext(
  meta: SupabaseGoogleOAuthMeta,
  landingSegment: "students" | "colleges",
): void {
  sessionStorage.setItem(META_KEY, JSON.stringify(meta));
  sessionStorage.setItem(PORTAL_KEY, landingSegment);
}

export function readSupabaseGoogleOAuthContext(): {
  meta: SupabaseGoogleOAuthMeta;
  landingSegment: "students" | "colleges";
} | null {
  const portal = sessionStorage.getItem(PORTAL_KEY);
  const raw = sessionStorage.getItem(META_KEY);
  if (!portal || !raw) return null;
  try {
    const meta = JSON.parse(raw) as SupabaseGoogleOAuthMeta;
    if (portal !== "students" && portal !== "colleges") return null;
    return { meta, landingSegment: portal };
  } catch {
    return null;
  }
}

export function clearSupabaseGoogleOAuthContext(): void {
  sessionStorage.removeItem(META_KEY);
  sessionStorage.removeItem(PORTAL_KEY);
}

/** URL may contain tokens/code after Supabase redirects back to the app. */
export function urlLooksLikeSupabaseAuthCallback(): boolean {
  if (typeof window === "undefined") return false;
  const { hash, search } = window.location;
  if (hash.includes("access_token=") || hash.includes("error=")) return true;
  const params = new URLSearchParams(search);
  return params.has("code") || params.has("error_description");
}

export function stripAuthParamsFromUrl(): void {
  if (typeof window === "undefined") return;
  window.history.replaceState(
    {},
    document.title,
    `${window.location.origin}${window.location.pathname}`,
  );
}

const CODE_HANDLED_KEY = "phygital_supabase_oauth_code_handled";

let oauthReturnSessionPromise: Promise<Session | null> | null = null;

/**
 * After redirect with ?code=, Supabase (detectSessionInUrl) exchanges PKCE once.
 * Do not call exchangeCodeForSession manually — that causes PKCECodeVerifierMissingError.
 */
export function waitForSupabaseOAuthReturnSession(): Promise<Session | null> {
  if (oauthReturnSessionPromise) return oauthReturnSessionPromise;

  oauthReturnSessionPromise = new Promise<Session | null>((resolve) => {
    const supabase = getSupabaseBrowserClient();
    const code = new URLSearchParams(window.location.search).get("code");

    if (code && sessionStorage.getItem(CODE_HANDLED_KEY) === code) {
      void supabase.auth.getSession().then(({ data: { session } }) => resolve(session ?? null));
      return;
    }
    if (code) sessionStorage.setItem(CODE_HANDLED_KEY, code);

    let settled = false;
    const finish = (session: Session | null) => {
      if (settled) return;
      settled = true;
      subscription.unsubscribe();
      clearTimeout(timer);
      resolve(session);
    };

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((event, session) => {
      if (
        session?.access_token &&
        (event === "SIGNED_IN" || event === "INITIAL_SESSION" || event === "TOKEN_REFRESHED")
      ) {
        finish(session);
      }
    });

    const timer = window.setTimeout(() => finish(null), 12_000);

    void supabase.auth.getSession().then(({ data: { session } }) => {
      if (session?.access_token) finish(session);
    });
  }).finally(() => {
    oauthReturnSessionPromise = null;
  });

  return oauthReturnSessionPromise;
}

export async function startSupabaseGoogleOAuthRedirect(
  meta: SupabaseGoogleOAuthMeta,
  landingSegment: "students" | "colleges",
): Promise<void> {
  saveSupabaseGoogleOAuthContext(meta, landingSegment);
  const supabase = getSupabaseBrowserClient();
  const redirectTo = `${window.location.origin}${window.location.pathname}`;
  const { error } = await supabase.auth.signInWithOAuth({
    provider: "google",
    options: {
      redirectTo,
      skipBrowserRedirect: false,
    },
  });
  if (error) {
    clearSupabaseGoogleOAuthContext();
    throw error;
  }
}
