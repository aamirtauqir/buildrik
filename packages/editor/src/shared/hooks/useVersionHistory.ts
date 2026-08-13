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
  /** The list could not be read. The versions are still stored. */
  loadError: boolean;
  retryLoad: () => void;
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
  const [loadError, setLoadError] = React.useState(false);

  const isAvailable = composer?.versions?.isAvailable() ?? false;

  React.useEffect(() => {
    if (!composer?.versions) {
      setVersions([]);
      setIsLoading(false);
      return;
    }

    const loadVersions = () => {
      setVersions(composer.versions.getVersions());
      setIsLoading(false);
      setLoadError(false);
    };

    const onLoadFailed = () => {
      setIsLoading(false);
      setLoadError(true);
    };

    /* The seed read is synchronous and returns [] while the manager is still
       awaiting storage (VersionTimelineManager.loadVersionsFromStorage is
       async). Clearing isLoading here made the panel render its empty state —
       "Version history appears here as you save changes" — to users who had
       forty saved versions, until VERSION_LIST_UPDATED arrived and it popped
       to a list. Seed the rows, but stay loading until the manager says it has
       finished; when storage is unavailable the manager never starts, and
       isAvailable is false, which the panel branches on first. */
    setVersions(composer.versions.getVersions());
    if (!composer.versions.isAvailable()) setIsLoading(false);

    // Listen for version changes
    composer.on(EVENTS.VERSION_LIST_UPDATED, loadVersions);
    composer.on(EVENTS.VERSION_LOAD_FAILED, onLoadFailed);

    return () => {
      composer.off(EVENTS.VERSION_LIST_UPDATED, loadVersions);
      composer.off(EVENTS.VERSION_LOAD_FAILED, onLoadFailed);
    };
  }, [composer]);

  const createVersion = React.useCallback(
    async (name: string, description?: string) => {
      if (!composer?.versions) return;
      await composer.versions.createVersion(name, description);
    },
    [composer]
  );

  const restoreVersion = React.useCallback(
    async (id: string) => {
      if (!composer?.versions) return;
      await composer.versions.restoreVersion(id);
    },
    [composer]
  );

  const deleteVersion = React.useCallback(
    async (id: string) => {
      if (!composer?.versions) return;
      await composer.versions.deleteVersion(id);
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
      if (!composer?.versions) return null;
      return composer.versions.compareVersions(currentId, targetId);
    },
    [composer]
  );

  const updateAiSummary = React.useCallback(
    async (versionId: string, summary: string) => {
      if (!composer?.versions) return;
      await composer.versions.updateVersion(versionId, { aiSummary: summary });
    },
    [composer]
  );

  const retryLoad = React.useCallback(() => {
    if (!composer?.versions?.reloadVersions) return;
    setLoadError(false);
    setIsLoading(true);
    void composer.versions.reloadVersions();
  }, [composer]);

  return {
    versions,
    isAvailable,
    isLoading,
    loadError,
    retryLoad,
    createVersion,
    restoreVersion,
    deleteVersion,
    getVersion,
    compareVersions,
    updateAiSummary,
  };
}
