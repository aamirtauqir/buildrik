/**
 * NewPageModal — decision #19 (v3 Q2b): Add page opens this modal instead of
 * creating "About" instantly and dropping into an inline rename.
 *
 * design-2l9 board 101:29978: "New page", "{Site} · Create a page", Page
 * name, Blank · From template as a segmented row, what the source does next,
 * an "Add to site navigation" checkbox, the capacity line, Cancel · Create
 * page / Choose template — no ✕ (Esc and Cancel close). Was boards
 * 6752:59256 / 6752:59365's cards. Create on Blank lands
 * on the new, empty page with "Page created" (6700:71154); Create on From
 * template opens the templates catalogue (4418:54134) carrying the name, and
 * creates nothing until a template is chosen there — leaving the catalogue
 * must leave no blank page behind (QA 2026-09-24).
 *
 * "Add to site navigation" (on by default, as drawn) writes through
 * ElementManager.addPageToNavigation — every nav's link group takes a link to
 * the new page. On From template the choice rides to the catalogue with the
 * name and is applied when the page is actually created there.
 *
 * Every Add-page door emits UI_NEW_PAGE_REQUESTED; this is its one listener,
 * mounted once by StudioModals.
 *
 * @license BSD-3-Clause
 */
import * as React from "react";
import type { Composer } from "@/engine";
import { EVENTS } from "@/shared/constants/events";
import { getDefaultPageName } from "@/shared/utils/pageUtils";
import { BK_LABEL_CLASS, Button, Checkbox, Label, Modal, TextInput, useToast } from "@/editor/chrome-ui";
import { usePageCapacity, type PageCapacity } from "../usePageCapacity";

type Source = "blank" | "template";

/* design-2l9 board 101:29978: the source is a two-chip segmented row,
   178 wide each, the chosen one on the accent tint. */
