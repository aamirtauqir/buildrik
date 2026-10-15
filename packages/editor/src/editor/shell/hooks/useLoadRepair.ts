/**
 * useLoadRepair — runs the DamageScanner once per site load and turns what it
 * finds into the repair toast and Issues rows (CEO D5/D9, design decisions 1
 * and 8, plan tasks E-T9 / DR-T5 / DR-T1).
 *
 * Order (decision 1): the restore dialog first — the scan waits until kept
 * edits are restored or discarded, so it reads the document the user keeps —
 * then the repair, then its toast, then Issues. Nothing is put over a modal.
 *
 * Automatic repairs (sizes that are not numbers) run only when:
 *   - the server's kill switch allows it (`EDITOR_LOAD_REPAIR`, read per load),
 *   - the editor can write (not view mode / read-only),
 *   - and a "Before automatic repair" version was saved first. If that
 *     snapshot fails nothing is changed; the findings are only listed.
 * They land as ONE history step; the toast's Undo takes it back.
 *
 * Possible damage (escaped text) is never changed without the user: each row
 * offers Fix and, in its overflow, Keep as written. "Keep" and a dismissed
 * "Couldn't verify" row are remembered on this device for this site.
 *
 * @license BSD-3-Clause
 */

import * as React from "react";
import type { Composer } from "@/engine/Composer";
import type { ToastInput } from "@/editor/chrome-ui";
import {
  applyDamageRepairs,
  applyEscapedTextFix,
  scanDamage,
  type DamageReport,
  type EscapedTextCandidate,
  type UnverifiedStyles,
} from "@/engine/recovery/DamageScanner";
import { EVENTS } from "@/shared/constants/events";
import { stripAllTags } from "@/shared/utils/html/sanitization";
import { isLoadRepairEnabled } from "@/services/BuildrikSyncProvider";
import { onOffScreenSettled, peekOffScreenUnsaved } from "@/services/unsavedRecovery";
import { trackEvent } from "@/shared/utils/errorTracking";
import type { Issue } from "./useStudioState";

export const LOAD_REPAIR_LABEL = "Automatic repair";
export const BEFORE_REPAIR_VERSION = "Before automatic repair";
const KEPT_PREFIX = "bk-damage-kept-v1-";

/** Element id + the exact text it was kept with: a later change re-checks it. */
const keptKey = (elementId: string, text: string) => `${elementId}:${text.length}:${text.slice(0, 64)}`;

function readKept(siteId: string): Set<string> {
  try {
    const raw = localStorage.getItem(KEPT_PREFIX + siteId);
    return new Set(raw ? (JSON.parse(raw) as string[]) : []);
  } catch {
    return new Set();
  }
}

function writeKept(siteId: string, kept: Set<string>): void {
  try {
    localStorage.setItem(KEPT_PREFIX + siteId, JSON.stringify([...kept]));
  } catch {
    /* storage refused — the row returns next load, which is the safe side */
  }
}

/** What a reader sees: the text with its markup applied once. */
const visible = (content: string) => stripAllTags(content).replace(/\s+/g, " ").trim();

function elementLabel(composer: Composer, elementId: string, pageId: string): string {
  const el = composer.elements.getElement(elementId);
  const page = composer.elements.getAllPages().find((p) => p.id === pageId);
  const name = el?.getType?.() ?? "Element";
  const kind = name.charAt(0).toUpperCase() + name.slice(1);
  return page ? `${page.name} › ${kind}` : kind;
}

export interface LoadRepair {
  /** Rows for the Issues panel. */
  issues: Issue[];
  fix: (issue: Issue) => boolean;
  keep: (issue: Issue) => void;
}

