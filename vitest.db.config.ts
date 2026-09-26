import { defineConfig } from "vitest/config";
import path from "path";

// D-14a: Postgres-backed test tier. Separate from the root `vitest.config.ts`
// (jsdom + component tests) because these tests hit a real database and must
// run serially against one Postgres connection, not in parallel jsdom
// workers. `globalSetup` provisions `buildrik_test` and points DATABASE_URL
// at it BEFORE any `*.db.test.ts` file (or the modules it imports, e.g.
// `@/lib/prisma`) runs — see `__tests__/db/setup.ts`.
export default defineConfig({
  test: {
    globals: true,
    environment: "node",
    include: ["**/*.db.test.{ts,tsx}"],
    exclude: ["**/node_modules/**", ".worktrees/**"],
    globalSetup: [path.resolve(__dirname, "__tests__/db/setup.ts")],
    testTimeout: 20000,
    // One shared Postgres connection pool across files; running files in
    // parallel workers races TRUNCATEs against other files' fixtures.
    fileParallelism: false,
  },
  resolve: {
    // Subset of the root vitest.config.ts alias table — only what the
    // server/service import graph under test actually needs (services,
    // lib, shared schemas, dashboard email templates pulled in by
    // email.service.ts). See that file for the full editor-facing set.
    alias: {
      "server-only": path.resolve(__dirname, "packages/editor/src/test-stubs/server-only.ts"),
      "@/emails": path.resolve(__dirname, "packages/dashboard/emails"),
      "@/server": path.resolve(__dirname, "server"),
      "@/lib": path.resolve(__dirname, "lib"),
      "@server": path.resolve(__dirname, "server"),
      "@lib": path.resolve(__dirname, "lib"),
      "@buildrik/shared": path.resolve(__dirname, "packages/shared"),
      "@": path.resolve(__dirname, "."),
    },
  },
});
