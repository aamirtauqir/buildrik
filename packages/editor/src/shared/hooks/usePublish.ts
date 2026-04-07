/**
 * usePublish - Hook for managing project publish lifecycle
 * Provides publish/unpublish actions with loading, error, and status tracking
 *
 * Architecture: The editor package is a library — actual API calls are
 * injected from the host app (website) via onPublish/onUnpublish callbacks.
 * This hook manages the UI state around those operations.
 *
 * @license BSD-3-Clause
 */

import * as React from "react";

// ============================================
// Types
// ============================================

export interface PublishResult {
  publishedUrl: string | null;
  publishedAt: string | null;
}

export interface PublishState {
  isPublished: boolean;
  publishedUrl: string | null;
  lastPublishedAt: Date | null;
}

export interface UsePublishOptions {
  /** Async function that publishes the project — provided by host application */
  onPublish?: (projectId: string) => Promise<PublishResult>;
  /** Async function that unpublishes the project — provided by host application */
  onUnpublish?: (projectId: string) => Promise<void>;
  /** Initial publish state from loaded project data */
  initialState?: Partial<PublishState>;
}

export interface UsePublishReturn {
  /** Trigger publish — returns true on success, false on failure */
  publish: () => Promise<boolean>;
  /** Trigger unpublish — returns true on success, false on failure */
  unpublish: () => Promise<boolean>;
  /** Whether a publish/unpublish operation is in progress */
  isPublishing: boolean;
  /** The published URL (null if not published) */
  publishedUrl: string | null;
  /** Last publish timestamp */
  lastPublishedAt: Date | null;
  /** Error message from last failed operation */
  error: string | null;
  /** Whether the project is currently published */
  isPublished: boolean;
  /** Clear the current error */
  clearError: () => void;
}

// ============================================
// Hook
// ============================================

export function usePublish(
  projectId: string | null,
  options: UsePublishOptions = {}
): UsePublishReturn {
  const { onPublish, onUnpublish, initialState } = options;

  const [isPublishing, setIsPublishing] = React.useState(false);
  const [publishedUrl, setPublishedUrl] = React.useState<string | null>(
    initialState?.publishedUrl ?? null
  );
  const [lastPublishedAt, setLastPublishedAt] = React.useState<Date | null>(
    initialState?.lastPublishedAt ?? null
  );
  const [error, setError] = React.useState<string | null>(null);
  const [isPublished, setIsPublished] = React.useState(initialState?.isPublished ?? false);

  // Sync with external state changes (e.g., project reload)
  const prevUrl = React.useRef(initialState?.publishedUrl);
  const prevIsPublished = React.useRef(initialState?.isPublished);

  React.useEffect(() => {
    if (initialState?.publishedUrl !== prevUrl.current) {
      setPublishedUrl(initialState?.publishedUrl ?? null);
      prevUrl.current = initialState?.publishedUrl;
    }
    if (initialState?.isPublished !== prevIsPublished.current) {
      setIsPublished(initialState?.isPublished ?? false);
      prevIsPublished.current = initialState?.isPublished;
    }
  }, [initialState?.publishedUrl, initialState?.isPublished]);

  const publish = React.useCallback(async (): Promise<boolean> => {
    if (!projectId || !onPublish || isPublishing) return false;

    setIsPublishing(true);
    setError(null);

    try {
      const result = await onPublish(projectId);
      setPublishedUrl(result.publishedUrl);
      setIsPublished(true);
      setLastPublishedAt(result.publishedAt ? new Date(result.publishedAt) : new Date());
      return true;
    } catch (err) {
      const message = err instanceof Error ? err.message : "Publish failed";
      setError(message);
      return false;
    } finally {
      setIsPublishing(false);
    }
  }, [projectId, onPublish, isPublishing]);

  const unpublish = React.useCallback(async (): Promise<boolean> => {
    if (!projectId || !onUnpublish || isPublishing) return false;

    setIsPublishing(true);
    setError(null);

    try {
      await onUnpublish(projectId);
      setIsPublished(false);
      setPublishedUrl(null);
      return true;
    } catch (err) {
      const message = err instanceof Error ? err.message : "Unpublish failed";
      setError(message);
      return false;
    } finally {
      setIsPublishing(false);
    }
  }, [projectId, onUnpublish, isPublishing]);

  const clearError = React.useCallback(() => {
    setError(null);
  }, []);

  return {
    publish,
    unpublish,
    isPublishing,
    publishedUrl,
    lastPublishedAt,
    error,
    isPublished,
    clearError,
  };
}
