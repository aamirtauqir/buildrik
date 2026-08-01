import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import tailwindcss from "@tailwindcss/vite";
import { resolve } from "path";

export default defineConfig({
  plugins: [
    react({
      jsxImportSource: "@emotion/react",
    }),
    tailwindcss(),
  ],
  root: "./demo",
  // Read env from monorepo root so a single `.env.local` serves both
  // Next.js (dashboard) and Vite (editor). Without this, Vite would look
  // for `.env*` next to `root` (./demo) — Phase 1d would silently miss
  // VITE_FEATURE_PUBLISH=true. Only VITE_*-prefixed vars are exposed.
  envDir: resolve(__dirname, "../.."),
  build: {
    outDir: resolve(__dirname, "dist"),
    emptyOutDir: true,
  },
  resolve: {
    alias: {
      "@": resolve(__dirname, "./src"),
      "@hooks": resolve(__dirname, "./src/hooks"),
      "@utils": resolve(__dirname, "./src/utils"),
      "@shared": resolve(__dirname, "./src/shared"),
      "@buildrik/shared": resolve(__dirname, "../shared"),
    },
  },
  define: {
    __EDITOR_V2__: JSON.stringify(false),
  },
  server: {
    port: 5050,
    host: "0.0.0.0",
    // Dev cross-origin auth: editor proxies /api → dashboard (localhost:3000)
    // so the browser sees same-origin requests and sends the NextAuth cookie.
    // Prod is same-site under buildrik.com (editor.buildrik.com → app.buildrik.com)
    // so SameSite=lax + credentials:include works without proxying. See
    // packages/dashboard/middleware.ts for prod CORS allowlist via EDITOR_ORIGIN.
    proxy: {
      "/api": {
        target: "http://localhost:3000",
        changeOrigin: true,
      },
    },
  },
});
