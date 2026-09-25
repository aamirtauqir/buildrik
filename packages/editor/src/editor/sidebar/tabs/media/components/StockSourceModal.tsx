/**
 * StockSourceModal — Clone 3695:45569 "Stock assets".
 *
 * Opened by the library's `+ Add from stock`. Title, one line that says what
 * this dialog does to the canvas (nothing), a search field, the results as
 * cards — image · title · attribution line — of which ONE is selectable, and
 * Cancel · `Save to library` (primary, disabled until a result is selected).
 * Saving hands the result up and waits; the orchestrator closes this and
 * shows 3695:45573 "Stock image saved". A save the engine refused leaves the
 * dialog open with its selection.
 *
 * The code's sources stay — photos and videos — behind the compact switch
 * beside the search. The Icons source is gone (G3-036): it was four demo
 * glyphs whose only real path was a link to the Select Icon modal, which
 * the library's own Icons door already opens. Fonts are dropped: `MediaManager.getFonts` is
 * four stub families with no file, so there is nothing a "save to library"
 * dialog could save; the inspector's Font picker is their door, which is
 * what the old Use button's toast already said. The orientation group, the
 * twelve colour dots, the provider pills and the quota strip are dropped
 * too: none fits under the search without the second toolbar row the Clone
 * does not draw (and no consumer ever passed `source` / `quota`).
 *
 * `Insert` is gone. Stock saves to the library; the canvas is untouched.
 *
 * Displaces V1 147:55 / 3397:18464 ("Add from Stock"). The not-configured /
 * searching / no-results / search-failed states keep their copy — the Clone
 * keeps them as REFERENCE VARIANTs 3397:18935 / 18533 / 18581 / 18655.
 *
 * Shape from `libraryModal.ts` (title 16/600, body 13 ink-soft, 32px
 * buttons, 8 gap) at the Clone's 640.
 *
 * @license BSD-3-Clause
 */

import * as React from "react";
import { Search, X } from "lucide-react";
import { Button, IconButton, ModalBody, ModalContent, ModalRoot, TextInput } from "@/editor/chrome-ui";
import type { DiscColor, DiscOrientation, StockFailureReason, StockPhoto, StockVideo } from "../data/mediaTypes";
import {
  LIBRARY_MODAL_BODY,
  LIBRARY_MODAL_BTN_OUTLINE,
  LIBRARY_MODAL_BTN_PRIMARY,
  LIBRARY_MODAL_FOOT,
  LIBRARY_MODAL_TITLE,
} from "@/editor/media/components/libraryModal";
import { COLORS, FilterDropdown, ORIENTATIONS, TYPES } from "./StockBrowserOverlay";

export type StockKind = "img" | "vid";
export type StockItem = StockPhoto | StockVideo;

interface StockSourceModalProps {
  open: boolean;
  onClose(): void;
  photos: StockPhoto[];
  videos: StockVideo[];
  loading: Record<"img" | "vid" | "ico" | "fnt", boolean>;
  searchQuery: string;
  /** WHY the last search failed, or null/absent when it did not (blocker A-STOCK). */
  searchFailed?: StockFailureReason | null;
  onSearch(query: string): void;
  orientation: DiscOrientation;
  color: DiscColor;
  onSetOrientation(o: DiscOrientation): void;
  onSetColor(c: DiscColor): void;
  onLoadMore(type: "img" | "vid"): void;
  /** Save the ONE selected result. Resolves when it has settled; closing is the orchestrator's. */
  onSave(type: StockKind, item: StockItem): Promise<unknown> | void;
}


const PROVIDER_LABEL: Record<string, string> = { unsplash: "Unsplash", pexels: "Pexels", pixabay: "Pixabay" };

/**
 * Each failure gets its own sentence because each has a different next step,
 * and none of them is "try a different search term" — which is the only thing
 * the old shared "No photos found for …" copy could ever suggest.
 *
 * `retryable` gates the Try again button: re-running the query cannot conjure
 * an API key, so offering it on a configuration fault just wastes the click.
 */
