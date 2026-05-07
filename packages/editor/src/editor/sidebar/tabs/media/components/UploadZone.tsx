import { Input } from "@/editor/shared/vibcoder/Input";
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

const ACCEPT_TYPES = "image/*,video/*,.ttf,.otf,.woff,.woff2,.svg";
const MAX_FILE_BYTES = 50 * 1024 * 1024; // 50MB hard ceiling at the UI layer

function isAccepted(file: File): boolean {
  if (file.type.startsWith("image/")) return true;
  if (file.type.startsWith("video/")) return true;
  if (file.type.startsWith("font/")) return true;
  if (/\.(ttf|otf|woff2?|svg)$/i.test(file.name)) return true;
  return false;
}

export function UploadZone({ storage, onUpload, disabled = false }: UploadZoneProps) {
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

  // Visual state takes priority: rejected > full > near-limit > drag > idle.
  const stateClass = rejectedReason
    ? "med-upload-zone--rejected"
    : isFull
      ? "med-upload-zone--disabled"
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
      {isNearLimit && !rejectedReason && (
        <span style={{ fontSize: 10, color: "var(--bd-warn, #D97706)", marginTop: 2 }}>
          {Math.round((storage.total - storage.used) / 1024 / 1024)}MB left
        </span>
      )}
      <Input
        ref={inputRef}
        type="file"
        multiple
        accept={ACCEPT_TYPES}
        style={{ display: "none" }}
        onChange={(e) => handleFiles(e.target.files)}
      />
    </div>
  );
}
