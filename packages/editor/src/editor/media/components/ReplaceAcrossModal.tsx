/**
 * ReplaceAcrossModal (S21 — Media replace-across)
 *
 * Per-page selectable bulk asset replacement. Reads usagesByPage from
 * `composer.mediaOps.getUsagesByPage(oldSrc)`; user toggles per-page
 * checkboxes; Confirm calls `replaceAcrossSelective(oldSrc, newSrc,
 * selectedPageIds)`.
 *
 * Pure UI — engine call lives in the consumer (mount). This component
 * only owns selection state + the visible diff layout.
 *
 * @license BSD-3-Clause
 */
import * as React from "react";
import { ModalContent, ModalDescription, ModalRoot, ModalTitle } from "@/editor/ui";
import { Button, Checkbox } from "flowbite-react";

export interface ReplaceAcrossPageEntry {
  pageId: string;
  pageName: string;
  /** Number of distinct elements on this page that reference oldSrc. */
  placeCount: number;
}

export interface ReplaceAcrossModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  /** Asset being replaced — name only; the engine call uses the underlying src. */
  oldName: string;
  oldSrc: string;
  /** Replacement asset — name + src. UI shows name; engine call uses src. */
  newName: string;
  newSrc: string;
  /** Pages where oldSrc is referenced (one entry per page; multiple places per page allowed). */
  pages: ReadonlyArray<ReplaceAcrossPageEntry>;
  /** Called with the user's chosen page subset when user clicks Confirm. */
  onConfirm: (selectedPageIds: ReadonlyArray<string>) => void;
}

const SQUARE = 56;
const ROW_THUMB_W = 56;
const ROW_THUMB_H = 40;

export const ReplaceAcrossModal: React.FC<ReplaceAcrossModalProps> = ({
  open,
  onOpenChange,
  oldName,
  oldSrc: _oldSrc,
  newName,
  newSrc: _newSrc,
  pages,
  onConfirm,
}) => {
  // Selection: default = every page checked; user can uncheck.
  const [selected, setSelected] = React.useState<ReadonlySet<string>>(
    () => new Set(pages.map((p) => p.pageId))
  );

  // When `pages` prop changes (new asset), reset selection to all-checked.
  React.useEffect(() => {
    setSelected(new Set(pages.map((p) => p.pageId)));
  }, [pages]);

  const totalPlaces = React.useMemo(
    () =>
      pages.reduce(
        (sum, p) => (selected.has(p.pageId) ? sum + p.placeCount : sum),
        0
      ),
    [pages, selected]
  );

  const togglePage = (pageId: string) => {
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(pageId)) next.delete(pageId);
      else next.add(pageId);
      return next;
    });
  };

  const handleConfirm = () => {
    onConfirm(Array.from(selected));
    onOpenChange(false);
  };

  const selectedCount = selected.size;

  return (
    <ModalRoot open={open} onOpenChange={onOpenChange}>
      <ModalContent size="xl" aria-labelledby="replace-across-title">
        {/* Header */}
        <div
          style={{
            padding: "16px 20px",
            borderBottom: "1px solid var(--bk-border)",
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
          }}
        >
          <div>
            <ModalTitle id="replace-across-title" style={{ fontSize: 15, fontWeight: 600 }}>
              Replace {oldName} across pages
            </ModalTitle>
            <ModalDescription
              style={{ fontSize: 11, color: "var(--bk-ink-muted)", marginTop: 2 }}
            >
              Used in {pages.length} {pages.length === 1 ? "page" : "pages"} · review before applying
            </ModalDescription>
          </div>
        </div>

        {/* Replacing / With strip */}
        <div
          style={{
            padding: "12px 20px",
            display: "flex",
            gap: 16,
            borderBottom: "1px solid var(--bk-border)",
          }}
        >
          <ThumbBlock label="Replacing" name={oldName} kind="old" size={SQUARE} />
          <div style={{ display: "flex", alignItems: "center", padding: "0 8px" }}>
            <ArrowRight />
          </div>
          <ThumbBlock label="With" name={newName} kind="new" size={SQUARE} />
        </div>

        {/* Per-page list */}
        <div style={{ flex: 1, padding: "12px 20px", overflowY: "auto", maxHeight: 360 }}>
          <div
            style={{
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
              padding: "4px 0 8px",
              fontSize: 11,
              color: "var(--bk-ink-muted)",
            }}
          >
            <span>Choose pages</span>
            <span>
              {selectedCount} of {pages.length} selected
            </span>
          </div>
          <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
            {pages.map((p) => {
              const checked = selected.has(p.pageId);
              return (
                <PageRow
                  key={p.pageId}
                  page={p}
                  checked={checked}
                  onToggle={() => togglePage(p.pageId)}
                  thumbW={ROW_THUMB_W}
                  thumbH={ROW_THUMB_H}
                />
              );
            })}
          </div>
        </div>

        {/* Footer */}
        <div
          style={{
            padding: "12px 20px",
            background: "var(--bk-bg-subtle)",
            borderTop: "1px solid var(--bk-border)",
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            gap: 8,
          }}
        >
          <span style={{ fontSize: 12, color: "var(--bk-ink-muted)" }}>
            {selectedCount} of {pages.length} pages selected · ~{totalPlaces}{" "}
            {totalPlaces === 1 ? "element change" : "element changes"}
          </span>
          <div style={{ display: "flex", gap: 8 }}>
            <Button
              type="button"
              color="light"
              onClick={() => onOpenChange(false)} className="tw:border-transparent tw:bg-transparent tw:text-gray-600 tw:hover:text-gray-900"
            >
              Cancel
            </Button>
            <Button
              type="button"
              onClick={handleConfirm}
              disabled={selectedCount === 0}
            >
              Replace on {selectedCount} {selectedCount === 1 ? "page" : "pages"}
            </Button>
          </div>
        </div>
      </ModalContent>
    </ModalRoot>
  );
};

