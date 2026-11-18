/**
 * DynamicPagesPane — a collection's generated pages (4428:147857; pattern
 * edited 6887:77325; no pattern 4418:89084; none published 4418:89287;
 * unknown URL field 4418:164278).
 *
 * The URL pattern and the template page are the two things the publish
 * service needs (`appendDynamicPagesToPublish` only takes collections with
 * BOTH `pageSlugPattern` and `pageTemplatePath`); pages are rendered on
 * publish, one per published record. The template is bound by the page's
 * published file name (`pageFileNames`), the same name the publish payload
 * carries, so the server finds it. "Generate N pages" saves that binding —
 * the pages themselves appear with the next publish, as the intro line says.
 *
 * design-2l9 187:20406 … 187:22375: until a page is linked the tab starts on
 * "Create collection page" / "Choose an existing page" (DynamicPagesStart);
 * a linked page that is gone says so before the form.
 *
 * @license BSD-3-Clause
 */
import * as React from "react";
import type { Composer } from "@/engine";
import { EVENTS } from "@/shared/constants";
import { pageFileNames } from "@/engine/export";
import type { CMSCollection, CMSContentItem } from "@/shared/types/cms";
import { Button, Select, TextInput, useToast } from "@/editor/chrome-ui";
import { applyCmsPattern, cmsPatternError, cmsSlugField } from "@buildrik/shared/schemas/cms";
import { NOTE, PANE, WARN } from "./paneStyles";
import { DynamicPagesStart } from "./DynamicPagesStart";
import { undoWithOwnReceipt } from "@/editor/shell/hooks/useHistoryFeedback";

/* 165:3693 / 187:21853: 720 filled fields under 13/20 ink labels; an
   invalid one is outlined in the error red. */
const FIELD_W = "tw:w-[720px]";
/* 165:3432 measured: this form's controls are 28 tall (the shared pane
   CONTROL is 32), filled, 13px. */
const CONTROL =
  "tw:[&_input]:h-7 tw:[&_input]:py-0 tw:[&_input]:pl-2.5 tw:[&_input]:text-[13px] tw:[&_input]:rounded-[6px] " +
  "tw:[&_select]:h-7 tw:[&_select]:py-0 tw:[&_select]:pl-2.5 tw:[&_select]:text-[13px] tw:[&_select]:rounded-[6px]";
const FIELD_LABEL = "tw:mb-2 tw:block tw:text-[13px] tw:leading-5 tw:text-[var(--bk-ink)]";
const FILLED =
  "tw:[&_input]:border-0 tw:[&_input]:bg-[var(--bk-gray-100)] tw:[&_select]:border-0 tw:[&_select]:bg-[var(--bk-gray-100)]";
const INVALID = "tw:[&_input]:border tw:[&_input]:border-[var(--bk-error)]";
import { CreateCollectionPageDialog, type CreateCollectionPageChoice } from "./CreateCollectionPageDialog";
import { buildCollectionPage, collectionPageName, retryCollectionLink, saveCollectionLink, type CreatedCollectionPage } from "./createCollectionPage";
import { unsavedCollectionLinks, useUnsavedCollectionLink } from "./unsavedCollectionLinks";
import { isCmsCollectionSaveOwed, onCmsSyncError } from "@/services/cmsSync";

export interface DynamicPagesPaneProps {
  composer: Composer | null;
  collection: CMSCollection;
  records: CMSContentItem[];
  /** Put a page on the canvas and leave the CMS (187:21418). */
  onOpenPage?: (pageId: string) => void;
  /** 165:3693 — the form's Save lives in the workspace header (top-right);
   *  the pane reports it here (null while no form is shown). */
  onSaveAction?: (action: DynamicPagesSave | null) => void;
}

export interface DynamicPagesSave {
  disabled: boolean;
  saving: boolean;
  run: () => void;
}

type Made = Pick<CreatedCollectionPage, "pageId" | "name"> & { undo?: CreatedCollectionPage["undo"] };

