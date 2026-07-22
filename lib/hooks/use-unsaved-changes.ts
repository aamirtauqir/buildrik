"use client";

import { useEffect } from "react";

/**
 * Warn on tab close / reload when a form has unsaved edits. The App Router has
 * no built-in navigation-block, so this covers the browser-level exit (the case
 * where silent data loss hurts most — e.g. pasted custom head/body code). Attach
 * `dirty` = "form differs from the last saved state".
 */
export function useUnsavedChanges(dirty: boolean): void {
  useEffect(() => {
    if (!dirty) return;
    function onBeforeUnload(e: BeforeUnloadEvent) {
      e.preventDefault();
      // Modern browsers show their own generic message; returnValue must be set.
      e.returnValue = "";
    }
    window.addEventListener("beforeunload", onBeforeUnload);
    return () => window.removeEventListener("beforeunload", onBeforeUnload);
  }, [dirty]);
}
