import { defineConfig } from "vitest/config";
import path from "path";

export default defineConfig({
  test: {
    globals: true,
    environment: "node",
    include: ["__tests__/**/*.test.{ts,tsx}", "packages/editor/src/**/*.test.{ts,tsx}"],
    exclude: ["**/node_modules/**", ".worktrees/**"],
  },
  resolve: {
    alias: {
      "@/components": path.resolve(__dirname, "packages/dashboard/components"),
      "@/emails": path.resolve(__dirname, "packages/dashboard/emails"),
      "@/app": path.resolve(__dirname, "packages/dashboard/app"),
      "@server": path.resolve(__dirname, "server"),
      "@lib": path.resolve(__dirname, "lib"),
      "@/server": path.resolve(__dirname, "server"),
      "@/lib": path.resolve(__dirname, "lib"),
      // Editor package aliases — needed for editor tests run from repo root
      "@shared": path.resolve(__dirname, "packages/editor/src/shared"),
      "@features": path.resolve(__dirname, "packages/editor/src/features"),
      "@hooks": path.resolve(__dirname, "packages/editor/src/hooks"),
      "@utils": path.resolve(__dirname, "packages/editor/src/utils"),
      "@components": path.resolve(__dirname, "packages/editor/src/components"),
      // Keep this last — most general match
      "@": path.resolve(__dirname, "."),
    },
  },
});
