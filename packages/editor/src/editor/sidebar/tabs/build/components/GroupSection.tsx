/**
 * GroupSection — one Insert group, boards 1069:4529/4707/4790/4970: a
 * 28-pixel header (▾/▸ chevron, caps label, live count right-aligned) over
 * 28-pixel list rows indented to the label.
 *
 * Replaces CatAccordion in the default view. CatAccordion's category IA
 * survives only inside SearchResults grouping.
 *
 * @license BSD-3-Clause
 */

import * as React from "react";
import type { FlatElEntry } from "../catalog/types";
import type { BlockDefinition } from "../../../../../blocks/blockRegistry";
import type { ComponentDefinition } from "../../../../../shared/types/components";
import type { InsertGroup } from "../catalog/groups";
import type { BlockDragStartFn, DragStartFn, ElClickFn } from "../hooks/useBuildTab";
import { BK_TOOLTIP_CLASS, Button, Tooltip } from "@/editor/chrome-ui";
import { BlockThumb } from "./BlockThumb";

interface GroupSectionProps {
  group: InsertGroup;
  isOpen: boolean;
  onToggle: () => void;
  elements?: FlatElEntry[];
  blocks?: BlockDefinition[];
  /** COMPONENTS (board 1069:4790): the registry's component blocks as rows. */
  components?: BlockDefinition[];
  /** MINE (board 1069:4970): the user's own components as plain rows. */
  mine?: ComponentDefinition[];
  /** FROM LIBRARY (board 4418:99857): the workspace's shared masters, listed
   *  under SAVED COMPONENTS before "Manage components ›". */
  library?: ReadonlyArray<{ componentId: string; name: string }>;
  onLibraryInsert?: (componentId: string) => void;
  onDragStart: DragStartFn;
  /** Board 4428:140817's grip — a block card drags onto the canvas too. */
  onBlockDragStart?: BlockDragStartFn;
  onElClick: ElClickFn;
  onBlockInsert?: (block: BlockDefinition) => void;
  onMineInsert?: (component: ComponentDefinition) => void;
  /** "Manage components ›" at the end of SAVED COMPONENTS (4418:99857). */
  onManageComponents?: () => void;
  /** ★ on element rows (G2-115): which names are favourites, and the toggle. */
  favs?: Set<string>;
  onToggleFav?: (name: string) => void;
}

/** Board 1069:4979 group header: dense row · ▾/▸ 11 · LABEL 11/600 caps tracking .5 · count 11/400 right.
 *
 *  The count is --bk-ink-muted, not the board's ink-placeholder. That token is
 *  `var(--bk-gray-400)` — the SAME value as --bk-border-strong and --bk-border-input — so
 *  the board asks a border colour to paint a number: 2.54:1 on white, measured
 *  on four counts, against a 4.5 floor. --bk-ink-muted measures 4.83 and is the
 *  chrome-furniture ink DESIGN.md:518 already names for exactly this.
 *
 *  `py-[6px]` is the board's own box, not a number chased for a diff: 28 - 6 - 6
 *  is 16, exactly the label's line box, so the padded box and `align-items:
 *  center` render identically. What was there instead was flowbite's own 1px,
 *  which is nobody's decision. Where a board's vertical padding does NOT close
 *  like that — the list rows below say h-28 with py-5 around a 20px line box —
 *  it is auto-layout noise and the centring stands. */
