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

interface ServerQuota {
  usedBytes: number;
  totalBytes: number; // -1 for unlimited
}

export function useUploadState(
  composer: Composer,
  showToast: ShowToast,
  serverQuota?: ServerQuota | null
): UploadStateResult {
  const [uploadQueue, setUploadQueue] = useState<UploadProgress[]>([]);
  const [failedUploads, setFailedUploads] = useState<FailedUpload[]>([]);
  const [localStorageUsed, setLocalStorageUsed] = useState(0);
  const [panelDragOver, setPanelDragOver] = useState(false);
  const dragCounterRef = useRef(0);
  // Retain the actual File for each failed upload so the queue's Retry button
  // can re-upload it (the failedUploads list only holds {fileName, reason}).
  const failedFilesRef = useRef<Map<string, File>>(new Map());

  // Recalculate localStorageUsed whenever assets change.
  // Used as fallback when server quota unavailable.
  const recalcStorage = useCallback(() => {
    const assets = composer.media.getAssets();
    const total = assets.reduce((acc, a) => acc + a.size, 0);
    setLocalStorageUsed(total);
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

  // Phase C re-wired in B4: now that uploads mirror to server (Phase B2),
  // server's usedBytes accurately reflects engine state. Use server when
  // wired; fall back to local IndexedDB sum when offline / unauthenticated /
  // unconfigured. Local-only assets (mirror failed) still count via the
  // local sum, so the cap check stays correct in both modes.
  //   server reachable + asset mirrored     → server usedBytes (canonical)
  //   server unreachable                    → local sum (degrades gracefully)
  //   server reachable + local-only assets  → max(server, local) so the cap
  //                                            check sees the true usage
  const isUnlimited = serverQuota?.totalBytes === -1;
  const storageUsed = serverQuota
    ? Math.max(serverQuota.usedBytes, localStorageUsed)
    : localStorageUsed;
  const storageTotal =
    serverQuota && !isUnlimited && serverQuota.totalBytes > 0
      ? serverQuota.totalBytes
      : STORAGE_QUOTA_BYTES;

  const upload = useCallback(
    async (files: File[], opts: { folderId?: string | null } = {}): Promise<boolean> => {
      const totalNew = files.reduce((acc, f) => acc + f.size, 0);
      // Skip cap check on unlimited tier (BUSINESS).
      if (!isUnlimited && storageUsed + totalNew > storageTotal) {
        showToast("Not enough storage — delete some files to free space", "error");
        return false;
      }
      const uploadOpts =
        opts.folderId != null ? { folderId: opts.folderId } : undefined;
      // Await the uploads so callers can report success only after they
      // actually complete. Was fire-and-forget — callers toasted success
      // before uploadFile resolved, masking silent failures.
      const results = await Promise.allSettled(
        files.map((file) => {
          const existing = composer.media.getAssets().find((a) => a.name === file.name);
          if (existing) {
            showToast(`"${file.name}" already exists — uploading as duplicate`, "info");
          }
          return composer.media.uploadFile(file, uploadOpts);
        }),
      );
      // Retain rejected Files so they can be retried; clear retained Files
      // that succeeded this round.
      results.forEach((r, i) => {
        const f = files[i];
        if (r.status === "rejected") failedFilesRef.current.set(f.name, f);
        else failedFilesRef.current.delete(f.name);
      });
      const failed = results.filter((r) => r.status === "rejected").length;
      if (failed > 0) {
        showToast(`${failed} upload${failed === 1 ? "" : "s"} failed`, "error");
      }
      return failed === 0;
    },
    [composer, storageUsed, storageTotal, isUnlimited, showToast]
  );

  // Re-upload a previously-failed file by name (queue Retry button).
  const retryUpload = useCallback(
    (fileName: string) => {
      const file = failedFilesRef.current.get(fileName);
      if (!file) return;
      setFailedUploads((prev) => prev.filter((f) => f.fileName !== fileName));
      void upload([file]);
    },
    [upload]
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
    storageTotal,
    panelDragOver,
    upload,
    retryUpload,
    dismissFailedUploads,
    handlePanelDragEnter,
    handlePanelDragLeave,
    handlePanelDragOver,
    handlePanelDrop,
  };
}
