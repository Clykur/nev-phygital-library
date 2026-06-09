import type { CredentialResponse } from "@react-oauth/google";

const LOG_PREFIX = "[Google Auth]";

function isDev(): boolean {
  return import.meta.env.DEV;
}

export function maskGoogleClientId(clientId: string | undefined): string {
  if (!clientId?.trim()) return "(not set)";
  const id = clientId.trim();
  if (id.length <= 16) return id;
  return `${id.slice(0, 12)}…${id.slice(-28)}`;
}

export function describeGoogleClientIdConfig(clientId: string): {
  fromEnv: boolean;
  validShape: boolean;
} {
  const fromEnv = Boolean((import.meta.env.VITE_GOOGLE_CLIENT_ID as string | undefined)?.trim());
  const validShape =
    clientId !== "missing-client-id-configure-in-env" &&
    clientId.endsWith(".apps.googleusercontent.com");
  return { fromEnv, validShape };
}

/** Run once at app startup (dev only). */
export function logGoogleAuthEnvironment(clientId: string): void {
  if (!isDev()) return;

  const { fromEnv, validShape } = describeGoogleClientIdConfig(clientId);
  const origin = typeof window !== "undefined" ? window.location.origin : "(no window)";

  const originsForGoogleCloud = new Set<string>([origin]);
  if (origin.includes("localhost")) {
    originsForGoogleCloud.add("http://127.0.0.1:3000");
  }
  if (origin.includes("127.0.0.1")) {
    originsForGoogleCloud.add("http://localhost:3000");
  }

  console.groupCollapsed(`${LOG_PREFIX} environment (dev)`);
  console.info(
    "VITE_GOOGLE_CLIENT_ID loaded:",
    fromEnv ? "yes" : "no — set in .env.local and restart `npm run dev`",
  );
  console.info("client id:", maskGoogleClientId(clientId));
  console.info(
    "client id looks like a Web OAuth id:",
    validShape ? "yes" : "no — use a Web application client, not iOS/Android",
  );
  console.info("current page origin:", origin);
  console.info(
    "Google Cloud → APIs & Services → Credentials → OAuth 2.0 Client IDs → open THIS client → Application type must be Web application",
  );
  console.info("Authorized JavaScript origins — add every line below (no trailing slash):");
  [...originsForGoogleCloud].forEach((o) => console.info("  •", o));
  console.info(
    "Authorized redirect URIs (for popup/redirect sign-in) — add the same origin(s) plus production:",
    "https://nev-phygital-library.vercel.app",
  );
  console.info(
    "403 gsi/button + “origin is not allowed” = missing origin above for this exact client id. Supabase URL settings do not fix this.",
  );
  console.info(
    "“Cross-Origin-Opener-Policy would block postMessage” — use Chrome/Safari directly (not an embedded IDE browser); repo sets COOP to same-origin-allow-popups on Vite/Vercel.",
  );
  console.info(
    "Phygital-Backend GOOGLE_CLIENT_ID must match this VITE_GOOGLE_CLIENT_ID or API token verification fails after Google succeeds.",
  );
  console.groupEnd();
}

function formatConsoleArgs(args: unknown[]): string {
  return args
    .map((a) => {
      if (typeof a === "string") return a;
      if (a instanceof Error) return a.message;
      try {
        return JSON.stringify(a);
      } catch {
        return String(a);
      }
    })
    .join(" ");
}

function logGsiOriginBlocked(): void {
  console.groupCollapsed(
    `${LOG_PREFIX} gsi/button 403 — origin not allowlisted (button iframe only)`,
  );
  console.warn(
    "FedCM/popup sign-in can still work; this error is the embedded Google button iframe rejecting your origin.",
  );
  console.info("add to Authorized JavaScript origins:", window.location.origin);
  console.info(
    "client id (masked):",
    maskGoogleClientId(import.meta.env.VITE_GOOGLE_CLIENT_ID as string),
  );
  console.groupEnd();
}

let gsiInitializeHintLogged = false;

function logGsiMultipleInitialize(): void {
  if (gsiInitializeHintLogged) return;
  gsiInitializeHintLogged = true;
  console.info(
    `${LOG_PREFIX} GIS initialize() was called more than once (normal in dev: React Strict Mode runs effects twice). Safe to ignore if sign-in works.`,
  );
}

/** Surfaces GSI iframe / button errors with actionable context (dev only). */
export function installGoogleAuthConsoleHints(): () => void {
  if (!isDev() || typeof window === "undefined") return () => {};

  const originalError = console.error.bind(console);
  const originalWarn = console.warn.bind(console);

  const handleGsiMessage = (text: string) => {
    if (text.includes("origin is not allowed")) {
      logGsiOriginBlocked();
      return;
    }
    if (text.includes("initialize() is called multiple times")) {
      logGsiMultipleInitialize();
    }
  };

  console.error = (...args: unknown[]) => {
    handleGsiMessage(formatConsoleArgs(args));
    originalError(...args);
  };

  console.warn = (...args: unknown[]) => {
    handleGsiMessage(formatConsoleArgs(args));
    originalWarn(...args);
  };

  return () => {
    console.error = originalError;
    console.warn = originalWarn;
  };
}

export function logGooglePortalAccessDenied(
  portal: "students" | "colleges",
  baseRole: string | undefined,
): void {
  if (!isDev()) return;
  console.groupCollapsed(`${LOG_PREFIX} portal access denied after successful Google + API login`);
  console.info("landing tab:", portal);
  console.info("user baseRole:", baseRole ?? "(none)");
  if (portal === "colleges" && baseRole !== "hub" && baseRole !== "super_admin") {
    console.warn(
      "this Google account is not a hub/super_admin user. Use Hub Sign Up with Google, or email/password for an existing hub account.",
    );
  }
  if (portal === "students" && (baseRole === "hub" || baseRole === "super_admin")) {
    console.warn(
      "hub/admin accounts cannot use the student landing login — switch to Colleges & Institutes.",
    );
  }
  console.groupEnd();
}

export function logGoogleCredentialSuccess(context: string, response: CredentialResponse): void {
  if (!isDev()) return;
  if (response.credential) {
    console.info(`${LOG_PREFIX} credential received (${context}) — sending to /api/auth/google`);
    return;
  }
  console.warn(`${LOG_PREFIX} onSuccess without credential (${context})`, response);
}

export function logGoogleCredentialError(context: string, reason?: unknown): void {
  if (!isDev()) return;
  console.groupCollapsed(`${LOG_PREFIX} button flow failed (${context})`);
  if (reason !== undefined) console.error("detail:", reason);
  console.info(
    "if the button never appears or shows 403 in Network, fix Authorized JavaScript origins for:",
    window.location.origin,
  );
  console.info(
    "if the popup closes with no token, check ad blockers and third-party cookies / FedCM settings.",
  );
  console.groupEnd();
}

export function logGoogleBackendAuthStart(context: string): void {
  if (!isDev()) return;
  console.info(`${LOG_PREFIX} POST /api/auth/google (${context})`);
}

export function logGoogleBackendAuthSuccess(context: string): void {
  if (!isDev()) return;
  console.info(`${LOG_PREFIX} backend sign-in OK (${context})`);
}

export function logGoogleBackendAuthFailure(context: string, error: unknown): void {
  if (!isDev()) return;
  console.groupCollapsed(`${LOG_PREFIX} backend sign-in failed (${context})`);
  console.error(error);
  console.info(
    "this step runs after Google returns a credential — 403 on gsi/button is fixed in Google Cloud, not the API.",
  );
  console.groupEnd();
}
