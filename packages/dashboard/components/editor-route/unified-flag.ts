import { createContext, useContext } from "react";

/**
 * Sync flag-aware href. Editor under /edit/[siteId] when flag ON, legacy
 * cross-origin URL otherwise. Eng review D3: sync to avoid async ripple
 * across 10 imperative click handlers.
 */
export function getEditorHref(siteId: string, unified: boolean): string {
  if (unified) return `/edit/${encodeURIComponent(siteId)}`;
  const legacy = process.env.NEXT_PUBLIC_EDITOR_URL || "http://localhost:5050";
  return `${legacy}/?siteId=${encodeURIComponent(siteId)}`;
}

export const UnifiedEditorFlagContext = createContext<boolean>(false);

export function useUnifiedEditorFlag(): boolean {
  return useContext(UnifiedEditorFlagContext);
}