const FAILURE_COPY: Record<StockFailureReason, { message: string; retryable: boolean }> = {
  "not-configured": {
    message: "Stock search isn't configured for this site yet. Ask an admin to add a stock provider key.",
    retryable: false,
  },
  unauthorized: {
    message: "The stock provider rejected our API key. It may have expired — an admin will need to renew it.",
    retryable: false,
  },
  "request-failed": {
    message: "Couldn't reach the stock library.",
    retryable: true,
  },
};

/* v3 4418:154195 / 6883:75565: one result per row — a 24-inset card, 180
   image on r8, name and credit 14 ink; the chosen one wears a 2px accent
   edge on r8. States (6840:62903 rest, 6823:599xx) sit in the same 24 inset. */
const CARD =
  "tw:flex tw:flex-col tw:gap-5 tw:rounded-xl tw:border-2 tw:p-[22px] tw:text-left tw:cursor-pointer " +
  "tw:focus-visible:outline-none tw:focus-visible:[box-shadow:var(--bk-shadow-focus)]";
const CARD_OFF = "tw:border-transparent tw:hover:bg-[var(--bk-gray-50)]";
const CARD_ON = "tw:rounded-lg tw:border-[var(--bk-accent)]";
const THUMB = "tw:block tw:h-45 tw:w-full tw:rounded-lg tw:object-cover tw:bg-[var(--bk-bg-subtle)]";
const TITLE = "tw:truncate tw:text-[14px] tw:font-normal tw:leading-5 tw:text-[var(--bk-ink)]";
const CREDIT = "tw:truncate tw:text-[14px] tw:leading-5 tw:text-[var(--bk-ink)]";
const STATE = "tw:m-0 tw:p-6 tw:text-[14px] tw:leading-5 tw:text-[var(--bk-ink)]";
const SEARCH_FIELD =
  "tw:flex tw:h-9 tw:items-center tw:gap-2 tw:rounded-md tw:border tw:border-[var(--bk-border-input)] tw:bg-white tw:pl-3 tw:pr-1 tw:text-[var(--bk-ink-muted)] " +
  "tw:[&>div]:min-w-0 tw:[&>div]:flex-1 tw:[&_input]:border-0 tw:[&_input]:bg-transparent tw:[&_input]:p-0 tw:[&_input]:text-[14px] " +
  "tw:[&_input]:leading-5 tw:[&_input]:text-[var(--bk-ink)] tw:[&_input]:shadow-none tw:[&_input]:ring-0 tw:[&_input]:outline-none";

interface CardProps {
  id: string;
  selected: boolean;
  onSelect(): void;
  children: React.ReactNode;
}

/* A div, not a Button: the attribution line inside carries the author's own
   link, and an interactive element may not nest another. */
function Card({ id, selected, onSelect, children }: CardProps) {
  return (
    <div
      role="button"
      tabIndex={0}
      aria-pressed={selected}
      data-testid={`stock-card-${id}`}
      className={`${CARD} ${selected ? CARD_ON : CARD_OFF}`}
      onClick={onSelect}
      onKeyDown={(e) => {
        if (e.key === "Enter" || e.key === " ") {
          e.preventDefault();
          onSelect();
        }
      }}
    >
      {children}
    </div>
  );
}

