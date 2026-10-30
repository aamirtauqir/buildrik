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
import { CONTROL, LABEL, NOTE, WARN } from "./paneStyles";

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

  return (
    <Modal
      open={open}
      onClose={onCancel}
      title={`Create collection page for ${collection.name}`}
      subtitle="Create editable elements from these fields."
      kind="form"
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
      <div className="tw:flex tw:flex-col tw:gap-4">
        <div>
          <label className={LABEL} htmlFor="cms-dp-create-pattern">URL pattern</label>
          <TextInput id="cms-dp-create-pattern" sizing="sm" className={CONTROL} value={pattern} onChange={(e) => setPattern(e.target.value)} data-testid="cms-dp-create-pattern" />
          {problem && pattern.trim() ? <span className={WARN}>{problem}</span> : null}
        </div>
        <fieldset className="tw:m-0 tw:border-0 tw:p-0">
          <legend className={LABEL}>Include fields</legend>
          {plan.length === 0 ? <p className={`${NOTE} tw:m-0`}>{collection.name} has no field a page element can show.</p> : null}
          {plan.map((p) => (
            <label key={p.field.id} className="tw:flex tw:h-7 tw:items-center tw:gap-2 tw:text-[13px] tw:leading-5 tw:text-[var(--bk-ink)]">
              <Checkbox checked={picked.has(p.field.id)} onChange={() => toggle(p.field.id)} data-testid={`cms-dp-create-field-${p.field.slug}`} />
              {`${p.field.name} · ${p.label}`}
            </label>
          ))}
        </fieldset>
        <fieldset className="tw:m-0 tw:border-0 tw:p-0">
          <legend className={LABEL}>Layout</legend>
          <div className="tw:flex tw:gap-4">
            {COLLECTION_PAGE_LAYOUTS.map((l) => (
              <label key={l} className="tw:flex tw:h-7 tw:items-center tw:gap-2 tw:text-[13px] tw:leading-5 tw:text-[var(--bk-ink)]">
                <Radio color="blue" name="cms-dp-create-layout" value={l} checked={layout === l} onChange={() => setLayout(l)} data-testid={`cms-dp-create-layout-${l}`} />
                {l}
              </label>
            ))}
          </div>
        </fieldset>
        {/* The order the elements will be made in, as tokens. */}
        <div className="tw:flex tw:flex-col tw:gap-1 tw:rounded-[6px] tw:bg-[var(--bk-gray-50)] tw:p-3" data-testid="cms-dp-create-preview">
          {orderedPlan(chosen, layout).map((p) =>
              p.element === "image" ? (
                <span key={p.field.id} className="tw:size-10 tw:rounded-full tw:bg-[var(--bk-gray-200)]" aria-hidden="true" />
              ) : (
                <span key={p.field.id} className={p.element === "heading" ? "tw:text-[14px] tw:font-semibold tw:leading-5 tw:text-[var(--bk-ink)]" : NOTE}>
                  {`{${p.field.name}}`}
                </span>
              ),
            )}
        </div>
        <p className={`${NOTE} tw:m-0`}>You can edit every element after creation.</p>
      </div>
    </Modal>
  );
}
