import { createContext, useCallback, useContext } from "react";
import { useRouter } from "next/navigation";

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

/** Open the editor for a site from a click or a mutation's onSuccess: a soft
 *  route under the unified flag, a full-page load to the legacy origin
 *  otherwise (it is a different origin, so it cannot be soft-routed). */
export function useOpenEditor(): (siteId: string) => void {
  const unified = useUnifiedEditorFlag();
  const router = useRouter();
  return useCallback(
    (siteId: string) => {
      const href = getEditorHref(siteId, unified);
      if (unified) router.push(href);
      else window.location.href = href;
    },
    [unified, router],
  );
}