const HeaderRow: React.FC<{ group: InsertGroup; isOpen: boolean; onToggle: () => void }> = ({
  group, isOpen, onToggle,
}) => (
  <Button
    type="button"
    color="light"
    className="bld-group-header tw:flex tw:items-center tw:justify-start tw:w-full tw:h-[var(--bk-size-row-dense)] tw:py-[6px] tw:pl-[var(--bk-space-12)] tw:pr-[var(--bk-space-16)] tw:gap-[6px] tw:bg-transparent tw:border-0 tw:rounded-none tw:cursor-pointer tw:text-left tw:shadow-none"
    aria-expanded={isOpen}
    data-testid={`insert-group-${group.id}`}
    onClick={onToggle}
  >
    <span className="tw:text-[11px] tw:leading-[16px] tw:text-[var(--bk-ink-muted)]" aria-hidden="true">
      {isOpen ? "▾" : "▸"}
    </span>
    <span
      data-testid={`insert-group-label-${group.id}`}
      className="tw:flex-1 tw:text-[11px] tw:leading-[16px] tw:font-semibold tw:tracking-[0.5px] tw:text-[var(--bk-ink-muted)]"
    >
      {group.label}
    </span>
    {group.count != null && (
      <span
        data-testid={`insert-group-count-${group.id}`}
        className="tw:text-[11px] tw:leading-[16px] tw:text-[var(--bk-ink-muted)] tw:tabular-nums"
      >
        {group.count}
      </span>
    )}
  </Button>
);

/** Board 1069:4999 list row: dense · rounded-4 · 14 icon · 13/400 label,
 *  indented past the group chevron. `pinned` switches to board 1069:5011's
 *  ⌥ Paste HTML… band, which is a full-height row at the panel inset with
 *  12/400 soft-ink text and no icon slot. Exported for BuildTab.
 *
 *  The label and icon carry conformance anchors derived from the row's own
 *  testId. `insert-row-label-${testId}` and not `${testId}-label`, because
 *  check-anchors resolves a template only through the text BEFORE the
 *  interpolation — a trailing suffix greps as an absent anchor. */
