/**
 * NewPageModal — decision #19 (v3 Q2b): Add page opens this modal instead of
 * creating "About" instantly and dropping into an inline rename.
 *
 * Boards 6752:59256 (From template selected — the resting state) and
 * 6752:59365 (Blank selected): Page name · Blank "Empty canvas" · From
 * template "Pick from N layouts" · Cancel · Create page. Create on Blank lands
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
import { Grid3x3, Square } from "lucide-react";
import { BK_LABEL_CLASS, Button, Label, Modal, TextInput, ToggleSwitch, useToast } from "@/editor/chrome-ui";
import { SITE_TEMPLATES, getMyTemplates } from "@/editor/sidebar/tabs/templates/templatesData";

type Source = "blank" | "template";

/* 6752:59256 option card: ~124 tall, 16 inset, 20 glyph over a 13/600 title
   and a 12 muted hint; picked = accent edge on the accent tint. */
const CARD =
  "tw:flex tw:h-[124px] tw:flex-1 tw:flex-col tw:items-start tw:justify-start tw:gap-3 tw:rounded-lg tw:border tw:border-solid " +
  "tw:p-4 tw:text-left tw:font-normal tw:text-[var(--bk-ink)]";
const CARD_ON = "tw:border-[var(--bk-accent)] tw:bg-[var(--bk-accent-tint)] tw:ring-1 tw:ring-[var(--bk-accent)]";
const CARD_OFF = "tw:border-[var(--bk-border)] tw:bg-[var(--bk-bg-panel)]";
export function NewPageModal({ composer }: { composer: Composer | null }) {
  const { addToast } = useToast();
  const [open, setOpen] = React.useState(false);
  const [name, setName] = React.useState("");
  const [source, setSource] = React.useState<Source>("template");
  const [addToNav, setAddToNav] = React.useState(true);
  const [error, setError] = React.useState<string | null>(null);

  React.useEffect(() => {
    if (!composer) return;
    const onRequest = () => {
      setName(getDefaultPageName(composer.elements.getAllPages()));
      setSource("template");
      setAddToNav(true);
      setError(null);
      setOpen(true);
    };
    composer.on(EVENTS.UI_NEW_PAGE_REQUESTED, onRequest);
    return () => {
      composer.off(EVENTS.UI_NEW_PAGE_REQUESTED, onRequest);
    };
  }, [composer]);

  const layoutCount = React.useMemo(
    () => (open ? SITE_TEMPLATES.filter((t) => t.type === "page").length + getMyTemplates().length : 0),
    [open],
  );

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
      setError("Couldn't add page right now. Try again.");
      return;
    }
    if (addToNav) composer.elements.addPageToNavigation(pageId);
    composer.elements.setActivePage(pageId);
    setOpen(false);
    addToast({ title: "Page created", description: `‘${trimmed}’ is ready.`, tone: "success" });
  };

  const card = (value: Source, icon: React.ReactNode, title: string, hint: string) => (
    <Button
      color="light"
      role="radio"
      aria-checked={source === value}
      className={`${CARD} ${source === value ? CARD_ON : CARD_OFF}`}
      data-testid={`new-page-source-${value}`}
      onClick={() => setSource(value)}
    >
      <span className="tw:flex tw:flex-col tw:items-start tw:gap-3">
        {icon}
        <span className="tw:flex tw:flex-col tw:gap-1">
          <span className="tw:block tw:text-[length:var(--bk-text-13)] tw:font-semibold tw:text-[var(--bk-ink)]">{title}</span>
          <span className="tw:block tw:text-[length:var(--bk-text-12)] tw:text-[var(--bk-ink-muted)]">{hint}</span>
        </span>
      </span>
    </Button>
  );

  return (
    <Modal
      open={open}
      onClose={() => setOpen(false)}
      title="New page"
      /* width/dialog-lg — board 6752:59256 draws this one at 640. */
      width="lg"
      testId="new-page-modal"
      closeButton
      footer={
        <>
          <Button color="light" size="xs" data-testid="new-page-cancel" onClick={() => setOpen(false)}>
            Cancel
          </Button>
          <Button size="xs" data-testid="new-page-create" disabled={!name.trim()} onClick={create}>
            Create page
          </Button>
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
        <div className="tw:flex tw:flex-col tw:gap-1">
          <Label htmlFor="new-page-name" className={BK_LABEL_CLASS}>
            Page name
          </Label>
          <TextInput
            id="new-page-name"
            data-testid="new-page-name"
            placeholder="About us"
            value={name}
            autoFocus
            onFocus={(e) => e.currentTarget.select()}
            onChange={(e) => {
              setName(e.target.value);
              setError(null);
            }}
          />
        </div>
        <div className="tw:flex tw:gap-4" role="radiogroup" aria-label="Start from">
          {card("blank", <Square size={20} strokeWidth={1.75} aria-hidden />, "Blank", "Empty canvas")}
          {card("template", <Grid3x3 size={20} strokeWidth={1.75} aria-hidden />, "From template", `Pick from ${layoutCount} layouts`)}
        </div>
        <div className="tw:flex tw:items-center tw:gap-2">
          <ToggleSwitch
            id="new-page-add-to-nav"
            checked={addToNav}
            onChange={setAddToNav}
            aria-labelledby="new-page-add-to-nav-label"
            sizing="sm"
            data-testid="new-page-add-to-nav"
          />
          <span id="new-page-add-to-nav-label" className="tw:text-[length:var(--bk-text-13)] tw:text-[var(--bk-ink)]">
            Add to site navigation
          </span>
        </div>
        {error ? (
          <p role="alert" className="tw:m-0 tw:text-[length:var(--bk-text-12)] tw:text-[var(--bk-error)]">
            {error}
          </p>
        ) : null}
      </form>
    </Modal>
  );
}
