/**
 * useVersionHistory - Wrapper hook for VersionTimelineManager
 * Part of Phase 2: Custom hooks for History Tab redesign
 *
 * @license BSD-3-Clause
 */

import * as React from "react";
import type { Composer } from "../../engine";
import type { NamedVersion, CompareResult } from "../types/versions";
import { EVENTS } from "../constants/events";

export interface UseVersionHistoryReturn {
  /** List of saved versions */
  versions: NamedVersion[];
  /** Whether version history is available */
  isAvailable: boolean;
  /** Loading state */
  isLoading: boolean;
  /** Create a new version */
  createVersion: (name: string, description?: string) => Promise<void>;
  /** Restore a version by id */
  restoreVersion: (id: string) => Promise<void>;
  /** Delete a version by id */
  deleteVersion: (id: string) => Promise<void>;
  /** Get a specific version by id */
  getVersion: (id: string) => NamedVersion | undefined;
  /** Compare two versions and return diff */
  compareVersions: (currentId: string, targetId: string) => Promise<CompareResult | null>;
  /** Update AI summary for a version */
  updateAiSummary: (versionId: string, summary: string) => Promise<void>;
}

export function useVersionHistory(composer: Composer | null): UseVersionHistoryReturn {
  const [versions, setVersions] = React.useState<NamedVersion[]>([]);
  const [isLoading, setIsLoading] = React.useState(true);

  const isAvailable = composer?.versionHistory?.isAvailable() ?? false;

  React.useEffect(() => {
    if (!composer?.versionHistory) {
      setVersions([]);
      setIsLoading(false);
      return;
    }

    const loadVersions = () => {
      setVersions(composer.versionHistory.getVersions());
      setIsLoading(false);
    };

    // Initial load
    loadVersions();

    // Listen for version changes
    composer.on(EVENTS.VERSION_LIST_UPDATED, loadVersions);

    return () => {
      composer.off(EVENTS.VERSION_LIST_UPDATED, loadVersions);
    };
  }, [composer]);

  const createVersion = React.useCallback(
    async (name: string, description?: string) => {
      if (!composer?.versionHistory) return;
      await composer.versionHistory.createVersion(name, description);
    },
    [composer]
  );

  const restoreVersion = React.useCallback(
    async (id: string) => {
      if (!composer?.versionHistory) return;
      await composer.versionHistory.restoreVersion(id);
    },
    [composer]
  );

  const deleteVersion = React.useCallback(
    async (id: string) => {
      if (!composer?.versionHistory) return;
      await composer.versionHistory.deleteVersion(id);
    },
    [composer]
  );

  const getVersion = React.useCallback(
    (id: string): NamedVersion | undefined => {
      return versions.find((v) => v.id === id);
    },
    [versions]
  );

  const compareVersions = React.useCallback(
    async (currentId: string, targetId: string): Promise<CompareResult | null> => {
      if (!composer?.versionHistory) return null;
      return composer.versionHistory.compareVersions(currentId, targetId);
    },
    [composer]
  );

  const updateAiSummary = React.useCallback(
    async (versionId: string, summary: string) => {
      if (!composer?.versionHistory) return;
      await composer.versionHistory.updateVersion(versionId, { aiSummary: summary });
    },
    [composer]
  );

  return {
    versions,
    isAvailable,
    isLoading,
    createVersion,
    restoreVersion,
    deleteVersion,
    getVersion,
    compareVersions,
    updateAiSummary,
  };
}
