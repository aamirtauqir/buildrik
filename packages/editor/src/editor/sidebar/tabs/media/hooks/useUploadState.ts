/**
 * Media Tab — Upload State Hook
 * Single responsibility: queue, storage, upload(), drag, error handling.
 * @license BSD-3-Clause
 */

import * as React from "react";
import { useCallback, useEffect, useRef, useState } from "react";
import type { Composer } from "../../../../../engine/Composer";
import { MEDIA_EVENTS, STORAGE_QUOTA_BYTES } from "../../../../../shared/constants/media";
import type { UploadProgress } from "../../../../../shared/types/media";
import type { FailedUpload, UploadStateResult } from "../data/mediaTypes";

type ShowToast = (msg: string, type: "success" | "error" | "info") => void;

export function useUploadState(composer: Composer, showToast: ShowToast): UploadStateResult {
  const [uploadQueue, setUploadQueue] = useState<UploadProgress[]>([]);
  const [failedUploads, setFailedUploads] = useState<FailedUpload[]>([]);
  const [storageUsed, setStorageUsed] = useState(0);
  const [panelDragOver, setPanelDragOver] = useState(false);
  const dragCounterRef = useRef(0);

  // Recalculate storageUsed whenever assets change
  const recalcStorage = useCallback(() => {
    const assets = composer.media.getAssets();
    const total = assets.reduce((acc, a) => acc + a.size, 0);
    setStorageUsed(total);
  }, [composer]);

  useEffect(() => {
    recalcStorage();

    const onProgress = (payload: unknown) => {
      const p = payload as UploadProgress;
      setUploadQueue((prev) => {
        const idx = prev.findIndex((u) => u.fileName === p.fileName);
        if (idx >= 0) {
          const next = [...prev];
          next[idx] = p;
          return next;
        }
        return [...prev, p];
      });
      if (p.status === "complete" || p.status === "error") {
        setTimeout(
          () => setUploadQueue((prev) => prev.filter((u) => u.fileName !== p.fileName)),
          1500
        );
      }
    };

    const onError = (payload: unknown) => {
      const { fileName, error } = payload as { fileName?: string; error?: string };
      const name = fileName ?? "File";
      const reason = error ?? "Upload failed";
      setFailedUploads((prev) => [...prev, { fileName: name, reason }]);
      showToast(`${name} is not supported. Upload JPG, PNG, SVG, MP4, TTF, or OTF files.`, "error");
    };

    const onAdded = () => recalcStorage();
    const onDeleted = () => recalcStorage();

    const onComplete = (payload: unknown) => {
      const p = payload as { fileName?: string; mimeType?: string };
      if (p?.mimeType?.includes("font")) {
        showToast("Font uploaded! Use it via Text Style → Font → My Fonts", "info");
      } else {
        showToast(`${p?.fileName ?? "File"} uploaded ✓`, "success");
      }
      recalcStorage();
    };

    composer.media.on(MEDIA_EVENTS.UPLOAD_PROGRESS, onProgress);
    composer.media.on(MEDIA_EVENTS.UPLOAD_ERROR, onError);
    composer.media.on(MEDIA_EVENTS.MEDIA_ADDED, onAdded);
    composer.media.on(MEDIA_EVENTS.MEDIA_DELETED, onDeleted);
    composer.media.on(MEDIA_EVENTS.UPLOAD_COMPLETE, onComplete);

    return () => {
      composer.media.off(MEDIA_EVENTS.UPLOAD_PROGRESS, onProgress);
      composer.media.off(MEDIA_EVENTS.UPLOAD_ERROR, onError);
      composer.media.off(MEDIA_EVENTS.MEDIA_ADDED, onAdded);
      composer.media.off(MEDIA_EVENTS.MEDIA_DELETED, onDeleted);
      composer.media.off(MEDIA_EVENTS.UPLOAD_COMPLETE, onComplete);
    };
  }, [composer, recalcStorage, showToast]);

  const upload = useCallback(
    (files: File[]) => {
      // Pre-check quota
      const totalNew = files.reduce((acc, f) => acc + f.size, 0);
      if (storageUsed + totalNew > STORAGE_QUOTA_BYTES) {
        showToast("Not enough storage — delete some files to free space", "error");
        return;
      }
      files.forEach((file) => {
        // Duplicate filename info toast
        const existing = composer.media.getAssets().find((a) => a.name === file.name);
        if (existing) {
          showToast(`"${file.name}" already exists — uploading as duplicate`, "info");
        }
        composer.media.uploadFile(file);
      });
    },
    [composer, storageUsed, showToast]
  );

  const handlePanelDragEnter = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    dragCounterRef.current += 1;
    setPanelDragOver(true);
  }, []);

  const handlePanelDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    dragCounterRef.current -= 1;
    if (dragCounterRef.current <= 0) {
      dragCounterRef.current = 0;
      setPanelDragOver(false);
    }
  }, []);

  const handlePanelDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
  }, []);

  const handlePanelDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      dragCounterRef.current = 0;
      setPanelDragOver(false);
      const files = Array.from(e.dataTransfer.files);
      if (files.length > 0) upload(files);
    },
    [upload]
  );

  const dismissFailedUploads = useCallback(() => setFailedUploads([]), []);

  return {
    uploadQueue,
    failedUploads,
    storageUsed,
    panelDragOver,
    upload,
    dismissFailedUploads,
    handlePanelDragEnter,
    handlePanelDragLeave,
    handlePanelDragOver,
    handlePanelDrop,
  };
}
