/**
 * AssetDetailOverlay — §15 prototype-v3 5-tab drawer.
 *
 * Tabs: Preview · Where used · Versions · Edit · Optimize.
 * - Preview: file thumb + name input + metadata rows (Size/Dimensions/Type/Added)
 * - Where used: pages/elements that reference this asset's src (composer.elements.findByMediaSrc)
 * - Versions: sibling LibraryItems sharing the same base-name (strips _v{tag}/_opt_v{tag})
 * - Edit: invokes onEditImage callback (opens ImageEditorModal)
 * - Optimize: embeds <OptimizationPanel> inline — folds in §18 from standalone modal
 *
 * Action footer: Add to page · Delete.
 *
 * @license BSD-3-Clause
 */

import * as React from "react";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { Input } from "@/editor/shared/vibcoder/Input";
import { Button } from "@/editor/shared/vibcoder/Button";
import { OptimizationPanel } from "@/editor/media/OptimizationPanel";
import type { LibraryItem } from "../data/mediaTypes";
import { fmtDur, fmtSize } from "../data/mediaUtils";
import type { Composer } from "../../../../../engine/Composer";

type Tab = "preview" | "used" | "versions" | "edit" | "optimize";

interface AssetDetailOverlayProps {
  item: LibraryItem;
  onInsert(key: string): void;
  onRename(key: string, name: string): Promise<void>;
  onUpdate?(key: string, updates: Partial<LibraryItem>): Promise<void>;
  onDelete(key: string): void;
  onClose(): void;
  onPrev?: () => void;
  onNext?: () => void;
  onEditImage?(item: LibraryItem): void | Promise<void>;
  /** §15 — composer for Where-used + Versions tabs (composer.elements.findByMediaSrc). */
  composer?: Composer;
  /** §15 — current library items, used to derive Versions tab list by base-name match. */
  libraryItems?: ReadonlyArray<LibraryItem>;
  /** §15 — switch detail to a sibling item (clicked from Versions tab). */
  onOpenItem?: (item: LibraryItem) => void;
  /** §18 — uploads optimized output as a new version (mirrors handleEditImage upload pattern). */
  onOptimized?: (optimizedSrc: string) => void | Promise<void>;
  /** §15 footer Replace — opens file picker, then triggers replace-across flow on the parent. */
  onReplaceAcross?(item: LibraryItem): void;
}

function baseName(name: string): string {
  // Strip _v{4-digit-tag} or _opt_v{4-digit-tag} suffix
  return name.replace(/_(opt_)?v\d+$/i, "");
}

