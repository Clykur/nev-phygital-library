import { useState } from "react";
import { GoogleLogin } from "@react-oauth/google";
import { logGoogleCredentialError, logGoogleCredentialSuccess } from "@/lib/google-auth-debug";
import { supabaseBrowserConfigured } from "@/lib/supabase-client";
import {
  startSupabaseGoogleOAuthRedirect,
  type SupabaseGoogleOAuthMeta,
} from "@/lib/supabase-google-oauth";

const defaultButtonProps = {
  theme: "outline" as const,
  text: "continue_with" as const,
  shape: "pill" as const,
  size: "large" as const,
  ux_mode: "popup" as const,
  use_fedcm_for_button: false,
  login_uri: typeof window !== "undefined" ? window.location.origin : undefined,
};

type GoogleSignInButtonProps = {
  context: string;
  landingSegment: "students" | "colleges";
  oauthMeta?: SupabaseGoogleOAuthMeta;
  onCredential: (credential: string) => void;
};

function GoogleMark() {
  return (
    <svg width="18" height="18" viewBox="0 0 48 48" aria-hidden>
      <path
        fill="#EA4335"
        d="M24 9.5c3.54 0 6.71 1.22 9.21 3.6l6.85-6.85C35.9 2.38 30.47 0 24 0 14.62 0 6.51 5.38 2.56 13.22l7.98 6.19C12.13 13.09 17.62 9.5 24 9.5z"
      />
      <path
        fill="#4285F4"
        d="M46.98 24.55c0-1.57-.15-3.09-.38-4.55H24v9.02h12.94c-.58 2.96-2.26 5.48-4.78 7.18l7.73 6c4.51-4.18 7.09-10.36 7.09-17.65z"
      />
      <path
        fill="#FBBC05"
        d="M10.53 28.59c-.48-1.45-.76-2.99-.76-4.59s.27-3.14.76-4.59l-7.98-6.19C.92 16.46 0 20.12 0 24c0 3.88.92 7.54 2.56 10.78l7.97-6.19z"
      />
      <path
        fill="#34A853"
        d="M24 48c6.48 0 11.93-2.13 15.89-5.81l-7.73-6c-2.15 1.45-4.92 2.3-8.16 2.3-6.38 0-11.74-4.29-13.65-10.07l-7.98 6.19C6.51 42.62 14.62 48 24 48z"
      />
    </svg>
  );
}

function SupabaseGoogleSignInButton({
  context,
  landingSegment,
  oauthMeta,
}: Pick<GoogleSignInButtonProps, "context" | "landingSegment" | "oauthMeta">) {
  const [busy, setBusy] = useState(false);

  return (
    <button
      type="button"
      disabled={busy}
      onClick={() => {
        setBusy(true);
        void startSupabaseGoogleOAuthRedirect(oauthMeta ?? {}, landingSegment).catch((err) => {
          setBusy(false);
          logGoogleCredentialError(context, err);
        });
      }}
      className="w-full flex items-center justify-center gap-2 py-2.5 px-4 rounded-full border border-border bg-background hover:bg-muted/50 text-sm font-medium text-foreground transition disabled:opacity-60"
    >
      <GoogleMark />
      {busy ? "Redirecting…" : "Continue with Google"}
    </button>
  );
}

export function GoogleSignInButton({
  context,
  landingSegment,
  oauthMeta,
  onCredential,
}: GoogleSignInButtonProps) {
  if (supabaseBrowserConfigured()) {
    return (
      <SupabaseGoogleSignInButton
        context={context}
        landingSegment={landingSegment}
        oauthMeta={oauthMeta}
      />
    );
  }

  return (
    <GoogleLogin
      {...defaultButtonProps}
      onSuccess={(credentialResponse) => {
        logGoogleCredentialSuccess(context, credentialResponse);
        if (credentialResponse.credential) {
          onCredential(credentialResponse.credential);
        }
      }}
      onError={() => {
        logGoogleCredentialError(context);
      }}
    />
  );
}
