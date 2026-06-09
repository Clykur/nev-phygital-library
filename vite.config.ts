import path from "path";
import { defineConfig, loadEnv } from "vite";
import react from "@vitejs/plugin-react";
import tailwindcss from "@tailwindcss/vite";

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, ".", "");
  return {
    server: {
      port: 3000,
      host: "0.0.0.0",
      // Google GIS popup/sign-in uses postMessage; default COOP in some embeds blocks it.
      headers: {
        "Cross-Origin-Opener-Policy": "same-origin-allow-popups",
      },
      proxy: {
        "/api": {
          target: env.VITE_API_PROXY?.trim() || "http://127.0.0.1:8787",
          changeOrigin: true,
        },
        "/uploads": {
          target: env.VITE_API_PROXY?.trim() || "http://127.0.0.1:8787",
          changeOrigin: true,
        },
      },
    },
    plugins: [react(), tailwindcss()],

    resolve: {
      alias: {
        "@": path.resolve(__dirname, "src"),
      },
    },
  };
});
