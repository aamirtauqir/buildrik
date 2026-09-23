/**
 * useTemplateSelection — the full-canvas Templates view's selection state:
 * which template is previewed, whether the replace confirm is up, and the
 * catalogue search. Escape closes the replace confirm (the preview owns its
 * own Escape).
 *
 * The drawer-era state — inline detail id, category / type / tag pills and
 * pagination — went with the drawer (decision #24, audit G2-095/096).
 * @license BSD-3-Clause
 */

import * as React from "react";

export interface UseTemplateSelectionReturn {
  previewId: string | null;
  setPreviewId: React.Dispatch<React.SetStateAction<string | null>>;
  showReplace: boolean;
  setShowReplace: React.Dispatch<React.SetStateAction<boolean>>;
  searchQ: string;
  setSearchQ: React.Dispatch<React.SetStateAction<string>>;
}

export function useTemplateSelection(showProgress: boolean): UseTemplateSelectionReturn {
  const [previewId, setPreviewId] = React.useState<string | null>(null);
  const [showReplace, setShowReplace] = React.useState(false);
  const [searchQ, setSearchQ] = React.useState("");

  React.useEffect(() => {
    if (!showReplace) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape" && !showProgress) setShowReplace(false);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [showReplace, showProgress]);

  return { previewId, setPreviewId, showReplace, setShowReplace, searchQ, setSearchQ };
}
