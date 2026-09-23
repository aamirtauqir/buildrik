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
 * The code's sources stay — photos, videos, icons — behind the compact
 * switch beside the search. Fonts are dropped: `MediaManager.getFonts` is
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
import { Button, ModalBody, ModalContent, ModalRoot } from "@/editor/chrome-ui";
import { SquareArrowOutUpRight } from "lucide-react";
import { SearchBar } from "../../../shared/SearchBar";
import type { DiscIcon, StockFailureReason, StockPhoto, StockVideo } from "../data/mediaTypes";
import {
  LIBRARY_MODAL_BODY,
  LIBRARY_MODAL_BTN_PRIMARY,
  LIBRARY_MODAL_BTN_SECONDARY,
  LIBRARY_MODAL_FOOT,
  LIBRARY_MODAL_TITLE,
} from "@/editor/media/components/libraryModal";

export type StockKind = "img" | "vid" | "ico";
export type StockItem = StockPhoto | StockVideo | DiscIcon;

interface StockSourceModalProps {
  open: boolean;
  onClose(): void;
  photos: StockPhoto[];
  videos: StockVideo[];
  icons: DiscIcon[];
  loading: Record<"img" | "vid" | "ico" | "fnt", boolean>;
  searchQuery: string;
  /** WHY the last search failed, or null/absent when it did not (blocker A-STOCK). */
  searchFailed?: StockFailureReason | null;
  onSearch(query: string): void;
  onLoadMore(type: "img" | "vid"): void;
  /** Save the ONE selected result. Resolves when it has settled; closing is the orchestrator's. */
  onSave(type: StockKind, item: StockItem): Promise<unknown> | void;
  /** "Browse full icon library" — the Lucide picker, a different asset model. */
  onOpenIconPicker?(): void;
}

const SOURCES: ReadonlyArray<{ id: StockKind; label: string; noun: string }> = [
  { id: "img", label: "Photos", noun: "photos" },
  { id: "vid", label: "Videos", noun: "videos" },
  { id: "ico", label: "Icons", noun: "icons" },
];

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

const CARD =
  "tw:flex tw:flex-col tw:gap-1 tw:rounded-lg tw:border-2 tw:p-2 tw:text-left tw:cursor-pointer " +
  "tw:focus-visible:outline-none tw:focus-visible:[box-shadow:var(--bk-shadow-focus)]";
