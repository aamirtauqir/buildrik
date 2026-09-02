/**
 * Media Tab — Upload Zone
 *
 * Phase D state machine: idle / drag / near-limit (>=80% used) /
 * full / rejected (file-type / size violation).
 *
 * @license BSD-3-Clause
 */

import * as React from "react";
import { Upload, AlertTriangle, XCircle } from "lucide-react";
import type { UploadZoneProps } from "../data/mediaTypes";
import { StorageQuotaBar } from "./StorageQuotaBar";
import { Button, TextInput } from "@/editor/chrome-ui";
const ACCEPT_TYPES = "image/*,video/*,.ttf,.otf,.woff,.woff2,.svg";
const MAX_FILE_BYTES = 50 * 1024 * 1024; // 50MB hard ceiling at the UI layer

function isAccepted(file: File): boolean {
  if (file.type.startsWith("image/")) return true;
  if (file.type.startsWith("video/")) return true;
  if (file.type.startsWith("font/")) return true;
  if (/\.(ttf|otf|woff2?|svg)$/i.test(file.name)) return true;
  return false;
}

export function UploadZone({
  storage,
  onUpload,
  disabled = false,
  uploadQueue,
  onRetryUpload,
  onOptimize,
  inputRef: externalInputRef,
  compact = false,
}: UploadZoneProps) {
  // The drawer footer's "Upload" link opens THIS input (board 144:46). A second
  // input would mean a second accept-list and a second size guard to keep in
  // step with `isAccepted`, so the caller borrows the one that already exists.
  const localInputRef = React.useRef<HTMLInputElement>(null);
  const inputRef = externalInputRef ?? localInputRef;
  const [isDragOver, setIsDragOver] = React.useState(false);
  const [rejectedReason, setRejectedReason] = React.useState<string | null>(null);
  const rejectedTimerRef = React.useRef<ReturnType<typeof setTimeout> | null>(null);

  const isFull = storage.used >= storage.total;
  const usedPercent = storage.total > 0 ? (storage.used / storage.total) * 100 : 0;
  const isNearLimit = !isFull && usedPercent >= 80;

  React.useEffect(() => {
    return () => {
      if (rejectedTimerRef.current) clearTimeout(rejectedTimerRef.current);
    };
  }, []);

  const flashRejection = (reason: string) => {
    setRejectedReason(reason);
    if (rejectedTimerRef.current) clearTimeout(rejectedTimerRef.current);
    rejectedTimerRef.current = setTimeout(() => setRejectedReason(null), 4000);
  };

  const handleFiles = (files: FileList | null) => {
    if (!files?.length || disabled || isFull) return;
    const fileArr = Array.from(files);
    const tooBig = fileArr.find((f) => f.size > MAX_FILE_BYTES);
    if (tooBig) {
      flashRejection(`"${tooBig.name}" exceeds 50MB limit`);
      return;
    }
    const wrongType = fileArr.find((f) => !isAccepted(f));
    if (wrongType) {
      flashRejection(`"${wrongType.name}" type not allowed`);
      return;
    }
    onUpload(fileArr);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(false);
    if (!isFull) handleFiles(e.dataTransfer.files);
  };

  // §22 — active upload state (any queue item still in-flight)
  const hasActiveUploads = (uploadQueue ?? []).some(
    (q) =>
      q.status === "uploading" ||
      q.status === "optimizing" ||
      q.status === "processing" ||
      q.status === "pending",
  );

  const failedItems = (uploadQueue ?? []).filter((q) => q.status === "error");
  // Everything still moving. "complete" is excluded on purpose: a finished
  // upload's evidence is the card that just appeared in the grid, and a 100%
  // bar lingering under it says the work is still happening.
  const activeItems = (uploadQueue ?? []).filter(
    (q) => q.status === "pending" || q.status === "uploading" || q.status === "optimizing" || q.status === "processing",
  );

  // Visual state priority: rejected > full > uploading > near-limit > drag > idle.
  const stateClass = rejectedReason
    ? "med-upload-zone--rejected"
    : isFull
      ? "med-upload-zone--disabled"
      : hasActiveUploads
        ? "med-upload-zone--uploading"
        : isNearLimit
          ? "med-upload-zone--near-limit"
          : isDragOver
            ? "med-upload-zone--drag-active"
            : "";

  const Icon = rejectedReason ? XCircle : isNearLimit ? AlertTriangle : Upload;

  const label = rejectedReason
    ? rejectedReason
    : isFull
      ? "Storage full"
      : isNearLimit
        ? `Almost full (${Math.round(usedPercent)}%)`
        : "Drag files or click to browse";

  return (
    <div className="med-upload-zone-wrap" data-testid="media-upload-zone-wrap">
      {/*
        COMPACT is the drawer (board 144:2), which draws no drop box at all —
        just the two footer links. The zone still has to exist: it owns the file
        input, the drag target, the accept-list and the rejection copy. So in
        compact mode it collapses to nothing at rest and only paints while a
        drag is over it, or when it has something to say (storage full, a
        rejected file). Hiding it outright would have deleted drag-and-drop to
        match a static frame.
      */}
      <div
        className={[
          `med-upload-zone${stateClass ? ` ${stateClass}` : ""}`,
          compact && "tw:flex tw:items-center tw:justify-center tw:gap-2 tw:px-4 tw:text-[12px]",
          // Quota pressure paints in StorageQuotaBar's band (boards 145:199 /
          // 145:250) — repeating it here doubled the message. The strip only
          // surfaces for a drag-over or a rejection flash.
          compact && (isDragOver || rejectedReason
            ? "tw:h-9 tw:border tw:border-dashed tw:border-[var(--bk-gray-300)] tw:text-[var(--bk-ink-soft)]"
            : "tw:h-0 tw:overflow-hidden tw:border-0 tw:p-0"),
        ].filter(Boolean).join(" ")}
        data-testid="media-upload-zone"
        onClick={() => !isFull && !disabled && !rejectedReason && inputRef.current?.click()}
        onDragOver={(e) => { e.preventDefault(); setIsDragOver(true); }}
        onDragLeave={() => setIsDragOver(false)}
        onDrop={handleDrop}
        role="button"
        tabIndex={compact ? -1 : 0}
        aria-hidden={compact && !isDragOver && !rejectedReason}
        aria-label={label}
        aria-live={rejectedReason ? "assertive" : "polite"}
        onKeyDown={(e) => { if (e.key === "Enter" || e.key === " ") { e.preventDefault(); inputRef.current?.click(); } }}
      >
        <Icon size={compact ? 14 : 20} className="med-upload-zone-icon" />
        <span className="med-upload-zone__label">{label}</span>
        <TextInput
          ref={inputRef}
          type="file"
          multiple
          accept={ACCEPT_TYPES}
          style={{ display: "none" }}
          onChange={(e) => handleFiles(e.target.files)}
        />
      </div>
      <StorageQuotaBar used={storage.used} total={storage.total} onOptimize={onOptimize} compact={compact} />
      {/*
        Board `145:143` — one 44h row per upload in flight: name, mono percent,
        and a 4px accent track. Mono because the number changes several times a
        second and proportional digits make the row twitch while it counts.
      */}
      {activeItems.length > 0 && (
        <ul className="tw:m-0 tw:list-none tw:p-0" role="list" aria-label="Uploads in progress" data-testid="media-upload-progress">
          {activeItems.map((item) => (
            <li key={item.fileName} className="tw:flex tw:h-11 tw:flex-col tw:justify-center tw:gap-1.5 tw:px-4">
              <span className="tw:flex tw:items-baseline tw:gap-2">
                <span className="tw:min-w-0 tw:flex-1 tw:truncate tw:text-[12px] tw:leading-[18px] tw:text-[var(--bk-ink)]">
                  {item.fileName}
                </span>
                <span className="tw:[font-family:var(--bk-font-mono)] tw:text-[11px] tw:font-medium tw:leading-4 tw:tabular-nums tw:text-[var(--bk-ink-muted)]">
                  {Math.round(item.progress)}%
                </span>
              </span>
              <span
                className="tw:h-1 tw:w-full tw:overflow-hidden tw:rounded-[2px] tw:bg-[var(--bk-gray-100)]"
                role="progressbar"
                aria-label={`Uploading ${item.fileName}`}
                aria-valuenow={Math.round(item.progress)}
                aria-valuemin={0}
                aria-valuemax={100}
              >
                <span
                  className="tw:block tw:h-full tw:rounded-[2px] tw:bg-[var(--bk-accent)]"
                  style={{ width: `${Math.min(100, Math.max(0, item.progress))}%` }}
                />
              </span>
            </li>
          ))}
        </ul>
      )}

      {/*
        T9 — board `145:195`. A 44h row on warning-tint, filename over the
        reason, Retry on the right. It is NOT a toast: an upload that failed is
        still failed thirty seconds later, and the board draws it persisting
        above the footer with the actual limit named ("file is 24 MB, limit is
        10 MB"), because "Upload failed" alone tells the user nothing they can
        act on. Restyled, not rebuilt — this list, its retry handler and its
        `aria-label` predate the redesign.
      */}
      {failedItems.length > 0 && (
        <ul
          className="med-upload-queue-errors tw:m-0 tw:list-none tw:p-0"
          role="list"
          aria-label="Failed uploads"
          data-testid="upload-queue-errors"
        >
          {failedItems.map((item) => (
            <li
              key={item.fileName}
              className="med-upload-queue-item med-upload-queue-item--error tw:flex tw:min-h-11 tw:items-center tw:gap-2 tw:bg-yellow-50 tw:px-4 tw:py-1.5"
              data-testid="media-upload-error-row"
            >
              <span className="tw:flex tw:min-w-0 tw:flex-1 tw:flex-col">
                <span className="med-upload-queue-item__name tw:truncate tw:text-[12px] tw:leading-[18px] tw:text-[var(--bk-ink)]">
                  {item.fileName}
                </span>
                <span className="med-upload-queue-item__reason tw:truncate tw:text-[11px] tw:leading-4 tw:text-amber-800">
                  {item.error ?? "Upload failed"}
                </span>
              </span>
              {onRetryUpload ? (
                <Button
                  type="button"
                  color="light"
                  size="xs"
                  variant="link" className="med-upload-queue-item__retry tw:shrink-0 tw:text-[12px]"
                  onClick={() => onRetryUpload(item.fileName)}
                  aria-label={`Retry ${item.fileName}`}
                >
                  {/* Board 145:148 draws "Retry" as bare accent text. The
                      glyph that used to sit here also rendered flush against
                      the word — flowbite puts children in one span with no
                      gap — so it read as "↻Retry". */}
                  Retry
                </Button>
              ) : null}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
