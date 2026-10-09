/**
 * useAutoMilestone - Monitors history for significant changes and suggests milestones
 * Part of Phase 5: Auto-milestone suggestions
 *
 * Detects significant changes:
 * - A new page is added
 * - An element is deleted
 * - >50% of an element's properties changed
 * - 10 auto-checkpoints since last manual save
 *
 * Debounces suggestions to max once per 10 minutes, and only past a
 * significance threshold of history entries recorded since the last attempt
 * — each attempt spends AI quota regardless of outcome (S-8), and never
 * while the tab is hidden.
 *
 * @license BSD-3-Clause
 */

import * as React from "react";
import type { Composer } from "@/engine";
import { EVENTS } from "../constants/events";
import { aiTrpcClient } from "@/services/ai/AiTrpcClient";
import { getSiteIdFromUrl } from "@/services/BuildrikSyncProvider";

export interface MilestoneSuggestion {
  suggestedName: string;
  reasoning: string;
  trigger: "page_added" | "element_deleted" | "mass_change" | "checkpoint_threshold";
}

export interface UseAutoMilestoneReturn {
  /** Current milestone suggestion, if any */
  suggestion: MilestoneSuggestion | null;
  /** Whether suggestion is loading */
  isLoading: boolean;
  /** Dismiss the current suggestion */
  dismiss: () => void;
  /** Accept the suggestion and save version */
  accept: (name: string | null) => void;
  /** Edit the suggestion name before saving */
  edit: (name: string) => void;
  /** Whether auto-milestones are available */
  isAvailable: boolean;
}

const AUTO_CHECKPOINT_THRESHOLD = 10;
/* S-8/carry-over 15: every requestSuggestion call spends AI quota (the
   client only skips the CALL, not the spend — a rejected/failed call still
   burns a request against the account's budget). At 30s this hook could
   fire up to ~120/h, and the cooldown only ever armed on SUCCESS
   (`lastSuggestionTime` was set inside the try block) — a run of failures
   (quota already exhausted, a flaky endpoint) left it at its initial 0
   forever, so the "cooldown" gated nothing once it started failing: every
   qualifying history entry retried immediately. Raised to 10 minutes and
   the gate now arms on every ATTEMPT, not just a success. */
const SUGGESTION_COOLDOWN_MS = 10 * 60_000; // 10 minutes
/* A significance threshold on top of the cooldown — 30s of edits during a
   burst was "significant" by the old clock alone; now also require at
   least this many recorded history entries since the last suggestion
   (attempted or shown), so a quiet 10 minutes with one small edit doesn't
   still spend a call the moment the cooldown lifts. */
const MIN_CHANGES_SINCE_LAST_SUGGESTION = 5;

/* carry-over 15: `lastSuggestionTime` lived only in React state, so a
   remount (StrictMode double-mount aside, a real one happens on any panel
   that unmounts/remounts this hook) reset it to 0 — `hasAttempted` read
   false again, which bypassed BOTH the 10-minute cooldown and the
   significance threshold below for the "first" attempt after the remount.
   Persisted per site so the cooldown survives a remount; sessionStorage
   because the cooldown is a same-session concept, not something that should
   outlive the tab. Wrapped in try/catch — storage can be disabled or full,
   and a suggestion gate is never worth breaking the editor over. */
const LAST_SUGGESTION_KEY_PREFIX = "bk-auto-milestone-last-suggestion-";

function readPersistedLastSuggestionTime(siteId: string | null): number {
  if (!siteId) return 0;
  try {
    const raw = sessionStorage.getItem(LAST_SUGGESTION_KEY_PREFIX + siteId);
    const parsed = raw ? Number(raw) : 0;
    return Number.isFinite(parsed) ? parsed : 0;
  } catch {
    return 0;
  }
}

function writePersistedLastSuggestionTime(siteId: string | null, time: number): void {
  if (!siteId) return;
  try {
    sessionStorage.setItem(LAST_SUGGESTION_KEY_PREFIX + siteId, String(time));
  } catch {
    // Storage disabled or full — in-memory state still gates this session.
  }
}

/**
 * Approximate property count per element type, used to normalize "mass change"
 * detection (spec §2.9). Values mirror the spec's example numbers; unknown
 * types fall back to SCHEMA_PROP_COUNT_FALLBACK.
 */
const SCHEMA_PROP_COUNT: Record<string, number> = {
  div: 20,
  container: 20,
  section: 15,
  img: 15,
  image: 15,
  text: 10,
  heading: 10,
  paragraph: 10,
  button: 12,
  input: 14,
  textarea: 14,
};
const SCHEMA_PROP_COUNT_FALLBACK = 15;
const MASS_CHANGE_RATIO = 0.5;

