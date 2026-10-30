/**
 * A Collection list's "Pages" and "When empty" (B-30; 2L9 B5-D75 `189:22181`,
 * D78 `189:24174`, D80 `189:25445`, D81 `189:25985`, D82 `189:26518`):
 *
 *   Pages        ◉ Show first 6 only   ○ Split into pages
 *                3 pages · /, /page/2, /page/3
 *                Generated on publish. Previous and Next are editable links.
 *                /page/2 is already used by another page. …   Open conflicting page ›
 *   When empty   ◉ Show editable No items block   ○ Hide list
 *
 * Split adds the pager (an ordinary block after the list); Show first removes
 * it. "Show editable No items block" adds the list's No items child when it
 * has none. Each choice is one history step. A collection page is one
 * record's page, so it cannot split (engine-list-query.md §Pages).
 *
 * @license BSD-3-Clause
 */
import * as React from "react";
import type { Composer } from "@/engine";
import type { CMSCollectionBinding } from "@/engine/cms/CMSBindingManager";
import { ensureEmptySlot, ensurePager, listPagination, removePager, type ListPagination } from "@/engine/cms/listPages";
import { EVENTS } from "@/shared/constants/events";
import { Button, Radio } from "@/editor/chrome-ui";
import { GROUP_TITLE } from "@/editor/inspector/shared/controls/controlClasses";
import { NoteRow } from "./behaviourRows";

const ROW = "tw:flex tw:items-center tw:gap-2 tw:py-1 tw:text-[13px] tw:leading-5 tw:text-[var(--bk-ink)]";
const RADIO = "tw:border-[var(--bk-ink-muted)] tw:bg-[var(--bk-bg-card)]";
const LINK = "tw:h-8 tw:self-center tw:text-[13px] tw:font-normal";

function Choice({ name, checked, disabled, onPick, children, testId }: { name: string; checked: boolean; disabled?: boolean; onPick: () => void; children: React.ReactNode; testId: string }) {
  return (
    <label className={`${ROW} ${disabled ? "tw:opacity-50" : ""}`}>
      <Radio color="blue" className={RADIO} name={name} checked={checked} disabled={disabled} onChange={onPick} data-testid={testId} />
      <span>{children}</span>
    </label>
  );
}

/** The pages a split list will publish, kept in step with the list's records. */
function usePagination(composer: Composer, elementId: string, binding: CMSCollectionBinding): ListPagination | null {
  const [state, setState] = React.useState<ListPagination | null>(null);
  const key = JSON.stringify([binding.pages, binding.limit, binding.skip, binding.filter, binding.sort]);
  React.useEffect(() => {
    let live = true;
    const run = () => void listPagination(composer, elementId).then((p) => live && setState(p)).catch(() => live && setState(null));
    run();
    const evs = [EVENTS.PROJECT_CHANGED, EVENTS.CMS_LIST_QUERY_CHANGED] as const;
    for (const e of evs) composer.on(e, run);
    return () => {
      live = false;
      for (const e of evs) composer.off(e, run);
    };
  }, [composer, elementId, key]);
  return state;
}

export function CollectionPagesRows({ composer, elementId, binding }: { composer: Composer; elementId: string; binding: CMSCollectionBinding }) {
  const pagination = usePagination(composer, elementId, binding);
  const activePage = composer.elements.getActivePage?.();
  const onCollectionPage = Boolean(activePage && composer.cms.bindings.templateCollectionOf?.(activePage.id));
  const split = binding.pages === "split";
  const step = (label: string, write: () => void) => {
    composer.beginTransaction?.(label);
    try {
      write();
    } finally {
      composer.endTransaction?.();
    }
  };
  const pickFirst = () => step("Show first items", () => {
    composer.cms.bindings.setListQuery(elementId, { pages: undefined });
    removePager(composer, elementId);
  });
  const pickSplit = () => step("Split list into pages", () => {
    if (composer.cms.bindings.setListQuery(elementId, { pages: "split" })) ensurePager(composer, elementId);
  });
  const pickSlot = () => step("Show No items block", () => {
    if (composer.cms.bindings.setListQuery(elementId, { whenEmpty: undefined })) ensureEmptySlot(composer, elementId);
  });
  const pickHide = () => step("Hide empty list", () => {
    composer.cms.bindings.setListQuery(elementId, { whenEmpty: "hide" });
  });
  const name = `list-${elementId}`;

  return (
    <div className="tw:flex tw:flex-col" data-testid="collection-pages">
      <div className={`${GROUP_TITLE} tw:mt-4!`}>Pages</div>
      <div role="radiogroup" aria-label="Pages">
        <Choice name={`${name}-pages`} checked={!split || onCollectionPage} onPick={pickFirst} testId="collection-pages-first">
          {binding.limit ? `Show first ${binding.limit} only` : "Show all"}
        </Choice>
        <Choice name={`${name}-pages`} checked={split && !onCollectionPage} disabled={onCollectionPage || !binding.limit} onPick={pickSplit} testId="collection-pages-split">
          Split into pages
        </Choice>
      </div>
      {onCollectionPage ? (
        <NoteRow>Pagination is unavailable on a collection page.</NoteRow>
      ) : !binding.limit ? (
        <NoteRow>Set Show to split the list into pages.</NoteRow>
      ) : split && pagination ? (
        <>
          <NoteRow testId="collection-pages-paths">
            {pagination.paths.length === 1 ? "1 page" : `${pagination.paths.length} pages`} · {pagination.paths.join(", ")}
          </NoteRow>
          <NoteRow>Generated on publish. Previous and Next are editable links.</NoteRow>
          {pagination.collision ? (
            <>
              <NoteRow tone="error" testId="collection-pages-collision">
                {pagination.collision.path} is already used by another page. Rename that page or turn off pagination.
              </NoteRow>
              <Button type="button" variant="link" size="xs" className={LINK} onClick={() => composer.elements.setActivePage(pagination.collision!.pageId)}>
                Open conflicting page ›
              </Button>
            </>
          ) : null}
        </>
      ) : null}
      <div className={`${GROUP_TITLE} tw:mt-4!`}>When empty</div>
      <div role="radiogroup" aria-label="When empty">
        <Choice name={`${name}-empty`} checked={binding.whenEmpty !== "hide"} onPick={pickSlot} testId="collection-empty-slot">
          Show editable No items block
        </Choice>
        <Choice name={`${name}-empty`} checked={binding.whenEmpty === "hide"} onPick={pickHide} testId="collection-empty-hide">
          Hide list
        </Choice>
      </div>
    </div>
  );
}
