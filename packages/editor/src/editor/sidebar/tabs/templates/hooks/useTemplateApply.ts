/**
 * useTemplateApply — apply progress, error handling, retry, canvas element count tracking.
 * @license BSD-3-Clause
 */

import * as React from "react";
import type { Composer } from "../../../../../engine";
import { dismissOnboarding } from "../templatesStorage";

export interface UseTemplateApplyReturn {
  showProgress: boolean;
  setShowProgress: React.Dispatch<React.SetStateAction<boolean>>;
  applyError: string | null;
  setApplyError: React.Dispatch<React.SetStateAction<string | null>>;
  canRetry: boolean;
  setCanRetry: React.Dispatch<React.SetStateAction<boolean>>;
  resetStyles: boolean;
  setResetStyles: React.Dispatch<React.SetStateAction<boolean>>;
  canvasElementCount: number;
  hasExistingContent: boolean;
  /** Ref holding the template ID currently being applied */
  pendingId: React.MutableRefObject<string | null>;
  /** Begin the apply progress animation; caller must set showReplace(false) first */
  startApply: () => void;
  /** Called on retry after error — resets error state and restarts progress */
  handleRetry: () => void;
}

export function useTemplateApply(composer: Composer | null): UseTemplateApplyReturn {
  const [showProgress, setShowProgress] = React.useState(false);
  const [applyError, setApplyError] = React.useState<string | null>(null);
  const [canRetry, setCanRetry] = React.useState(false);
  const [resetStyles, setResetStyles] = React.useState(false);
  const [canvasElementCount, setCanvasElementCount] = React.useState(0);
  const pendingId = React.useRef<string | null>(null);

  // Sync canvas element count reactively — O(1) child count instead of toHTML() per render.
  React.useEffect(() => {
    if (!composer) return;
    const sync = () => {
      try {
        const page = composer.elements.getActivePage();
        if (!page) { setCanvasElementCount(0); return; }
        const root = composer.elements.getElement(page.root.id);
        setCanvasElementCount(root?.getChildCount?.() ?? 0);
      } catch {
        // ignore
      }
    };
    sync();
    composer.on("element:created", sync);
    composer.on("element:deleted", sync);
    composer.on("history:undo", sync);
    composer.on("history:redo", sync);
    return () => {
      composer.off("element:created", sync);
      composer.off("element:deleted", sync);
      composer.off("history:undo", sync);
      composer.off("history:redo", sync);
    };
  }, [composer]);

  const startApply = React.useCallback(() => {
    setShowProgress(true);
    dismissOnboarding();
  }, []);

  const handleRetry = React.useCallback(() => {
    if (!pendingId.current) return;
    setCanRetry(false);
    setApplyError(null);
    setShowProgress(true);
    dismissOnboarding();
  }, []);

  return {
    showProgress,
    setShowProgress,
    applyError,
    setApplyError,
    canRetry,
    setCanRetry,
    resetStyles,
    setResetStyles,
    canvasElementCount,
    hasExistingContent: canvasElementCount > 0,
    pendingId,
    startApply,
    handleRetry,
  };
}
