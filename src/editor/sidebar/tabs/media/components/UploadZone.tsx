/**
 * Media Tab — Upload Zone + Storage Bar
 * Visible in My Library view only.
 * Storage thresholds: <80% green, ≥80% yellow, 100% red + disabled.
 * @license BSD-3-Clause
 */

import * as React from "react";
import { useRef } from "react";
import type { UploadZoneProps } from "../data/mediaTypes";
import { fmtSize } from "../data/mediaUtils";

export function UploadZone({ storage, onUpload, uploadQueue, disabled = false }: UploadZoneProps) {
  const inputRef = useRef<HTMLInputElement>(null);
  const pct = Math.min(100, (storage.used / storage.total) * 100);
  const isFull = storage.used >= storage.total;
  const isNearFull = pct >= 80;
  const remaining = storage.total - storage.used;

  const handleFiles = (files: FileList | null) => {
    if (!files?.length || disabled || isFull) return;
    onUpload(Array.from(files));
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    if (!isFull) handleFiles(e.dataTransfer.files);
  };

  const storageClass = isFull
    ? "med-storage-bar--full"
    : isNearFull
      ? "med-storage-bar--near-full"
      : "";

  const storageLabel = isFull
    ? "Storage full — delete files to free space"
    : isNearFull
      ? `Almost full — ${fmtSize(remaining)} remaining`
      : `${fmtSize(storage.used)} / ${fmtSize(storage.total)}`;

  return (
    <div className="med-upload-zone">
      {/* Upload button */}
      <button
        className="med-upload-btn"
        onClick={() => !isFull && inputRef.current?.click()}
        onDragOver={(e) => e.preventDefault()}
        onDrop={handleDrop}
        disabled={isFull || disabled}
        aria-disabled={isFull || disabled}
        aria-label={isFull ? "Storage full" : "Upload files"}
      >
        <svg
          width="13"
          height="13"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          aria-hidden="true"
        >
          <path d="M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4" />
          <polyline points="17 8 12 3 7 8" />
          <line x1="12" y1="3" x2="12" y2="15" />
        </svg>
        {uploadQueue.length > 0
          ? `Uploading ${uploadQueue.length} file${uploadQueue.length > 1 ? "s" : ""}…`
          : isFull
            ? "Storage full"
            : "Upload files"}
      </button>

      {/* Hidden file input */}
      <input
        ref={inputRef}
        type="file"
        multiple
        accept="image/*,video/*,.ttf,.otf,.woff,.woff2,.svg"
        style={{ display: "none" }}
        onChange={(e) => handleFiles(e.target.files)}
      />

      {/* Storage bar */}
      <div
        className={`med-storage-bar ${storageClass}`}
        role="meter"
        aria-valuenow={pct}
        aria-valuemin={0}
        aria-valuemax={100}
        aria-label="Storage usage"
      >
        <div className="med-storage-track">
          <div className="med-storage-fill" style={{ width: `${pct}%` }} />
        </div>
        <span className="med-storage-label">
          {storageLabel}
          <span style={{ opacity: 0.6, marginLeft: 4 }}>(Free plan)</span>
        </span>
        {isNearFull && !isFull && (
          <a
            href="#upgrade"
            onClick={(e) => e.preventDefault()}
            style={{
              fontSize: 12,
              color: "var(--aqb-primary, #3b82f6)",
              textDecoration: "none",
              marginLeft: 6,
              flexShrink: 0,
            }}
            aria-label="Upgrade storage plan"
          >
            Upgrade
          </a>
        )}
      </div>
    </div>
  );
}