export function AssetDetailOverlay({
  item,
  onInsert,
  onRename,
  onUpdate,
  onDelete,
  onClose,
  onPrev,
  onNext,
  onEditImage,
  composer,
  libraryItems,
  onOpenItem,
  onOptimized,
  onReplaceAcross,
}: AssetDetailOverlayProps) {
  const [tab, setTab] = useState<Tab>("preview");
  const [name, setName] = useState(item.name);
  const [altDraft, setAltDraft] = useState(item.altText ?? "");
  const [inserted, setInserted] = useState(false);
  const [metaError, setMetaError] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  const overlayRef = useRef<HTMLDivElement>(null);
  const mountedRef = useRef(true);
  const insertTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Where used — single-page scope (composer.elements is the active page's manager)
  const usedElements = useMemo(() => {
    if (!composer || !item.src) return [];
    try {
      return composer.elements.findByMediaSrc(item.src);
    } catch {
      return [];
    }
  }, [composer, item.src]);

  // Versions — sibling LibraryItems sharing base-name, sorted newest-first
  const versions = useMemo(() => {
    if (!libraryItems) return [];
    const base = baseName(item.name);
    return libraryItems
      .filter((it) => baseName(it.name) === base && it.type === item.type)
      .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
  }, [libraryItems, item.name, item.type]);

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
    setAltDraft(item.altText ?? "");
    setTab("preview");
    setInserted(false);
    setMetaError(false);
  }, [item.key, item.name, item.altText]);

  const commitAltText = useCallback(() => {
    if (!onUpdate) return;
    const next = altDraft.trim();
    if (next === (item.altText ?? "")) return;
    void onUpdate(item.key, { altText: next });
  }, [onUpdate, altDraft, item.altText, item.key]);

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

  // Tab visibility — Edit + Optimize are image-only
  const showEdit = item.type === "img" && !!onEditImage;
  const showOptimize = item.type === "img" && !!onOptimized;
  const tabs: Array<{ id: Tab; label: string; count?: number }> = [
    { id: "preview", label: "Preview" },
    { id: "used", label: "Where used", count: usedElements.length },
    { id: "versions", label: "Versions", count: versions.length > 1 ? versions.length : undefined },
    ...(showEdit ? [{ id: "edit" as Tab, label: "Edit" }] : []),
    ...(showOptimize ? [{ id: "optimize" as Tab, label: "Optimize" }] : []),
  ];

  return (
    <div ref={overlayRef} className="med-detail-overlay" role="dialog" aria-modal="true" aria-label={item.name}>
      {/* Back nav row */}
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

      {/* Tabs */}
      <div className="med-detail-tabs" role="tablist" aria-label="Asset detail sections">
        {tabs.map((t) => (
          <button
            key={t.id}
            type="button"
            role="tab"
            aria-selected={tab === t.id}
            className={`med-detail-tab${tab === t.id ? " is-active" : ""}`}
            onClick={() => setTab(t.id)}
          >
            {t.label}
            {t.count != null && t.count > 0 ? (
              <span className="med-detail-tab-count">{t.count}</span>
            ) : null}
          </button>
        ))}
      </div>

      {/* Tab content */}
      <div className="med-detail-body" role="tabpanel">
        {metaError ? (
          <div className="med-detail-error-body">
            <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="var(--bd-fg-secondary, var(--bd-fg-muted))" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
              <rect x="3" y="3" width="18" height="18" rx="2" />
              <line x1="9" y1="9" x2="15" y2="15" />
              <line x1="15" y1="9" x2="9" y2="15" />
            </svg>
            <p className="med-detail-error-title">Preview metadata unavailable</p>
            <p className="med-detail-error-sub">The file may have been moved or deleted.</p>
            <Button className="med-detail-retry" onClick={() => setMetaError(false)}>Retry</Button>
          </div>
        ) : tab === "preview" ? (
          <>
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
          </>
        ) : tab === "used" ? (
          <div className="med-detail-list">
            {usedElements.length === 0 ? (
              <div className="med-detail-empty">Not used on this page yet</div>
            ) : (
              <ul className="med-detail-used-list">
                {usedElements.map((el) => {
                  const id = el.getId();
                  const tag = el.getType() || "element";
                  return (
                    <li key={id} className="med-detail-used-row">
                      <span className="med-detail-used-tag">{tag}</span>
                      <span className="med-detail-used-id">{id}</span>
                    </li>
                  );
                })}
              </ul>
            )}
          </div>
        ) : tab === "versions" ? (
          <div className="med-detail-list">
            {versions.length <= 1 ? (
              <div className="med-detail-empty">No prior versions</div>
            ) : (
              <ul className="med-detail-versions-list">
                {versions.map((v) => (
                  <li key={v.key}>
                    <button
                      type="button"
                      className={`med-detail-version-row${v.key === item.key ? " is-current" : ""}`}
                      onClick={() => v.key !== item.key && onOpenItem?.(v)}
                      disabled={v.key === item.key || !onOpenItem}
                    >
                      <span className="med-detail-version-name">{v.name}</span>
                      <span className="med-detail-version-meta">
                        {fmtSize(v.size)} · {new Date(v.createdAt).toLocaleDateString()}
                      </span>
                      {v.key === item.key && <span className="med-detail-version-badge">current</span>}
                    </button>
                  </li>
                ))}
              </ul>
            )}
          </div>
        ) : tab === "edit" ? (
          <div className="med-detail-edit-pane">
            <label className="med-detail-edit-field">
              <span className="med-detail-edit-label">Alt text</span>
              <Input
                className="med-detail-alt-input"
                value={altDraft}
                onChange={(e) => setAltDraft(e.target.value)}
                onBlur={commitAltText}
                onKeyDown={(e) => {
                  if (e.key === "Enter") {
                    e.preventDefault();
                    commitAltText();
                    (e.currentTarget as HTMLInputElement).blur();
                  }
                }}
                placeholder="Describe this image for screen readers"
                aria-label="Alt text"
              />
              <span className="med-detail-edit-help">
                Used by screen readers + image-SEO. Keep under 125 characters.
              </span>
            </label>
            <div className="med-detail-edit-divider" role="separator" />
            <p className="med-detail-edit-blurb">
              Crop, rotate, or adjust this image. Edits create a new versioned copy — original is preserved.
            </p>
            <Button
              className="med-detail-edit-cta"
              onClick={() => onEditImage?.(item)}
              disabled={!onEditImage}
            >
              Open image editor
            </Button>
          </div>
        ) : tab === "optimize" ? (
          <div className="med-detail-optim-pane">
            <OptimizationPanel
              imageSrc={item.src}
              onOptimized={async (src) => {
                await onOptimized?.(src);
              }}
              onClose={() => setTab("preview")}
            />
          </div>
        ) : null}
      </div>

      {/* Action footer — only shown for non-Edit/non-Optimize tabs (those have inline CTAs) */}
      {tab !== "edit" && tab !== "optimize" && (
        <div className="med-detail-actions">
          <Button
            className="med-detail-action-btn med-detail-action-btn--primary"
            onClick={handleInsert}
            disabled={inserted}
          >
            {inserted ? "Added ✓" : "Add to page"}
          </Button>
          {onReplaceAcross && (item.type === "img" || item.type === "vid") ? (
            <Button
              className="med-detail-action-btn"
              onClick={() => onReplaceAcross(item)}
              aria-label="Replace asset"
            >
              Replace
            </Button>
          ) : null}
          <Button
            className="med-detail-action-btn med-detail-action-btn--danger"
            onClick={() => onDelete(item.key)}
          >
            Delete
          </Button>
        </div>
      )}
    </div>
  );
}
