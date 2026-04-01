/**
 * Media Tab — Asset Detail Overlay
 * Full preview with metadata, inline rename, and insert action.
 * @license BSD-3-Clause
 */

import * as React from "react";
import { useCallback, useEffect, useRef, useState } from "react";
import type { LibraryItem } from "../data/mediaTypes";
import { fmtDur, fmtSize } from "../data/mediaUtils";

interface AssetDetailOverlayProps {
  item: LibraryItem;
  onInsert(key: string): void;
  onRename(key: string, name: string): Promise<void>;
  onDelete(key: string): void;
  onClose(): void;
}

export function AssetDetailOverlay({
  item,
  onInsert,
  onRename,
  onDelete,
  onClose,
}: AssetDetailOverlayProps) {
  const [name, setName] = useState(item.name);
  const [inserted, setInserted] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  const overlayRef = useRef<HTMLDivElement>(null);
  const mountedRef = useRef(true);
  const insertTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Track mount state; clear pending timer on unmount
  useEffect(() => {
    mountedRef.current = true;
    return () => {
      mountedRef.current = false;
      if (insertTimerRef.current) clearTimeout(insertTimerRef.current);
    };
  }, []);

  useEffect(() => {
    const el = overlayRef.current;
    if (!el) return;

    // Move focus into overlay
    const firstFocusable = el.querySelector<HTMLElement>(
      "button, input, [tabindex]:not([tabindex='-1'])"
    );
    firstFocusable?.focus();

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        e.preventDefault();
        onClose();
        return;
      }
      if (e.key !== "Tab") return;

      // Trap focus within overlay
      const focusable = Array.from(
        el.querySelectorAll<HTMLElement>(
          "button:not([disabled]), input:not([disabled]), [tabindex]:not([tabindex='-1'])"
        )
      );
      if (focusable.length === 0) return;
      const first = focusable[0];
      const last = focusable[focusable.length - 1];
      if (e.shiftKey && document.activeElement === first) {
        e.preventDefault();
        last.focus();
      } else if (!e.shiftKey && document.activeElement === last) {
        e.preventDefault();
        first.focus();
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [onClose]);

  // Reset when item changes
  useEffect(() => {
    setName(item.name);
    setInserted(false);
  }, [item.key, item.name]);

  const commitRename = useCallback(() => {
    const trimmed = name.trim();
    if (trimmed && trimmed !== item.name) {
      onRename(item.key, trimmed);
    }
  }, [item.key, item.name, name, onRename]);

  const handleInsert = useCallback(() => {
    onInsert(item.key);
    setInserted(true);
    if (insertTimerRef.current) clearTimeout(insertTimerRef.current);
    insertTimerRef.current = setTimeout(() => {
      if (mountedRef.current) {
        setInserted(false);
        onClose();
      }
    }, 800);
  }, [item.key, onInsert, onClose]);

  return (
    <div
      ref={overlayRef}
      className="med-detail-overlay"
      role="dialog"
      aria-modal="true"
      aria-label={item.name}
    >
      {/* Back button */}
      <button className="med-detail-back" onClick={onClose} aria-label="Back">
        ← Back
      </button>

      {/* Preview */}
      <div className="med-detail-preview">
        {item.type === "vid" ? (
          <video src={item.src} controls style={{ maxWidth: "100%", maxHeight: "100%" }} />
        ) : item.type === "fnt" ? (
          <div className="med-font-specimen" style={{ fontFamily: `"${item.name}", serif` }}>
            <div className="med-font-specimen-lg">Aa Bb Cc</div>
            <div className="med-font-specimen-sm">The quick brown fox</div>
          </div>
        ) : (
          <img
            src={item.thumb ?? item.src}
            alt={item.name}
            style={{ maxWidth: "100%", maxHeight: "100%", objectFit: "contain" }}
          />
        )}
      </div>

      {/* Metadata body */}
      <div className="med-detail-body">
        {/* Editable name */}
        <div className="med-detail-name-row">
          <input
            ref={inputRef}
            className="med-detail-name"
            value={name}
            onChange={(e) => setName(e.target.value)}
            onBlur={commitRename}
            onKeyDown={(e) => {
              if (e.key === "Enter") commitRename();
              if (e.key === "Escape") {
                setName(item.name);
                onClose(); // Close the entire overlay on Escape
              }
            }}
            aria-label="File name"
          />
        </div>

        {/* Meta rows */}
        <div className="med-detail-meta">
          <div className="med-detail-row">
            <span className="med-detail-key">Size</span>
            <span className="med-detail-val">{fmtSize(item.size)}</span>
          </div>
          {item.width != null && item.height != null && (
            <div className="med-detail-row">
              <span className="med-detail-key">Dimensions</span>
              <span className="med-detail-val">
                {item.width} × {item.height}
              </span>
            </div>
          )}
          {item.duration != null && (
            <div className="med-detail-row">
              <span className="med-detail-key">Duration</span>
              <span className="med-detail-val">{fmtDur(item.duration as number)}</span>
            </div>
          )}
          <div className="med-detail-row">
            <span className="med-detail-key">Type</span>
            <span className="med-detail-val">{item.mimeType}</span>
          </div>
          <div className="med-detail-row">
            <span className="med-detail-key">Added</span>
            <span className="med-detail-val">{new Date(item.createdAt).toLocaleDateString()}</span>
          </div>
        </div>
      </div>

      {/* Footer actions */}
      <div className="med-detail-actions">
        <button
          className="med-upload-btn"
          style={{ flex: 1, height: 32 }}
          onClick={handleInsert}
          disabled={inserted}
          aria-label="Add to page"
        >
          {inserted ? "Added ✓" : "Add to page ↗"}
        </button>
        <button
          className="med-bulk-btn danger"
          style={{ height: 32 }}
          onClick={() => {
            onDelete(item.key);
          }}
          aria-label="Delete file"
        >
          Delete
        </button>
      </div>
    </div>
  );
}