function Credit({ author, authorUrl, source }: { author?: string; authorUrl?: string; source?: string }) {
  const provider = source ? (PROVIDER_LABEL[source] ?? source) : null;
  return (
    <span className={CREDIT} data-testid="stock-tile-attribution">
      {author ? (
        authorUrl ? (
          <a
            href={authorUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="tw:text-inherit tw:underline-offset-2 tw:hover:underline"
            onClick={(e) => e.stopPropagation()}
          >
            {author}
          </a>
        ) : (
          author
        )
      ) : null}
      {author && provider ? " · " : null}
      {provider}
    </span>
  );
}

export function StockSourceModal({
  open,
  onClose,
  photos,
  videos,
  loading,
  searchQuery,
  searchFailed,
  onSearch,
  orientation,
  color,
  onSetOrientation,
  onSetColor,
  onLoadMore,
  onSave,
}: StockSourceModalProps) {
  const [source, setSource] = React.useState<StockKind>("img");
  const [selectedId, setSelectedId] = React.useState<string | null>(null);
  const [saving, setSaving] = React.useState(false);
  const [draft, setDraft] = React.useState(searchQuery);

  // A reopened dialog starts on photos with nothing selected.
  React.useEffect(() => {
    if (open) {
      setSource("img");
      setSelectedId(null);
      setSaving(false);
    }
  }, [open]);

  React.useEffect(() => setDraft(searchQuery), [searchQuery]);

  /* Typing searches after a pause; Enter searches now (the rest state tells
     the user to "press Enter"). */
  React.useEffect(() => {
    if (draft === searchQuery) return;
    const t = setTimeout(() => onSearch(draft), 400);
    return () => clearTimeout(t);
  }, [draft, searchQuery, onSearch]);

  if (!open) return null;

  const results: StockItem[] = source === "img" ? photos : videos;
  const selected = selectedId === null ? null : (results.find((r) => r.id === selectedId) ?? null);
  const isLoading = loading[source];
  const noun = source === "img" ? "photos" : "videos";

  const save = async () => {
    if (!selected || saving) return;
    setSaving(true);
    try {
      await onSave(source, selected);
    } finally {
      setSaving(false);
    }
  };

  return (
    <ModalRoot open={open} onClose={onClose}>
      <ModalContent size="table" srTitle="Stock assets" data-testid="stock-modal">
        <h2 className={LIBRARY_MODAL_TITLE} data-testid="stock-title">
          Stock assets
        </h2>
        <ModalBody className="tw:flex tw:min-h-0 tw:flex-col tw:gap-4">
          <p className={LIBRARY_MODAL_BODY} data-testid="stock-body">
            Browse stock photos and save an image to this site. Your canvas selection stays unchanged.
          </p>
          <div className={SEARCH_FIELD} data-testid="stock-search">
            <Search size={16} aria-hidden="true" className="tw:shrink-0" />
            <TextInput
              type="text"
              value={draft}
              placeholder="Search Pexels and Unsplash…"
              aria-label="Search stock"
              onChange={(e: React.ChangeEvent<HTMLInputElement>) => setDraft(e.target.value)}
              onKeyDown={(e: React.KeyboardEvent<HTMLInputElement>) => {
                if (e.key === "Enter") onSearch(draft);
              }}
            />
            {draft ? (
              <IconButton
                size="sm"
                label="Clear search"
                data-testid="stock-search-clear"
                onClick={() => {
                  setDraft("");
                  onSearch("");
                }}
              >
                <X size={14} aria-hidden="true" />
              </IconButton>
            ) : null}
          </div>
          {/* Board 4418:154195 — Orientation ▾ · Colour ▾ · Type ▾, 88 wide,
              16 in. Type replaces the old Photos | Videos switch. */}
          <div className="tw:flex tw:gap-2 tw:px-4" data-testid="stock-filter-row">
            <FilterDropdown label="Orientation" value={orientation} options={ORIENTATIONS} onPick={onSetOrientation} testId="stock-filter-orientation" />
            <FilterDropdown label="Colour" value={color} options={COLORS} onPick={onSetColor} testId="stock-filter-colour" />
            <FilterDropdown
              label="Type"
              value={source}
              options={TYPES}
              onPick={(t) => {
                setSource(t);
                setSelectedId(null);
              }}
              testId="stock-filter-type"
            />
          </div>

          <div className="tw:min-h-0 tw:flex-1 tw:overflow-auto" data-testid="stock-results">
            {isLoading ? (
              <p className={`${STATE} tw:text-[var(--bk-accent-text)]`} data-testid="stock-loading">
                Searching...
              </p>
            ) : null}

            {!isLoading && searchQuery.length === 0 ? (
              <div className={`${STATE} tw:flex tw:flex-col tw:gap-5`} data-testid="stock-idle">
                <span>Search millions of free {noun}</span>
                <span>
                  Type a subject — “restaurant interior”, “pizza oven”, “dining room” — and press Enter. Results come
                  from Pexels and Unsplash.
                </span>
              </div>
            ) : null}
            {/* A failed request is not an empty result, and the three failures
                are not each other. Until the service carried a reason, all four
                rendered "No photos found for …" (blocker A-STOCK). */}
            {!isLoading && searchFailed && searchQuery.length > 0 ? (
              <p className={STATE} role="alert" data-testid="stock-failed">
                {FAILURE_COPY[searchFailed].message}
                {FAILURE_COPY[searchFailed].retryable ? (
                  <>
                    {" "}
                    <Button
                      color="light"
                      size="xs"
                      variant="link"
                      className="tw:h-auto tw:min-h-0 tw:p-0 tw:font-normal tw:text-[var(--bk-accent-text)]"
                      onClick={() => onSearch(searchQuery)}
                    >
                      Try again
                    </Button>
                  </>
                ) : null}
              </p>
            ) : null}

            {!isLoading && !searchFailed && results.length === 0 && searchQuery.length > 0 ? (
              <p className={STATE} data-testid="stock-empty">
                {`No ${noun} found for "${searchQuery}"`}
              </p>
            ) : null}

            {results.length > 0 ? (
              <div className="tw:flex tw:flex-col tw:gap-2">
                {source === "img"
                  ? photos.map((p) => (
                      <Card key={p.id} id={p.id} selected={selectedId === p.id} onSelect={() => setSelectedId(p.id)}>
                        <img src={p.thumb} alt={p.alt} loading="lazy" className={THUMB} />
                        <span className={TITLE} data-testid="stock-card-title">
                          {p.alt || "Stock photo"}
                        </span>
                        <Credit author={p.author} authorUrl={p.authorUrl} source={p.source} />
                      </Card>
                    ))
                  : null}
                {source === "vid"
                  ? videos.map((v) => (
                      <Card key={v.id} id={v.id} selected={selectedId === v.id} onSelect={() => setSelectedId(v.id)}>
                        <img src={v.thumb} alt="" loading="lazy" className={THUMB} />
                        <span className={TITLE} data-testid="stock-card-title">
                          Video · {Math.round(v.duration)}s
                        </span>
                        <Credit author={v.author} source={v.source} />
                      </Card>
                    ))
                  : null}
              </div>
            ) : null}

            {results.length > 0 ? (
              <Button
                type="button"
                size="xs"
                color="light"
                className={`${LIBRARY_MODAL_BTN_OUTLINE} tw:mt-3 tw:w-full`}
                data-testid="stock-load-more"
                onClick={() => onLoadMore(source)}
                disabled={isLoading}
              >
                {isLoading ? "Loading..." : "Load more"}
              </Button>
            ) : null}
          </div>
        </ModalBody>
        <div className={LIBRARY_MODAL_FOOT} data-testid="stock-foot">
          <Button
            type="button"
            size="xs"
            color="light"
            className={`${LIBRARY_MODAL_BTN_OUTLINE} tw:text-[var(--bk-gray-700)]`}
            onClick={onClose}
            data-testid="stock-cancel"
          >
            Cancel
          </Button>
          {/* 6840:62903 — with nothing found yet there is nothing to save, and
              the rest state shows Cancel alone. */}
          {results.length > 0 ? (
            <Button
              type="button"
              size="xs"
              className={LIBRARY_MODAL_BTN_PRIMARY}
              onClick={() => void save()}
              disabled={!selected || saving}
              data-testid="stock-save"
            >
              {saving ? "Saving…" : "Save to library"}
            </Button>
          ) : null}
        </div>
      </ModalContent>
    </ModalRoot>
  );
}