/**
 * Pull the type of an element by id from a ProjectData tree. Walks pages →
 * root → children recursively. Returns null if not found.
 */
function findElementType(
  project: { pages: Array<{ root: { id: string; type?: string; children?: unknown[] } }> },
  elementId: string
): string | null {
  const walk = (node: { id: string; type?: string; children?: unknown[] }): string | null => {
    if (node.id === elementId) return node.type ?? null;
    if (Array.isArray(node.children)) {
      for (const child of node.children) {
        const result = walk(child as { id: string; type?: string; children?: unknown[] });
        if (result) return result;
      }
    }
    return null;
  };

  for (const page of project.pages) {
    const result = walk(page.root);
    if (result) return result;
  }
  return null;
}

/**
 * Inspect the latest history display entry and decide whether mass_change
 * fires (spec §2.9). Returns true if any element in the entry has >= 50% of
 * its schema properties changed.
 *
 * Per-element grouping uses the `element[<index>]` property markers that
 * HistoryFormatter emits for add/remove operations on `elements`/`children`
 * paths, plus style/content properties carried in the same entry. When no
 * elementId is available, the entry's total distinct-property count is
 * compared against the fallback schema size.
 */
function shouldFireMassChange(
  changes: Array<{ property: string; operation: string; description?: string }>,
  project: { pages: Array<{ root: { id: string; type?: string; children?: unknown[] } }> }
): boolean {
  if (changes.length === 0) return false;

  // Distinct property names (excluding the "..." info sentinel the formatter
  // appends for overflow).
  const distinctProps = new Set<string>();
  let overflowCount = 0;

  for (const change of changes) {
    if (change.operation === "info") {
      // "and N more changes" — parse N out of the description.
      const match = change.description?.match(/and (\d+) more/);
      if (match) overflowCount = parseInt(match[1], 10) || 0;
      continue;
    }
    distinctProps.add(change.property);
  }

  const totalDistinct = distinctProps.size + overflowCount;
  if (totalDistinct === 0) return false;

  // If any change reference an element[N] marker, try to look up the type
  // of an element to use a type-specific schema size. Otherwise fall back.
  let schemaCount = SCHEMA_PROP_COUNT_FALLBACK;
  for (const prop of distinctProps) {
    const elementMarker = prop.match(/^element\[(.+)\]$/);
    if (!elementMarker) continue;
    const candidateId = elementMarker[1];
    const type = findElementType(project, candidateId);
    if (type && SCHEMA_PROP_COUNT[type] !== undefined) {
      schemaCount = SCHEMA_PROP_COUNT[type];
      break;
    }
  }

  return totalDistinct / schemaCount >= MASS_CHANGE_RATIO;
}

