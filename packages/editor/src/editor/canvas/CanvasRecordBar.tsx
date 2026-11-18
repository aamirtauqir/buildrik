/**
 * CanvasRecordBar — on a collection's template page, which record the canvas
 * previews (design-2l9 173:12022 · 173:12390 · 174:13155 · 177:17091):
 * "Record [title ⌄] ‹ › ☐ Show drafts" under the canvas bar, and a picker
 * ("Search published records…", "Showing published records · N",
 * "☐ Show drafts on canvas", Close).
 *
 * A view preference, held by the engine (composer.cms.bindings
 * setPreviewRecord / setShowDrafts): the page, its bindings and what publishes
 * do not change. Absent on every page that is not a template.
 *
 * @license BSD-3-Clause
 */
import * as React from "react";
import { ChevronDown, ChevronLeft, ChevronRight } from "lucide-react";
import type { Composer } from "@/engine";
import type { CMSCollection, CMSContentItem } from "@/shared/types/cms";
import { EVENTS } from "@/shared/constants";
import { Button, Checkbox, IconButton, Popover, TextInput } from "@/editor/chrome-ui";
import { recordTitle } from "@/editor/cms/RecordsTable";

const LABEL = "tw:text-[12px] tw:leading-[18px] tw:text-[var(--bk-ink-soft)]";

interface BarState {
  collection: CMSCollection;
  candidates: CMSContentItem[];
  current: CMSContentItem | null;
  drafts: boolean;
}

function useRecordBar(composer: Composer | null): BarState | null {
  const [state, setState] = React.useState<BarState | null>(null);
  const [tick, setTick] = React.useState(0);
  React.useEffect(() => {
    if (!composer) return;
    const bump = () => setTick((t) => t + 1);
    const evs = [EVENTS.PAGE_CHANGED, EVENTS.PAGE_CREATED, EVENTS.PROJECT_LOADED, EVENTS.CMS_PREVIEW_RECORD_CHANGED, EVENTS.CMS_COLLECTION_UPDATED];
    evs.forEach((e) => composer.on(e, bump));
    const store = composer.cms.collections;
    const storeEvs = ["content:created", "content:updated", "content:deleted", EVENTS.CMS_CONTENT_PUBLISHED, EVENTS.CMS_CONTENT_UNPUBLISHED, EVENTS.CMS_STORE_REFRESHED, EVENTS.CMS_COLLECTION_UPDATED];
    storeEvs.forEach((e) => store.on(e, bump));
    return () => {
      evs.forEach((e) => composer.off(e, bump));
      storeEvs.forEach((e) => store.off(e, bump));
    };
  }, [composer]);
  React.useEffect(() => {
    let live = true;
    const pageId = composer?.elements.getActivePage()?.id;
    const collectionId = composer && pageId ? composer.cms.bindings.templateCollectionOf(pageId) : null;
    const collection = collectionId ? composer?.cms.collections.getCollection(collectionId) : null;
    if (!composer || !collection) {
      setState(null);
      return;
    }
    const b = composer.cms.bindings;
    void Promise.all([b.previewCandidates(collection.id), b.getPreviewRecord(collection.id)]).then(([candidates, current]) => {
      if (live) setState({ collection, candidates, current, drafts: b.getShowDrafts() });
    });
    return () => {
      live = false;
    };
  }, [composer, tick]);
  return state;
}

