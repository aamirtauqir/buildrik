/**
 * Media Tab — Upload Zone
 *
 * Phase D state machine: idle / drag / near-limit (>=80% used) /
 * full / rejected (file-type / size violation).
 *
 * @license BSD-3-Clause
 */

import * as React from "react";
import { Upload, AlertTriangle, XCircle, RotateCcw } from "lucide-react";
import type { UploadZoneProps } from "../data/mediaTypes";
import { StorageQuotaBar } from "./StorageQuotaBar";
import { Button, TextInput } from "flowbite-react";
import { BK_TEXT_INPUT_THEME } from "@/editor/chrome-ui/textInputTheme";

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
}: UploadZoneProps) {
  const inputRef = React.useRef<HTMLInputElement>(null);
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
    <div className="med-upload-zone-wrap">
      <div
        className={`med-upload-zone${stateClass ? ` ${stateClass}` : ""}`}
        onClick={() => !isFull && !disabled && !rejectedReason && inputRef.current?.click()}
        onDragOver={(e) => { e.preventDefault(); setIsDragOver(true); }}
        onDragLeave={() => setIsDragOver(false)}
        onDrop={handleDrop}
        role="button"
        tabIndex={0}
        aria-label={label}
        aria-live={rejectedReason ? "assertive" : "polite"}
        onKeyDown={(e) => { if (e.key === "Enter" || e.key === " ") { e.preventDefault(); inputRef.current?.click(); } }}
      >
        <Icon size={20} className="med-upload-zone-icon" />
        <span className="med-upload-zone__label">{label}</span>
        <TextInput theme={BK_TEXT_INPUT_THEME}
          ref={inputRef}
          type="file"
          multiple
          accept={ACCEPT_TYPES}
          style={{ display: "none" }}
          onChange={(e) => handleFiles(e.target.files)}
        />
      </div>
      <StorageQuotaBar used={storage.used} total={storage.total} />
      {failedItems.length > 0 && (
        <ul
          className="med-upload-queue-errors"
          role="list"
          aria-label="Failed uploads"
          data-testid="upload-queue-errors"
        >
          {failedItems.map((item) => (
            <li
              key={item.fileName}
              className="med-upload-queue-item med-upload-queue-item--error"
            >
              <XCircle size={14} aria-hidden />
              <span className="med-upload-queue-item__name">{item.fileName}</span>
              <span className="med-upload-queue-item__reason">
                {item.error ?? "Upload failed"}
              </span>
              {onRetryUpload ? (
                <Button
                  type="button"
                  color="light"
                  size="xs"
                  className="med-upload-queue-item__retry tw:border-transparent tw:bg-transparent tw:text-gray-600 tw:hover:text-gray-900"
                  onClick={() => onRetryUpload(item.fileName)}
                  aria-label={`Retry ${item.fileName}`}
                >
                  <RotateCcw size={12} aria-hidden />
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
