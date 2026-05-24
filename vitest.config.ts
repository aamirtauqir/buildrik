import { defineConfig } from "vitest/config";
import path from "path";

export default defineConfig({
  test: {
    globals: true,
    environment: "jsdom",
    // Loads @testing-library/jest-dom matchers (toBeInTheDocument /
    // toHaveAttribute / toHaveClass) + jsdom polyfills (ResizeObserver,
    // matchMedia, scrollIntoView) used by Radix / cmdk component tests.
    // Without this, ~10% of the suite blows up with "Invalid Chai property".
    setupFiles: [path.resolve(__dirname, "packages/editor/src/test-setup.ts")],
    // Editor's vitest.config sets 15s. Some DesignSystemTab / SettingsTab
    // section-switch tests genuinely take 5-8s due to IndexedDB seed + 14
    // accordion mounts. Default 5s timed them out spuriously.
    testTimeout: 15000,
    include: [
      "__tests__/**/*.test.{ts,tsx}",
      "lib/**/*.test.{ts,tsx}",
      "packages/editor/src/**/*.test.{ts,tsx}",
      "packages/shared/**/*.test.{ts,tsx}",
      "server/**/*.test.{ts,tsx}",
      "packages/dashboard/app/**/*.test.{ts,tsx}",
    ],
    exclude: ["**/node_modules/**", ".worktrees/**"],
  },
  resolve: {
    // ORDER MATTERS — vite alias resolution is first-match-wins. Specific
    // prefixes MUST appear before generic ones (see editor's vitest.config
    // for the same rule + the inventory-before-architecture memory).
    alias: {
      // Stub Next.js "server-only" sentinel so editor + shared imports
      // that incidentally pull in server-only-marked modules don't crash
      // vitest's non-server runtime.
      "server-only": path.resolve(__dirname, "packages/editor/src/test-stubs/server-only.ts"),

      // Dashboard-rooted prefixes (most specific)
      "@/components": path.resolve(__dirname, "packages/dashboard/components"),
      "@/emails": path.resolve(__dirname, "packages/dashboard/emails"),
      "@/app": path.resolve(__dirname, "packages/dashboard/app"),

      // Server / lib at repo root
      "@/server": path.resolve(__dirname, "server"),
      "@/lib": path.resolve(__dirname, "lib"),
      "@server": path.resolve(__dirname, "server"),
      "@lib": path.resolve(__dirname, "lib"),

      // Editor `@/X` subtree — editor tests use `@/editor/...`,
      // `@/engine/...`, `@/services/...`, etc. where `@` means the editor
      // src root. Root vitest's catch-all `@` resolves to repo root, so
      // each editor subtree gets a specific alias here that wins by
      // first-match before the catch-all triggers.
      "@/editor": path.resolve(__dirname, "packages/editor/src/editor"),
      "@/engine": path.resolve(__dirname, "packages/editor/src/engine"),
      "@/services": path.resolve(__dirname, "packages/editor/src/services"),
      "@/themes": path.resolve(__dirname, "packages/editor/src/themes"),
      "@/styles": path.resolve(__dirname, "packages/editor/src/styles"),
      "@/blocks": path.resolve(__dirname, "packages/editor/src/blocks"),
      "@/templates": path.resolve(__dirname, "packages/editor/src/templates"),
      "@/ai": path.resolve(__dirname, "packages/editor/src/ai"),
      "@/shared": path.resolve(__dirname, "packages/editor/src/shared"),
      "@/preview": path.resolve(__dirname, "packages/editor/src/preview"),

      // Bare prefixes (editor-package convention)
      "@shared": path.resolve(__dirname, "packages/editor/src/shared"),
      "@features": path.resolve(__dirname, "packages/editor/src/features"),
      "@hooks": path.resolve(__dirname, "packages/editor/src/hooks"),
      "@utils": path.resolve(__dirname, "packages/editor/src/utils"),
      "@components": path.resolve(__dirname, "packages/editor/src/components"),

      // Workspace package — editor's "../shared" lands here from root POV.
      "@buildrik/shared": path.resolve(__dirname, "packages/shared"),

      // Keep this last — most general match. Falls back to repo root for
      // `@/<anything-else>` that isn't an editor-known subtree.
      "@": path.resolve(__dirname, "."),
    },
  },
});