export function useLoadRepair(opts: {
  composer: Composer | null;
  siteId: string | null;
  addToast: (input: ToastInput) => string;
  readOnly: boolean;
}): LoadRepair {
  const { composer, siteId, addToast, readOnly } = opts;
  const [report, setReport] = React.useState<Pick<DamageReport, "candidates" | "unverified">>({
    candidates: [],
    unverified: [],
  });
  const readOnlyRef = React.useRef(readOnly);
  readOnlyRef.current = readOnly;
  const addToastRef = React.useRef(addToast);
  addToastRef.current = addToast;

  React.useEffect(() => {
    if (!composer || !siteId) return;
    let done = false;
    let alive = true;
    let stopWaiting: (() => void) | undefined;

    const run = async () => {
      if (done || !alive) return;
      done = true;
      const found = scanDamage(composer.exportProject());
      const kept = readKept(siteId);
      setReport({
        candidates: found.candidates.filter((c) => !kept.has(keptKey(c.elementId, c.before))),
        unverified: found.unverified.filter((u) => !kept.has(keptKey(u.elementId, "unverified"))),
      });
      if (found.repairs.length === 0 || readOnlyRef.current || composer.readOnly || !isLoadRepairEnabled()) return;

      try {
        await composer.versions.createVersion(
          BEFORE_REPAIR_VERSION,
          "Saved before the editor removed sizes that weren't numbers.",
          composer.exportProject(),
        );
      } catch {
        return; // no snapshot, no repair (failure-modes table)
      }
      if (!alive) return;
      composer.beginTransaction(LOAD_REPAIR_LABEL);
      let applied = 0;
      try {
        applied = applyDamageRepairs(composer, found.repairs);
      } finally {
        composer.endTransaction();
      }
      if (applied === 0) return;
      trackEvent("repair.applied", { nonFiniteSize: applied });
      addToastRef.current({
        tone: "info",
        title: applied === 1 ? "Fixed 1 broken size" : `Fixed ${applied} broken sizes`,
        description: `Sizes that weren't numbers were removed. The page before this is in History as "${BEFORE_REPAIR_VERSION}".`,
        action: {
          label: "Undo",
          onClick: () => {
            if (!composer.history.nextUndoTouchesOnly([], [LOAD_REPAIR_LABEL])) return;
            composer.history.undo();
            trackEvent("repair.undone", { nonFiniteSize: applied });
          },
        },
        secondaryAction: {
          label: "Details",
          onClick: () => composer.emit(EVENTS.UI_PANEL_OPEN, { panel: "history", screen: "saves" }),
        },
        duration: 12000,
      });
    };

    /* After this load settles and after any restore choice (decision 1). */
    const schedule = () => {
      if (done) return;
      window.setTimeout(() => {
        if (done || !alive) return;
        if (peekOffScreenUnsaved(siteId)) {
          stopWaiting?.();
          stopWaiting = onOffScreenSettled(siteId, () => window.setTimeout(() => void run(), 0));
          return;
        }
        void run();
      }, 0);
    };
    composer.on(EVENTS.PROJECT_LOADED, schedule);
    return () => {
      alive = false;
      stopWaiting?.();
      composer.off(EVENTS.PROJECT_LOADED, schedule);
    };
  }, [composer, siteId]);

  const issues = React.useMemo<Issue[]>(() => {
    if (!composer) return [];
    const rows: Issue[] = report.candidates.map((c) => ({
      id: `damage:${c.elementId}`,
      type: "warning",
      message: "Text may be escaped twice",
      location: elementLabel(composer, c.elementId, c.pageId),
      elementId: c.elementId,
      pageId: c.pageId,
      damage: { kind: "escaped-text", before: visible(c.before) || c.before, after: visible(c.after) },
    }));
    for (const u of report.unverified) {
      rows.push({
        id: `damage-unverified:${u.elementId}`,
        type: "info",
        message: "Couldn't verify mobile or hover styles",
        location: elementLabel(composer, u.elementId, u.pageId),
        elementId: u.elementId,
        pageId: u.pageId,
        damage: { kind: "unverified-styles" },
      });
    }
    return rows;
  }, [composer, report]);

  const remove = (elementId: string, kind: "candidates" | "unverified") =>
    setReport((r) => ({ ...r, [kind]: (r[kind] as Array<EscapedTextCandidate | UnverifiedStyles>).filter((x) => x.elementId !== elementId) }));

  const fix = (issue: Issue): boolean => {
    const c = report.candidates.find((x) => issue.id === `damage:${x.elementId}`);
    if (!composer || !c || readOnly) return false;
    composer.beginTransaction("Fix escaped text");
    let ok = false;
    try {
      ok = applyEscapedTextFix(composer, c);
    } finally {
      composer.endTransaction();
    }
    if (ok) remove(c.elementId, "candidates");
    return ok;
  };

  const keep = (issue: Issue) => {
    if (!siteId) return;
    const kept = readKept(siteId);
    const c = report.candidates.find((x) => issue.id === `damage:${x.elementId}`);
    if (c) {
      kept.add(keptKey(c.elementId, c.before));
      remove(c.elementId, "candidates");
    } else if (issue.elementId && issue.damage?.kind === "unverified-styles") {
      kept.add(keptKey(issue.elementId, "unverified"));
      remove(issue.elementId, "unverified");
    }
    writeKept(siteId, kept);
  };

  return { issues, fix, keep };
}
