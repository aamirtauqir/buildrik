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
      "@": path.resolve(__dirname, "."),
    },
  },
});
