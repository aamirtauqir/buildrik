/**
 * Media Tab — Upload Zone + Storage Bar
 * Visible in My Library view only.
 * @license BSD-3-Clause
 */

import * as React from "react";
import { useRef } from "react";
import type { UploadZoneProps } from "./mediaTypes";
import { fmtSize } from "./mediaUtils";

export function UploadZone({ storage, onUpload, uploadQueue }: UploadZoneProps) {
  const inputRef = useRef<HTMLInputElement>(null);
  const usedPct = Math.min(100, (storage.used / storage.total) * 100);
  const usedLabel = fmtSize(storage.used);
  const totalLabel = fmtSize(storage.total);

  const handleFiles = (files: FileList | null) => {
    if (!files?.length) return;
    onUpload(Array.from(files));
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    handleFiles(e.dataTransfer.files);
  };

  return (
    <div className="med-upload-zone">
      {/* Upload button */}
      <button
        className="med-upload-btn"
        onClick={() => inputRef.current?.click()}
        onDragOver={(e) => e.preventDefault()}
        onDrop={handleDrop}
        aria-label="Upload files"
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
        className="med-storage-bar"
        role="meter"
        aria-valuenow={usedPct}
        aria-valuemin={0}
        aria-valuemax={100}
      >
        <div className="med-storage-track">
          <div className="med-storage-fill" style={{ width: `${usedPct}%` }} />
        </div>
        <span className="med-storage-label">
          {usedLabel} / {totalLabel}
        </span>
      </div>
    </div>
  );
}
