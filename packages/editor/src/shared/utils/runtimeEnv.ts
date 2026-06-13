// Vite + Next.js dual-context env reader.
// Editor authored for Vite (`import.meta.env.VITE_X`) but bundled into
// Next.js via `transpilePackages` for unified-editor mode (single subdomain).
// Next.js does not substitute `import.meta.env` — top-level reads throw.
// This helper resolves env from both contexts safely at module load.

type EnvMap = Record<string, string | undefined>;

function readViteEnv(): EnvMap {
  try {
    const meta = import.meta as unknown as { env?: EnvMap };
    return meta?.env ?? {};
  } catch {
    return {};
  }
}

function readProcessEnv(): EnvMap {
  if (typeof process !== "undefined" && process.env) {
    return process.env as EnvMap;
  }
  return {};
}

const vite = readViteEnv();
const proc = readProcessEnv();

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

export const FEATURE_COMPONENTS_V2: boolean =
  (vite.VITE_FEATURE_COMPONENTS_V2 ?? proc.NEXT_PUBLIC_FEATURE_COMPONENTS_V2) === "true";

export const FEATURE_DS_AI: boolean =
  (vite.VITE_FEATURE_DS_AI ?? proc.NEXT_PUBLIC_FEATURE_DS_AI) === "true";

// Real-time collaboration is DEMO-ONLY (last-write-wins, 6 known
// non-convergence P1s). Gate the Collaborate CTA behind this flag so it is
// not exposed as production-ready until a real OT/CRDT arc lands.
export const FEATURE_COLLAB: boolean =
  (vite.VITE_FEATURE_COLLAB ?? proc.NEXT_PUBLIC_FEATURE_COLLAB) === "true";
