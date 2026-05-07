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
      // Scope to the engine + the canvas/inspector hook layers that Phase D
      // is most likely to touch. Widen `include` later if coverage matters
      // outside these areas.
      include: [
        "src/engine/**/*.{ts,tsx}",
        "src/editor/canvas/hooks/**/*.{ts,tsx}",
        "src/editor/inspector/hooks/**/*.{ts,tsx}",
        "src/editor/shell/hooks/**/*.{ts,tsx}",
      ],
      exclude: [
        "**/__tests__/**",
        "**/*.{test,spec}.{ts,tsx}",
        "**/*.d.ts",
      ],
    },
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
});
