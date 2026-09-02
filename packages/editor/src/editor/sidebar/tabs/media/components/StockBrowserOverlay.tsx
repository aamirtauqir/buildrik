/**
 * StockBrowserOverlay — the stock-browser drill-in, board 147:55.
 *
 * The caption's contract: the filter row carries three 88w dropdowns that
 * scroll horizontally rather than wrapping; results reuse the 136×104 grid
 * EXACTLY so the eye does not relearn it one level down; the 24h provider
 * credit per cell is required by both providers; infinite scroll, with Load
 * more after 3 auto-loads so the scroll is escapable.
 *
 * This is the DRAWER's stock surface — the fullpage manager keeps
 * StockSourceModal (tabs, colour swatches, provider switch). Both drive the
 * same discovery state; a cell click saves the asset into the library.
 *
 * @license BSD-3-Clause
 */

import * as React from "react";
import { Button, Menu, MenuItem, PanelFrame, Popover, TextField } from "@/editor/chrome-ui";
import type {
  DiscColor,
  DiscOrientation,
  StockPhoto,
  StockVideo,
} from "../data/mediaTypes";

interface StockBrowserOverlayProps {
  onClose(): void;
  photos: StockPhoto[];
  videos: StockVideo[];
  loading: Record<"img" | "vid", boolean> | Record<string, boolean>;
  searchQuery: string;
  orientation: DiscOrientation;
  color: DiscColor;
  onSearch(q: string, orientation?: DiscOrientation, color?: DiscColor): void;
  onSetOrientation(o: DiscOrientation): void;
  onSetColor(c: DiscColor): void;
  onLoadMore(type: "img" | "vid"): void;
  onSave(type: "img" | "vid", item: StockPhoto | StockVideo): void;
}

const ORIENTATIONS: Array<{ id: DiscOrientation; label: string }> = [
  { id: "all", label: "All" },
  { id: "landscape", label: "Landscape" },
  { id: "portrait", label: "Portrait" },
  { id: "squarish", label: "Square" },
];

const COLORS: Array<{ id: DiscColor; label: string }> = [
  { id: "all", label: "All" },
  { id: "black_and_white", label: "B&W" },
  { id: "black", label: "Black" },
  { id: "white", label: "White" },
  { id: "red", label: "Red" },
  { id: "orange", label: "Orange" },
  { id: "yellow", label: "Yellow" },
  { id: "green", label: "Green" },
  { id: "teal", label: "Teal" },
  { id: "blue", label: "Blue" },
];

const TYPES: Array<{ id: "img" | "vid"; label: string }> = [
  { id: "img", label: "Photos" },
  { id: "vid", label: "Videos" },
];

/** Caption: infinite scroll hands over to an explicit Load more after 3. */
const MAX_AUTO_LOADS = 3;

const DROPDOWN =
  "tw:h-7 tw:w-[88px] tw:shrink-0 tw:justify-between tw:gap-0.5 tw:rounded-md tw:border tw:border-[var(--bk-gray-200)] " +
  "tw:bg-white tw:px-1.5 tw:text-[11px] tw:font-normal tw:text-[var(--bk-ink-soft)] tw:enabled:hover:bg-[var(--bk-gray-50)]";

function FilterDropdown<T extends string>({
  label,
  value,
  options,
  onPick,
  testid,
}: {
  label: string;
  value: T;
  options: Array<{ id: T; label: string }>;
  onPick(id: T): void;
  testid: string;
}) {
  const [open, setOpen] = React.useState(false);
  const current = options.find((o) => o.id === value);
  // Board 147:59 closes every control on the FILTER name ("Orientation ▾",
  // "Colour ▾", "Type ▾") — value state reads from the menu checkmark and,
  // for Type, from the back row's "Stock photos/videos".
  const shown = current && current.id !== "all" && label !== "Type" ? current.label : label;
  return (
    <Popover
      open={open}
      onClose={() => setOpen(false)}
      placement="bottom"
      label={label}
      trigger={
        <Button
          type="button"
          color="light"
          size="xs"
          className={DROPDOWN}
          aria-expanded={open}
          data-testid={testid}
          onClick={() => setOpen((v) => !v)}
        >
          <span className="tw:truncate">{shown}</span>
          <span aria-hidden="true" className="tw:text-[length:var(--bk-text-11)] tw:text-[var(--bk-ink-muted)]">{"▾"}</span>
        </Button>
      }
    >
      <Menu label={label}>
        {options.map((o) => (
          <MenuItem
            key={o.id}
            selected={o.id === value}
            onClick={() => {
              setOpen(false);
              onPick(o.id);
            }}
          >
            {o.label}
          </MenuItem>
        ))}
      </Menu>
    </Popover>
  );
}