export const Row: React.FC<{
  label: string;
  /**
   * The element's own glyph — `ElEntry.iconHtml`, the inner markup of a
   * `viewBox="0 0 24 24"` svg. Rows without one (blocks, components, the
   * user's own) keep the plain square.
   */
  iconHtml?: string;
  /** Board 1069:5011 draws the Paste-HTML row with no icon slot at all. */
  noIcon?: boolean;
  /** Pinned band (board 1069:5011): standard row height, panel inset, 12/400 soft. */
  pinned?: boolean;
  /** Board 138:198: disabled row = "Soon" tag + reason tooltip + no insert.
   *  "Disabled without a reason is a bug" — the Button component doc. */
  disabled?: boolean;
  disabledReason?: string;
  /** Enabled rows: hover/focus reports the row so the list can show its
   *  one-line description (G2-108, board 4418:103591). */
  onHoverChange?: (row: HTMLElement | null) => void;
  testId: string;
  /** Board 4418:99857's trailing ⠿ — a drag hint; the row is the handle. */
  grip?: boolean;
  /** ★ favourite toggle (G2-115): shown on hover. */
  fav?: { on: boolean; onToggle: () => void; testId: string };
  draggable?: boolean;
  onDragStart?: (e: React.DragEvent) => void;
  onClick: () => void;
}> = ({ label, iconHtml, noIcon, pinned, disabled, disabledReason, onHoverChange, testId, grip, fav, draggable, onDragStart, onClick }) => {
  const row = (
    <div
      role="button"
      tabIndex={disabled ? -1 : 0}
      aria-disabled={disabled || undefined}
      draggable={disabled ? false : draggable}
      className={`tw:group tw:flex tw:items-center tw:gap-[8px] tw:rounded-[4px] tw:select-none ${
        pinned
          ? "tw:h-[var(--bk-size-row)] tw:px-[var(--bk-space-16)]"
          : "tw:h-[var(--bk-size-row-dense)] tw:pl-[var(--bk-space-28)] tw:pr-[var(--bk-space-16)]"
      } ${
        disabled
          ? "tw:cursor-not-allowed"
          : "tw:cursor-pointer hover:tw:bg-[var(--bk-bg-subtle)]"
      }`}
      data-testid={testId}
      onMouseEnter={onHoverChange ? (e) => onHoverChange(e.currentTarget) : undefined}
      onMouseLeave={onHoverChange ? () => onHoverChange(null) : undefined}
      onFocus={onHoverChange ? (e) => onHoverChange(e.currentTarget) : undefined}
      onBlur={onHoverChange ? () => onHoverChange(null) : undefined}
      onClick={disabled ? undefined : onClick}
      onDragStart={disabled ? undefined : onDragStart}
      onKeyDown={(e) => {
        if (disabled) return;
        if (e.key === "Enter" || e.key === " ") { e.preventDefault(); onClick(); }
      }}
    >
      {/* Every element row drew the same solid square — a founder
          call from 2026-08-06, taken from the board's List-row icon. It made 53
          element types visually identical in the first panel a user opens, and
          it is the top row of this arc's ledger.

          The artwork was never missing. `ElEntry.iconHtml` carries a distinct
          hand-drawn glyph for every catalog entry — 59 entries, 53 distinct —
          and nothing has ever rendered one. The inspector, meanwhile, shows a
          real per-type lucide glyph for the SAME element (`ProInspector.tsx`
          via `elementIcons.tsx`), so the product disagreed with itself about
          whether an element has a face.

          Reverting is this block. The square is still what a row with no
          artwork of its own gets — board 1069:4999 draws it at 14 on soft ink. */}
      {noIcon ? null : iconHtml ? (
        <svg
          viewBox="0 0 24 24"
          width={14}
          height={14}
          fill="none"
          stroke="currentColor"
          strokeWidth={1.5}
          strokeLinecap="round"
          strokeLinejoin="round"
          className="tw:shrink-0 tw:text-[var(--bk-ink-muted)]"
          data-testid={`insert-row-icon-${testId}`}
          aria-hidden="true"
          /* Static markup compiled into the bundle from our own catalog — no
             user input reaches this, and no request fetches it. */
          dangerouslySetInnerHTML={{ __html: iconHtml }}
        />
      ) : (
        <span className="tw:size-[14px] tw:rounded-[2px] tw:bg-[var(--bk-ink-soft)] tw:shrink-0" data-testid={`insert-row-icon-${testId}`} aria-hidden="true" />
      )}
      <span
        data-testid={`insert-row-label-${testId}`}
        className={`tw:flex-1 tw:min-w-0 tw:truncate ${
          pinned
            ? "tw:text-[12px] tw:leading-[18px] tw:text-[var(--bk-ink-soft)]"
            : "tw:text-[13px] tw:leading-[20px] tw:text-[var(--bk-ink)]"
        }`}
      >
        {label}
        {disabled && (
          <span className="tw:ml-[var(--bk-space-12)] tw:text-[13px] tw:text-[var(--bk-ink-muted)]">Soon</span>
        )}
      </span>
      {fav ? (
        <span
          role="button"
          tabIndex={0}
          aria-pressed={fav.on}
          aria-label={fav.on ? `Remove ${label} from favourites` : `Add ${label} to favourites`}
          data-testid={fav.testId}
          /* Hover-only either way: the boards draw element rows without it. */
          className={`tw:w-[20px] tw:shrink-0 tw:text-center tw:text-[12px] tw:cursor-pointer tw:opacity-0 tw:group-hover:opacity-100 tw:focus-visible:opacity-100 ${
            fav.on ? "tw:text-[var(--bk-accent)]" : "tw:text-[var(--bk-ink-muted)]"
          }`}
          onClick={(e) => {
            e.stopPropagation();
            fav.onToggle();
          }}
          onKeyDown={(e) => {
            if (e.key === "Enter" || e.key === " ") { e.preventDefault(); e.stopPropagation(); fav.onToggle(); }
          }}
        >
          {fav.on ? "★" : "☆"}
        </span>
      ) : null}
      {grip ? (
        <span
          aria-hidden="true"
          data-testid={`insert-row-grip-${testId}`}
          className="tw:w-[28px] tw:shrink-0 tw:text-center tw:text-[12px] tw:text-[var(--bk-gray-400)] tw:cursor-grab"
        >
          ⠿
        </span>
      ) : null}
    </div>
  );

  // Board 138:198: the disabled row's tooltip IS the reason ("Video blocks
  // need a media provider connected" is that board's sample). Ink bg, white
  // 12px — the Tooltip primitive's dark style.
  return disabled && disabledReason ? (
    <Tooltip content={disabledReason} placement="bottom" arrow={false} theme={{ target: "tw:w-full" }}>
      {row}
    </Tooltip>
  ) : (
    row
  );
};