export function useAutoMilestone(
  composer: Composer | null
): UseAutoMilestoneReturn {
  const [suggestion, setSuggestion] = React.useState<MilestoneSuggestion | null>(null);
  const [isLoading, setIsLoading] = React.useState(false);
  const [lastSuggestionTime, setLastSuggestionTime] = React.useState(() =>
    readPersistedLastSuggestionTime(getSiteIdFromUrl()),
  );

  const autoCheckpointCountRef = React.useRef(0);
  // Significance threshold: history entries recorded since the gate last
  // armed (on an attempt, success or failure). Reset whenever the gate arms.
  const changesSinceLastSuggestionRef = React.useRef(0);

  const isAvailable = composer?.versions?.isAvailable() ?? false;

  const requestSuggestion = React.useCallback(
    async (trigger: MilestoneSuggestion["trigger"]) => {
      if (!composer?.versions || !isAvailable) return;

      // Never spend quota while the tab isn't visible — nobody is here to
      // see the suggestion, and a hidden tab left open overnight is exactly
      // the shape that burned quota fastest.
      if (typeof document !== "undefined" && document.visibilityState === "hidden") return;

      // Rate limit: don't attempt more than once per cooldown window. Armed
      // on every ATTEMPT below, not only a success, so a run of failures
      // can't disable the gate. lastSuggestionTime persists per site
      // (sessionStorage), so this holds across a remount too — a state-only
      // value read 0 again after remounting and let the very next qualifying
      // event straight through.
      if (Date.now() - lastSuggestionTime < SUGGESTION_COOLDOWN_MS) return;

      // Significance threshold: require real recorded activity since the
      // gate last armed — including the very first attempt. No exemption:
      // an exempted first attempt is indistinguishable, after a remount,
      // from "the gate never armed," which is exactly the bypass this
      // threshold exists to close.
      if (changesSinceLastSuggestionRef.current < MIN_CHANGES_SINCE_LAST_SUGGESTION) return;

      const now = Date.now();
      setLastSuggestionTime(now);
      writePersistedLastSuggestionTime(getSiteIdFromUrl(), now);
      changesSinceLastSuggestionRef.current = 0;
      setIsLoading(true);

      try {
        const historyStack = composer.history.getHistoryStack();
        const recentChanges = historyStack.slice(0, 10).map((e) => ({
          id: e.id,
          label: e.label,
          timestamp: e.timestamp,
          type: e.type,
        }));

        const pageCount = composer.exportProject().pages.length;
        /* `elementCount: 0` was pinned here while `pageCount` beside it was
           computed, and it is not cosmetic: `ai.service.ts:418` puts the pair
           straight into the prompt as "Current page structure: N pages,
           approximately 0 elements." Every milestone name was suggested by a
           model told the site has pages and nothing on them. */
        const elementCount = composer.elements.getAllElements().length;

        /* No retries: a suggestion nobody asked for is not worth a second
           credit-spending call. */
        const { data } = await aiTrpcClient.suggestMilestone(
          { recentChanges, pageStructure: { pageCount, elementCount } },
          { retries: 0 },
        );
        setSuggestion({
          suggestedName: data.suggestedName || "Update",
          reasoning: data.reasoning ?? "",
          trigger,
        });
      } catch (err) {
        // Best-effort — but said, not swallowed: a dead transport hid here
        // for months behind `catch {}`.
        console.warn("[useAutoMilestone] milestone suggestion failed:", err);
      } finally {
        setIsLoading(false);
      }
    },
    [composer, isAvailable, lastSuggestionTime]
  );

  React.useEffect(() => {
    if (!composer?.history) return;

    const handleRecorded = async (payload: { label?: string }) => {
      changesSinceLastSuggestionRef.current += 1;

      // Mass-change check runs on every recorded entry (manual or auto), since
      // a single user action can flip more than half an element's properties.
      // The 10-minute cooldown + significance threshold inside
      // requestSuggestion prevent floods when this co-fires with
      // checkpoint_threshold.
      try {
        const stack = composer.history.getHistoryStack();
        const latest = stack[0];
        if (latest && latest.type === "patch" && latest.changes.length > 0) {
          const project = composer.exportProject();
          if (shouldFireMassChange(latest.changes, project)) {
            void requestSuggestion("mass_change");
          }
        }
      } catch {
        // Best-effort — never let suggestion logic break history recording.
      }

      // Don't suggest checkpoint_threshold for explicit user actions
      if (payload.label && !payload.label.startsWith("Auto:")) {
        // User manually triggered an action — reset checkpoint counter
        autoCheckpointCountRef.current = 0;
        return;
      }

      // Track auto-checkpoint count
      if (payload.label?.startsWith("Auto:")) {
        autoCheckpointCountRef.current++;

        if (autoCheckpointCountRef.current >= AUTO_CHECKPOINT_THRESHOLD) {
          autoCheckpointCountRef.current = 0;
          await requestSuggestion("checkpoint_threshold");
        }
      }
    };

    const handleElementDeleted = async () => {
      await requestSuggestion("element_deleted");
    };

    /* The engine has no bare "page:created" — PageManager announces every page
       create/delete/activate as PROJECT_CHANGED with a `type` discriminator
       (:91, :270, :225). Listening for EVENTS.PAGE_CREATED meant the
       page_added milestone suggestion never fired for anyone. Filtered on the
       type so this stays as narrow as it was meant to be. */
    const handleProjectChanged = async (p?: { type?: string }) => {
      if (p?.type !== "page:created") return;
      await requestSuggestion("page_added");
    };

    composer.on(EVENTS.HISTORY_RECORDED, handleRecorded);
    composer.on(EVENTS.ELEMENT_DELETED, handleElementDeleted);
    composer.on(EVENTS.PROJECT_CHANGED, handleProjectChanged);

    return () => {
      composer.off(EVENTS.HISTORY_RECORDED, handleRecorded);
      composer.off(EVENTS.ELEMENT_DELETED, handleElementDeleted);
      composer.off(EVENTS.PROJECT_CHANGED, handleProjectChanged);
    };
  }, [composer, requestSuggestion]);

  const dismiss = React.useCallback(() => {
    setSuggestion(null);
  }, []);

  const accept = React.useCallback(
    async (name: string | null) => {
      if (!composer?.versions || !suggestion) return;
      const versionName = name ?? suggestion.suggestedName;
      await composer.versions.createVersion(versionName);
      setSuggestion(null);
    },
    [composer, suggestion]
  );

  const edit = React.useCallback((name: string) => {
    setSuggestion((prev) => (prev ? { ...prev, suggestedName: name } : null));
  }, []);

  return {
    suggestion,
    isLoading,
    dismiss,
    accept,
    edit,
    isAvailable,
  };
}
