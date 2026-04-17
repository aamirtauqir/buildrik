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
 * Debounces suggestions to max once per 30 seconds.
 *
 * @license BSD-3-Clause
 */

import * as React from "react";
import type { Composer } from "../../engine";
import { EVENTS } from "../constants/events";

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
const SUGGESTION_COOLDOWN_MS = 30_000; // 30 seconds

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
  const [lastSuggestionTime, setLastSuggestionTime] = React.useState(0);

  const autoCheckpointCountRef = React.useRef(0);

  const isAvailable = composer?.versionHistory?.isAvailable() ?? false;

  const requestSuggestion = React.useCallback(
    async (trigger: MilestoneSuggestion["trigger"]) => {
      if (!composer?.versionHistory || !isAvailable) return;

      // Rate limit: don't suggest if shown in last 30s
      if (Date.now() - lastSuggestionTime < SUGGESTION_COOLDOWN_MS) return;

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

        const response = await fetch("/api/trpc/ai.milestoneSuggest", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ recentChanges, pageStructure: { pageCount, elementCount: 0 } }),
        });

        if (!response.ok) throw new Error("AI unavailable");

        const data = await response.json();
        setSuggestion({
          suggestedName: data.result?.data?.suggestedName ?? "Update",
          reasoning: data.result?.data?.reasoning ?? "",
          trigger,
        });
        setLastSuggestionTime(Date.now());
      } catch {
        // Silently fail — milestone suggestions are best-effort
      } finally {
        setIsLoading(false);
      }
    },
    [composer, isAvailable, lastSuggestionTime]
  );

  React.useEffect(() => {
    if (!composer?.history) return;

    const handleRecorded = async (payload: { label?: string }) => {
      // Mass-change check runs on every recorded entry (manual or auto), since
      // a single user action can flip more than half an element's properties.
      // The 30s cooldown inside requestSuggestion prevents floods when this
      // co-fires with checkpoint_threshold.
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

    const handlePageCreated = async () => {
      await requestSuggestion("page_added");
    };

    composer.on(EVENTS.HISTORY_RECORDED, handleRecorded);
    composer.on(EVENTS.ELEMENT_DELETED, handleElementDeleted);
    composer.on(EVENTS.PAGE_CREATED, handlePageCreated);

    return () => {
      composer.off(EVENTS.HISTORY_RECORDED, handleRecorded);
      composer.off(EVENTS.ELEMENT_DELETED, handleElementDeleted);
      composer.off(EVENTS.PAGE_CREATED, handlePageCreated);
    };
  }, [composer, requestSuggestion]);

  const dismiss = React.useCallback(() => {
    setSuggestion(null);
  }, []);

  const accept = React.useCallback(
    async (name: string | null) => {
      if (!composer?.versionHistory || !suggestion) return;
      const versionName = name ?? suggestion.suggestedName;
      await composer.versionHistory.createVersion(versionName);
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
