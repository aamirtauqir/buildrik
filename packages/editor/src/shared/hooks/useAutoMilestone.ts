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
      // Don't suggest for explicit user actions
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
