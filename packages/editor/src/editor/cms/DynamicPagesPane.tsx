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
import { ACTION, CONTROL, CONTROL_W, LABEL, NOTE, PANE, SECTION, WARN } from "./paneStyles";
import { DynamicPagesStart } from "./DynamicPagesStart";

/* 187:21853: the linked view's 720 fields, filled, under 13/20 ink labels. */
const LINKED_W = "tw:w-[720px]";
const LINKED_LABEL = "tw:mb-2 tw:block tw:text-[13px] tw:leading-5 tw:text-[var(--bk-ink)]";
const FILLED = "tw:[&_input]:border-0 tw:[&_input]:bg-[var(--bk-gray-100)]";
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
}

type Made = Pick<CreatedCollectionPage, "pageId" | "name"> & { undo?: CreatedCollectionPage["undo"] };

export function DynamicPagesPane({ composer, collection, records, onOpenPage }: DynamicPagesPaneProps) {
  const { addToast } = useToast();
  const [pattern, setPattern] = React.useState(collection.pageSlugPattern ?? "");
  const [template, setTemplate] = React.useState(collection.pageTemplatePath ?? "");
  /* BD-05: each record page's <title> and description, from its fields. */
  const [seoTitle, setSeoTitle] = React.useState(collection.pageSeoTitle ?? "");
  const [seoDescription, setSeoDescription] = React.useState(collection.pageSeoDescription ?? "");
  React.useEffect(() => setSeoTitle(collection.pageSeoTitle ?? ""), [collection.pageSeoTitle]);
  React.useEffect(() => setSeoDescription(collection.pageSeoDescription ?? ""), [collection.pageSeoDescription]);
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
    seoDescription.trim() !== (collection.pageSeoDescription ?? "");
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
          if (!made.undo?.()) return;
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

  let status: React.ReactNode;
  if (!trimmed) {
    status = <span className={WARN} data-testid="cms-dp-status">No pattern set — this collection generates no pages.</span>;
  } else if (unknown.length) {
    status = (
      <span className={`${WARN} tw:flex tw:items-center tw:gap-2`} data-testid="cms-dp-status">
        {trimmed} cannot be saved: {unknown.join(", ")} {unknown.length === 1 ? "is" : "are"} not a field of {collection.name}.
        {fix ? (
          <Button size="xs" variant="link" className="tw:h-auto tw:min-h-0 tw:p-0 tw:text-[12px]" data-testid="cms-dp-fix" onClick={() => setPattern(fix)}>
            Use {fix}
          </Button>
        ) : null}
      </span>
    );
  } else if (patternProblem) {
    status = <span className={WARN} data-testid="cms-dp-status">{trimmed} cannot be saved: {patternProblem}</span>;
  } else if (published.length === 0) {
    status = (
      <span className={WARN} data-testid="cms-dp-status">
        {records.length === 0
          ? "No records yet — nothing to generate."
          : `${records.length} record${records.length === 1 ? "" : "s"}, none published. Dynamic pages only generate from published records.`}
      </span>
    );
  } else if (!template) {
    status = <span className={WARN} data-testid="cms-dp-status">Choose a template page — without one, publishing emits none of these.</span>;
  } else if (!templateName) {
    /* A09-8/A-17: the saved template page can go missing (renamed or
       deleted) without this pane's own state changing — `template` still
       holds the old file name, so `ready` looked true while the publish
       service would silently skip every record for this collection
       (`appendDynamicPagesToPublish`'s `if (!template) continue`). Surface
       the dangling reference instead of claiming Ready. */
    status = <span className={WARN} data-testid="cms-dp-status">The saved template page is missing — choose one again, or publishing generates none of these.</span>;
  } else if (collide) {
    status = <span className={WARN} data-testid="cms-dp-status">Two records resolve to the same URL — add a field that differs, such as {"{slug}"}.</span>;
  } else {
    status = (
      <span className="tw:flex tw:items-center tw:gap-2" data-testid="cms-dp-status">
        <span className="tw:inline-flex tw:h-5 tw:items-center tw:gap-1 tw:rounded-[4px] tw:bg-[var(--bk-green-100)] tw:px-1.5 tw:text-[11px] tw:font-medium tw:text-[var(--bk-green-700)]">
          <span className="tw:size-1.5 tw:rounded-full tw:bg-[var(--bk-green-500)]" aria-hidden="true" />
          Ready
        </span>
        <span className={NOTE}>
          {published.length} complete record{published.length === 1 ? "" : "s"} will get a page
          {drafts ? ` · ${drafts} unpublished draft${drafts === 1 ? " is" : "s are"} skipped` : ""}
        </span>
      </span>
    );
  }

  /* The link as saved — not a form edit still in progress. */
  const linkedPage = collection.pageTemplatePath && templatePage?.file === collection.pageTemplatePath ? templatePage : null;
  if (ready && linkedPage && !dirty) {
    /* 187:21853 — what the next publish does, in words. */
    status = (
      <section className="tw:flex tw:flex-col tw:gap-1" data-testid="cms-dp-status">
        <h3 className="tw:m-0 tw:text-[12px] tw:font-semibold tw:leading-[18px] tw:text-[var(--bk-ink)]">On the next publish</h3>
        <p className="tw:m-0 tw:text-[13px] tw:leading-5 tw:text-[var(--bk-ink)]">
          {`${published.length} published record${published.length === 1 ? "" : "s"} will generate ${published.length} page${published.length === 1 ? "" : "s"}. Changes to records or the template appear after site publish.`}
        </p>
      </section>
    );
  }

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

  const patternField = (
      <div className={linkedPage ? LINKED_W : CONTROL_W}>
        <label className={linkedPage ? LINKED_LABEL : LABEL} htmlFor="cms-dp-pattern">URL pattern</label>
        <TextInput
          id="cms-dp-pattern"
          sizing="sm"
          className={linkedPage ? `${CONTROL} ${FILLED}` : CONTROL}
          placeholder="/menu/{slug}"
          value={pattern}
          onChange={(e) => setPattern(e.target.value)}
          data-testid="cms-dp-pattern"
        />
      </div>
  );
  const seoTitleField = (
      <div className={linkedPage ? LINKED_W : CONTROL_W}>
        <label className={linkedPage ? LINKED_LABEL : LABEL} htmlFor="cms-dp-seo-title">{linkedPage ? "SEO title" : "SEO title pattern"}</label>
        <TextInput
          id="cms-dp-seo-title"
          sizing="sm"
          className={linkedPage ? `${CONTROL} ${FILLED}` : CONTROL}
          placeholder={`{${collection.displayField ?? collection.fields[0]?.slug ?? "title"}}`}
          value={seoTitle}
          onChange={(e) => setSeoTitle(e.target.value)}
          data-testid="cms-dp-seo-title"
        />
      </div>
  );
  const templateField = (
      <div className={CONTROL_W}>
        <label className={LABEL} htmlFor="cms-dp-template">Template page</label>
        <Select id="cms-dp-template" sizing="sm" className={CONTROL} value={template} onChange={(e) => setTemplate(e.target.value)} data-testid="cms-dp-template">
          <option value="">Choose a page…</option>
          {pages.map((p) => (
            <option key={p.file} value={p.file}>
              {p.name}
            </option>
          ))}
        </Select>
      </div>
  );
  const seoDescriptionField = (
      <div className={CONTROL_W}>
        <label className={LABEL} htmlFor="cms-dp-seo-description">SEO description pattern</label>
        <TextInput
          id="cms-dp-seo-description"
          sizing="sm"
          className={CONTROL}
          value={seoDescription}
          onChange={(e) => setSeoDescription(e.target.value)}
          data-testid="cms-dp-seo-description"
        />
      </div>
  );
  const pageList = urls.length ? (
        <section className={CONTROL_W}>
          <h3 className={`${SECTION} tw:mb-2`}>
            Pages to generate · {urls.length}
          </h3>
          <ul className="tw:m-0 tw:list-none tw:rounded-[6px] tw:border tw:border-[var(--bk-border)] tw:p-0 tw:py-1" data-testid="cms-dp-list">
            {urls.map((u, i) => (
              <li key={`${u}-${i}`} className="tw:flex tw:h-[26px] tw:items-center tw:justify-between tw:px-2 tw:text-[13px] tw:leading-5 tw:text-[var(--bk-ink)]">
                <span className="tw:truncate">{u}</span>
                <span className="tw:flex-none tw:text-[11px] tw:text-[var(--bk-ink-muted)]">{templateName}</span>
              </li>
            ))}
          </ul>
        </section>
  ) : null;
  const rest = (
    <>
      {templateField}
      {seoDescriptionField}
      {pageList}
    </>
  );

  if (linkedPage) {
    /* 187:21853 — a saved link: its page and the way to it, the URL and SEO
       title, and what the next publish does. The template choice, SEO
       description and page list sit under More settings (kept, not drawn on
       the board); Save appears once something is edited. */
    return (
      <div className={PANE} data-testid="cms-dynamic-pages">
        <div className="tw:flex tw:flex-col tw:items-start" data-testid="cms-dp-linked">
          <h3 className="tw:m-0 tw:text-[13px] tw:font-semibold tw:leading-5 tw:text-[var(--bk-ink)]">{linkedPage.name}</h3>
          {onOpenPage ? (
            <Button size="xs" variant="link" className="tw:mt-3 tw:h-8 tw:w-[200px] tw:justify-center tw:p-0 tw:text-[13px] tw:font-normal" onClick={() => onOpenPage(linkedPage.id)} data-testid="cms-dp-edit-page">
              Edit collection page ›
            </Button>
          ) : null}
        </div>
        {patternField}
        {seoTitleField}
        {seoUnknown.length ? (
        <span className={WARN} data-testid="cms-dp-seo-error">
          {seoUnknown.join(", ")} {seoUnknown.length === 1 ? "is" : "are"} not a field of {collection.name}.
        </span>
      ) : null}
        <div>{status}</div>
        <details className="tw:w-[720px]" data-testid="cms-dp-more">
          <summary className={`${NOTE} tw:cursor-pointer`}>More settings</summary>
          <div className="tw:mt-3 tw:flex tw:flex-col tw:gap-4">{rest}</div>
        </details>
        {dirty ? (
          <div>
        <Button
          size="xs"
          className={ACTION}
          disabled={!(dirty || ready) || saving || unknown.length > 0 || Boolean(patternProblem) || seoUnknown.length > 0}
          data-testid="cms-dp-save"
          onClick={() => void save()}
        >
          Save changes
        </Button>
      </div>
        ) : null}
      </div>
    );
  }

  return (
    <div className={PANE} data-testid="cms-dynamic-pages">
      <p className={`${NOTE} tw:m-0`}>One page per record. Pages are created on publish and update when records change.</p>
      {patternField}
      {templateField}
      {seoTitleField}
      {seoDescriptionField}
      {seoUnknown.length ? (
        <span className={WARN} data-testid="cms-dp-seo-error">
          {seoUnknown.join(", ")} {seoUnknown.length === 1 ? "is" : "are"} not a field of {collection.name}.
        </span>
      ) : null}
      <div>{status}</div>
      {pageList}
      <div>
        <Button
          size="xs"
          className={ACTION}
          disabled={!(dirty || ready) || saving || unknown.length > 0 || Boolean(patternProblem) || seoUnknown.length > 0}
          data-testid="cms-dp-save"
          onClick={() => void save()}
        >
          {ready ? `Generate ${published.length} page${published.length === 1 ? "" : "s"}` : "Save"}
        </Button>
      </div>
    </div>
  );
}
