/**
 * IconBrowserOverlay — the icon-picker drill-in, board 147:2.
 *
 * The caption's contract: "370 icons across 17 categories: category list →
 * 6-up grid at 40×40 · search · recent 12." Anatomy: shared Media header,
 * `‹ Icons` back row, a "Search N icons" box, a category row (All ▾ dropdown
 * left, "N categories" in mono right), a RECENT group band (12, most recent
 * first) and the 6-column 40×40 tile grid.
 *
 * Selecting a tile inserts the icon on the canvas with defaults and pops back
 * to the grid — the size/colour/stroke controls live in IconPickerModal, which
 * stays the inspector's element-config flow. Recents are SHARED with that
 * modal via STORAGE_KEYS.RECENT_ICONS (one list, two doors).
 *
 * @license BSD-3-Clause
 */

import * as React from "react";
import { Button, Menu, MenuItem, PanelFrame, Popover, TextField } from "@/editor/chrome-ui";
import {
  ICON_CATEGORIES,
  getAllIcons,
  getIconByName,
  getIconCount,
  getIconsByCategory,
  searchIcons,
  type IconDefinition,
} from "@/shared/constants/icons";
import { STORAGE_KEYS } from "@/shared/constants/storageKeys";

interface IconBrowserOverlayProps {
  /** Back to the media grid (the ‹ row; ESC does the same). */
  onClose(): void;
  /** Insert the picked icon — the drawer's one job for this screen. */
  onPick(icon: IconDefinition): void;
}

const MAX_RECENT = 12;

function readRecent(): string[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEYS.RECENT_ICONS);
    const parsed = raw ? (JSON.parse(raw) as string[]) : [];
    return Array.isArray(parsed) ? parsed.slice(0, MAX_RECENT) : [];
  } catch {
    return [];
  }
}

/* 75:34 — a tile is 40 tall and fills its track (42.67 at this width), not a
   fixed 40 square floated in the middle of one. */
const TILE =
  "tw:flex tw:h-10 tw:w-full tw:items-center tw:justify-center tw:rounded tw:border-0 tw:bg-[var(--bk-bg-subtle)] " +
  "tw:p-0 tw:text-[var(--bk-ink)] tw:enabled:hover:bg-[var(--bk-accent-subtle,#ebf5ff)]";
/* 220:827 — 28 tall, 16 inset, 8 gap. The gap was absent because the label
   grows with flex-1, which hides the difference until the count is short.
   `shrink-0` is the load-bearing one: this band is a flex item in a column
   whose content overflows, so `h-7` was being compressed to 16 — measured, not
   theorised. The band ships squashed today on every screen that has recents. */
const GROUP_HDR =
  "tw:flex tw:h-7 tw:w-full tw:shrink-0 tw:items-center tw:gap-2 tw:bg-[var(--bk-bg-subtle)] tw:px-4 tw:text-[11px] " +
  "tw:font-medium tw:leading-4 tw:tracking-[0.5px] tw:text-[var(--bk-ink-muted)]";

