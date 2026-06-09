/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */
import React from "react";
import ReactDOM from "react-dom/client";
import "./index.css";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { GoogleOAuthProvider } from "@react-oauth/google";
import { GoogleAuthDebugBootstrap } from "./components/GoogleAuthDebugBootstrap";
import { logGoogleAuthEnvironment } from "./lib/google-auth-debug";
import { supabaseBrowserConfigured } from "./lib/supabase-client";
import App from "./App";

const queryClient = new QueryClient();

const rootElement = document.getElementById("root");
if (!rootElement) {
  throw new Error("Could not find root element to mount to");
}

import { AuthProvider } from "./context/auth-context";

const clientId =
  (import.meta.env.VITE_GOOGLE_CLIENT_ID as string | undefined)?.trim() ||
  "missing-client-id-configure-in-env";

if (!supabaseBrowserConfigured()) {
  logGoogleAuthEnvironment(clientId);
}

function AppTree() {
  return (
    <>
      <GoogleAuthDebugBootstrap />
      <QueryClientProvider client={queryClient}>
        <AuthProvider>
          <App />
        </AuthProvider>
      </QueryClientProvider>
    </>
  );
}

const root = ReactDOM.createRoot(rootElement);
root.render(
  <React.StrictMode>
    {supabaseBrowserConfigured() ? (
      <AppTree />
    ) : (
      <GoogleOAuthProvider clientId={clientId}>
        <AppTree />
      </GoogleOAuthProvider>
    )}
  </React.StrictMode>,
);
