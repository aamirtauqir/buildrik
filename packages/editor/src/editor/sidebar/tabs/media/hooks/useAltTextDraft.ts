import type * as React from "react";
import { useEffect, useState } from "react";
import type { LibraryItem } from "../data/mediaTypes";

/**
 * The one commit model for an asset's alt text (REA 2026-10-20 M-4), shared
 * by the library rail and the drawer. Typing edits a local draft; blur or
 * Enter (Shift+Enter is a newline) sends the trimmed text once, and only when
 * it differs from what the asset holds. The rail used to send a server write
 * per keystroke while the drawer committed on blur, and the drawer's Enter
 * committed twice (its own call, then the blur it triggered).
 */
export function useAltTextDraft(
  item: LibraryItem,
  save: (key: string, altText: string) => Promise<void>,
) {
  const [draft, setDraft] = useState(item.altText ?? "");
  const [saveFailed, setSaveFailed] = useState(false);

  useEffect(() => {
    setDraft(item.altText ?? "");
    setSaveFailed(false);
  }, [item.key, item.altText]);

  const commit = () => {
    const next = draft.trim();
    if (next === (item.altText ?? "")) return;
    setSaveFailed(false);
    save(item.key, next).catch(() => setSaveFailed(true));
  };

  return {
    saveFailed,
    field: {
      value: draft,
      onChange: (e: React.ChangeEvent<HTMLTextAreaElement>) => setDraft(e.target.value),
      onBlur: commit,
      onKeyDown: (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
        if (e.key === "Enter" && !e.shiftKey) {
          e.preventDefault();
          e.currentTarget.blur();
        }
      },
    },
  };
}
