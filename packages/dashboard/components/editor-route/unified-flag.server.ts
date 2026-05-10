import "server-only";

/**
 * Server-side flag read. Edge Config in prod, env var fallback.
 *
 * Edge Config wiring deferred to Phase 3 (when @vercel/edge-config gets
 * installed and EDGE_CONFIG env wired in Vercel). Phase 1 ships with
 * env-var read so the route works in dev + preview.
 *
 * "server-only" import guarantees this module never gets pulled into a
 * client bundle even by accident.
 */
export async function readUnifiedEditorFlag(): Promise<boolean> {
  return process.env.NEXT_PUBLIC_UNIFIED_EDITOR === "true";
}
