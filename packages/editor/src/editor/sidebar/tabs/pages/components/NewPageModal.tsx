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
 * The board's "Add to site navigation" checkbox is not drawn: the product has
 * no navigation-element contract to write to (audit G2-074).
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
import { BK_LABEL_CLASS, Button, Label, Modal, TextInput, useToast } from "@/editor/chrome-ui";
import { SITE_TEMPLATES, getMyTemplates } from "@/editor/sidebar/tabs/templates/templatesData";

type Source = "blank" | "template";

const CARD =
  "tw:flex tw:h-auto tw:flex-1 tw:flex-col tw:items-start tw:gap-0.5 tw:rounded-lg tw:border tw:border-solid " +
  "tw:px-3 tw:py-2.5 tw:text-left tw:font-normal";
const CARD_ON = "tw:border-[var(--bk-accent)] tw:bg-[var(--bk-accent-tint)] tw:ring-1 tw:ring-[var(--bk-accent)]";
const CARD_OFF = "tw:border-[var(--bk-border)] tw:bg-[var(--bk-bg-panel)]";

export function NewPageModal({ composer }: { composer: Composer | null }) {
  const { addToast } = useToast();
  const [open, setOpen] = React.useState(false);
  const [name, setName] = React.useState("");
  const [source, setSource] = React.useState<Source>("template");
  const [error, setError] = React.useState<string | null>(null);

  React.useEffect(() => {
    if (!composer) return;
    const onRequest = () => {
      setName(getDefaultPageName(composer.elements.getAllPages()));
      setSource("template");
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
      composer.emit(EVENTS.UI_BROWSE_TEMPLATES, { newPageName: trimmed });
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
    composer.elements.setActivePage(pageId);
    setOpen(false);
    addToast({ title: "Page created", description: `‘${trimmed}’ is ready.`, tone: "success" });
  };

  const card = (value: Source, title: string, hint: string) => (
    <Button
      color="light"
      role="radio"
      aria-checked={source === value}
      className={`${CARD} ${source === value ? CARD_ON : CARD_OFF}`}
      data-testid={`new-page-source-${value}`}
      onClick={() => setSource(value)}
    >
      <span className="tw:block tw:text-[length:var(--bk-text-13)] tw:font-medium tw:text-[var(--bk-ink)]">{title}</span>
      <span className="tw:block tw:text-[length:var(--bk-text-12)] tw:text-[var(--bk-ink-muted)]">{hint}</span>
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
        className="tw:flex tw:flex-col tw:gap-3"
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
        <div className="tw:flex tw:gap-2" role="radiogroup" aria-label="Start from">
          {card("blank", "Blank", "Empty canvas")}
          {card("template", "From template", `Pick from ${layoutCount} layouts`)}
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
