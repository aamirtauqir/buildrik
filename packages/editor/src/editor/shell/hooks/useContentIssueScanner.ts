/**
 * Runs the engine's page-content detectors (`engine/content/contentIssues`)
 * over the live project and turns findings into `Issue` rows for the Issues
 * panel — the same shape the DS-lint producer already writes, so the panel,
 * the topbar chip and the publish gate (`lifecycle.ts`'s `errorCount`) don't
 * need to know a second producer exists.
 *
 * Three states, per the Issues panel's contract:
 *   "idle"     — last scan (if any) succeeded; `issues` is current
 *   "scanning" — a manual scan (mount, or the panel's Try again) is running
 *   "error"    — the last scan threw; `issues` keeps whatever it last had,
 *                the panel shows "Scan failed" + Try again over it
 *
 * A background rescan (the project changed under us) updates `issues`
 * silently — it does not flip the panel to "Scanning…" for every keystroke,
 * only a manual scan does. Reactive triggers are debounced: `ELEMENT_UPDATED`
 * fires per raw mutation (engine/AGENTS.md — history coalesces, events do
 * not), and a full-tree walk on every keystroke of a text edit elsewhere on
 * the page would be wasted work.
 *
 * @license BSD-3-Clause
 */
import * as React from "react";
import type { Composer } from "@/engine";
import { EVENTS } from "@/shared/constants";
import { detectContentIssues } from "@/engine/content/contentIssues";
import type { Issue } from "./useStudioState";

export type ContentScanState = "idle" | "scanning" | "error";

export interface UseContentIssueScannerReturn {
  issues: Issue[];
  scanState: ContentScanState;
  /** Manual scan — mount, and the panel's "Try again". Shows "Scanning…". */
  rescan: () => void;
}

const DEBOUNCE_MS = 400;

export function useContentIssueScanner(composer: Composer | null): UseContentIssueScannerReturn {
  const [issues, setIssues] = React.useState<Issue[]>([]);
  const [scanState, setScanState] = React.useState<ContentScanState>("idle");
  const debounceRef = React.useRef<ReturnType<typeof setTimeout> | null>(null);

  /** The actual scan. Never throws outward — a detector that throws lands
   *  here as the "error" state, not a crash that takes the panel with it. */
  const scanNow = React.useCallback(() => {
    if (!composer) return;
    try {
      // exportPages(), not getAllPages(): the page map's `root` is a snapshot
      // whose children are emptied once `buildElementTree` hands them to the
      // element registry, so scanning it found nothing on any loaded project.
      const pages = composer.elements.exportPages();
      const findings = detectContentIssues(pages);
      setIssues(
        findings.map((f) => ({
          id: f.id,
          type: f.type,
          message: f.message,
          location: f.location,
          elementId: f.elementId,
          pageId: f.pageId,
          contentKind: f.kind,
        })),
      );
      setScanState("idle");
    } catch (e) {
      console.error("[content-issues] scan failed", e);
      setScanState("error");
    }
  }, [composer]);

  const rescan = React.useCallback(() => {
    setScanState("scanning");
    // The timeout is deliberate, not a debounce: a synchronous scan would
    // collapse "Scanning…" into a result in the same tick, so a manual Scan
    // / Try again would never visibly run even though it did real work.
    setTimeout(scanNow, 0);
  }, [scanNow]);

  React.useEffect(() => {
    if (!composer) return;
    rescan();

    const onProjectChange = () => {
      if (debounceRef.current) clearTimeout(debounceRef.current);
      debounceRef.current = setTimeout(scanNow, DEBOUNCE_MS);
    };
    composer.on(EVENTS.PROJECT_LOADED, onProjectChange);
    composer.on(EVENTS.PROJECT_CHANGED, onProjectChange);
    composer.on(EVENTS.ELEMENT_UPDATED, onProjectChange);
    return () => {
      composer.off(EVENTS.PROJECT_LOADED, onProjectChange);
      composer.off(EVENTS.PROJECT_CHANGED, onProjectChange);
      composer.off(EVENTS.ELEMENT_UPDATED, onProjectChange);
      if (debounceRef.current) clearTimeout(debounceRef.current);
    };
  }, [composer, rescan, scanNow]);

  return { issues, scanState, rescan };
}

export default useContentIssueScanner;