/* One description bubble per list, not a flowbite Tooltip per row: 53
   tooltips (floating-ui each) made the drawer's first render 6–10s under
   test load, against ~0.5s without them. The bubble sits under the hovered
   (or focused) row — the same dark 12px surface as chrome-ui's Tooltip. */
const ElementRows: React.FC<{
  group: ElementRowGroup;
  elements: FlatElEntry[];
  favs?: Set<string>;
  onToggleFav?: (name: string) => void;
  onDragStart: DragStartFn;
  onElClick: ElClickFn;
}> = ({ group, elements, favs, onToggleFav, onDragStart, onElClick }) => {
  const [tip, setTip] = React.useState<{ text: string; top: number } | null>(null);
  return (
    <div className="tw:relative">
      {elements.map((el) => (
        <Row
          key={`${el.catId}-${el.name}`}
          label={el.name}
          iconHtml={el.iconHtml}
          disabled={el.disabled}
          disabledReason={el.disabled ? el.description : undefined}
          onHoverChange={
            el.disabled
              ? undefined
              : (row) => setTip(row ? { text: el.description, top: row.offsetTop + row.offsetHeight + 4 } : null)
          }
          testId={elRowTestId(group, el.name)}
          fav={
            onToggleFav && !el.disabled
              ? { on: favs?.has(el.name) ?? false, onToggle: () => onToggleFav(el.name), testId: elFavTestId(group, el.name) }
              : undefined
          }
          draggable
          onDragStart={(e) => onDragStart(e, el)}
          onClick={() => onElClick(el)}
        />
      ))}
      {tip && (
        <div
          role="tooltip"
          data-testid={`insert-${group === "elements" ? "el" : group === "favourites" ? "fav" : "recent"}-tip`}
          style={{ top: tip.top }}
          className={`tw:pointer-events-none tw:absolute tw:left-2 tw:z-10 tw:max-w-[264px] tw:bg-[var(--bk-gray-900)] tw:font-medium tw:shadow-sm ${BK_TOOLTIP_CLASS}`}
        >
          {tip.text}
        </div>
      )}
    </div>
  );
};

/** Groups that list element rows. Their test ids are literal templates on
 *  the declaring lines so the conformance anchor check can see them. */
type ElementRowGroup = "favourites" | "recent" | "elements";
const isElementRowGroup = (id: InsertGroup["id"]): id is ElementRowGroup => id === "favourites" || id === "recent" || id === "elements";
const elRowTestId = (g: ElementRowGroup, n: string) => (g === "favourites" ? `insert-fav-${n}` : g === "recent" ? `insert-recent-${n}` : `insert-el-${n}`);
const elFavTestId = (g: ElementRowGroup, n: string) => (g === "favourites" ? `insert-fav-fav-${n}` : g === "recent" ? `insert-recent-fav-${n}` : `insert-el-fav-${n}`);

