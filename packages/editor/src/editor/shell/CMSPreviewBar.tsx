import { Button } from "@/editor/shared/vibcoder/Button";
/**
 * CMSPreviewBar — Preview bar for CMS collection records (WS-14c)
 * PRD §12.4 — Shows above the canvas when a collection is bound and has records.
 *
 * @module editor/shell/CMSPreviewBar
 * @license BSD-3-Clause
 */

import { ChevronLeft, ChevronRight } from "lucide-react";
import * as React from "react";
import type { Composer } from "../../engine";

// =============================================================================
// TYPES
// =============================================================================

export interface CMSPreviewBarProps {
  composer: Composer | null;
}

// =============================================================================
// STYLES
// =============================================================================

const s: Record<string, React.CSSProperties> = {
  bar: {
    display: "flex",
    alignItems: "center",
    gap: 8,
    height: 36,
    padding: "0 16px",
    background: "var(--bd-accent-subtle)",
    borderBottom: "1px solid var(--bd-accent-alpha-30)",
    flexShrink: 0,
    zIndex: 10,
    userSelect: "none" as const,
  },
  label: {
    fontSize: 12,
    color: "var(--buildrick-text-secondary)",
    whiteSpace: "nowrap" as const,
  },
  counter: {
    fontSize: 12,
    fontWeight: 500,
    color: "var(--buildrick-text-primary, #e4e4e7)",
    minWidth: 32,
    textAlign: "center" as const,
  },
  navBtn: {
    width: 28,
    height: 28,
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    background: "transparent",
    border: "1px solid var(--bd-accent-alpha-30)",
    borderRadius: "var(--bd-radius-sm)",
    color: "var(--buildrick-text-secondary)",
    cursor: "pointer",
    transition: "background 0.15s, border-color 0.15s",
    flexShrink: 0,
  },
  exitLink: {
    marginLeft: "auto",
    fontSize: 12,
    color: "var(--buildrick-accent)",
    cursor: "pointer",
    background: "transparent",
    border: "none",
    padding: "2px 4px",
    borderRadius: "var(--buildrick-radius-sm)",
    transition: "opacity 0.15s",
    whiteSpace: "nowrap" as const,
  },
};

// =============================================================================
// HOOK — CMS preview record state
// =============================================================================

function useCMSPreview(composer: Composer | null) {
  const [active, setActive] = React.useState(false);
  const [currentIndex, setCurrentIndex] = React.useState(0);
  const [total, setTotal] = React.useState(0);

  // Check whether there are bound collections with records on mount and when composer changes
  React.useEffect(() => {
    if (!composer?.cms.collections) return;

    const checkCollections = () => {
      const all = composer.cms.collections.getAllCollections?.() ?? [];
      if (all.length > 0) {
        setTotal(all.length);
        setActive(true);
        setCurrentIndex(0);
      } else {
        setActive(false);
      }
    };

    checkCollections();

    // Re-check when collections change
    const onCreated = () => checkCollections();
    const onDeleted = () => checkCollections();
    composer.cms.collections.on?.("collection:created", onCreated);
    composer.cms.collections.on?.("collection:deleted", onDeleted);
    return () => {
      composer.cms.collections.off?.("collection:created", onCreated);
      composer.cms.collections.off?.("collection:deleted", onDeleted);
    };
  }, [composer]);

  const prev = React.useCallback(() => {
    setCurrentIndex((i) => Math.max(0, i - 1));
  }, []);

  const next = React.useCallback(() => {
    setCurrentIndex((i) => Math.min(total - 1, i + 1));
  }, [total]);

  const exit = React.useCallback(() => {
    setActive(false);
    setCurrentIndex(0);
  }, []);

  return { active, currentIndex, total, prev, next, exit };
}

// =============================================================================
// COMPONENT
// =============================================================================

export const CMSPreviewBar: React.FC<CMSPreviewBarProps> = ({ composer }) => {
  const { active, currentIndex, total, prev, next, exit } = useCMSPreview(composer);

  if (!active) return null;

  return (
    <div style={s.bar} role="status" aria-label="CMS record preview">
      <span style={s.label}>Viewing record</span>
      <span style={s.counter}>
        {currentIndex + 1} / {total}
      </span>
      {/* Navigation arrows */}
      <Button
        type="button"
        style={s.navBtn}
        onClick={prev}
        disabled={currentIndex === 0}
        aria-label="Previous record"
        onMouseEnter={(e) => {
          (e.currentTarget as HTMLElement).style.background =
            "var(--bd-accent-alpha-15)";
          (e.currentTarget as HTMLElement).style.borderColor =
            "var(--buildrick-accent)";
        }}
        onMouseLeave={(e) => {
          (e.currentTarget as HTMLElement).style.background = "transparent";
          (e.currentTarget as HTMLElement).style.borderColor =
            "var(--bd-accent-alpha-30)";
        }}
      >
        <ChevronLeft size={14} aria-hidden />
      </Button>
      <Button
        type="button"
        style={s.navBtn}
        onClick={next}
        disabled={currentIndex === total - 1}
        aria-label="Next record"
        onMouseEnter={(e) => {
          (e.currentTarget as HTMLElement).style.background =
            "var(--bd-accent-alpha-15)";
          (e.currentTarget as HTMLElement).style.borderColor =
            "var(--buildrick-accent)";
        }}
        onMouseLeave={(e) => {
          (e.currentTarget as HTMLElement).style.background = "transparent";
          (e.currentTarget as HTMLElement).style.borderColor =
            "var(--bd-accent-alpha-30)";
        }}
      >
        <ChevronRight size={14} aria-hidden />
      </Button>
      {/* Exit */}
      <Button
        type="button"
        style={s.exitLink}
        onClick={exit}
        aria-label="Exit CMS preview"
        onMouseEnter={(e) => {
          (e.currentTarget as HTMLElement).style.opacity = "0.7";
        }}
        onMouseLeave={(e) => {
          (e.currentTarget as HTMLElement).style.opacity = "1";
        }}
      >
        Exit preview
      </Button>
    </div>
  );
};

export default CMSPreviewBar;