export function CanvasRecordBar({ composer }: { composer: Composer | null }) {
  const state = useRecordBar(composer);
  const [open, setOpen] = React.useState(false);
  const [query, setQuery] = React.useState("");
  if (!composer || !state) return null;
  const { collection, candidates, current, drafts } = state;
  const b = composer.cms.bindings;
  const at = current ? candidates.findIndex((r) => r.id === current.id) : -1;
  const step = (by: number) => {
    const next = candidates[at + by];
    if (next) b.setPreviewRecord(collection.id, next.id);
  };
  const q = query.trim().toLowerCase();
  const shown = q ? candidates.filter((r) => recordTitle(collection, r).toLowerCase().includes(q)) : candidates;
  const toggleDrafts = (on: boolean) => b.setShowDrafts(on);

  return (
    <div
      className="tw:-mx-6 tw:-mt-6 tw:mb-6 tw:flex tw:h-10 tw:flex-none tw:items-center tw:gap-3 tw:border-b tw:border-[var(--bk-gray-200)] tw:bg-[var(--bk-bg-card)] tw:px-3"
      data-testid="canvas-record-bar"
    >
      <span className={LABEL}>Record</span>
      <Popover
        open={open}
        onClose={() => setOpen(false)}
        placement="bottom"
        label={`${collection.name} records`}
        trigger={
          <Button
            size="xs"
            variant="secondary"
            className="tw:h-7 tw:w-[337px] tw:justify-between tw:px-2 tw:text-[13px] tw:font-normal"
            onClick={() => setOpen((o) => !o)}
            data-testid="canvas-record-pick"
          >
            <span className="tw:truncate">{current ? recordTitle(collection, current) : `No ${drafts ? "" : "published "}records`}</span>
            <ChevronDown size={14} aria-hidden="true" />
          </Button>
        }
      >
        <div className="tw:flex tw:w-[361px] tw:flex-col tw:gap-1 tw:p-2" data-testid="canvas-record-picker">
          <TextInput
            sizing="sm"
            placeholder={drafts ? "Search records…" : "Search published records…"}
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            data-testid="canvas-record-search"
          />
          <div className="tw:flex tw:max-h-60 tw:flex-col tw:overflow-y-auto">
            {shown.map((r) => (
              <Button
                key={r.id}
                size="xs"
                variant="ghost"
                aria-current={r.id === current?.id ? "true" : undefined}
                className={`tw:h-8 tw:w-full tw:justify-center tw:text-[13px] tw:font-normal ${r.id === current?.id ? "tw:bg-[var(--bk-accent-tint)]" : ""}`}
                onClick={() => {
                  b.setPreviewRecord(collection.id, r.id);
                  setOpen(false);
                }}
                data-testid={`canvas-record-option-${r.id}`}
              >
                <span className="tw:truncate">{recordTitle(collection, r)}</span>
                {r.status === "draft" ? <span className="tw:ml-2 tw:text-[11px] tw:text-[var(--bk-ink-muted)]">Draft</span> : null}
              </Button>
            ))}
          </div>
          <span className={LABEL} data-testid="canvas-record-count">
            {`Showing ${drafts ? "published and draft" : "published"} records · ${shown.length}`}
          </span>
          <label className="tw:flex tw:h-7 tw:items-center tw:gap-2 tw:text-[13px] tw:text-[var(--bk-ink)]">
            <Checkbox checked={drafts} onChange={(e) => toggleDrafts(e.target.checked)} data-testid="canvas-record-drafts-picker" />
            Show drafts on canvas
          </label>
          <Button size="xs" variant="ghost" className="tw:h-7 tw:w-full tw:justify-center tw:text-[13px]" onClick={() => setOpen(false)} data-testid="canvas-record-close">
            Close
          </Button>
        </div>
      </Popover>
      <IconButton size="sm" label="Previous record" disabled={at <= 0} onClick={() => step(-1)} data-testid="canvas-record-prev">
        <ChevronLeft size={14} aria-hidden="true" />
      </IconButton>
      <IconButton size="sm" label="Next record" disabled={at < 0 || at >= candidates.length - 1} onClick={() => step(1)} data-testid="canvas-record-next">
        <ChevronRight size={14} aria-hidden="true" />
      </IconButton>
      <label className="tw:flex tw:items-center tw:gap-2 tw:text-[13px] tw:text-[var(--bk-ink)]">
        <Checkbox checked={drafts} onChange={(e) => toggleDrafts(e.target.checked)} data-testid="canvas-record-drafts" />
        Show drafts
      </label>
    </div>
  );
}