const CARD_OFF = "tw:border-transparent tw:hover:bg-[var(--bk-bg-subtle)]";
const CARD_ON = "tw:border-[var(--bk-accent)]";
const THUMB = "tw:block tw:w-full tw:aspect-[3/2] tw:rounded-md tw:object-cover tw:bg-[var(--bk-bg-subtle)]";
const TITLE = "tw:truncate tw:text-[length:var(--bk-text-13)] tw:font-semibold tw:leading-5 tw:text-[var(--bk-ink)]";
const CREDIT = "tw:truncate tw:text-[length:var(--bk-text-11)] tw:leading-4 tw:text-[var(--bk-ink-muted)]";
const STATE = "tw:m-0 tw:py-8 tw:text-center tw:text-[length:var(--bk-text-13)] tw:leading-5 tw:text-[var(--bk-ink-muted)]";

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
  icons,
  loading,
  searchQuery,
  searchFailed,
  onSearch,
  onLoadMore,
  onSave,
  onOpenIconPicker,
}: StockSourceModalProps) {
  const [source, setSource] = React.useState<StockKind>("img");
  const [selectedId, setSelectedId] = React.useState<string | null>(null);
  const [saving, setSaving] = React.useState(false);

  // A reopened dialog starts on photos with nothing selected.
  React.useEffect(() => {
    if (open) {
      setSource("img");
      setSelectedId(null);
      setSaving(false);
    }
  }, [open]);

  if (!open) return null;

  const results: StockItem[] = source === "img" ? photos : source === "vid" ? videos : icons;
  const selected = selectedId === null ? null : (results.find((r) => r.id === selectedId) ?? null);
  const isLoading = loading[source];
  const noun = SOURCES.find((s) => s.id === source)?.noun ?? "photos";
  const needsQuery = source !== "ico";

  const switchSource = (next: StockKind) => {
    setSource(next);
    setSelectedId(null);
  };

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
        <ModalBody className="tw:flex tw:min-h-0 tw:flex-col tw:gap-3">
          <p className={LIBRARY_MODAL_BODY} data-testid="stock-body">
            Browse stock photos and save an image to this site. Your canvas selection stays unchanged.
          </p>
          <div className="tw:flex tw:items-center tw:gap-2">
            <div className="tw:min-w-0 tw:flex-1">
              <SearchBar
                value={searchQuery}
                onChange={onSearch}
                placeholder={`Search stock ${noun}…`}
                ariaLabel="Search stock"
                debounceMs={400}
                testId="stock-search"
              />
            </div>
            <div role="group" aria-label="Stock source" className="tw:flex tw:shrink-0 tw:gap-1" data-testid="stock-source-switch">
              {SOURCES.map((s) => {
                const active = source === s.id;
                return (
                  <Button
                    key={s.id}
                    type="button"
                    size="xs"
                    variant={active ? undefined : "secondary"}
                    aria-pressed={active}
                    className={active ? LIBRARY_MODAL_BTN_PRIMARY : LIBRARY_MODAL_BTN_SECONDARY}
                    data-testid={`stock-source-${s.id}`}
                    onClick={() => switchSource(s.id)}
                  >
                    {s.label}
                  </Button>
                );
              })}
            </div>
          </div>

          <div className="tw:min-h-0 tw:flex-1 tw:overflow-auto" data-testid="stock-results">
            {source === "ico" && onOpenIconPicker ? (
              <Button
                type="button"
                color="light"
                size="xs"
                variant="link"
                className="tw:mb-2 tw:h-auto tw:min-h-0 tw:gap-1 tw:p-0 tw:font-normal tw:text-[var(--bk-accent-text)]"
                data-testid="stock-browse-icons"
                onClick={onOpenIconPicker}
              >
                Browse full icon library <SquareArrowOutUpRight size={12} aria-hidden="true" />
              </Button>
            ) : null}

            {isLoading ? (
              <p className={`${STATE} tw:text-[var(--bk-accent-text)]`} data-testid="stock-loading">
                Searching...
              </p>
            ) : null}

            {!isLoading && needsQuery && searchQuery.length === 0 ? (
              <p className={STATE} data-testid="stock-idle">
                Search to see stock {noun}.
              </p>
            ) : null}

            {/* A failed request is not an empty result, and the three failures
                are not each other. Until the service carried a reason, all four
                rendered "No photos found for …" (blocker A-STOCK). */}
            {/* The failure belongs to the provider sources: icons are the
                engine's own list, filtered client-side, so an unconfigured
                photo key must not blank them (seen live 2026-09-13). */}
            {!isLoading && needsQuery && searchFailed && searchQuery.length > 0 ? (
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

            {!isLoading && (!needsQuery || !searchFailed) && results.length === 0 && (!needsQuery || searchQuery.length > 0) ? (
              <p className={STATE} data-testid="stock-empty">
                {needsQuery ? `No ${noun} found for "${searchQuery}"` : "No icons found."}
              </p>
            ) : null}

            {results.length > 0 ? (
              <div className={`tw:grid tw:gap-2 ${source === "ico" ? "tw:grid-cols-4" : "tw:grid-cols-2"}`}>
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
                {source === "ico"
                  ? icons.map((ico) => (
                      <Card key={ico.id} id={ico.id} selected={selectedId === ico.id} onSelect={() => setSelectedId(ico.id)}>
                        <span className="tw:flex tw:aspect-[3/2] tw:w-full tw:items-center tw:justify-center tw:rounded-md tw:bg-[var(--bk-bg-subtle)]">
                          <img src={ico.svgDataUrl} alt={ico.name} className="tw:size-6" />
                        </span>
                        <span className={TITLE} data-testid="stock-card-title">
                          {ico.name}
                        </span>
                        <span className={CREDIT} data-testid="stock-tile-attribution">
                          {ico.category}
                        </span>
                      </Card>
                    ))
                  : null}
              </div>
            ) : null}

            {source !== "ico" && results.length > 0 ? (
              <Button
                type="button"
                size="xs"
                variant="secondary"
                className={`${LIBRARY_MODAL_BTN_SECONDARY} tw:mt-3 tw:w-full`}
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
            variant="secondary"
            className={LIBRARY_MODAL_BTN_SECONDARY}
            onClick={onClose}
            data-testid="stock-cancel"
          >
            Cancel
          </Button>
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
        </div>
      </ModalContent>
    </ModalRoot>
  );
}