const SOURCE = "tw:h-8 tw:w-[178px] tw:justify-center tw:rounded-md tw:border-0 tw:text-[13px] tw:font-normal tw:focus:ring-0";
const SOURCE_ON = "tw:bg-[var(--bk-accent-tint)] tw:text-[var(--bk-accent-text)] tw:enabled:hover:bg-[var(--bk-accent-tint)]";
const SOURCE_OFF = "tw:bg-transparent tw:text-[var(--bk-ink)]";
export function NewPageModal({ composer }: { composer: Composer | null }) {
  const { addToast } = useToast();
  const [open, setOpen] = React.useState(false);
  const [name, setName] = React.useState("");
  /* design-2l9 101:36828 "New page / Blank default". */
  const [source, setSource] = React.useState<Source>("blank");
  const [addToNav, setAddToNav] = React.useState(true);
  const [error, setError] = React.useState<string | null>(null);
  const { capacity, retry: retryCapacity } = usePageCapacity(open);
  const pageCount = open && composer ? composer.elements.getAllPages().length : 0;
  const atLimit = capacity.state === "known" && capacity.limit !== -1 && pageCount >= capacity.limit;
  /* A create waits for the limit, and stops at it — the server refuses a
     save that adds a page past it (PAGE_LIMIT). */
  const capacityBlocks = atLimit || capacity.state === "checking" || capacity.state === "unavailable";

  React.useEffect(() => {
    if (!composer) return;
    const onRequest = () => {
      setName(getDefaultPageName(composer.elements.getAllPages()));
      setSource("blank");
      setAddToNav(true);
      setError(null);
      setOpen(true);
    };
    composer.on(EVENTS.UI_NEW_PAGE_REQUESTED, onRequest);
    return () => {
      composer.off(EVENTS.UI_NEW_PAGE_REQUESTED, onRequest);
    };
  }, [composer]);


  const create = () => {
    const trimmed = name.trim();
    if (!composer || !trimmed) return;
    if (source === "template") {
      setOpen(false);
      composer.emit(EVENTS.UI_BROWSE_TEMPLATES, { newPageName: trimmed, addToNavigation: addToNav });
      return;
    }
    let pageId: string;
    try {
      pageId = composer.elements.createPage(trimmed).id;
    } catch (err) {
      console.error("[pages] create page failed", err);
      /* design-2l9 board 101:40412. */
      setError(`Couldn’t create ${trimmed}. Nothing was changed. Try again.`);
      return;
    }
    if (addToNav) composer.elements.addPageToNavigation(pageId);
    composer.elements.setActivePage(pageId);
    setOpen(false);
    /* design-2l9 board 101:42581: "Services created · Added to site navigation". */
    addToast({ description: `${trimmed} created${addToNav ? " · Added to site navigation" : ""}`, tone: "success" });
  };

  const sourceChip = (value: Source, title: string) => (
    <Button
      color="light"
      role="radio"
      aria-checked={source === value}
      className={`${SOURCE} ${source === value ? SOURCE_ON : SOURCE_OFF}`}
      data-testid={`new-page-source-${value}`}
      onClick={() => setSource(value)}
    >
      {title}
    </Button>
  );
  const siteName = composer?.getProjectMetadata?.()?.name;

  return (
    <Modal
      open={open}
      onClose={() => setOpen(false)}
      title="New page"
      /* width/dialog-lg — board 6752:59256 draws this one at 640. */
      width="lg"
      testId="new-page-modal"
      footer={
        <>
          <Button color="light" size="xs" data-testid="new-page-cancel" onClick={() => setOpen(false)}>
            Cancel
          </Button>
          <Button size="xs" data-testid="new-page-create" disabled={!name.trim() || capacityBlocks} onClick={create}>
            {error ? "Try again" : source === "template" ? "Choose template" : "Create page"}
          </Button>
          {/* 101:39695: Retry check closes the row, after the blocked Create. */}
          {capacity.state === "unavailable" && (
            <Button color="light" size="xs" data-testid="new-page-capacity-retry" onClick={retryCapacity}>
              Retry check
            </Button>
          )}
        </>
      }
    >
      <form
        className="tw:flex tw:flex-col tw:gap-4"
        onSubmit={(e) => {
          e.preventDefault();
          create();
        }}
      >
        {/* Board 101:29978: "{Site} · Create a page" under the title. */}
        <p className="tw:m-0 tw:text-[length:var(--bk-text-12)] tw:text-[var(--bk-ink-soft)]" data-testid="new-page-subtitle">
          {siteName ? `${siteName} · Create a page` : "Create a page"}
        </p>
        <div className="tw:flex tw:flex-col tw:gap-1">
          <Label htmlFor="new-page-name" className={BK_LABEL_CLASS}>
            Page name
          </Label>
          <TextInput
            id="new-page-name"
            data-testid="new-page-name"
            placeholder="About us"
            /* 101:37542 draws the empty field red, with its reason under it. */
            aria-invalid={!name.trim() || undefined}
            aria-describedby={!name.trim() ? "new-page-name-missing" : undefined}
            value={name}
            autoFocus
            onFocus={(e) => e.currentTarget.select()}
            onChange={(e) => {
              setName(e.target.value);
              setError(null);
            }}
          />
          {/* design-2l9 board 101:37542. */}
          {!name.trim() && (
            <span id="new-page-name-missing" className="tw:text-[length:var(--bk-text-12)] tw:text-[var(--bk-error-text)]" data-testid="new-page-name-missing">
              Name the page
            </span>
          )}
        </div>
        <div className="tw:flex tw:gap-0" role="radiogroup" aria-label="Start from">
          {sourceChip("blank", "Blank")}
          {sourceChip("template", "From template")}
        </div>
        {/* What the chosen source does next (101:29978 / 101:37542). */}
        <p className="tw:m-0 tw:text-[length:var(--bk-text-12)] tw:leading-4 tw:text-[var(--bk-ink-soft)]" data-testid="new-page-source-note">
          {source === "template" ? "Choose a page template before creating the page." : "Start with an empty page."}
        </p>
        <label className="tw:flex tw:items-center tw:gap-2 tw:text-[length:var(--bk-text-13)] tw:text-[var(--bk-ink)]">
          <Checkbox
            id="new-page-add-to-nav"
            checked={addToNav}
            onChange={(e) => setAddToNav(e.target.checked)}
            data-testid="new-page-add-to-nav"
          />
          Add to site navigation
        </label>
        <PageCapacityLine capacity={capacity} count={pageCount} atLimit={atLimit} />
        {error ? (
          <p role="alert" className="tw:m-0 tw:text-[length:var(--bk-text-12)] tw:text-[var(--bk-error)]">
            {error}
          </p>
        ) : null}
      </form>
    </Modal>
  );
}

const LINE = "tw:m-0 tw:text-[length:var(--bk-text-12)] tw:leading-4";

/** Boards 101:29978 / 101:38257 / 101:38980 / 101:39695. */
function PageCapacityLine({ capacity, count, atLimit }: { capacity: PageCapacity; count: number; atLimit: boolean }) {
  if (capacity.state === "none" || (capacity.state === "known" && capacity.limit === -1)) return null;
  const [head, body] =
    capacity.state === "checking"
      ? ["Checking page capacity…", "Wait for the current page limit before creating."]
      : capacity.state === "unavailable"
        ? ["Couldn’t check page capacity", "Your page name and navigation choice are retained."]
        : [
            `${count} of ${capacity.limit} pages on ${capacity.plan}`,
            atLimit ? "Ask the workspace owner to upgrade, or remove an unused page before creating another." : null,
          ];
  return (
    <div className="tw:flex tw:flex-col tw:gap-0.5" data-testid="new-page-capacity" role={capacity.state === "unavailable" || atLimit ? "status" : undefined}>
      {/* 101:38257 / 101:38980 / 101:39695: whenever the count blocks the
          create — at the limit, still checking, or unknown — its head is red
          and what to do sits a line apart, in soft ink. */}
      <p
        className={`${LINE} tw:tabular-nums ${
          atLimit || capacity.state === "checking" || capacity.state === "unavailable"
            ? "tw:text-[var(--bk-error-text)]"
            : "tw:text-[var(--bk-ink-muted)]"
        }`}
        data-testid="new-page-capacity-head"
      >
        {head}
      </p>
      {body && <p className={`${LINE} tw:mt-3 tw:text-[var(--bk-ink-soft)]`}>{body}</p>}
    </div>
  );
}