// ── helpers ────────────────────────────────────────────────────────────────

interface ThumbBlockProps {
  label: string;
  name: string;
  kind: "old" | "new";
  size: number;
}

function ThumbBlock({ label, name, kind, size }: ThumbBlockProps) {
  const accent = kind === "new" ? "var(--bk-accent)" : "var(--bk-ink-muted)";
  const bg =
    kind === "new"
      ? /* @lint-hex-policy: warm-tint illustrative gradient for replace-across hero */ "linear-gradient(135deg, var(--bk-accent-subtle), #e9f0fc)"
      : /* @lint-hex-policy: warm-tint illustrative gradient for replace-across hero */ "linear-gradient(135deg, #fff4e8, #fde9d2)";
  return (
    <div style={{ flex: 1, display: "flex", alignItems: "center", gap: 10 }}>
      <div
        style={{
          width: size,
          height: size,
          background: bg,
          borderRadius: 4,
          border: kind === "new" ? `2px solid ${accent}` : "1px solid var(--bk-border)",
        }}
      />
      <div>
        <div
          style={{
            fontSize: 11,
            color: accent,
            textTransform: "uppercase",
            letterSpacing: "0.04em",
            fontWeight: 600,
          }}
        >
          {label}
        </div>
        <div style={{ fontSize: 13, fontWeight: 500 }}>{name}</div>
      </div>
    </div>
  );
}

interface PageRowProps {
  page: ReplaceAcrossPageEntry;
  checked: boolean;
  onToggle: () => void;
  thumbW: number;
  thumbH: number;
}

function PageRow({ page, checked, onToggle, thumbW, thumbH }: PageRowProps) {
  return (
    <label
      style={{
        display: "flex",
        alignItems: "center",
        gap: 12,
        padding: 10,
        border: checked ? "1px solid var(--bk-accent)" : "1px solid var(--bk-border)",
        background: checked ? "var(--bk-ink-muted)" : "transparent",
        borderRadius: 6,
        cursor: "pointer",
        opacity: checked ? 1 : 0.7,
      }}
    >
      <Checkbox
        color="blue"
        className="tw:bg-white"
        checked={checked}
        onChange={onToggle}
        aria-label={`Replace on ${page.pageName}`}
        style={{ width: 16, height: 16 }}
      />
      <div style={{ display: "flex", gap: 6, flex: 1 }}>
        <div
          style={{
            width: thumbW,
            height: thumbH,
            background: /* @lint-hex-policy: warm-tint illustrative gradient for replace-across hero */ "linear-gradient(135deg, #fff4e8, #fde9d2)",
            borderRadius: 3,
          }}
        />
        <div style={{ display: "flex", alignItems: "center", padding: "0 4px" }}>
          <ArrowRight small />
        </div>
        <div
          style={{
            width: thumbW,
            height: thumbH,
            background: checked
              ? /* @lint-hex-policy: warm-tint illustrative gradient for replace-across hero */ "linear-gradient(135deg, var(--bk-accent-subtle), #e9f0fc)"
              : "var(--bk-bg-subtle)",
            borderRadius: 3,
            border: checked
              ? "1px solid var(--bk-accent)"
              : "1px dashed var(--bk-border)",
          }}
        />
      </div>
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ fontSize: 13, fontWeight: 500 }}>
          {page.pageName}
          {!checked && (
            <span style={{ fontSize: 10, color: "var(--bk-ink-muted)", fontWeight: 400, marginLeft: 6 }}>
              (skipped)
            </span>
          )}
        </div>
        <div style={{ fontSize: 11, color: "var(--bk-ink-muted)" }}>
          {page.placeCount} {page.placeCount === 1 ? "place" : "places"}
          {!checked ? " · won't change" : ""}
        </div>
      </div>
    </label>
  );
}

function ArrowRight({ small }: { small?: boolean } = {}) {
  const size = small ? 12 : 20;
  const stroke = small ? "var(--bk-ink-muted)" : "var(--bk-accent)";
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={stroke} strokeWidth="2" aria-hidden>
      <path d="M5 12h14M12 5l7 7-7 7" />
    </svg>
  );
}
