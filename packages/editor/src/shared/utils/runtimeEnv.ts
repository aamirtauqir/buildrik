// Vite + Next.js dual-context env reader.
// Editor authored for Vite (`import.meta.env.VITE_X`) but bundled into
// Next.js via `transpilePackages` for unified-editor mode (single subdomain).
// Next.js does not substitute `import.meta.env` — top-level reads throw.
// This helper resolves env from both contexts safely at module load.

type EnvMap = Record<string, string | undefined>;

function readViteEnv(): EnvMap {
  // Node (Vitest, SSR): process.env holds the VITE_* keys and stays mutable,
  // which is what makes this module testable — the injected object below is a
  // build-time snapshot that vi.stubEnv cannot reach.
  if (typeof process !== "undefined" && process.env) {
    return process.env as EnvMap;
  }
  try {
    // Browser: this MUST stay the literal `import.meta.env` member expression.
    // Vite resolves env by static text replacement on exactly that pattern, so
    // aliasing it first (`const m = import.meta; m.env`) leaves nothing to
    // replace — and the browser's native `import.meta` carries no `env`, so
    // every VITE_* var silently read as undefined. That shipped: Publish stayed
    // hidden with VITE_FEATURE_PUBLISH=true set, and DASHBOARD_URL fell through
    // to window.location.origin instead of the dashboard.
    return (import.meta as unknown as { env?: EnvMap }).env ?? {};
  } catch {
    return {};
  }
}

function readNextEnv(): EnvMap {
  // Next/Turbopack resolves NEXT_PUBLIC_* by STATIC TEXT REPLACEMENT of the
  // exact expression `process.env.NEXT_PUBLIC_FOO`. Reading through an alias
  // (`const p = process.env; p[key]`) leaves nothing to replace — the same trap
  // documented above for `import.meta.env`, and this file fell into it on the
  // Next side too. Worse: in the unified-editor browser bundle there is no
  // `process` object at all (`typeof process === "undefined"`), so the aliased
  // read was not merely unreplaced, it was unreachable. Every NEXT_PUBLIC_* read
  // as undefined and every feature flag was permanently false in the shipping
  // path, with VITE_FEATURE_PUBLISH=true set and looking correct in dev.
  //
  // So each key MUST appear literally, exactly once, below.
  try {
    return {
      NEXT_PUBLIC_APP_URL: process.env.NEXT_PUBLIC_APP_URL,
      NEXT_PUBLIC_SENTRY_DSN: process.env.NEXT_PUBLIC_SENTRY_DSN,
      NEXT_PUBLIC_FEATURE_PUBLISH: process.env.NEXT_PUBLIC_FEATURE_PUBLISH,
      NEXT_PUBLIC_FEATURE_DS_AI: process.env.NEXT_PUBLIC_FEATURE_DS_AI,
      NEXT_PUBLIC_FEATURE_COLLAB: process.env.NEXT_PUBLIC_FEATURE_COLLAB,
      NODE_ENV: process.env.NODE_ENV,
    };
  } catch {
    // No `process` binding and no replacement performed — treat as unset.
    return {};
  }
}

const vite = readViteEnv();
const proc = readNextEnv();

function pick(viteKey: string, nextKey: string, fallback: string): string {
  return vite[viteKey] ?? proc[nextKey] ?? fallback;
}

function pickOptional(viteKey: string, nextKey: string): string | undefined {
  return vite[viteKey] ?? proc[nextKey];
}

const defaultDashboardUrl =
  typeof window !== "undefined" && window.location?.origin
    ? window.location.origin
    : "http://localhost:3000";

export const DASHBOARD_URL: string = pick(
  "VITE_DASHBOARD_URL",
  "NEXT_PUBLIC_APP_URL",
  defaultDashboardUrl,
);

export const SENTRY_DSN: string | undefined = pickOptional(
  "VITE_SENTRY_DSN",
  "NEXT_PUBLIC_SENTRY_DSN",
);

export const FEATURE_PUBLISH: boolean =
  (vite.VITE_FEATURE_PUBLISH ?? proc.NEXT_PUBLIC_FEATURE_PUBLISH) === "true";

export const FEATURE_DS_AI: boolean =
  (vite.VITE_FEATURE_DS_AI ?? proc.NEXT_PUBLIC_FEATURE_DS_AI) === "true";

// Dev/demo build detection. Vite exposes MODE as a plain string in both dev
// and build; Next-bundled context falls back to NODE_ENV.
export const IS_DEV_BUILD: boolean =
  vite.MODE === "development" || proc.NODE_ENV === "development";

// Real-time collaboration is DEMO-ONLY (last-write-wins, 6 known
// non-convergence P1s). Gate the Collaborate CTA behind this flag so it is
// not exposed as production-ready until a real OT/CRDT arc lands.
export const FEATURE_COLLAB: boolean =
  (vite.VITE_FEATURE_COLLAB ?? proc.NEXT_PUBLIC_FEATURE_COLLAB) === "true";
