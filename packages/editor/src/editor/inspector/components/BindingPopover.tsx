import { Button } from "@/editor/shared/vibcoder/Button";
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
import type { CMSCollection } from "../../../shared/types/cms";

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
    borderRadius: "var(--buildrick-radius-sm)",
    cursor: "pointer",
    transition: "color 0.15s, background 0.15s",
    flexShrink: 0,
  },
  popover: {
    position: "absolute",
    top: "calc(100% + 6px)",
    right: 0,
    width: 240,
    background: "var(--buildrick-bg-panel)",
    border: "1px solid var(--buildrick-border)",
    borderRadius: "var(--buildrick-radius-md)",
    boxShadow: "var(--buildrick-shadow-lg)",
    zIndex: 1000,
    overflow: "hidden",
  },
  popoverHeader: {
    padding: "8px 12px",
    borderBottom: "1px solid var(--buildrick-border)",
    fontSize: 11,
    fontWeight: 600,
    color: "var(--buildrick-text-muted)",
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
    color: "var(--buildrick-text-muted)",
    textAlign: "center" as const,
    lineHeight: 1.5,
  },
  sectionTitle: {
    padding: "6px 12px 4px",
    fontSize: 10,
    fontWeight: 600,
    color: "var(--buildrick-text-muted)",
    textTransform: "uppercase" as const,
    letterSpacing: "0.07em",
    background: "var(--buildrick-bg-elevated)",
  },
  listItem: {
    display: "flex",
    alignItems: "center",
    padding: "7px 12px",
    fontSize: 12,
    color: "var(--buildrick-text-secondary)",
    cursor: "pointer",
    transition: "background 0.1s",
    border: "none",
    width: "100%",
    textAlign: "left" as const,
    background: "transparent",
  },
  listItemActive: {
    background: "var(--buildrick-accent-tint)",
    color: "var(--buildrick-accent)",
  },
  divider: {
    height: 1,
    background: "var(--buildrick-border)",
    margin: "4px 0",
  },
  footerLink: {
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    padding: "8px 12px",
    fontSize: 12,
    color: "var(--buildrick-accent)",
    cursor: "pointer",
    borderTop: "1px solid var(--buildrick-border)",
    background: "transparent",
    border: "none",
    width: "100%",
    borderRadius: 0,
    transition: "background 0.1s",
  },
  boundIndicator: {
    padding: "8px 12px",
    fontSize: 11,
    color: "var(--buildrick-text-muted)",
    display: "flex",
    alignItems: "center",
    justifyContent: "space-between",
    borderBottom: "1px solid var(--buildrick-border)",
  },
  unbindBtn: {
    fontSize: 11,
    color: "var(--buildrick-error)",
    background: "transparent",
    border: "none",
    cursor: "pointer",
    padding: "2px 4px",
    borderRadius: "var(--buildrick-radius-sm)",
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
  const [isBound, setIsBound] = React.useState(false);
  const [boundLabel, setBoundLabel] = React.useState<string | null>(null);
  const wrapperRef = React.useRef<HTMLDivElement>(null);

  // Load collections when popover opens
  React.useEffect(() => {
    if (!open) return;
    const all = composer?.cmsManager?.getAllCollections?.() ?? [];
    setCollections(all);
  }, [open, composer]);

  // Close on outside click
  React.useEffect(() => {
    if (!open) return;
    const handleOutside = (e: MouseEvent) => {
      if (wrapperRef.current && !wrapperRef.current.contains(e.target as Node)) {
        setOpen(false);
        setSelectedCollection(null);
      }
    };
    document.addEventListener("mousedown", handleOutside);
    return () => document.removeEventListener("mousedown", handleOutside);
  }, [open]);

  const handleSelectCollection = React.useCallback(
    (col: CMSCollection) => {
      setSelectedCollection(col);
    },
    []
  );

  const handleSelectField = React.useCallback(
    (collectionId: string, fieldId: string, fieldName: string) => {
      if (!elementId) return;
      // Bind element to field using the CMS bindings manager
      composer?.cmsBindings?.bindToField?.(elementId, collectionId, undefined, fieldId, "content");
      setBoundLabel(`${selectedCollection?.name ?? ""} › ${fieldName}`);
      setIsBound(true);
      setOpen(false);
      setSelectedCollection(null);
    },
    [elementId, composer, selectedCollection]
  );

  const handleUnbind = React.useCallback(() => {
    if (!elementId) return;
    composer?.cmsBindings?.unbindAll?.(elementId);
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
          color: isActive ? "var(--buildrick-accent)" : "var(--buildrick-text-muted)",
          background: isActive ? "var(--buildrick-accent-tint)" : "transparent",
        }}
        title="Bind to collection field"
        aria-label="Bind to collection field"
        aria-expanded={open}
        onClick={() => setOpen((v) => !v)}
        onMouseEnter={(e) => {
          if (!isActive) {
            (e.currentTarget as HTMLElement).style.color = "var(--buildrick-text-secondary)";
            (e.currentTarget as HTMLElement).style.background =
              "var(--buildrick-bg-elevated)";
          }
        }}
        onMouseLeave={(e) => {
          if (!isActive) {
            (e.currentTarget as HTMLElement).style.color = "var(--buildrick-text-muted)";
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
                  <Link size={10} style={{ color: "var(--buildrick-accent)" }} />
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
                        "var(--buildrick-bg-elevated)";
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
                        color: "var(--buildrick-text-muted)",
                      }}
                    >
                      {col.fields.length} fields
                    </span>
                  </Button>
                ))}
              </>
            )}

            {/* Field list (when collection selected) */}
            {selectedCollection && (
              <>
                <Button
                  type="button"
                  style={{
                    ...s.listItem,
                    color: "var(--buildrick-accent)",
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
                    onClick={() =>
                      handleSelectField(selectedCollection.id, field.slug, field.name)
                    }
                    onMouseEnter={(e) => {
                      (e.currentTarget as HTMLElement).style.background =
                        "var(--buildrick-bg-elevated)";
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
                        color: "var(--buildrick-text-muted)",
                      }}
                    >
                      {field.type}
                    </span>
                  </Button>
                ))}
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
                "var(--buildrick-accent-tint)";
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
