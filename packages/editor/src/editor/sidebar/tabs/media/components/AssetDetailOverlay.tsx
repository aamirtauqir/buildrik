import { Input } from "@/editor/shared/vibcoder/Input";
import { Button } from "@/shared/ui/Button";
/**
 * Media Tab — Asset Detail Overlay (vSrqD spec)
 * Back nav row h=30 + preview h=140 + metadata + actions.
 * COb2m error: image-off icon + "Preview metadata unavailable" + retry.
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
  onPrev?: () => void;
  onNext?: () => void;
}

export function AssetDetailOverlay({
  item,
  onInsert,
  onRename,
  onDelete,
  onClose,
  onPrev,
  onNext,
}: AssetDetailOverlayProps) {
  const [name, setName] = useState(item.name);
  const [inserted, setInserted] = useState(false);
  const [metaError, setMetaError] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  const overlayRef = useRef<HTMLDivElement>(null);
  const mountedRef = useRef(true);
  const insertTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

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
    const firstFocusable = el.querySelector<HTMLElement>("button, input, [tabindex]:not([tabindex='-1'])");
    firstFocusable?.focus();

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") { e.preventDefault(); onClose(); return; }
      if (e.key !== "Tab") return;
      const focusable = Array.from(el.querySelectorAll<HTMLElement>("button:not([disabled]), input:not([disabled]), [tabindex]:not([tabindex='-1'])"));
      if (!focusable.length) return;
      const first = focusable[0];
      const last = focusable[focusable.length - 1];
      if (e.shiftKey && document.activeElement === first) { e.preventDefault(); last.focus(); }
      else if (!e.shiftKey && document.activeElement === last) { e.preventDefault(); first.focus(); }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [onClose]);

  useEffect(() => {
    setName(item.name);
    setInserted(false);
    setMetaError(false);
  }, [item.key, item.name]);

  const commitRename = useCallback(() => {
    const trimmed = name.trim();
    if (trimmed && trimmed !== item.name) onRename(item.key, trimmed);
  }, [item.key, item.name, name, onRename]);

  const handleInsert = useCallback(() => {
    onInsert(item.key);
    setInserted(true);
    if (insertTimerRef.current) clearTimeout(insertTimerRef.current);
    insertTimerRef.current = setTimeout(() => {
      if (mountedRef.current) { setInserted(false); onClose(); }
    }, 800);
  }, [item.key, onInsert, onClose]);

  return (
    <div ref={overlayRef} className="med-detail-overlay" role="dialog" aria-modal="true" aria-label={item.name}>
      {/* Back nav row (vSrqD) — h=30, padding [8,10] */}
      <div className="med-detail-nav">
        <Button className="med-detail-back" onClick={onClose} aria-label="Back to media grid">
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M19 12H5M12 19l-7-7 7-7" />
          </svg>
          Back to media grid
        </Button>
        <span className="med-strip-spacer" />
        {onPrev && <Button className="med-detail-navbtn" onClick={onPrev}>Prev</Button>}
        {onNext && <Button className="med-detail-navbtn" onClick={onNext}>Next</Button>}
      </div>
      {metaError ? (
        /* COb2m — Metadata error state */
        (<div className="med-detail-error-body">
          <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="var(--bd-fg-secondary, var(--bd-fg-muted))" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
            <rect x="3" y="3" width="18" height="18" rx="2" />
            <line x1="9" y1="9" x2="15" y2="15" />
            <line x1="15" y1="9" x2="9" y2="15" />
          </svg>
          <p className="med-detail-error-title">Preview metadata unavailable</p>
          <p className="med-detail-error-sub">The file may have been moved or deleted.</p>
          <Button
            className="med-detail-retry"
            onClick={() => setMetaError(false)}
          >
            Retry
          </Button>
        </div>)
      ) : (
        <>
          {/* Preview — h=140, fill var(--bd-bg-card), cornerRadius 4 */}
          <div className="med-detail-preview">
            {item.type === "vid" ? (
              <video src={item.src} controls style={{ maxWidth: "100%", maxHeight: "100%" }} onError={() => setMetaError(true)} />
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
                onError={() => setMetaError(true)}
              />
            )}
          </div>

          {/* Metadata — gap 8, padding [10,12] */}
          <div className="med-detail-meta-section">
            <Input
              ref={inputRef}
              className="med-detail-name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              onBlur={commitRename}
              onKeyDown={(e) => {
                if (e.key === "Enter") commitRename();
                if (e.key === "Escape") { setName(item.name); onClose(); }
              }}
              aria-label="File name"
            />
            <div className="med-detail-meta">
              <div className="med-detail-row">
                <span className="med-detail-key">Size</span>
                <span className="med-detail-val">{fmtSize(item.size)}</span>
              </div>
              {item.width != null && item.height != null && (
                <div className="med-detail-row">
                  <span className="med-detail-key">Dimensions</span>
                  <span className="med-detail-val">{item.width} × {item.height}</span>
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

          {/* Action buttons row — padding [4,12,12,12], gap 6 */}
          <div className="med-detail-actions">
            <Button
              className="med-detail-action-btn med-detail-action-btn--primary"
              onClick={handleInsert}
              disabled={inserted}
            >
              {inserted ? "Added ✓" : "Add to page"}
            </Button>
            <Button
              className="med-detail-action-btn med-detail-action-btn--danger"
              onClick={() => onDelete(item.key)}
            >
              Delete
            </Button>
          </div>
        </>
      )}
    </div>
  );
}
