/**
 * PageSwitcherMenu — the bottom bar's page list (Figma 2L9 `Shell/PageSwitcherMenu`
 * 558:4419, 260 wide: a 26 header, 32 rows on a 2px rhythm, a "Templates"
 * group under a hairline, then the actions).
 *
 * Board 558:448976 (B3-P28): a 12 regular header counting templates, file
 * glyphs (Home too), the path right-aligned in each row, the current page
 * tinted blue-100 with no check, a 12 "Templates" label under a gray-200
 * hairline, "Manage pages ›" in the accent.
 *
 * Behaviour the board does not draw, from the plan (Task 1.3, Review Focus 1
 * — 100 pages in ≤2 interactions; manifest `authority: code:search-add-page`):
 * a search field that is always there and focused on open, filtering by name
 * and slug, and "+ Add page" above "Manage pages ›". `aria-current="page"`
 * marks the active page. The list scrolls inside a 400px panel while the
 * search and the actions stay put.
 *
 * Keyboard (combobox + listbox): ↑/↓ move the highlighted row, Enter opens it.
 * Focus on open, Escape and outside clicks belong to the portalled Popover
 * this renders in — the search is the panel's first focusable control.
 *
 * @license BSD-3-Clause
 */
import React from "react";
import { File, Plus, Search } from "lucide-react";
import type { PageSummary } from "@/shared/types";
import { TextInput } from "./TextInput";
import { Row, ROW_ICON_CLASS, ROW_LABEL_CLASS } from "./Row";
import { plural } from "./issueCopy";

export interface PageSwitcherMenuProps {
  pages: readonly PageSummary[];
  activePageId: string | null;
  onSelect: (id: string) => void;
  onAddPage: () => void;
  onManagePages: () => void;
  /** Rows are listed but cannot be opened; this line says why. */
  disabledReason?: string;
}

const matches = (p: PageSummary, q: string) =>
  !q ||
  p.name.toLowerCase().includes(q) ||
  p.slug.toLowerCase().includes(q) ||
  (p.collectionName ?? "").toLowerCase().includes(q);

