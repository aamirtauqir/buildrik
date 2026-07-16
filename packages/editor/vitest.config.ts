import { defineConfig } from "vitest/config";
import react from "@vitejs/plugin-react";
import { resolve } from "path";

export default defineConfig({
  plugins: [
    react({
      jsxImportSource: "@emotion/react",
    }),
  ],
  test: {
    environment: "jsdom",
    globals: true,
    include: [
      "src/**/*.{test,spec}.{ts,tsx}",
      "scripts/__tests__/*.mjs",
      "scripts/__tests__/*.{test,spec}.{ts,tsx}",
      "scripts/audit/__tests__/*.mjs",
      "scripts/codemods/**/__tests__/*.{test,spec}.{ts,tsx}",
      "scripts/codemods/*.{test,spec}.{ts,tsx}",
      // Dashboard unification tests (Phase 0-3 spec §550). Co-located in the
      // dashboard package; run from here to reuse RTL + jsdom + setup.
      "../dashboard/**/__tests__/*.{test,spec}.{ts,tsx}",
      // Server-side unification tests (userCanEditSite auth gate, future
      // route handler tests). Live at the repo-root `server/` tree.
      "../../server/**/__tests__/*.{test,spec}.{ts,tsx}",
    ],
    setupFiles: ["./src/test-setup.ts"],
    testTimeout: 15000,
    coverage: {
      // Baseline coverage config for Phase D god-component splits
      // (E-007/E-006/E-014). Run `npm run test:coverage` to produce a report
      // before refactoring high-risk files. Provider v8 = native, no Babel
      // instrumentation overhead.
      provider: "v8",
      reporter: ["text", "html"],
      reportsDirectory: "./coverage",
      // Widened 2026-07-08 (deep-audit coverage arc): the previous 4-glob scope
      // measured only 244/1227 source files and overstated real coverage.
      // Whole-package truth now; preview galleries + stubs stay out.
      include: ["src/**/*.{ts,tsx}"],
      exclude: [
        "**/__tests__/**",
        "**/*.{test,spec}.{ts,tsx}",
        "**/*.d.ts",
        "src/preview/**",
        "src/test-stubs/**",
      ],
    },
  },
  resolve: {
    // ORDER MATTERS — vite alias resolution is first-match-wins. Specific
    // prefixes (`@/lib`, `@/server`) MUST appear before the catch-all `@`.
    alias: {
      // Stub Next.js "server-only" sentinel (vitest cannot satisfy it).
      "server-only": resolve(__dirname, "./src/test-stubs/server-only.ts"),
      // Dashboard / server-root aliases — mirror root vitest.config.ts so
      // cross-package tests resolve like prod build does.
      "@/server": resolve(__dirname, "../../server"),
      "@/lib": resolve(__dirname, "../../lib"),
      "@/components": resolve(__dirname, "../dashboard/components"),
      "@/app": resolve(__dirname, "../dashboard/app"),
      "@/emails": resolve(__dirname, "../dashboard/emails"),
      "@server": resolve(__dirname, "../../server"),
      "@lib": resolve(__dirname, "../../lib"),
      "@hooks": resolve(__dirname, "./src/hooks"),
      "@utils": resolve(__dirname, "./src/utils"),
      "@shared": resolve(__dirname, "./src/shared"),
      "@buildrik/shared": resolve(__dirname, "../shared"),
      // Catch-all (editor src). Must be LAST.
      "@": resolve(__dirname, "./src"),
      // Pin RTL/jest-dom to editor's installed copies so dashboard unification
      // tests (run under this config) can resolve them. pnpm strict-resolves
      // workspace deps; without these aliases the dashboard test files can't
      // walk up into editor's node_modules.
      "@testing-library/react": resolve(__dirname, "./node_modules/@testing-library/react"),
      "@testing-library/dom": resolve(__dirname, "./node_modules/@testing-library/dom"),
      "@testing-library/jest-dom": resolve(__dirname, "./node_modules/@testing-library/jest-dom"),
      "@testing-library/user-event": resolve(__dirname, "./node_modules/@testing-library/user-event"),
    },
  },
});
