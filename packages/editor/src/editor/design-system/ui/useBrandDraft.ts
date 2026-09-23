/**
 * useBrandDraft — the Brand workspace's auto-draft survives a reload
 * (decision #28; QA 2026-09-24: an unsaved edit + reload came back as the
 * saved value, no draft, no prompt).
 *
 * Staged edits live in the token registries' React state, above the shell,
 * and nothing wrote them anywhere. This keeps a copy of the draft — each
 * edited token's value / dark value, and colour tokens added but not yet
 * saved — in localStorage, rewritten whenever the draft changes and removed
 * when it empties (Save or Discard). On the next load, once the workspace
 * has loaded the saved brand, the draft is staged back on top of it.
 *
 * It lives here and not in `state/` because C1 keeps `state/` read-only; it
 * only uses the registries' public updateToken / addToken.
 *
 * Not covered: preset (Presets page) edits, and tokens added to the eleven
 * generic kinds — neither has a draft entry point here.
 *
 * @license BSD-3-Clause
 */
import * as React from "react";
import type { DesignToken } from "../types";

export interface DraftRegistry {
  tokens: DesignToken[];
  savedTokens: DesignToken[];
  updateToken: (id: string, value: string, darkValue?: string) => void;
}

interface StoredDraft {
  changed: Array<{ id: string; value: string; darkValue?: string }>;
  added: DesignToken[];
}

export const brandDraftKey = (projectId: string | null | undefined) =>
  `buildrick-brand-draft-${projectId || "local"}`;

function read(key: string): StoredDraft | null {
  try {
    const raw = localStorage.getItem(key);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as StoredDraft;
    return Array.isArray(parsed?.changed) && Array.isArray(parsed?.added) ? parsed : null;
  } catch {
    return null;
  }
}

export function useBrandDraft({
  projectId,
  registries,
  color,
  addColorToken,
  ready,
}: {
  projectId: string | null | undefined;
  registries: readonly DraftRegistry[];
  /** The colour registry — the only one whose additions the draft carries. */
  color: DraftRegistry;
  addColorToken: (token: DesignToken) => void;
  /** True once the saved brand has been loaded into the registries. */
  ready: boolean;
}): void {
  const key = brandDraftKey(projectId);
  const restoredRef = React.useRef(false);

  // Restore once, after the saved brand is in.
  React.useEffect(() => {
    if (!ready || restoredRef.current) return;
    restoredRef.current = true;
    const draft = read(key);
    if (!draft) return;
    for (const t of draft.added) {
      if (!color.tokens.some((c) => c.id === t.id)) addColorToken(t);
    }
    for (const c of draft.changed) {
      const owner = registries.find((r) => r.tokens.some((t) => t.id === c.id));
      owner?.updateToken(c.id, c.value, c.darkValue);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [ready, key]);

  // Keep the stored copy equal to the draft — never before the restore, or
  // the empty pre-restore state would erase it.
  const tokenLists = registries.map((r) => r.tokens);
  const savedLists = registries.map((r) => r.savedTokens);
  React.useEffect(() => {
    if (!restoredRef.current) return;
    const changed: StoredDraft["changed"] = [];
    const added: DesignToken[] = [];
    for (const r of registries) {
      for (const t of r.tokens) {
        const saved = r.savedTokens.find((s) => s.id === t.id);
        if (!saved) {
          if (r === color) added.push(t);
        } else if (t.value !== saved.value || (t.darkValue ?? "") !== (saved.darkValue ?? "")) {
          changed.push({ id: t.id, value: t.value, ...(t.darkValue !== undefined ? { darkValue: t.darkValue } : {}) });
        }
      }
    }
    try {
      if (changed.length + added.length === 0) localStorage.removeItem(key);
      else localStorage.setItem(key, JSON.stringify({ changed, added }));
    } catch {
      /* Storage full or blocked: the draft still lives in memory for this session. */
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [key, ...tokenLists, ...savedLists]);
}