export function PageSwitcherMenu({
  pages,
  activePageId,
  onSelect,
  onAddPage,
  onManagePages,
  disabledReason,
}: PageSwitcherMenuProps) {
  const listId = React.useId();
  const [query, setQuery] = React.useState("");
  const q = query.trim().toLowerCase();
  const staticPages = pages.filter((p) => p.kind === "static");
  const templates = pages.filter((p) => p.kind === "template");
  const shownStatic = staticPages.filter((p) => matches(p, q));
  const shownTemplates = templates.filter((p) => matches(p, q));
  /* One ordered list for the arrow keys — the order on screen. */
  const shown = [...shownStatic, ...shownTemplates];

  const [highlight, setHighlight] = React.useState<string | null>(activePageId);
  const current = shown.some((p) => p.id === highlight) ? highlight : (shown[0]?.id ?? null);
  const optionId = (id: string) => `${listId}-${id}`;

  React.useEffect(() => {
    if (!current) return;
    document.getElementById(optionId(current))?.scrollIntoView?.({ block: "nearest" });
    // eslint-disable-next-line react-hooks/exhaustive-deps -- optionId derives from the stable listId
  }, [current]);

  const choose = (id: string) => {
    if (!disabledReason) onSelect(id);
  };

  const onKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "ArrowDown" || e.key === "ArrowUp") {
      e.preventDefault();
      if (shown.length === 0) return;
      const at = shown.findIndex((p) => p.id === current);
      const step = e.key === "ArrowDown" ? 1 : -1;
      setHighlight(shown[(at + step + shown.length) % shown.length].id);
    } else if (e.key === "Enter" && current) {
      e.preventDefault();
      choose(current);
    }
  };

  const header = `Pages · ${staticPages.length}${templates.length ? ` + ${plural(templates.length, "template")}` : ""}`;

  const option = (p: PageSummary) => {
    const active = p.id === activePageId;
    const template = p.kind === "template";
    return (
      <Row
        key={p.id}
        id={optionId(p.id)}
        role="option"
        interactive
        tabIndex={-1}
        selected={p.id === current}
        aria-current={active ? "page" : undefined}
        disabled={Boolean(disabledReason)}
        aria-label={template ? `${p.collectionName ?? p.name} · ${p.slug}` : undefined}
        title={disabledReason}
        data-testid={`page-switcher-row-${p.id}`}
        className={`${OPTION_CLASS} ${active ? CURRENT_CLASS : HIGHLIGHT_CLASS}`}
        onMouseEnter={() => setHighlight(p.id)}
        onClick={() => choose(p.id)}
      >
        {p.depth ? <span aria-hidden="true" className={`tw:flex-none ${INDENT[Math.min(p.depth, INDENT.length - 1)]}`} /> : null}
        {/* The board draws Home with the same file glyph as every page; the
            home role stays in its accessible name. */}
        {p.isHome ? (
          <span className={GLYPH_CLASS} role="img" aria-label="Homepage">
            <File size={24} aria-hidden="true" />
          </span>
        ) : (
          <span className={GLYPH_CLASS} aria-hidden="true">
            <File size={24} />
          </span>
        )}
        <span className={ROW_LABEL_CLASS}>{template ? (p.collectionName ?? p.name) : p.name}</span>
        <span className="tw:min-w-0 tw:max-w-[50%] tw:flex-none tw:truncate tw:text-right tw:text-[12px] tw:text-[var(--bk-ink-muted)]">{p.slug}</span>
        {p.dirty ? (
          <span role="img" aria-label="unsaved changes" className="tw:size-1.5 tw:flex-none tw:rounded-full tw:bg-[var(--bk-warning)]" />
        ) : null}
      </Row>
    );
  };

  return (
    <div className="tw:flex tw:max-h-[386px] tw:w-[246px] tw:flex-col" data-testid="page-switcher-menu">
      <div className="tw:flex tw:h-[26px] tw:flex-none tw:items-center tw:px-2 tw:text-[12px] tw:text-[var(--bk-ink-muted)]">
        {header}
      </div>
      <div className="tw:flex-none tw:pb-1">
        <TextInput
          type="text"
          icon={SearchIcon}
          value={query}
          placeholder="Search pages"
          aria-label="Search pages"
          role="combobox"
          aria-expanded="true"
          aria-controls={listId}
          aria-autocomplete="list"
          aria-activedescendant={current ? optionId(current) : undefined}
          onChange={(e) => {
            setQuery(e.target.value);
            setHighlight(null);
          }}
          onKeyDown={onKeyDown}
          data-testid="page-switcher-search"
        />
      </div>
      {disabledReason ? (
        <p className="tw:m-0 tw:flex-none tw:px-2 tw:py-1 tw:text-[12px] tw:text-[var(--bk-ink-muted)]" data-testid="page-switcher-disabled">
          {disabledReason}
        </p>
      ) : null}
      <div
        id={listId}
        role="listbox"
        aria-label="Pages"
        className="tw:flex tw:min-h-0 tw:flex-1 tw:flex-col tw:gap-0.5 tw:overflow-y-auto"
      >
        {shownStatic.map(option)}
        {shownTemplates.length ? (
          <div role="group" aria-label="Templates" className="tw:flex tw:flex-col tw:gap-0.5">
            <div role="presentation" className={DIVIDER} />
            <div role="presentation" className="tw:flex tw:h-5 tw:items-center tw:px-2 tw:text-[12px] tw:text-[var(--bk-ink-muted)]">
              Templates
            </div>
            {shownTemplates.map(option)}
          </div>
        ) : null}
        {shown.length === 0 ? (
          <p role="status" className="tw:m-0 tw:px-2 tw:py-2 tw:text-[12px] tw:text-[var(--bk-ink-muted)]">
            {pages.length === 0 ? "No pages" : `No pages match '${query.trim()}'`}
          </p>
        ) : null}
      </div>
      <div className="tw:flex tw:flex-none tw:flex-col tw:gap-0.5 tw:pt-0.5">
        <div role="presentation" className={DIVIDER} />
        <Row interactive className="tw:px-2! tw:rounded-md" data-testid="page-switcher-add" onClick={onAddPage}>
          <span className={ROW_ICON_CLASS} aria-hidden="true">
            <Plus size={14} />
          </span>
          <span className={ROW_LABEL_CLASS}>Add page</span>
        </Row>
        <Row interactive className="tw:px-2! tw:rounded-md" data-testid="page-switcher-manage" onClick={onManagePages}>
          <span className={`${ROW_LABEL_CLASS} tw:text-[var(--bk-accent-text)]`}>Manage pages ›</span>
        </Row>
      </div>
    </div>
  );
}

/** 16px per nesting level, capped at three. */
const INDENT = ["", "tw:w-4", "tw:w-8", "tw:w-12"];
const DIVIDER = "tw:my-px tw:h-px tw:flex-none tw:bg-[var(--bk-gray-200)]";
/* Row's aria-selected look (blue-50 + accent text + 3px bar) is the
   keyboard/hover highlight here, so it is drawn as a plain hover: the
   board's only tint is the current page's. `!` because Row concatenates
   classes (no twMerge) and these restate BASE's own properties. */
const OPTION_CLASS = "tw:px-2! tw:gap-2.5! tw:rounded-md tw:aria-selected:before:hidden tw:aria-selected:text-[var(--bk-ink)]!";
const HIGHLIGHT_CLASS = "tw:aria-selected:bg-[var(--bk-gray-100)]!";
const CURRENT_CLASS = "tw:bg-[var(--bk-blue-100)]!";
/* 24 file glyph (16×20 ink) in gray-600 — board ≈18×22, #4B5563. */
const GLYPH_CLASS = "tw:flex-none tw:inline-flex tw:text-[var(--bk-gray-600)]";

function SearchIcon(props: React.SVGProps<SVGSVGElement>) {
  return <Search size={14} aria-hidden="true" {...props} />;
}
