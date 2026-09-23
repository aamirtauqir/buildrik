/**
 * Media Tab — Upload Zone
 *
 * Phase D state machine: idle / drag / near-limit (>=80% used) / full.
 *
 * The zone no longer refuses files on its own. It used to flash
 * `"x" exceeds 50MB limit` for four seconds and drop the whole batch — 50 MB
 * was a number the engine never had (10 MB per image, 1 per SVG, 100 per
 * video, 5 per font), so a 20 MB JPG passed here and was refused there, while
 * a 60 MB MP4 the engine would take was blocked here; and the flash was gone
 * before anyone could act on it. `validateFile` in the engine is the one
 * gate, and its refusal is the persistent row below with the real numbers
 * (Clone 3584:45522).
 *
 * @license BSD-3-Clause
 */

import * as React from "react";
import { Upload, AlertTriangle } from "lucide-react";
import type { FailedUpload, UploadZoneProps } from "../data/mediaTypes";
import { StorageQuotaBar } from "./StorageQuotaBar";
import { Button, TextInput } from "@/editor/chrome-ui";
const ACCEPT_TYPES = "image/*,video/*,.ttf,.otf,.woff,.woff2,.svg";

export function UploadZone({
  storage,
  onUpload,
  disabled = false,
  viewOnlyReason,
  uploadQueue,
  failedUploads,
  onRetryUpload,
  onReplacementPicked,
  onOptimize,
  inputRef: externalInputRef,
  compact = false,
}: UploadZoneProps) {
  // The drawer footer's "Upload" link opens THIS input (board 144:46). A second
  // input would mean a second accept-list to keep in step, so the caller
  // borrows the one that already exists.
  const localInputRef = React.useRef<HTMLInputElement>(null);
  const inputRef = externalInputRef ?? localInputRef;
  /* Clone 3584:45522 → 3585:23326: `Choose a smaller file…` picks ONE
     replacement for one refused file. Its own input (single, same accept
     list, same file) so the multi-file picker above never has to change
     shape under a click. */
  const replacementRef = React.useRef<HTMLInputElement>(null);
  const replacingRef = React.useRef<FailedUpload | null>(null);
  const [isDragOver, setIsDragOver] = React.useState(false);

  const isFull = storage.used >= storage.total;
  const usedPercent = storage.total > 0 ? (storage.used / storage.total) * 100 : 0;
  const isNearLimit = !isFull && usedPercent >= 80;
  /* A viewer's zone takes nothing — not a click, not a drop (audit G3-064). */
  const viewOnly = Boolean(viewOnlyReason);
  const inert = disabled || isFull || viewOnly;

  const handleFiles = (files: FileList | null) => {
    if (!files?.length || inert) return;
    onUpload(Array.from(files));
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(false);
    if (!inert) handleFiles(e.dataTransfer.files);
  };

  const chooseReplacement = (original: FailedUpload) => {
    replacingRef.current = original;
    replacementRef.current?.click();
  };

  const handleReplacementChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    const original = replacingRef.current;
    replacingRef.current = null;
    e.target.value = "";
    if (file && original) onReplacementPicked?.(original, file);
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

  // Visual state priority: view-only > full > uploading > near-limit > drag > idle.
  const stateClass = viewOnly || isFull
    ? "med-upload-zone--disabled"
    : hasActiveUploads
      ? "med-upload-zone--uploading"
      : isNearLimit
        ? "med-upload-zone--near-limit"
        : isDragOver
          ? "med-upload-zone--drag-active"
          : "";

  const Icon = isNearLimit ? AlertTriangle : Upload;

  const label = viewOnly
    ? (viewOnlyReason as string)
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
        input, the drag target and the accept-list. So in compact mode it
        collapses to nothing at rest and only paints while a drag is over it, or
        when it has something to say (storage full). Hiding it outright would
        have deleted drag-and-drop to match a static frame.
      */}
      <div
        className={[
          `med-upload-zone${stateClass ? ` ${stateClass}` : ""}`,
          compact && "tw:flex tw:items-center tw:justify-center tw:gap-2 tw:px-4 tw:text-[12px]",
          // Quota pressure paints in StorageQuotaBar's band (boards 145:199 /
          // 145:250) — repeating it here doubled the message. The strip only
          // surfaces for a drag-over.
          compact && (isDragOver
            ? "tw:h-9 tw:border tw:border-dashed tw:border-[var(--bk-gray-300)] tw:text-[var(--bk-ink-soft)]"
            : "tw:h-0 tw:overflow-hidden tw:border-0 tw:p-0"),
        ].filter(Boolean).join(" ")}
        data-testid="media-upload-zone"
        onClick={() => !inert && inputRef.current?.click()}
        onDragOver={(e) => { e.preventDefault(); if (!viewOnly) setIsDragOver(true); }}
        onDragLeave={() => setIsDragOver(false)}
        onDrop={handleDrop}
        role="button"
        tabIndex={compact ? -1 : 0}
        aria-hidden={compact && !isDragOver}
        aria-disabled={viewOnly || undefined}
        aria-label={label}
        aria-live="polite"
        onKeyDown={(e) => { if (e.key === "Enter" || e.key === " ") { e.preventDefault(); if (!inert) inputRef.current?.click(); } }}
      >
        <Icon size={compact ? 14 : 20} className="med-upload-zone-icon" />
        <span className="med-upload-zone__label">{label}</span>
        <TextInput
          ref={inputRef}
          type="file"
          multiple
          accept={ACCEPT_TYPES}
          className="tw:hidden"
          data-testid="media-upload-input"
          onChange={(e) => handleFiles(e.target.files)}
        />
        <TextInput
          ref={replacementRef}
          type="file"
          accept={ACCEPT_TYPES}
          className="tw:hidden"
          data-testid="media-replacement-input"
          onChange={handleReplacementChange}
        />
      </div>
      <StorageQuotaBar used={storage.used} total={storage.total} onOptimize={onOptimize} compact={compact} />
      {/*
        Clone 3584:45876 (re-draws board 145:143) — one 44h row per upload in
        flight: name, mono percent, and a 4px accent track. Mono because the
        number changes several times a second and proportional digits make the
        row twitch while it counts. The board's ✕ on this row is not drawn:
        the upload pipeline has no cancel, and a ✕ that only hid the row while
        the file still landed would say the opposite of what it does.
      */}
      {activeItems.length > 0 && (
        <ul className="tw:m-0 tw:list-none tw:p-0" role="list" aria-label="Uploads in progress" data-testid="media-upload-progress">
          {activeItems.map((item, i) => (
            <li key={item.fileName} className="tw:flex tw:h-11 tw:flex-col tw:justify-center tw:gap-1.5 tw:px-4" data-testid={`media-upload-row-${i}`}>
              <span className="tw:flex tw:items-baseline tw:gap-2">
                <span className="tw:min-w-0 tw:flex-1 tw:truncate tw:text-[12px] tw:leading-[18px] tw:text-[var(--bk-ink)]" data-testid={`media-upload-name-${i}`}>
                  {item.fileName}
                </span>
                <span className="tw:[font-family:var(--bk-font-mono)] tw:text-[11px] tw:font-medium tw:leading-4 tw:tabular-nums tw:text-[var(--bk-ink-muted)]" data-testid={`media-upload-pct-${i}`}>
                  {Math.round(item.progress)}%
                </span>
              </span>
              <span
                className="tw:h-1 tw:w-full tw:overflow-hidden tw:rounded-[2px] tw:bg-[var(--bk-gray-100)]"
                data-testid={`media-upload-track-${i}`}
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
        Clone 3584:45522 (re-draws board 145:195). A warning-tint band above
        the footer: filename, the engine's reason in full (it wraps — the
        numbers are the point), and the way out under it. It is NOT a toast:
        an upload that failed is still failed thirty seconds later.

        The way out depends on WHY. The size gate's record carries the limit,
        and its door is `Choose a smaller file…` — a replacement picker; the
        V1 board's Retry stays for every other failure (a retry of a 62 MB
        file against a 10 MB limit could only fail the same way).
      */}
      {failedItems.length > 0 && (
        <ul
          className="med-upload-queue-errors tw:m-0 tw:list-none tw:p-0"
          role="list"
          aria-label="Failed uploads"
          data-testid="upload-queue-errors"
        >
          {failedItems.map((item) => {
            const record = failedUploads?.find((f) => f.fileName === item.fileName);
            const sizeGate = record?.limit !== undefined && onReplacementPicked ? record : null;
            return (
              <li
                key={item.fileName}
                /* Clone 3584:45522 — a COLUMN: name over the reason over the
                   door, all flush left. The legacy `.med-upload-queue-item` row
                   rules (flex row, centred, 40% name, one-line reason) beat
                   these utilities on source order and centred the name while
                   the reason ran off the band (measured live 2026-09-13), so
                   the error row no longer carries them. */
                className="med-upload-queue-item--error tw:flex tw:flex-col tw:items-start tw:gap-1 tw:bg-[var(--bk-warning-tint)] tw:px-4 tw:py-3"
                data-testid="media-upload-error-row"
              >
                <span className="tw:w-full tw:truncate tw:text-[12px] tw:leading-[18px] tw:text-[var(--bk-ink)]" data-testid="media-upload-error-name">
                  {item.fileName}
                </span>
                {/* Board 145:197 — --color/warning-text, the token this system
                    already ships as `--bk-warning-text`. */}
                <span className="tw:w-full tw:text-[11px] tw:leading-4 tw:text-[var(--bk-warning-text)]" data-testid="media-upload-error-reason">
                  {item.error ?? "Upload failed"}
                </span>
                {sizeGate ? (
                  <Button
                    type="button"
                    color="light"
                    size="xs"
                    variant="link"
                    className="tw:mt-1 tw:min-h-6 tw:self-start tw:pl-3.5 tw:text-[13px] tw:leading-5 tw:font-normal tw:text-[var(--bk-ink)]"
                    data-testid="media-upload-error-replace"
                    onClick={() => chooseReplacement(sizeGate)}
                    aria-label={`Choose a smaller file to replace ${item.fileName}`}
                  >
                    Choose a smaller file…
                  </Button>
                ) : onRetryUpload ? (
                  <Button
                    type="button"
                    color="light"
                    size="xs"
                    variant="link"
                    className="tw:mt-1 tw:min-h-6 tw:self-start tw:pl-3.5 tw:text-[12px] tw:leading-[18px] tw:text-[var(--bk-accent-text)]"
                    data-testid="media-upload-error-retry"
                    onClick={() => onRetryUpload(item.fileName)}
                    aria-label={`Retry ${item.fileName}`}
                  >
                    {/* Board 145:148 draws "Retry" as bare accent text. */}
                    Retry
                  </Button>
                ) : null}
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}
