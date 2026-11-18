/**
 * CreateCollectionPageDialog — "Create collection page for {Collection}"
 * (design-2l9 187:20616, again from a missing page 191:31132): the URL
 * pattern, which fields become elements ("Name · Heading H1"), a layout, and
 * a preview of the order. Choosing only; DynamicPagesPane runs the creation.
 *
 * @license BSD-3-Clause
 */
import * as React from "react";
import type { CMSCollection } from "@/shared/types/cms";
import { Button, Checkbox, Modal, Radio, TextInput } from "@/editor/chrome-ui";
import { cmsPatternError } from "@buildrik/shared/schemas/cms";
import {
  COLLECTION_PAGE_LAYOUTS,
  defaultPagePattern,
  orderedPlan,
  pageFieldPlan,
  type CollectionPageLayout,
  type PageFieldPlan,
} from "./createCollectionPage";
import { CONTROL, NOTE, WARN } from "./paneStyles";

/* 187:20616: section heads 12 medium ink, 24 above; the pattern field filled. */
const HEAD = "tw:mb-2 tw:mt-6 tw:block tw:p-0 tw:text-[12px] tw:font-medium tw:leading-[18px] tw:text-[var(--bk-ink)]";
const LEGEND = "tw:mb-2 tw:block tw:p-0 tw:text-[12px] tw:font-medium tw:leading-[18px] tw:text-[var(--bk-ink)]";
const FILLED = "tw:[&_input]:border-0 tw:[&_input]:bg-[var(--bk-gray-100)]";

export interface CreateCollectionPageChoice {
  pattern: string;
  plan: PageFieldPlan[];
  layout: CollectionPageLayout;
}

export interface CreateCollectionPageDialogProps {
  open: boolean;
  collection: CMSCollection;
  onCancel: () => void;
  onCreate: (choice: CreateCollectionPageChoice) => void;
}

export function CreateCollectionPageDialog({ open, collection, onCancel, onCreate }: CreateCollectionPageDialogProps) {
  const plan = React.useMemo(() => pageFieldPlan(collection), [collection]);
  const [pattern, setPattern] = React.useState(() => defaultPagePattern(collection));
  const [picked, setPicked] = React.useState<Set<string>>(() => new Set(plan.map((p) => p.field.id)));
  const [layout, setLayout] = React.useState<CollectionPageLayout>("Profile");
  const chosen = plan.filter((p) => picked.has(p.field.id));
  const problem = pattern.trim() ? cmsPatternError(pattern.trim(), collection.fields) : "Enter a URL pattern.";
  const toggle = (id: string) =>
    setPicked((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });

  const shown = orderedPlan(chosen, layout);
  const image = shown.find((p) => p.element === "image");
  const texts = shown.filter((p) => p.element !== "image");
  const token = (p: PageFieldPlan) => (
    <span
      key={p.field.id}
      className={
        p.element === "heading"
          ? "tw:text-[16px] tw:font-semibold tw:leading-6 tw:text-[var(--bk-ink)]"
          : "tw:text-[12px] tw:leading-[18px] tw:text-[var(--bk-ink-soft)]"
      }
    >
      {`{${p.field.name}}`}
    </span>
  );

  return (
    <Modal
      open={open}
      onClose={onCancel}
      title={`Create collection page for ${collection.name}`}
      kind="form"
      /* 187:20616 — a 720 dialog. */
      width="xl"
      placement="workspace"
      testId="cms-dp-create"
      footer={
        <>
          <Button variant="secondary" onClick={onCancel} data-testid="cms-dp-create-cancel">
            Cancel
          </Button>
          <Button
            disabled={Boolean(problem) || chosen.length === 0}
            onClick={() => onCreate({ pattern: pattern.trim(), plan: chosen, layout })}
            data-testid="cms-dp-create-confirm"
          >
            Create page
          </Button>
        </>
      }
    >
      <div className="tw:flex tw:flex-col">
        <p className="tw:m-0 tw:text-[13px] tw:leading-5 tw:text-[var(--bk-ink)]">Create editable elements from these fields.</p>
        <label className={HEAD} htmlFor="cms-dp-create-pattern">URL pattern</label>
        <TextInput id="cms-dp-create-pattern" sizing="sm" className={`${CONTROL} ${FILLED}`} value={pattern} onChange={(e) => setPattern(e.target.value)} data-testid="cms-dp-create-pattern" />
        {problem && pattern.trim() ? <span className={`${WARN} tw:mt-1`}>{problem}</span> : null}
        <fieldset className="tw:m-0 tw:mt-6 tw:border-0 tw:p-0">
          <legend className={LEGEND}>Include fields</legend>
          {plan.length === 0 ? <p className={`${NOTE} tw:m-0`}>{collection.name} has no field a page element can show.</p> : null}
          {plan.map((p) => (
            <label key={p.field.id} className="tw:flex tw:h-[44px] tw:items-center tw:gap-3 tw:text-[13px] tw:leading-5 tw:text-[var(--bk-ink)]">
              <Checkbox checked={picked.has(p.field.id)} onChange={() => toggle(p.field.id)} data-testid={`cms-dp-create-field-${p.field.slug}`} />
              {`${p.field.name} · ${p.label}`}
            </label>
          ))}
        </fieldset>
        <fieldset className="tw:m-0 tw:mt-6 tw:border-0 tw:p-0">
          <legend className={LEGEND}>Layout</legend>
          {/* Three equal segments; the chosen one tinted (187:20616). */}
          <div className="tw:grid tw:grid-cols-3">
            {COLLECTION_PAGE_LAYOUTS.map((l) => (
              <label
                key={l}
                className={`tw:flex tw:h-8 tw:items-center tw:gap-2 tw:rounded-[4px] tw:px-3 tw:text-[13px] tw:leading-5 tw:text-[var(--bk-ink)] ${
                  layout === l ? "tw:bg-[var(--bk-accent-tint)]" : ""
                }`}
              >
                <Radio color="blue" name="cms-dp-create-layout" value={l} checked={layout === l} onChange={() => setLayout(l)} data-testid={`cms-dp-create-layout-${l}`} />
                {l}
              </label>
            ))}
          </div>
        </fieldset>
        {/* What will be made, in its order: the image beside the text for a
            Profile, above it otherwise. */}
        <div
          className={`tw:mt-2 tw:flex tw:gap-5 tw:rounded-[4px] tw:bg-[var(--bk-gray-100)] tw:p-4 ${layout === "Profile" ? "tw:flex-row tw:items-start" : "tw:flex-col"}`}
          data-testid="cms-dp-create-preview"
        >
          {image && layout === "Profile" ? <span className="tw:size-28 tw:flex-none tw:rounded-full tw:bg-[var(--bk-bg-card)]" aria-hidden="true" /> : null}
          <div className="tw:flex tw:flex-col tw:gap-3">
            {layout === "Article" && texts[0] ? token(texts[0]) : null}
            {image && layout === "Article" ? <span className="tw:h-20 tw:w-full tw:rounded-[4px] tw:bg-[var(--bk-bg-card)]" aria-hidden="true" /> : null}
            {(layout === "Article" ? texts.slice(1) : texts).map(token)}
          </div>
        </div>
      </div>
    </Modal>
  );
}