export const GroupSection: React.FC<GroupSectionProps> = ({
  group, isOpen, onToggle, elements, blocks, components, mine, library, onLibraryInsert, onDragStart, onBlockDragStart, onElClick, onBlockInsert, onMineInsert, onManageComponents, favs, onToggleFav,
}) => (
  <div data-testid={`insert-section-${group.id}`}>
    <HeaderRow group={group} isOpen={isOpen} onToggle={onToggle} />
    {isOpen && isElementRowGroup(group.id) && elements && (
      <ElementRows
        group={group.id}
        elements={elements}
        favs={favs}
        onToggleFav={onToggleFav}
        onDragStart={onDragStart}
        onElClick={onElClick}
      />
    )}
    {/* Board 138:2: BLOCKS is a CARD GRID, not rows — `Card / media` (17:6):
        136×104, 136×76 thumb (4:3) on bg-subtle + a 12px label. Thumb is the
        block's preview when it has one, empty until then — the board names it
        "thumb/site-preview (empty until first publish)".

        The note here used to read "Two columns at 320w: 16+136+16+136+16 = 320
        EXACTLY". That arithmetic is right about the PANEL and wrong about its
        content box, and being one pixel out cost the grid entirely — see the
        note on the grid container below. */}
    {/* Board 1069:4790 (components-expanded): registry component blocks as
        plain rows — same Row treatment, same onBlockClick insert path
        (BlockDefinition extends BlockData). */}
    {isOpen && group.id === "components" && components?.map((c) => (
      <Row
        key={c.id}
        label={c.label}
        testId={`insert-component-${c.id}`}
        onClick={() => onBlockInsert?.(c)}
      />
    ))}
    {isOpen && group.id === "mine" && mine && (
      <>
        {/* Board 4418:99857: dense rows with a ⠿ grip; each drags onto the
            canvas as a component id (the drop instantiates it). */}
        {mine.map((c) => (
          <Row
            key={c.id}
            label={c.name}
            testId={`insert-mine-${c.id}`}
            grip
            draggable
            onDragStart={(e) => {
              e.dataTransfer.setData("application/x-aquibra-component", c.id);
              e.dataTransfer.effectAllowed = "copy";
            }}
            onClick={() => onMineInsert?.(c)}
          />
        ))}
        {mine.length === 0 && !library?.length && (
          <p
            data-testid="insert-mine-empty"
            className="tw:m-0 tw:pl-[var(--bk-space-28)] tw:pr-[var(--bk-space-16)] tw:py-[var(--bk-space-4)] tw:text-[12px] tw:leading-[18px] tw:text-[var(--bk-ink-muted)]"
          >
            No saved components yet. Select an element and choose Save as component.
          </p>
        )}
        {library && library.length > 0 && (
          <>
            <div
              data-testid="insert-library-label"
              className="tw:flex tw:items-center tw:h-[var(--bk-size-row-dense)] tw:pl-[var(--bk-space-28)] tw:pr-[var(--bk-space-16)] tw:text-[11px] tw:leading-[16px] tw:font-semibold tw:tracking-[.5px] tw:text-[var(--bk-ink-muted)]"
            >
              FROM LIBRARY
            </div>
            {library.map((c) => (
              <Row
                key={c.componentId}
                label={c.name}
                testId={`insert-library-${c.componentId}`}
                onClick={() => onLibraryInsert?.(c.componentId)}
              />
            ))}
          </>
        )}
        {onManageComponents && (
          <div
            role="button"
            tabIndex={0}
            data-testid="insert-mine-manage"
            className="tw:flex tw:items-center tw:h-[var(--bk-size-row-dense)] tw:pl-[var(--bk-space-28)] tw:pr-[var(--bk-space-16)] tw:rounded-[4px] tw:cursor-pointer tw:text-[13px] tw:leading-[20px] tw:text-[var(--bk-ink)] hover:tw:bg-[var(--bk-bg-subtle)]"
            onClick={onManageComponents}
            onKeyDown={(e) => {
              if (e.key === "Enter" || e.key === " ") { e.preventDefault(); onManageComponents(); }
            }}
          >
            Manage components ›
          </div>
        )}
      </>
    )}
    {/* A GRID, because the flex-wrap version missed two columns by ONE pixel
        and nobody could see why. Board 138:2 draws two cards side by side and
        the arithmetic under it reads 16 + 136 + 16 + 136 + 16 = 320 — right
        about the panel, wrong about its content box: `.ls-panel` carries a
        `border-right: 1px`, so clientWidth is 319 and the content box 287, one
        short of the 288 two fixed cards need. Measured live: 50 cards, 50
        rows, one card per row, a 5700px column. `auto-fill` with a min under
        the card width cannot lose that way, and it earns the expanded drawer
        (560/700) more columns instead of two marooned cards. */}
    {isOpen && group.id === "blocks" && (
      <>
        <div data-testid="insert-blocks-grid" className="tw:grid tw:grid-cols-2 tw:gap-[8px] tw:px-[var(--bk-space-16)] tw:py-[var(--bk-space-4)]">
          {/* Board 4428:140817 / 4428:145110: a card is its thumbnail over its
              name; hovered, it names what it is and offers "Add <name>" or the
              drag. The card IS the drag source — the board's grip is a hint,
              not a separate handle. */}
          {blocks?.map((b) => (
            <div
              key={b.id}
              role="button"
              tabIndex={0}
              draggable={Boolean(onBlockDragStart)}
              className="tw:group tw:flex tw:flex-col tw:gap-[6px] tw:min-w-0 tw:cursor-pointer tw:select-none tw:rounded-[var(--bk-radius-md)] tw:outline-none tw:focus-visible:[box-shadow:var(--bk-shadow-focus)]"
              data-testid={`insert-block-${b.id}`}
              aria-label={`Add ${b.label}`}
              title={b.description ? `${b.description} — click to add, or drag it onto the canvas` : `Click to add ${b.label}, or drag it onto the canvas`}
              onClick={() => onBlockInsert?.(b)}
              onDragStart={onBlockDragStart ? (e) => onBlockDragStart(e, b) : undefined}
              onKeyDown={(e) => {
                if (e.key === "Enter" || e.key === " ") { e.preventDefault(); onBlockInsert?.(b); }
              }}
            >
              {b.preview ? (
                <img
                  src={b.preview}
                  alt=""
                  className="tw:h-[65px] tw:w-full tw:rounded-[var(--bk-radius-md)] tw:object-cover tw:border tw:border-[var(--bk-border)] tw:group-hover:border-[var(--bk-accent)]"
                  data-testid={`insert-block-thumb-${b.id}`}
                />
              ) : (
                <BlockThumb
                  blockId={b.id}
                  className="tw:h-[65px] tw:w-full tw:rounded-[var(--bk-radius-md)] tw:bg-[var(--bk-bg-subtle)] tw:border tw:border-[var(--bk-border)] tw:group-hover:border-[var(--bk-accent)]"
                />
              )}
              <div className="tw:flex tw:items-center tw:justify-between tw:gap-1 tw:min-w-0">
                <p data-testid={`insert-block-label-${b.id}`} className="tw:m-0 tw:text-[11px] tw:leading-[16px] tw:text-[var(--bk-ink-soft)] tw:truncate tw:group-hover:text-[var(--bk-ink)]">
                  {b.label}
                </p>
                {/* The board's Insert pill, hover-revealed (DESIGN.md anti-slop
                    12: actions reveal on hover, never a per-row strip). */}
                <span
                  aria-hidden="true"
                  data-testid={`insert-block-pill-${b.id}`}
                  className="tw:hidden tw:group-hover:inline-flex tw:h-4 tw:shrink-0 tw:items-center tw:rounded-full tw:bg-[var(--bk-accent-tint)] tw:px-1.5 tw:text-[11px] tw:leading-4 tw:font-medium tw:text-[var(--bk-accent-text)]"
                >
                  Add
                </span>
              </div>
            </div>
          ))}
        </div>
        {/* Board 4428:140817's footnote under the grid. */}
        <p data-testid="insert-blocks-note" className="tw:m-0 tw:px-[var(--bk-space-16)] tw:pb-[var(--bk-space-8)] tw:text-[11px] tw:leading-[16px] tw:text-[var(--bk-ink-muted)]">
          Blocks use your Brand colours and fonts.
        </p>
      </>
    )}
  </div>
);

export default GroupSection;
