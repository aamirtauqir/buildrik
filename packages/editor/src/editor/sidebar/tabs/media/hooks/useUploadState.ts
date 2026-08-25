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

type ShowToast = (msg: string, type: "success" | "error" | "info" | "warning") => void;

/**
 * Upload toasts have ONE owner per document.
 *
 * `useMediaState` — and through it this hook — is instantiated twice:
 * `MediaTab.tsx:71` (the 320 rail panel) and `LibraryManager.tsx:65` (the
 * fullpage manager). Both mount at once, because `Expand Media` opens the
 * manager while the Media tab is still the active tab. Each instance
 * subscribed its own handler to the same composer event, so one upload raised
 * TWO identical toasts — measured 2026-08-25 on the local-only warning, and it
 * applied to every upload toast, "uploaded ✓" included.
 *
 * First instance to mount claims toast duty and releases it on unmount; the
 * others still track queue + storage, they just do not speak.
 */
const toastSpeakers: symbol[] = [];


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

    /* A registry, not a single owner: the first instance to mount would
       otherwise release on unmount and leave nobody speaking — the rail panel
       unmounts when the fullpage manager takes over, which silenced the
       warning entirely. The head of the live set speaks, so the duty moves
       when the head goes away. */
    const me = Symbol("upload-toast-speaker");
    toastSpeakers.push(me);
    const speaks = () => toastSpeakers[0] === me;

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
      /*
        Board 145:148 keeps the failure ON SCREEN above the footer, with the
        reason and a Retry. That row renders from `uploadQueue`, and a file
        rejected by validation never entered it — it only landed in
        `failedUploads`, which nothing renders. So a 12 MB image was refused in
        total silence: measured live, the drawer showed no band at all.
      */
      setUploadQueue((prev) => [
        ...prev.filter((u) => u.fileName !== name),
        { fileName: name, progress: 0, status: "error", error: reason },
      ]);
      // The reason is already computed — say it. This used to claim every
      // failure was an unsupported TYPE, so an oversized JPG was told to
      // upload a JPG.
      if (speaks()) showToast(`${name} — ${reason}`, "error");
    };

    const onAdded = () => recalcStorage();
    const onDeleted = () => recalcStorage();

    const onComplete = (payload: unknown) => {
      const p = payload as {
        fileName?: string;
        mimeType?: string;
        asset?: { localOnly?: boolean };
      };
      if (!speaks()) {
        recalcStorage();
        return;
      }
      if (p?.mimeType?.includes("font")) {
        showToast("Font uploaded! Use it via Text Style → Font → My Fonts", "info");
      } else if (p?.asset?.localOnly) {
        /* "uploaded ✓" over a file that never left the browser. The mirror
           failed (offline, auth, no blob token), so the asset is in this
           device's IndexedDB and nowhere else — which also decides what happens
           when it is placed on a page. */
        showToast(
          `${p?.fileName ?? "File"} saved on this device — it didn't reach the server, so it won't publish yet.`,
          "warning",
        );
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
      const i = toastSpeakers.indexOf(me);
      if (i !== -1) toastSpeakers.splice(i, 1);
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
  /**
   * Board 1163:13948's error row carries a Dismiss. A failed upload otherwise
   * sat in the queue forever — the auto-clear only ever fired for completes.
   */
  const dismissUpload = useCallback((fileName: string) => {
    setUploadQueue((prev) => prev.filter((u) => u.fileName !== fileName));
  }, []);

  const retryUpload = useCallback(
    (fileName: string) => {
      const file = failedFilesRef.current.get(fileName);
      if (!file) return;
      setFailedUploads((prev) => prev.filter((f) => f.fileName !== fileName));
      // The band renders from the queue, so the retry has to clear it there
      // too or the old failure sits under the new attempt.
      setUploadQueue((prev) => prev.filter((u) => u.fileName !== fileName));
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
    dismissUpload,
    dismissFailedUploads,
    handlePanelDragEnter,
    handlePanelDragLeave,
    handlePanelDragOver,
    handlePanelDrop,
  };
}
