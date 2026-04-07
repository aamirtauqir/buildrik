/**
 * Media Manager Hook
 * Provides media operations from composer's MediaManager
 * @license BSD-3-Clause
 */

import * as React from "react";
import type { Composer } from "../../../engine";
import { MEDIA_EVENTS } from "../../../shared/constants/media";
import type { MediaAsset, MediaAssetType, UploadResult } from "../../../shared/types/media";

export interface UseMediaManagerResult {
  /** All media assets */
  assets: MediaAsset[];
  /** Loading state */
  isLoading: boolean;
  /** Upload a file */
  uploadFile: (
    file: File,
    options?: { folderId?: string; tags?: string[] }
  ) => Promise<UploadResult>;
  /** Delete an asset */
  deleteAsset: (assetId: string) => Promise<void>;
  /** Get an asset by ID */
  getAsset: (assetId: string) => MediaAsset | undefined;
  /** Get assets with optional filtering */
  getAssets: (options?: {
    folderId?: string | null;
    type?: MediaAssetType;
    tags?: string[];
    search?: string;
  }) => MediaAsset[];
  /** Update an asset */
  updateAsset: (assetId: string, updates: Partial<MediaAsset>) => Promise<MediaAsset | null>;
}

export function useMediaManager(composer: Composer | null): UseMediaManagerResult {
  const [assets, setAssets] = React.useState<MediaAsset[]>([]);
  const [isLoading, setIsLoading] = React.useState(false);

  // Subscribe to media changes
  React.useEffect(() => {
    if (!composer?.media) return;

    const updateAssets = () => {
      setAssets(composer.media.getAssets());
    };

    composer.media.on(MEDIA_EVENTS.MEDIA_ADDED, updateAssets);
    composer.media.on(MEDIA_EVENTS.MEDIA_DELETED, updateAssets);
    composer.media.on(MEDIA_EVENTS.MEDIA_UPDATED, updateAssets);

    // Get initial state
    updateAssets();

    return () => {
      composer.media.off(MEDIA_EVENTS.MEDIA_ADDED, updateAssets);
      composer.media.off(MEDIA_EVENTS.MEDIA_DELETED, updateAssets);
      composer.media.off(MEDIA_EVENTS.MEDIA_UPDATED, updateAssets);
    };
  }, [composer]);

  const uploadFile = React.useCallback(
    async (file: File, options?: { folderId?: string; tags?: string[] }): Promise<UploadResult> => {
      if (!composer?.media) {
        return { success: false, error: "Media manager not available", fileName: file.name };
      }
      setIsLoading(true);
      try {
        return await composer.media.uploadFile(file, options);
      } finally {
        setIsLoading(false);
      }
    },
    [composer]
  );

  const deleteAsset = React.useCallback(
    async (assetId: string) => {
      if (!composer?.media) return;
      await composer.media.deleteAsset(assetId);
    },
    [composer]
  );

  const getAsset = React.useCallback(
    (assetId: string): MediaAsset | undefined => {
      return composer?.media?.getAsset(assetId);
    },
    [composer]
  );

  const getAssets = React.useCallback(
    (options?: {
      folderId?: string | null;
      type?: MediaAssetType;
      tags?: string[];
      search?: string;
    }): MediaAsset[] => {
      return composer?.media?.getAssets(options) ?? [];
    },
    [composer]
  );

  const updateAsset = React.useCallback(
    async (assetId: string, updates: Partial<MediaAsset>): Promise<MediaAsset | null> => {
      if (!composer?.media) return null;
      return composer.media.updateAsset(assetId, updates);
    },
    [composer]
  );

  return {
    assets,
    isLoading,
    uploadFile,
    deleteAsset,
    getAsset,
    getAssets,
    updateAsset,
  };
}

export default useMediaManager;
