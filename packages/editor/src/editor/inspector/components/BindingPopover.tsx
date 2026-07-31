/**
 * BindingPopover — Link element content to a CMS collection field (WS-14b)
 * PRD §12.3 — Chain icon button + popover with collection/field selection
 *
 * Self-contained with local state; mounts inside the inspector header area.
 * Rule: stays in inspector/components/ — not imported from shell.
 *
 * @module editor/inspector/components/BindingPopover
 * @license BSD-3-Clause
 */

import { Link, Link2Off } from "lucide-react";
import * as React from "react";
import type { Composer } from "../../../engine";
import { useClickOutside } from "../../../shared/hooks/useClickOutside";
import type { CMSCollection, CMSContentItem } from "../../../shared/types/cms";
import { Button } from "@/editor/chrome-ui";
// =============================================================================
// TYPES
// =============================================================================

export interface BindingPopoverProps {
  /** Selected element ID */
  elementId: string | null;
  /** Composer instance for CMS access */
  composer: Composer | null;
  /** Called when user wants to create a new collection (opens CMSCollectionSetupModal) */
  onOpenCreateCollection?: () => void;
}

// =============================================================================
// STYLES
// =============================================================================

const s: Record<string, React.CSSProperties> = {
  wrapper: {
    position: "relative",
    display: "inline-block",
  },
  chainBtn: {
    width: 24,
    height: 24,
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    background: "transparent",
    border: "none",
    borderRadius: "var(--bk-radius-sm)",
    cursor: "pointer",
    transition: "color 0.15s, background 0.15s",
    flexShrink: 0,
  },
  popover: {
    position: "absolute",
    top: "calc(100% + 6px)",
    right: 0,
    width: 240,
    background: "var(--bk-bg-panel)",
    border: "1px solid var(--bk-border)",
    borderRadius: "var(--bk-radius-lg)",
    boxShadow: "var(--bk-shadow-overlay)",
    zIndex: 1000,
    overflow: "hidden",
  },
  popoverHeader: {
    padding: "8px 12px",
    borderBottom: "1px solid var(--bk-border)",
    fontSize: 11,
    fontWeight: 600,
    color: "var(--bk-ink-muted)",
    textTransform: "uppercase" as const,
    letterSpacing: "0.06em",
  },
  popoverBody: {
    maxHeight: 280,
    overflowY: "auto" as const,
  },
  emptyMsg: {
    padding: "14px 12px",
    fontSize: 12,
    color: "var(--bk-ink-muted)",
    textAlign: "center" as const,
    lineHeight: 1.5,
  },
  sectionTitle: {
    padding: "6px 12px 4px",
    fontSize: 10,
    fontWeight: 600,
    color: "var(--bk-ink-muted)",
    textTransform: "uppercase" as const,
    letterSpacing: "0.07em",
    background: "var(--bk-bg-card)",
  },
  listItem: {
    display: "flex",
    alignItems: "center",
    padding: "7px 12px",
    fontSize: 12,
    color: "var(--bk-ink-soft)",
    cursor: "pointer",
    transition: "background 0.1s",
    border: "none",
    width: "100%",
    textAlign: "left" as const,
    background: "transparent",
  },
  listItemActive: {
    background: "var(--bk-accent-tint)",
    color: "var(--bk-accent)",
  },
  divider: {
    height: 1,
    background: "var(--bk-border)",
    margin: "4px 0",
  },
  footerLink: {
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    padding: "8px 12px",
    fontSize: 12,
    color: "var(--bk-accent)",
    cursor: "pointer",
    borderTop: "1px solid var(--bk-border)",
    background: "transparent",
    border: "none",
    width: "100%",
    borderRadius: 0,
    transition: "background 0.1s",
  },
  boundIndicator: {
    padding: "8px 12px",
    fontSize: 11,
    color: "var(--bk-ink-muted)",
    display: "flex",
    alignItems: "center",
    justifyContent: "space-between",
    borderBottom: "1px solid var(--bk-border)",
  },
  unbindBtn: {
    fontSize: 11,
    color: "var(--bk-error)",
    background: "transparent",
    border: "none",
    cursor: "pointer",
    padding: "2px 4px",
    borderRadius: "var(--bk-radius-sm)",
  },
};

// =============================================================================
// COMPONENT
// =============================================================================

