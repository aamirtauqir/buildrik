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
import { ModalContent, ModalDescription, ModalRoot, ModalTitle, Button, Checkbox } from "@/editor/chrome-ui";

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

/* @lint-hex-policy: warm-tint illustrative gradient for replace-across hero */
const TINT_WARM = "tw:[background-image:linear-gradient(135deg,#fff4e8,#fde9d2)]";
/* @lint-hex-policy: warm-tint illustrative gradient for replace-across hero */
const TINT_ACCENT = "tw:[background-image:linear-gradient(135deg,var(--bk-accent-subtle),#e9f0fc)]";

const SECTION_X = "tw:px-5";
const HAIRLINE = "tw:border-gray-200";
/** Hero thumb (square) and per-row thumb (4:3-ish) — the two fixed art sizes. */
const HERO_THUMB = "tw:size-14 tw:rounded";
const ROW_THUMB = "tw:w-14 tw:h-10 tw:rounded-[3px] tw:flex-none";

export const ReplaceAcrossModal: React.FC<ReplaceAcrossModalProps> = ({
  open,
  onOpenChange,
  oldName,
  oldSrc,
  newName,
  newSrc,
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
        <div className={`tw:flex tw:items-center tw:justify-between tw:py-4 ${SECTION_X} tw:border-b ${HAIRLINE}`}>
          <div>
            <ModalTitle inset={false} id="replace-across-title" className="tw:text-[15px] tw:font-semibold">
              Replace {oldName} across pages
            </ModalTitle>
            <ModalDescription className="tw:mt-0.5 tw:text-[11px] tw:text-gray-500">
              Used in {pages.length} {pages.length === 1 ? "page" : "pages"} · review before applying
            </ModalDescription>
          </div>
        </div>

        {/* Replacing / With strip */}
        <div className={`tw:flex tw:gap-4 tw:py-3 ${SECTION_X} tw:border-b ${HAIRLINE}`}>
          <ThumbBlock label="Replacing" name={oldName} src={oldSrc} kind="old" />
          <div className="tw:flex tw:items-center tw:px-2">
            <ArrowRight />
          </div>
          <ThumbBlock label="With" name={newName} src={newSrc} kind="new" />
        </div>

        {/* Per-page list */}
        <div className={`tw:flex-1 tw:py-3 ${SECTION_X} tw:overflow-y-auto tw:max-h-90`}>
          <div className="tw:flex tw:items-center tw:justify-between tw:pt-1 tw:pb-2 tw:text-[11px] tw:text-gray-500">
            <span>Choose pages</span>
            <span>
              {selectedCount} of {pages.length} selected
            </span>
          </div>
          <div className="tw:flex tw:flex-col tw:gap-1.5">
            {pages.map((p) => {
              const checked = selected.has(p.pageId);
              return (
                <PageRow
                  key={p.pageId}
                  page={p}
                  checked={checked}
                  onToggle={() => togglePage(p.pageId)}
                />
              );
            })}
          </div>
        </div>

        {/* Footer */}
        <div
          className={`tw:flex tw:items-center tw:justify-between tw:gap-2 tw:py-3 ${SECTION_X} tw:border-t ${HAIRLINE} tw:bg-[var(--bk-bg-subtle)]`}
        >
          <span className="tw:text-xs tw:text-gray-500">
            {selectedCount} of {pages.length} pages selected · ~{totalPlaces}{" "}
            {totalPlaces === 1 ? "element change" : "element changes"}
          </span>
          <div className="tw:flex tw:gap-2">
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
  /** The image itself. Board 1164:4738 draws a placeholder rectangle in this
   *  slot; a placeholder rectangle in a wireframe means "image goes here", and
   *  the srcs were already being handed to this modal and thrown away — the
   *  props were destructured to `_oldSrc` / `_newSrc`. A confirm whose whole
   *  job is "are you replacing the right picture with the right picture"
   *  cannot answer it with two coloured boxes. */
  src?: string;
  kind: "old" | "new";
}

function ThumbBlock({ label, name, src, kind }: ThumbBlockProps) {
  const isNew = kind === "new";
  const frame = `${HERO_THUMB} ${isNew ? `${TINT_ACCENT} tw:border-2 tw:border-[var(--bk-accent)]` : `${TINT_WARM} tw:border ${HAIRLINE}`}`;
  return (
    <div className="tw:flex tw:flex-1 tw:items-center tw:gap-2.5">
      {src ? (
        <img
          src={src}
          alt=""
          className={`${frame} tw:object-cover`}
        />
      ) : (
        /* No src (a non-image asset, or one whose URL has expired) keeps the
           board's plain frame rather than a broken-image glyph. */
        <div className={frame} />
      )}
      <div>
        <div
          className={`tw:text-[11px] tw:font-semibold tw:uppercase tw:tracking-[0.04em] ${
            isNew ? "tw:text-[var(--bk-accent-text)]" : "tw:text-gray-500"
          }`}
        >
          {label}
        </div>
        <div className="tw:text-[13px] tw:font-medium">{name}</div>
      </div>
    </div>
  );
}

interface PageRowProps {
  page: ReplaceAcrossPageEntry;
  checked: boolean;
  onToggle: () => void;
}

function PageRow({ page, checked, onToggle }: PageRowProps) {
  return (
    <label
      className={`tw:flex tw:items-center tw:gap-3 tw:p-2.5 tw:rounded-md tw:border tw:cursor-pointer ${
        checked
          ? "tw:border-[var(--bk-accent)] tw:bg-[var(--bk-accent-tint)]"
          : `${HAIRLINE} tw:bg-transparent tw:opacity-70`
      }`}
    >
      <Checkbox
        color="blue"
        className="tw:bg-white tw:size-4"
        checked={checked}
        onChange={onToggle}
        aria-label={`Replace on ${page.pageName}`}
      />
      <div className="tw:flex tw:flex-1 tw:gap-1.5">
        <div className={`${ROW_THUMB} ${TINT_WARM}`} />
        <div className="tw:flex tw:items-center tw:px-1">
          <ArrowRight small />
        </div>
        <div
          className={`${ROW_THUMB} ${
            checked
              ? `${TINT_ACCENT} tw:border tw:border-[var(--bk-accent)]`
              : `tw:bg-[var(--bk-bg-subtle)] tw:border tw:border-dashed ${HAIRLINE}`
          }`}
        />
      </div>
      <div className="tw:flex-1 tw:min-w-0">
        <div className="tw:text-[13px] tw:font-medium">
          {page.pageName}
          {!checked && (
            <span className="tw:ml-1.5 tw:text-[10px] tw:font-normal tw:text-gray-500">(skipped)</span>
          )}
        </div>
        <div className="tw:text-[11px] tw:text-gray-500">
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