export function DynamicPagesPane({ composer, collection, records, onOpenPage, onSaveAction }: DynamicPagesPaneProps) {
  const { addToast } = useToast();
  const [pattern, setPattern] = React.useState(collection.pageSlugPattern ?? "");
  const [template, setTemplate] = React.useState(collection.pageTemplatePath ?? "");
  /* BD-05: each record page's <title> and description, from its fields. */
  const [seoTitle, setSeoTitle] = React.useState(collection.pageSeoTitle ?? "");
  const [seoDescription, setSeoDescription] = React.useState(collection.pageSeoDescription ?? "");
  React.useEffect(() => setSeoTitle(collection.pageSeoTitle ?? ""), [collection.pageSeoTitle]);
  React.useEffect(() => setSeoDescription(collection.pageSeoDescription ?? ""), [collection.pageSeoDescription]);
  /* A-27 (165:3693 "Social image"): the image field each page's og:image comes from. */
  const [socialImage, setSocialImage] = React.useState(collection.pageSocialImage ?? "");
  React.useEffect(() => setSocialImage(collection.pageSocialImage ?? ""), [collection.pageSocialImage]);
  const imageFields = collection.fields.filter((f) => f.type === "image");
  const [saving, setSaving] = React.useState(false);
  React.useEffect(() => setPattern(collection.pageSlugPattern ?? ""), [collection.pageSlugPattern]);
  React.useEffect(() => setTemplate(collection.pageTemplatePath ?? ""), [collection.pageTemplatePath]);

  /* Re-read on every page change — made here (187:20616), or gone with an
     Undo (187:22375) — not memoised on the composer. */
  const [, setPagesTick] = React.useState(0);
  React.useEffect(() => {
    if (!composer) return;
    const bump = () => setPagesTick((t) => t + 1);
    const evs = [EVENTS.PAGE_CHANGED, EVENTS.PAGE_CREATED, EVENTS.PROJECT_LOADED, EVENTS.HISTORY_UNDO, EVENTS.HISTORY_REDO];
    evs.forEach((e) => composer.on(e, bump));
    return () => evs.forEach((e) => composer.off(e, bump));
  }, [composer]);
  const pages = (() => {
    if (!composer) return [];
    const all = composer.elements.getAllPages();
    const names = pageFileNames(all);
    /* The home page is index.html — a collection that binds its template to it
       would emit {field} tokens at the site root (BD-04). Exclude it here so
       the picker can never offer the home, matching the server's BAD_REQUEST
       guard in upsertCollection(). */
    return all
      .map((p) => ({ id: p.id, file: names.get(p.id) ?? "index.html", name: p.name }))
      .filter((p) => p.file !== "index.html");
  })();
  const templatePage = pages.find((p) => p.file === template) ?? null;
  const templateName = templatePage?.name ?? "";

  const trimmed = pattern.trim();
  const keys = [...trimmed.matchAll(/\{([a-zA-Z0-9_-]+)\}/g)].map((m) => m[1]);
  const unknown = keys.filter((k) => !collection.fields.some((f) => f.slug === k));
  const published = records.filter((r) => r.status === "published");
  const drafts = records.length - published.length;
  /* DM-18: the pattern is a real path (the server refuses one that isn't);
     unknown fields keep their own board line (4418:164278). */
  const patternProblem = trimmed && unknown.length === 0 ? cmsPatternError(trimmed, collection.fields) : null;
  /* The server's own slug rule (shared applyCmsPattern), for the preview. */
  const urls = trimmed && unknown.length === 0 && !patternProblem ? published.map((r) => applyCmsPattern(trimmed, r.data, true)) : [];
  const collide = urls.length !== new Set(urls).size;
  const ready = Boolean(trimmed) && unknown.length === 0 && !patternProblem && Boolean(templateName) && published.length > 0 && !collide;
  const seoKeys = [...`${seoTitle} ${seoDescription}`.matchAll(/\{([a-zA-Z0-9_-]+)\}/g)].map((m) => m[1]);
  const seoUnknown = seoKeys.filter((k) => !collection.fields.some((f) => f.slug === k));
  const dirty =
    trimmed !== (collection.pageSlugPattern ?? "") ||
    template !== (collection.pageTemplatePath ?? "") ||
    seoTitle.trim() !== (collection.pageSeoTitle ?? "") ||
    seoDescription.trim() !== (collection.pageSeoDescription ?? "") ||
    socialImage !== (collection.pageSocialImage ?? "");
  const slugField = cmsSlugField(collection.fields) ?? collection.fields[0];
  const fix = unknown.length && slugField ? trimmed.replace(`{${unknown[0]}}`, `{${slugField.slug}}`) : null;

  /* 187:20406 → 187:21418: the start screen, the create dialog, and the two
     steps of creating — the page, then the server-confirmed link. */
  const [form, setForm] = React.useState(false);
  const [dialog, setDialog] = React.useState(false);
  const [creating, setCreating] = React.useState<string | null>(null);
  /* 187:21035 — held in a store, so it outlives this tab (187:22071). */
  const unlinked = useUnsavedCollectionLink(collection.id);
  /* The queue may land it on its own (a reconnect replays the outbox):
     then the link is saved and the notice goes. */
  React.useEffect(() => {
    if (!unlinked) return;
    const check = () => {
      if (!isCmsCollectionSaveOwed(collection.id) && collection.pageTemplatePath === unlinked.file) unsavedCollectionLinks.clear(collection.id);
    };
    return onCmsSyncError(() => window.setTimeout(check, 0));
  }, [unlinked, collection.id, collection.pageTemplatePath]);
  const [linking, setLinking] = React.useState(false);
  const opened = (made: Made) => {
    addToast({
      tone: "success",
      /* 187:21418 — one line and its Undo. */
      description: `${made.name} created · ${published.length} page${published.length === 1 ? "" : "s"} on publish`,
      /* 187:21418 → 187:22586: Undo reverts the one creation step; the
         collection's link stays and now points at nothing — said so. */
      action: made.undo && {
        label: "Undo",
        onClick: () => {
          /* The follow-up below is this undo's message; the shell's "Undo: …" bar stays down. */
          if (!made.undo || !undoWithOwnReceipt(made.undo)) return;
          addToast({
            /* 187:22586: one line and Open CMS. Stays until answered: the
               shell's own "Undo: …" receipt would otherwise replace it. */
            tone: "neutral",
            duration: Infinity,
            description: `${made.name} removed. Collection link needs repair.`,
            action: { label: "Open CMS", onClick: () => composer?.emit(EVENTS.UI_PANEL_OPEN, { panel: "content" }) },
          });
        },
      },
    });
    onOpenPage?.(made.pageId);
  };
  const create = async (choice: CreateCollectionPageChoice) => {
    if (!composer) return;
    setDialog(false);
    setCreating(collectionPageName(collection, choice.layout));
    try {
      const made = await buildCollectionPage(composer, collection, choice.plan, choice.layout);
      let reached = false;
      try {
        reached = await saveCollectionLink(composer, collection, { file: made.file, pattern: choice.pattern });
      } catch {
        reached = false;
      }
      if (reached) opened(made);
      else
        unsavedCollectionLinks.set({
          collectionId: collection.id,
          collectionName: collection.name,
          pageId: made.pageId,
          name: made.name,
          file: made.file,
          pattern: choice.pattern,
        });
    } finally {
      setCreating(null);
    }
  };
  const retryLink = async () => {
    if (!composer || !unlinked) return;
    setLinking(true);
    try {
      if (await retryCollectionLink(composer, collection.id)) {
        const made = unlinked;
        unsavedCollectionLinks.clear(collection.id);
        opened(made);
      }
    } finally {
      setLinking(false);
    }
  };

  const save = async () => {
    if (!composer || unknown.length || patternProblem || seoUnknown.length) return;
    setSaving(true);
    try {
      /* Empty clears the binding rather than storing "" — a collection with
         no pattern is one that generates nothing, and both are optional. */
      await composer.cms.collections.updateCollection(collection.id, {
        pageSlugPattern: trimmed || undefined,
        pageTemplatePath: template || undefined,
        pageSeoTitle: seoTitle.trim() || undefined,
        pageSeoDescription: seoDescription.trim() || undefined,
        pageSocialImage: socialImage || undefined,
      });
      addToast({
        tone: "success",
        title: "Dynamic pages saved",
        description: ready
          ? `${collection.name} generates ${published.length} page${published.length === 1 ? "" : "s"} on the next publish.`
          : `${collection.name} · nothing is generated until the pattern, template and a published record are all in place.`,
      });
    } finally {
      setSaving(false);
    }
  };

  /* 165:3693 / 4418:164278: what is wrong with the URL pattern is said under
     the field itself (red), with the one-click fix. A collision is checked
     with the shared slug rule over the published records — what the publish
     worker generates paths from — and blocks Save. */
  const firstDup = urls.find((u, i) => urls.indexOf(u) !== i) ?? null;
  const slugFix = slugField ? trimmed.replace(/\{[a-zA-Z0-9_-]+\}(?!.*\{)/, `{${slugField.slug}}`) : null;
  let patternError: { text: string; fix: string | null } | null = null;
  if (unknown.length) {
    patternError = { text: `${trimmed} cannot be saved: ${unknown.join(", ")} ${unknown.length === 1 ? "is" : "are"} not a field of ${collection.name}.`, fix };
  } else if (patternProblem) {
    patternError = { text: `${trimmed} cannot be saved: ${patternProblem}`, fix: null };
  } else if (collide && firstDup) {
    patternError = {
      text: `Multiple records resolve to ${firstDup}. Choose a unique field, such as {${slugField?.slug ?? "slug"}}.`,
      fix: slugFix && slugFix !== trimmed ? slugFix : null,
    };
  }

  let status: React.ReactNode = null;
  if (!trimmed) {
    status = <span className={WARN} data-testid="cms-dp-status">No pattern set — this collection generates no pages.</span>;
  } else if (published.length === 0) {
    status = (
      <span className={WARN} data-testid="cms-dp-status">
        {records.length === 0
          ? "No records yet — nothing to generate."
          : `${records.length} record${records.length === 1 ? "" : "s"}, none published. Dynamic pages only generate from published records.`}
      </span>
    );
  } else if (!template) {
    status = <span className={WARN} data-testid="cms-dp-status">Choose a collection page — without one, publishing emits none of these.</span>;
  } else if (!templateName) {
    /* A09-8/A-17: the saved template page can go missing without this
       pane's state changing; never claim the pages will generate. */
    status = <span className={WARN} data-testid="cms-dp-status">The saved template page is missing — choose one again, or publishing generates none of these.</span>;
  } else {
    /* 165:3693 — what the next publish does, in a grey box; kept beside a
       pattern error (the board does), saying what that error means for it. */
    const distinct = new Set(urls).size;
    status = (
      <section className="tw:flex tw:flex-col tw:gap-1 tw:rounded-[6px] tw:bg-[var(--bk-gray-50)] tw:p-3" data-testid="cms-dp-status">
        <h3 className="tw:m-0 tw:text-[12px] tw:font-semibold tw:leading-[18px] tw:text-[var(--bk-ink)]">On the next publish</h3>
        <p className="tw:m-0 tw:text-[13px] tw:leading-5 tw:text-[var(--bk-ink)]">
          {patternError
            ? collide
              ? `${published.length} published records share ${distinct} URL${distinct === 1 ? "" : "s"} — saving is blocked until each record has its own.`
              : "Nothing is generated until the URL pattern can be saved."
            : `${published.length} published record${published.length === 1 ? "" : "s"} will generate ${published.length} page${published.length === 1 ? "" : "s"}.`}
          {!patternError && drafts ? ` ${drafts} draft record${drafts === 1 ? " is" : "s are"} excluded.` : ""}
          {!patternError ? " Changes to records or the template appear after site publish." : ""}
        </p>
      </section>
    );
  }
  const linkedPage = templatePage;

  const startState = creating
    ? ({ kind: "creating", name: creating } as const)
    : unlinked
      ? ({ kind: "link-failed", name: unlinked.name, pattern: unlinked.pattern, saving: linking } as const)
      : form
        ? null
        : !collection.pageTemplatePath && !collection.pageSlugPattern
          ? ({ kind: "empty", collection: collection.name } as const)
          : collection.pageTemplatePath && !templateName
            ? ({ kind: "missing" } as const)
            : null;
  const dialogEl = (
    <CreateCollectionPageDialog key={String(dialog)} open={dialog} collection={collection} onCancel={() => setDialog(false)} onCreate={(c) => void create(c)} />
  );
  const blocked = saving || Boolean(patternError) || seoUnknown.length > 0;
  /* Reported each render; the header draws it. */
  const saveRef = React.useRef(save);
  saveRef.current = save;
  const showsForm = !startState;
  React.useEffect(() => {
    if (!onSaveAction) return;
    onSaveAction(showsForm ? { disabled: blocked || !dirty, saving, run: () => void saveRef.current() } : null);
  }, [onSaveAction, showsForm, blocked, dirty, saving]);
  React.useEffect(() => () => onSaveAction?.(null), [onSaveAction]);
  if (startState) {
    return (
      <div className={PANE} data-testid="cms-dynamic-pages">
        <DynamicPagesStart
          state={startState}
          onCreate={() => setDialog(true)}
          onChooseExisting={() => setForm(true)}
          onRetryLink={() => void retryLink()}
          onOpenPage={unlinked && onOpenPage ? () => onOpenPage(unlinked.pageId) : undefined}
        />
        {dialogEl}
      </div>
    );
  }

  const field = (id: string, label: string, control: React.ReactNode, extra?: React.ReactNode, first = false) => (
    <div className={`${FIELD_W}${first ? " tw:mt-2" : ""}`}>
      <label className={FIELD_LABEL} htmlFor={id}>{label}</label>
      {control}
      {extra}
    </div>
  );

  /* 165:3693 (the whole form) · 187:21853 (a saved link): Collection page,
     Edit collection page ›, URL pattern, SEO title, SEO description, Social
     image, then
     what the next publish does. The page list stays, collapsed. */
  return (
    <div className={PANE} data-testid="cms-dynamic-pages">
      {field(
        "cms-dp-template",
        "Collection page",
        <Select id="cms-dp-template" sizing="sm" className={`${CONTROL} ${FILLED}`} value={template} onChange={(e) => setTemplate(e.target.value)} data-testid="cms-dp-template">
          <option value="">Choose a page…</option>
          {pages.map((p) => (
            <option key={p.file} value={p.file}>
              {p.name}
            </option>
          ))}
        </Select>,
        linkedPage && onOpenPage ? (
          <Button size="xs" variant="link" className="tw:mt-[17px] tw:h-8 tw:w-[200px] tw:justify-center tw:p-0 tw:text-[13px] tw:font-normal" onClick={() => onOpenPage(linkedPage.id)} data-testid="cms-dp-edit-page">
            Edit collection page ›
          </Button>
        ) : null,
        true,
      )}
      {field(
        "cms-dp-pattern",
        "URL pattern",
        <TextInput
          id="cms-dp-pattern"
          sizing="sm"
          className={`${CONTROL} ${FILLED} ${patternError ? INVALID : ""}`}
          placeholder="/menu/{slug}"
          value={pattern}
          color={patternError ? "failure" : undefined}
          aria-invalid={patternError ? true : undefined}
          onChange={(e) => setPattern(e.target.value)}
          data-testid="cms-dp-pattern"
        />,
        patternError ? (
          <div className="tw:mt-2 tw:flex tw:flex-col tw:items-start tw:gap-2">
            <span className="tw:text-[12px] tw:leading-[18px] tw:text-[var(--bk-ink-soft)]" data-testid="cms-dp-pattern-error">{patternError.text}</span>
            {patternError.fix ? (
              <Button size="xs" variant="link" className="tw:h-auto tw:min-h-0 tw:w-[200px] tw:justify-center tw:p-0 tw:text-[13px] tw:font-normal" data-testid="cms-dp-fix" onClick={() => setPattern(patternError!.fix!)}>
                {`Use ${patternError.fix.match(/\{[^}]+\}(?!.*\{)/)?.[0] ?? patternError.fix}`}
              </Button>
            ) : null}
          </div>
        ) : urls.length > 0 ? (
          /* 165:3432: how many pages the pattern makes, under the field. */
          <p className={`${NOTE} tw:m-0 tw:mt-2`} data-testid="cms-dp-unique">{`${urls.length.toLocaleString()} unique URL${urls.length === 1 ? "" : "s"}`}</p>
        ) : null,
      )}
      {field(
        "cms-dp-seo-title",
        "SEO title",
        <TextInput
          id="cms-dp-seo-title"
          sizing="sm"
          className={`${CONTROL} ${FILLED}`}
          placeholder={`{${collection.displayField ?? collection.fields[0]?.slug ?? "title"}}`}
          value={seoTitle}
          onChange={(e) => setSeoTitle(e.target.value)}
          data-testid="cms-dp-seo-title"
        />,
      )}
      {field(
        "cms-dp-seo-description",
        "SEO description",
        <TextInput id="cms-dp-seo-description" sizing="sm" className={`${CONTROL} ${FILLED}`} value={seoDescription} onChange={(e) => setSeoDescription(e.target.value)} data-testid="cms-dp-seo-description" />,
      )}
      {seoUnknown.length ? (
        <span className={WARN} data-testid="cms-dp-seo-error">
          {seoUnknown.join(", ")} {seoUnknown.length === 1 ? "is" : "are"} not a field of {collection.name}.
        </span>
      ) : null}
      {field(
        "cms-dp-social-image",
        "Social image",
        <Select id="cms-dp-social-image" sizing="sm" className={`${CONTROL} ${FILLED}`} value={socialImage} onChange={(e) => setSocialImage(e.target.value)} data-testid="cms-dp-social-image">
          <option value="">{imageFields.length ? "None" : "No image fields"}</option>
          {imageFields.map((f) => (
            <option key={f.slug} value={f.slug}>
              {f.name}
            </option>
          ))}
        </Select>,
      )}
      {status ? <div className={FIELD_W}>{status}</div> : null}
      {urls.length && !patternError ? (
        <details className={FIELD_W} data-testid="cms-dp-more">
          <summary className={`${NOTE} tw:cursor-pointer`}>{`Pages to generate · ${urls.length}`}</summary>
          <ul className="tw:m-0 tw:mt-2 tw:list-none tw:rounded-[6px] tw:border tw:border-[var(--bk-border)] tw:p-0 tw:py-1" data-testid="cms-dp-list">
            {urls.map((u, i) => (
              <li key={`${u}-${i}`} className="tw:flex tw:h-[26px] tw:items-center tw:justify-between tw:px-2 tw:text-[13px] tw:leading-5 tw:text-[var(--bk-ink)]">
                <span className="tw:truncate">{u}</span>
                <span className="tw:flex-none tw:text-[11px] tw:text-[var(--bk-ink-muted)]">{templateName}</span>
              </li>
            ))}
          </ul>
        </details>
      ) : null}
    </div>
  );
}