export function IconBrowserOverlay({ onClose, onPick }: IconBrowserOverlayProps) {
  const [search, setSearch] = React.useState("");
  const [category, setCategory] = React.useState<string>("all");
  const [catMenuOpen, setCatMenuOpen] = React.useState(false);
  const [recent, setRecent] = React.useState<string[]>(readRecent);
  const overlayRef = React.useRef<HTMLDivElement>(null);

  React.useEffect(() => {
    const el = overlayRef.current;
    if (!el) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        e.preventDefault();
        e.stopPropagation();
        onClose();
      }
    };
    // Capture on document — see AssetDetailOverlay: window-bubble is the last
    // stop on the event path and the easiest position to be preempted from.
    document.addEventListener("keydown", onKey, true);
    return () => document.removeEventListener("keydown", onKey, true);
  }, [onClose]);

  const icons = React.useMemo(() => {
    if (search.trim()) return searchIcons(search.trim());
    if (category !== "all") return getIconsByCategory(category);
    return getAllIcons();
  }, [search, category]);

  const recentIcons = React.useMemo(
    () =>
      recent
        .map((name) => getIconByName(name))
        .filter((i): i is IconDefinition => !!i)
        .slice(0, MAX_RECENT),
    [recent],
  );
  const showRecent = !search.trim() && category === "all" && recentIcons.length > 0;

  const pick = React.useCallback(
    (icon: IconDefinition) => {
      const next = [icon.name, ...recent.filter((n) => n !== icon.name)].slice(0, MAX_RECENT);
      setRecent(next);
      try {
        localStorage.setItem(STORAGE_KEYS.RECENT_ICONS, JSON.stringify(next));
      } catch {
        // Storage unavailable — the pick still works.
      }
      onPick(icon);
      onClose();
    },
    [recent, onPick, onClose],
  );

  const categoryLabel =
    category === "all" ? "All" : ICON_CATEGORIES.find((c) => c.id === category)?.label ?? "All";

  const grid = (list: IconDefinition[], testid: string) => (
    <div
      /* Board 75:25 draws the picker SIX up on a 12 gutter (75:30's body is
         px 12, pt 6, pb 12), which makes each track 42.67 wide. It shipped
         five up at a 16 gutter — and this file's own docstring said "6-up
         grid" the whole time, so the markup was the thing that drifted. */
      className="tw:grid tw:grid-cols-6 tw:gap-2 tw:px-3 tw:pt-1.5 tw:pb-3"
      data-testid={testid}
    >
      {list.map((icon) => {
        const Cmp = icon.component;
        return (
          <Button
            key={icon.name}
            data-testid={`icon-tile-${icon.name}`}
            className={TILE}
            title={icon.name}
            aria-label={`Insert ${icon.name} icon`}
            onClick={() => pick(icon)}
          >
            <Cmp size={18} strokeWidth={2} aria-hidden="true" />
          </Button>
        );
      })}
    </div>
  );

  return (
    <div
      ref={overlayRef}
      /* Board 147:2 gives the drill-in frame the drawer's own
         --flowbite/gray/100 edge. With no border set at all the computed
         border-color reads #000000, the initial value — the identical defect
         boards 144:2 and 146:2 already found on SlimLauncher and the asset
         detail overlay. */
      className="tw:absolute tw:inset-0 tw:z-10 tw:flex tw:flex-col tw:items-stretch tw:overflow-y-auto tw:border tw:border-[var(--bk-gray-100)] tw:bg-[var(--bk-bg-panel,white)]"
      role="dialog"
      aria-modal="true"
      aria-label="Icon picker"
      data-testid="media-icon-browser"
    >
      <PanelFrame.Header title="Assets" onClose={onClose} />

      <Button
        variant="link" className="tw:flex tw:h-9 tw:shrink-0 tw:w-full tw:items-center tw:justify-start tw:px-4 tw:text-left"
        data-testid="media-icon-back"
        onClick={onClose}
        aria-label="Back to media grid"
      >
        {"‹"}&nbsp;&nbsp;Icons
      </Button>

      {/* Board 147:6 — "Search 370 icons", the real catalog count. */}
      <div className="tw:flex tw:h-9 tw:shrink-0 tw:items-center tw:px-4">
        <TextField
          type="text"
          className="tw:h-[var(--bk-size-row)] tw:w-full tw:rounded-md tw:border tw:border-[var(--bk-gray-200)] tw:bg-[var(--bk-gray-50)] tw:px-[var(--bk-space-8)] tw:text-[length:var(--bk-text-12)] tw:text-[var(--bk-ink)] tw:placeholder:text-[var(--bk-gray-500)]"
          placeholder={`Search ${getIconCount()} icons`}
          value={search}
          onChange={(e: React.ChangeEvent<HTMLInputElement>) => setSearch(e.target.value)}
          aria-label="Search icons"
        />
      </div>

      {/* Category row — All ▾ dropdown left, "N categories" mono right. */}
      <div className="tw:flex tw:h-8 tw:shrink-0 tw:items-center tw:gap-2 tw:px-4" data-testid="media-icon-categories">
        <Popover
          open={catMenuOpen}
          onClose={() => setCatMenuOpen(false)}
          placement="bottom"
          label="Icon category"
          trigger={
            <Button
              type="button"
              color="light"
              size="xs"
              className="tw:min-h-6 tw:gap-1 tw:border-0 tw:bg-transparent tw:px-0 tw:text-[12px] tw:leading-[18px] tw:text-[var(--bk-ink)] tw:enabled:hover:bg-transparent"
              aria-expanded={catMenuOpen}
              data-testid="icon-category-scope"
              onClick={() => setCatMenuOpen((v) => !v)}
            >
              <span>{categoryLabel}</span>
              <span aria-hidden="true" className="tw:text-[length:var(--bk-text-11)] tw:text-[var(--bk-ink-muted)]">{"▾"}</span>
            </Button>
          }
        >
          <Menu label="Icon category">
            <MenuItem
              onClick={() => {
                setCatMenuOpen(false);
                setCategory("all");
              }}
            >
              All
            </MenuItem>
            {ICON_CATEGORIES.map((c) => (
              <MenuItem
                key={c.id}
                onClick={() => {
                  setCatMenuOpen(false);
                  setCategory(c.id);
                }}
              >
                {c.label}
              </MenuItem>
            ))}
          </Menu>
        </Popover>
        <span className="tw:flex-1" />
        <span
          className="tw:[font-family:var(--bk-font-mono)] tw:text-[11px] tw:leading-4 tw:font-medium tw:tabular-nums tw:text-[var(--bk-ink-muted)]"
          data-testid="media-icon-category-count"
        >
          {ICON_CATEGORIES.length} categories
        </span>
      </div>

      {showRecent ? (
        <>
          <div className={GROUP_HDR} data-testid="media-icon-group-recent">
            <span className="tw:flex-1" data-testid="media-icon-group-label">RECENT</span>
            <span
              className="tw:[font-family:var(--bk-font-mono)] tw:tabular-nums"
              data-testid="media-icon-group-count"
            >
              {recentIcons.length}
            </span>
          </div>
          {grid(recentIcons, "icon-grid-recent")}
        </>
      ) : null}

      {icons.length === 0 ? (
        <div className="tw:px-4 tw:pt-8 tw:text-left tw:text-[13px] tw:leading-5">
          <p className="tw:text-[var(--bk-ink-muted)]">
            Nothing matches {"‘"}{search.trim()}{"’"}.
          </p>
          <Button
            type="button"
            color="light"
            size="xs"
            variant="link" className="tw:min-h-6 tw:mt-1.5"
            onClick={() => setSearch("")}
          >
            Clear search
          </Button>
        </div>
      ) : (
        grid(icons, "icon-grid-all")
      )}
    </div>
  );
}
