/**
 * ESLint for the dashboard, server and lib — everything outside the editor.
 *
 * Replaces `next lint`, which Next 16 removed: the root `lint` script had
 * failed with "Invalid project directory provided, no such directory: .../lint"
 * and no code outside packages/editor was linted at all. The editor keeps its
 * own config (packages/editor/eslint.config.mjs); ESLint resolves the nearest
 * config to each file, so the two never overlap.
 */
import nextVitals from "eslint-config-next/core-web-vitals";
import nextTs from "eslint-config-next/typescript";

export default [
  {
    ignores: [
      "**/node_modules/**",
      "**/.next/**",
      "packages/editor/**",
      "packages/dashboard/playwright-report/**",
      "packages/dashboard/test-results/**",
      "packages/dashboard/newdeisgn/**",
      "packages/dashboard/.qa-ui/**",
      "archive/**",
      "docs/**",
      "learn/**",
      "reports/**",
      "scratchpad_audit/**",
      "video/**",
      "src/**",
      "scripts/**",
      "**/*.mjs",
      "**/*.cjs",
      "next-env.d.ts",
    ],
  },
  ...nextVitals,
  ...nextTs,
  { settings: { next: { rootDir: "packages/dashboard/" } } },
];
