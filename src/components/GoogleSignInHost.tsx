import {
  createContext,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from "react";
import { createPortal } from "react-dom";
import { GoogleSignInButton } from "@/components/GoogleSignInButton";
import type { SupabaseGoogleOAuthMeta } from "@/lib/supabase-google-oauth";

type Slot = {
  id: string;
  context: string;
  landingSegment: "students" | "colleges";
  oauthMeta?: SupabaseGoogleOAuthMeta;
  onCredential: (credential: string) => void;
  node: HTMLElement;
};

type GoogleSignInHostApi = {
  attach: (
    id: string,
    context: string,
    landingSegment: "students" | "colleges",
    oauthMeta: SupabaseGoogleOAuthMeta | undefined,
    onCredential: (credential: string) => void,
    node: HTMLElement,
  ) => () => void;
};

const GoogleSignInHostContext = createContext<GoogleSignInHostApi | null>(null);

/** One GIS `initialize()` per page — button UI is portaled into the active form. */
export function GoogleSignInHost({ children }: { children: ReactNode }) {
  const [slot, setSlot] = useState<Slot | null>(null);

  const api = useMemo<GoogleSignInHostApi>(
    () => ({
      attach(id, context, landingSegment, oauthMeta, onCredential, node) {
        setSlot({ id, context, landingSegment, oauthMeta, onCredential, node });
        return () => {
          setSlot((current) => (current?.id === id ? null : current));
        };
      },
    }),
    [],
  );

  return (
    <GoogleSignInHostContext.Provider value={api}>
      {children}
      {slot &&
        createPortal(
          <GoogleSignInButton
            key={slot.id}
            context={slot.context}
            landingSegment={slot.landingSegment}
            oauthMeta={slot.oauthMeta}
            onCredential={slot.onCredential}
          />,
          slot.node,
        )}
    </GoogleSignInHostContext.Provider>
  );
}

type GoogleSignInAnchorProps = {
  id: string;
  context: string;
  active: boolean;
  landingSegment: "students" | "colleges";
  oauthMeta?: SupabaseGoogleOAuthMeta;
  onCredential: (credential: string) => void;
};

export function GoogleSignInAnchor({
  id,
  context,
  active,
  landingSegment,
  oauthMeta,
  onCredential,
}: GoogleSignInAnchorProps) {
  const host = useContext(GoogleSignInHostContext);
  const containerRef = useRef<HTMLDivElement>(null);
  const onCredentialRef = useRef(onCredential);
  onCredentialRef.current = onCredential;

  useEffect(() => {
    if (!active || !host || !containerRef.current) return;
    return host.attach(
      id,
      context,
      landingSegment,
      oauthMeta,
      (credential) => onCredentialRef.current(credential),
      containerRef.current,
    );
  }, [active, context, host, id, landingSegment, oauthMeta]);

  return <div ref={containerRef} className="flex justify-center w-full min-h-[44px]" />;
}
