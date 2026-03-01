/**
 * Media Tab — Onboarding Empty State
 * Shown when the library is empty. Upload CTA + browse stock.
 * @license BSD-3-Clause
 */

import * as React from "react";
import { useRef } from "react";
import { EMPTY_MSGS } from "../data/mediaData";
import type { MediaTypeFilter } from "../data/mediaTypes";

interface OnboardingEmptyStateProps {
  activeType: MediaTypeFilter;
  onUpload(files: File[]): void;
  onDiscovery(): void;
}

export function OnboardingEmptyState({
  activeType,
  onUpload,
  onDiscovery,
}: OnboardingEmptyStateProps) {
  const inputRef = useRef<HTMLInputElement>(null);
  const msg = EMPTY_MSGS[activeType];

  const handleFiles = (files: FileList | null) => {
    if (files?.length) onUpload(Array.from(files));
  };

  return (
    <div className="med-onboarding-empty">
      <div className="med-empty-icon" aria-hidden="true">
        🖼
      </div>
      <h3 className="med-empty-title">{msg.title}</h3>
      <p className="med-empty-sub">{msg.sub}</p>

      <button
        className="med-upload-btn med-empty-upload"
        onClick={() => inputRef.current?.click()}
        aria-label="Upload files"
      >
        Upload files
      </button>

      <input
        ref={inputRef}
        type="file"
        multiple
        accept="image/*,video/*,.ttf,.otf,.woff,.woff2,.svg"
        style={{ display: "none" }}
        onChange={(e) => handleFiles(e.target.files)}
      />

      {activeType === "all" && (
        <button
          className="med-disc-cta"
          onClick={onDiscovery}
          aria-label="Browse free stock photos"
        >
          Browse free stock photos →
        </button>
      )}
    </div>
  );
}
