/**
 * useTemplateApply — 4-state template apply flow
 *
 * State machine:
 *   IDLE → CONFIRMING → APPLYING → SUCCESS | ERROR
 *                                    ↓        ↓
 *                                   IDLE    APPLYING (retry)
 *
 * @license BSD-3-Clause
 */

import * as React from "react";
import type { Composer } from "../../../../../engine";
import { dismissOnboarding } from "../templatesStorage";

export type ApplyState = "idle" | "confirming" | "applying" | "success" | "error";

export interface UseTemplateApplyReturn {
  /** Current state in the apply flow */
  applyState: ApplyState;
  /** Error message when in error state */
  applyError: string | null;
  /** Progress percentage (0-100) during applying state */
  progress: number;
  /** Number of elements on the current canvas page */
  canvasElementCount: number;
  /** Whether the canvas has existing content that will be replaced */
  hasExistingContent: boolean;
  /** Template ID being applied */
  pendingId: React.MutableRefObject<string | null>;

  // Legacy compat — expose showProgress/resetStyles for existing TemplatesTab code
  showProgress: boolean;
  setShowProgress: React.Dispatch<React.SetStateAction<boolean>>;
  canRetry: boolean;
  setCanRetry: React.Dispatch<React.SetStateAction<boolean>>;
  resetStyles: boolean;
  setResetStyles: React.Dispatch<React.SetStateAction<boolean>>;
  setApplyError: React.Dispatch<React.SetStateAction<string | null>>;

  /** Begin confirm dialog (IDLE → CONFIRMING) */
  requestApply: (templateId: string) => void;
  /** User confirmed, start applying (CONFIRMING → APPLYING) */
  confirmApply: () => void;
  /** User cancelled the confirm dialog (CONFIRMING → IDLE) */
  cancelApply: () => void;
  /** Apply succeeded (APPLYING → SUCCESS) */
  completeApply: () => void;
  /** Apply failed (APPLYING → ERROR) */
  failApply: (error: string) => void;
  /** Retry from error (ERROR → APPLYING) */
  retryApply: () => void;
  /** Dismiss success/error and return to idle */
  resetApply: () => void;
  /** Legacy: begin apply progress (compat with existing code) */
  startApply: () => void;
  /** Legacy: retry handler (compat with existing code) */
  handleRetry: () => void;
}

export function useTemplateApply(composer: Composer | null): UseTemplateApplyReturn {
  const [applyState, setApplyState] = React.useState<ApplyState>("idle");
  const [applyError, setApplyError] = React.useState<string | null>(null);
  const [progress, setProgress] = React.useState(0);
  const [canRetry, setCanRetry] = React.useState(false);
  const [resetStyles, setResetStyles] = React.useState(false);
  const [canvasElementCount, setCanvasElementCount] = React.useState(0);
  const pendingId = React.useRef<string | null>(null);
  const timerRef = React.useRef<ReturnType<typeof setTimeout> | null>(null);

  // Derived
  const showProgress = applyState === "applying";

  // Cleanup timers on unmount
  React.useEffect(() => {
    return () => {
      if (timerRef.current) clearTimeout(timerRef.current);
    };
  }, []);

  // Timeout: auto-fail if APPLYING state lasts longer than 15s
  React.useEffect(() => {
    if (applyState !== "applying") return;
    const timeout = setTimeout(() => {
      setApplyState("error");
      setApplyError("Template apply timed out. Please retry.");
      setCanRetry(true);
    }, 15000);
    return () => clearTimeout(timeout);
  }, [applyState]);

  // Sync canvas element count
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

  // State transitions
  const requestApply = React.useCallback((templateId: string) => {
    if (applyState === "applying") return; // Guard: reject during active apply
    pendingId.current = templateId;
    setApplyState("confirming");
    setApplyError(null);
    setProgress(0);
  }, [applyState]);

  const confirmApply = React.useCallback(() => {
    setApplyState("applying");
    setProgress(0);
    dismissOnboarding();
  }, []);

  const cancelApply = React.useCallback(() => {
    pendingId.current = null;
    setApplyState("idle");
  }, []);

  const completeApply = React.useCallback(() => {
    setApplyState("success");
    setProgress(100);
    // Auto-dismiss success after 2s (cleaned up on unmount via timerRef)
    if (timerRef.current) clearTimeout(timerRef.current);
    timerRef.current = setTimeout(() => {
      setApplyState("idle");
      pendingId.current = null;
      timerRef.current = null;
    }, 2000);
  }, []);

  const failApply = React.useCallback((error: string) => {
    setApplyState("error");
    setApplyError(error);
    setCanRetry(true);
  }, []);

  const retryApply = React.useCallback(() => {
    if (!pendingId.current) return;
    setApplyError(null);
    setCanRetry(false);
    setApplyState("applying");
    setProgress(0);
    dismissOnboarding();
  }, []);

  const resetApply = React.useCallback(() => {
    setApplyState("idle");
    setApplyError(null);
    setProgress(0);
    pendingId.current = null;
  }, []);

  // Legacy compat
  const startApply = React.useCallback(() => {
    setApplyState("applying");
    setProgress(0);
    dismissOnboarding();
  }, []);

  const handleRetry = React.useCallback(() => {
    retryApply();
  }, [retryApply]);

  const setShowProgress = React.useCallback((val: React.SetStateAction<boolean>) => {
    const resolved = typeof val === "function" ? val(showProgress) : val;
    if (resolved) {
      setApplyState("applying");
    } else if (applyState === "applying") {
      setApplyState("idle");
    }
  }, [showProgress, applyState]);

  return {
    applyState,
    applyError,
    progress,
    canvasElementCount,
    hasExistingContent: canvasElementCount > 0,
    pendingId,

    // Legacy compat
    showProgress,
    setShowProgress,
    canRetry,
    setCanRetry,
    resetStyles,
    setResetStyles,
    setApplyError,

    // State machine transitions
    requestApply,
    confirmApply,
    cancelApply,
    completeApply,
    failApply,
    retryApply,
    resetApply,
    startApply,
    handleRetry,
  };
}
