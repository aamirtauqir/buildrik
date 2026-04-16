/**
 * useSemanticDiff Hook
 * Computes diff between current state and a given version on-demand
 *
 * @license BSD-3-Clause
 */

import { useState, useCallback, useEffect } from "react";
import type { Composer } from "../../engine";
import type { NamedVersion } from "../types/versions";

/**
 * Result of comparing two versions
 */
export interface CompareResult {
  available: boolean;
  summary?: string;
  changes?: Array<{ name: string; what: string }>;
}

/**
 * Return type for useSemanticDiff hook
 */
export interface UseSemanticDiffReturn {
  diff: CompareResult | null;
  isLoading: boolean;
  error: string | null;
  refetch: () => Promise<void>;
}

/**
 * Hook to compute diff on-demand for a given version
 * Returns null if composer is null or versionId is not provided
 */
export function useSemanticDiff(
  composer: Composer | null,
  versionId: string | null
): UseSemanticDiffReturn | null {
  const [diff, setDiff] = useState<CompareResult | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const computeDiff = useCallback(async () => {
    if (!composer?.versionHistory || !versionId) {
      setDiff(null);
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      // Get current version (first in list) for comparison
      const currentVersions = composer.versionHistory.getVersions();
      const currentId = currentVersions[0]?.id;

      if (!currentId) {
        setDiff({ available: false });
        return;
      }

      // Try to call compareVersions method if available
      const versionHistory = composer.versionHistory as unknown as Record<string, unknown>;
      const compareMethod = versionHistory["compareVersions"] as
        | ((a: string, b: string) => {
            changedCount: number;
            changes: Array<{ elementName: string; description: string }>;
          })
        | undefined;

      if (typeof compareMethod === "function") {
        const result = compareMethod(currentId, versionId);
        setDiff({
          available: true,
          summary: `Changed ${result.changedCount ?? 0} elements`,
          changes: (result.changes ?? []).map((c) => ({
            name: c.elementName ?? "Unknown",
            what: c.description ?? "",
          })),
        });
      } else {
        // compareVersions not available - get both versions and compute diff
        const currentVersion = await composer.versionHistory.getVersion(currentId);
        const targetVersion = await composer.versionHistory.getVersion(versionId);

        if (!currentVersion || !targetVersion) {
          setDiff({ available: false });
          return;
        }

        // Compute structural diff between snapshots
        const changes = computeStructuralDiff(currentVersion, targetVersion);
        setDiff({
          available: true,
          summary: `Changed ${changes.length} elements`,
          changes,
        });
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to compute diff");
      setDiff({ available: false });
    } finally {
      setIsLoading(false);
    }
  }, [composer, versionId]);

  // Auto-compute diff when versionId changes
  useEffect(() => {
    if (versionId) {
      computeDiff();
    } else {
      setDiff(null);
      setError(null);
    }
  }, [versionId, computeDiff]);

  if (!composer) return null;

  return {
    diff,
    isLoading,
    error,
    refetch: computeDiff,
  };
}

/**
 * Compute structural diff between two version snapshots
 */
function computeStructuralDiff(
  current: NamedVersion,
  target: NamedVersion
): Array<{ name: string; what: string }> {
  const changes: Array<{ name: string; what: string }> = [];

  // Compare pages
  const currentPages = current.snapshot?.pages ?? [];
  const targetPages = target.snapshot?.pages ?? [];

  if (currentPages.length !== targetPages.length) {
    changes.push({
      name: "Pages",
      what: `${targetPages.length} → ${currentPages.length} pages`,
    });
  }

  // Compare root elements of each page
  const maxPages = Math.max(currentPages.length, targetPages.length);
  for (let i = 0; i < maxPages; i++) {
    const currentPage = currentPages[i];
    const targetPage = targetPages[i];

    if (!targetPage) {
      changes.push({ name: currentPage.name ?? `Page ${i + 1}`, what: "added" });
      continue;
    }
    if (!currentPage) {
      changes.push({ name: targetPage.name ?? `Page ${i + 1}`, what: "removed" });
      continue;
    }

    // Count elements in trees
    const currentCount = countTree(currentPage.root);
    const targetCount = countTree(targetPage.root);

    if (currentCount !== targetCount) {
      changes.push({
        name: targetPage.name ?? `Page ${i + 1}`,
        what: `${targetCount} → ${currentCount} elements`,
      });
    }
  }

  return changes;
}

/**
 * Count elements in a tree structure
 */
function countTree(root: { children?: unknown[] } | undefined): number {
  if (!root || !root.children) return 0;
  let count = 0;
  for (const child of root.children) {
    if (child && typeof child === 'object') {
      count += 1 + countTree(child as { children?: unknown[] });
    }
  }
  return count;
}

export default useSemanticDiff;