export const BindingPopover: React.FC<BindingPopoverProps> = ({
  elementId,
  composer,
  onOpenCreateCollection,
}) => {
  const [open, setOpen] = React.useState(false);
  const [collections, setCollections] = React.useState<CMSCollection[]>([]);
  const [selectedCollection, setSelectedCollection] = React.useState<CMSCollection | null>(null);
  const [selectedField, setSelectedField] = React.useState<{ slug: string; name: string } | null>(null);
  const [records, setRecords] = React.useState<CMSContentItem[]>([]);
  const [isBound, setIsBound] = React.useState(false);
  const [boundLabel, setBoundLabel] = React.useState<string | null>(null);
  const wrapperRef = React.useRef<HTMLDivElement>(null);

  // Load collections when popover opens
  React.useEffect(() => {
    if (!open) return;
    const all = composer?.cms.collections?.getAllCollections?.() ?? [];
    setCollections(all);
  }, [open, composer]);

  // Close on outside click — clear selection too so reopening starts fresh.
  const handleClickOutside = React.useCallback(() => {
    setOpen(false);
    setSelectedCollection(null);
  }, []);
  useClickOutside(wrapperRef, handleClickOutside, { enabled: open });

  const handleSelectCollection = React.useCallback(
    (col: CMSCollection) => {
      setSelectedCollection(col);
    },
    []
  );

  // Field then record: a single-element binding needs BOTH a field and a
  // specific record (itemId), otherwise resolveBinding has nothing to read and
  // always returns the fallback (the old flow bound with itemId=undefined).
  const handleSelectField = React.useCallback(
    (fieldSlug: string, fieldName: string) => {
      setSelectedField({ slug: fieldSlug, name: fieldName });
      if (composer && selectedCollection) {
        void composer.cms.collections
          .getContentItems(selectedCollection.id)
          .then((rows) => setRecords(rows))
          .catch(() => setRecords([]));
      }
    },
    [composer, selectedCollection]
  );

  const handleSelectRecord = React.useCallback(
    (itemId: string) => {
      if (!elementId || !selectedCollection || !selectedField) return;
      composer?.cms.bindings?.bindToField?.(
        elementId,
        selectedCollection.id,
        itemId,
        selectedField.slug,
        "content"
      );
      setBoundLabel(`${selectedCollection.name} › ${selectedField.name}`);
      setIsBound(true);
      setOpen(false);
      setSelectedCollection(null);
      setSelectedField(null);
      setRecords([]);
    },
    [elementId, composer, selectedCollection, selectedField]
  );

  const handleUnbind = React.useCallback(() => {
    if (!elementId) return;
    composer?.cms.bindings?.unbindAll?.(elementId);
    setIsBound(false);
    setBoundLabel(null);
  }, [elementId, composer]);

  const isActive = isBound;

  return (
    <div ref={wrapperRef} style={s.wrapper}>
      {/* Chain icon button */}
      <Button
        type="button"
        style={{
          ...s.chainBtn,
          color: isActive ? "var(--bk-accent)" : "var(--bk-ink-muted)",
          background: isActive ? "var(--bk-accent-tint)" : "transparent",
        }}
        title="Bind to collection field"
        aria-label="Bind to collection field"
        aria-expanded={open}
        onClick={() => setOpen((v) => !v)}
        onMouseEnter={(e) => {
          if (!isActive) {
            (e.currentTarget as HTMLElement).style.color = "var(--bk-ink-soft)";
            (e.currentTarget as HTMLElement).style.background =
              "var(--bk-bg-card)";
          }
        }}
        onMouseLeave={(e) => {
          if (!isActive) {
            (e.currentTarget as HTMLElement).style.color = "var(--bk-ink-muted)";
            (e.currentTarget as HTMLElement).style.background = "transparent";
          }
        }}
      >
        {isActive ? <Link size={12} aria-hidden /> : <Link size={12} aria-hidden />}
      </Button>
      {/* Popover */}
      {open && (
        <div style={s.popover} role="dialog" aria-label="Bind to collection field">
          <div style={s.popoverHeader}>Bind to collection</div>

          <div style={s.popoverBody}>
            {/* Current binding status */}
            {isBound && boundLabel && (
              <div style={s.boundIndicator}>
                <span style={{ display: "flex", alignItems: "center", gap: 4 }}>
                  <Link size={10} style={{ color: "var(--bk-accent)" }} />
                  {boundLabel}
                </span>
                <Button
                  type="button"
                  style={s.unbindBtn}
                  onClick={handleUnbind}
                  title="Remove binding"
                >
                  <Link2Off size={10} />
                </Button>
              </div>
            )}

            {/* No collections */}
            {collections.length === 0 && (
              <div style={s.emptyMsg}>
                No collections yet.
                <br />
                Create one first.
              </div>
            )}

            {/* Collection list (when no collection selected) */}
            {collections.length > 0 && !selectedCollection && (
              <>
                <div style={s.sectionTitle}>Collections</div>
                {collections.map((col) => (
                  <Button
                    key={col.id}
                    type="button"
                    style={s.listItem}
                    onClick={() => handleSelectCollection(col)}
                    onMouseEnter={(e) => {
                      (e.currentTarget as HTMLElement).style.background =
                        "var(--bk-bg-card)";
                    }}
                    onMouseLeave={(e) => {
                      (e.currentTarget as HTMLElement).style.background = "transparent";
                    }}
                  >
                    {col.name}
                    <span
                      style={{
                        marginLeft: "auto",
                        fontSize: 10,
                        color: "var(--bk-ink-muted)",
                      }}
                    >
                      {col.fields.length} fields
                    </span>
                  </Button>
                ))}
              </>
            )}

            {/* Field list (collection selected, no field yet) */}
            {selectedCollection && !selectedField && (
              <>
                <Button
                  type="button"
                  style={{
                    ...s.listItem,
                    color: "var(--bk-accent)",
                    fontSize: 11,
                  }}
                  onClick={() => setSelectedCollection(null)}
                >
                  ← {selectedCollection.name}
                </Button>
                <div style={s.divider} />
                <div style={s.sectionTitle}>Fields</div>
                {selectedCollection.fields.length === 0 && (
                  <div style={{ ...s.emptyMsg, padding: "10px 12px" }}>No fields defined</div>
                )}
                {selectedCollection.fields.map((field) => (
                  <Button
                    key={field.id}
                    type="button"
                    style={s.listItem}
                    onClick={() => handleSelectField(field.slug, field.name)}
                    onMouseEnter={(e) => {
                      (e.currentTarget as HTMLElement).style.background =
                        "var(--bk-bg-card)";
                    }}
                    onMouseLeave={(e) => {
                      (e.currentTarget as HTMLElement).style.background = "transparent";
                    }}
                  >
                    {field.name}
                    <span
                      style={{
                        marginLeft: "auto",
                        fontSize: 10,
                        color: "var(--bk-ink-muted)",
                      }}
                    >
                      {field.type}
                    </span>
                  </Button>
                ))}
              </>
            )}

            {/* Record list (field selected) — pick which record to bind. */}
            {selectedCollection && selectedField && (
              <>
                <Button
                  type="button"
                  style={{ ...s.listItem, color: "var(--bk-accent)", fontSize: 11 }}
                  onClick={() => {
                    setSelectedField(null);
                    setRecords([]);
                  }}
                >
                  ← {selectedField.name}
                </Button>
                <div style={s.divider} />
                <div style={s.sectionTitle}>Record</div>
                {records.length === 0 && (
                  <div style={{ ...s.emptyMsg, padding: "10px 12px" }}>
                    No records yet. Add records via the command palette → “Manage CMS Records”.
                  </div>
                )}
                {records.map((rec) => {
                  const key = selectedCollection.displayField || selectedCollection.fields[0]?.slug;
                  const label = key && rec.data[key] != null && rec.data[key] !== ""
                    ? String(rec.data[key])
                    : "(untitled)";
                  return (
                    <Button
                      key={rec.id}
                      type="button"
                      style={s.listItem}
                      onClick={() => handleSelectRecord(rec.id)}
                    >
                      {label}
                      <span style={{ marginLeft: "auto", fontSize: 10, color: "var(--bk-ink-muted)" }}>
                        {rec.status}
                      </span>
                    </Button>
                  );
                })}
              </>
            )}
          </div>

          {/* Create collection link */}
          <Button
            type="button"
            style={s.footerLink}
            onClick={() => {
              setOpen(false);
              onOpenCreateCollection?.();
            }}
            onMouseEnter={(e) => {
              (e.currentTarget as HTMLElement).style.background =
                "var(--bk-accent-tint)";
            }}
            onMouseLeave={(e) => {
              (e.currentTarget as HTMLElement).style.background = "transparent";
            }}
          >
            + Create Collection
          </Button>
        </div>
      )}
    </div>
  );
};

export default BindingPopover;