export function StockBrowserOverlay({
  onClose,
  photos,
  videos,
  loading,
  searchQuery,
  orientation,
  color,
  onSearch,
  onSetOrientation,
  onSetColor,
  onLoadMore,
  onSave,
}: StockBrowserOverlayProps) {
  const [type, setType] = React.useState<"img" | "vid">("img");
  const [draft, setDraft] = React.useState(searchQuery);
  const autoLoadsRef = React.useRef(0);
  const scrollRef = React.useRef<HTMLDivElement>(null);
  const overlayRef = React.useRef<HTMLDivElement>(null);

  React.useEffect(() => {
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

  const isLoading = Boolean(loading[type]);
  const items: Array<StockPhoto | StockVideo> = type === "img" ? photos : videos;

  // Infinite scroll — the sentinel hands over to the explicit link after 3.
  const handleScroll = React.useCallback(() => {
    const el = scrollRef.current;
    if (!el || isLoading || autoLoadsRef.current >= MAX_AUTO_LOADS) return;
    if (el.scrollTop + el.clientHeight >= el.scrollHeight - 120 && items.length > 0) {
      autoLoadsRef.current += 1;
      onLoadMore(type);
    }
  }, [isLoading, items.length, onLoadMore, type]);

  const submitSearch = React.useCallback(() => {
    autoLoadsRef.current = 0;
    onSearch(draft.trim(), orientation, color);
  }, [draft, onSearch, orientation, color]);

  const credit = (item: StockPhoto | StockVideo) =>
    `${item.source.charAt(0).toUpperCase()}${item.source.slice(1)} · ${item.author}`;

  return (
    <div
      ref={overlayRef}
      className="tw:absolute tw:inset-0 tw:z-10 tw:flex tw:flex-col tw:items-stretch tw:bg-[var(--bk-bg-panel,white)]"
      role="dialog"
      aria-modal="true"
      aria-label="Stock browser"
      data-testid="media-stock-browser"
    >
      <PanelFrame.Header title="Media" onClose={onClose} />

      <Button
        variant="link" className="tw:flex tw:h-9 tw:w-full tw:shrink-0 tw:items-center tw:justify-start tw:px-4 tw:text-left"
        onClick={onClose}
        aria-label="Back to media grid"
      >
        {"‹"}&nbsp;&nbsp;Stock {type === "img" ? "photos" : "videos"}
      </Button>

      <div className="tw:flex tw:h-9 tw:shrink-0 tw:items-center tw:px-4">
        <TextField
          type="text"
          className="tw:h-[var(--bk-size-row-dense)] tw:w-full tw:rounded-md tw:border tw:border-[var(--bk-gray-200)] tw:bg-[var(--bk-gray-50)] tw:px-2 tw:text-[13px] tw:text-[var(--bk-ink)] tw:placeholder:text-[var(--bk-gray-500)]"
          placeholder="Search free stock"
          value={draft}
          onChange={(e: React.ChangeEvent<HTMLInputElement>) => setDraft(e.target.value)}
          onKeyDown={(e: React.KeyboardEvent<HTMLInputElement>) => {
            if (e.key === "Enter") submitSearch();
          }}
          aria-label="Search stock"
        />
      </div>

      {/* Board 147:59 — three 88w dropdowns on a horizontally scrolling row. */}
      <div className="tw:flex tw:shrink-0 tw:gap-2 tw:overflow-x-auto tw:px-4 tw:py-1" data-testid="stock-filter-row">
        <FilterDropdown
          label="Orientation"
          value={orientation}
          options={ORIENTATIONS}
          onPick={(o) => {
            autoLoadsRef.current = 0;
            onSetOrientation(o);
          }}
          testid="stock-filter-orientation"
        />
        <FilterDropdown
          label="Color"
          value={color}
          options={COLORS}
          onPick={(c) => {
            autoLoadsRef.current = 0;
            onSetColor(c);
          }}
          testid="stock-filter-colour"
        />
        <FilterDropdown
          label="Type"
          value={type}
          options={TYPES}
          onPick={(t) => {
            autoLoadsRef.current = 0;
            setType(t);
          }}
          testid="stock-filter-type"
        />
      </div>

      <div
        ref={scrollRef}
        onScroll={handleScroll}
        className="tw:min-h-0 tw:flex-1 tw:overflow-y-auto"
        data-testid="stock-results"
      >
        {/* The caption's law: reuse the 136×104 grid EXACTLY — plus the 24h
            credit both providers require. */}
        <div className="tw:grid tw:grid-cols-2 tw:justify-items-start tw:gap-4 tw:px-4 tw:py-3">
          {items.map((item) => (
            <Button
              key={item.id}
              className="tw:flex tw:h-[128px] tw:w-34 tw:flex-col tw:items-stretch tw:gap-1 tw:rounded tw:border-0 tw:bg-transparent tw:p-0 tw:text-left"
              aria-label={`Save ${("alt" in item && item.alt) || "stock asset"} to library`}
              onClick={() => onSave(type, item)}
            >
              <img
                src={item.thumb}
                alt={"alt" in item ? item.alt : ""}
                loading="lazy"
                className="tw:h-19 tw:w-34 tw:rounded tw:bg-[var(--bk-bg-subtle)] tw:object-cover"
              />
              <span className="tw:flex tw:h-6 tw:items-center tw:truncate tw:text-[11px] tw:leading-4 tw:text-[var(--bk-ink-muted)]">
                {credit(item)}
              </span>
            </Button>
          ))}
        </div>

        {isLoading ? (
          <p className="tw:px-4 tw:pb-1 tw:text-[13px] tw:leading-5 tw:text-[var(--bk-ink-muted)]">
            Loading 8 more…
          </p>
        ) : null}

        {items.length > 0 && !isLoading ? (
          <div className="tw:flex tw:justify-center tw:pb-4">
            <Button
              type="button"
              color="light"
              size="xs"
              variant="link" className="tw:min-h-6"
              data-testid="stock-load-more"
              onClick={() => onLoadMore(type)}
            >
              Load more
            </Button>
          </div>
        ) : null}

        {items.length === 0 && !isLoading ? (
          <p className="tw:px-4 tw:pt-6 tw:text-[13px] tw:leading-5 tw:text-[var(--bk-ink-muted)]">
            Search to browse free {type === "img" ? "photos" : "videos"}.
          </p>
        ) : null}
      </div>
    </div>
  );
}
