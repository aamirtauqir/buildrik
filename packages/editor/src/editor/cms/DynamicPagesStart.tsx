/**
 * DynamicPagesStart — the Dynamic pages tab before a working link exists
 * (design-2l9): no page yet (187:20406), the linked page gone (187:22375),
 * creating (187:20858), and a made page whose link the server has not
 * confirmed (187:21035 / 187:21245). Words and buttons only; the pane owns
 * every state and action.
 *
 * @license BSD-3-Clause
 */
import * as React from "react";
import { Button } from "@/editor/chrome-ui";
import { NOTE } from "./paneStyles";

export type DynamicPagesStartState =
  | { kind: "empty"; collection: string }
  | { kind: "missing" }
  | { kind: "creating"; name: string }
  | { kind: "link-failed"; name: string; pattern: string; saving: boolean };

export interface DynamicPagesStartProps {
  state: DynamicPagesStartState;
  onCreate: () => void;
  onChooseExisting: () => void;
  onRetryLink: () => void;
  onOpenPage?: () => void;
}

/* 187:20406 / 187:20858 / 187:21035 / 187:22375: a 13 semibold title, a
   13 line, then the answers STACKED (16 apart, 32 tall), a 12 note last. */
const TITLE = "tw:m-0 tw:text-[13px] tw:font-semibold tw:leading-5 tw:text-[var(--bk-ink)]";
const BODY = "tw:m-0 tw:mt-3 tw:text-[13px] tw:leading-5 tw:text-[var(--bk-ink)]";
const BTN = "tw:h-8 tw:justify-center tw:px-3 tw:text-[13px] tw:font-medium tw:rounded-[6px]";
const WIDE = `${BTN} tw:w-60`;
const NARROW = `${BTN} tw:w-[200px]`;

export function DynamicPagesStart({ state, onCreate, onChooseExisting, onRetryLink, onOpenPage }: DynamicPagesStartProps) {
  let title: string;
  let body: string;
  let actions: React.ReactNode;
  let note: React.ReactNode = null;
  if (state.kind === "empty" || state.kind === "missing") {
    const empty = state.kind === "empty";
    title = empty ? `Create a page for every ${state.collection} record` : "Collection page missing";
    body = empty
      ? `Build one template from ${state.collection} fields. Each published record gets its own URL.`
      : "The linked page is no longer in your pages. The collection link still exists.";
    note = empty ? (
      <p className={`${NOTE} tw:m-0`}>No pages will be generated until a collection page is linked.</p>
    ) : (
      <p className="tw:m-0 tw:text-[12px] tw:leading-[18px] tw:text-[var(--bk-error-text)]">Publishing generates none of these until a page is linked.</p>
    );
    const create = (
      <Button key="create" size="xs" className={WIDE} variant="primary" onClick={onCreate} data-testid="cms-dp-start-create">
        Create collection page
      </Button>
    );
    const choose = (
      <Button key="choose" size="xs" className={empty ? WIDE : NARROW} variant="secondary" onClick={onChooseExisting} data-testid="cms-dp-start-choose">
        {empty ? "Choose an existing page" : "Choose page"}
      </Button>
    );
    actions = empty ? [create, choose] : [choose, create];
  } else if (state.kind === "creating") {
    title = `Creating ${state.name}…`;
    body = "Creating the page, then saving its collection link. Keep this tab open.";
    actions = (
      <Button size="xs" variant="secondary" className={WIDE} disabled data-testid="cms-dp-start-creating">
        Creating…
      </Button>
    );
  } else {
    title = "Page created, link not saved";
    body = `${state.name} is in your pages. Retry saves only the collection link; it will not create another page.`;
    note = <p className="tw:m-0 tw:font-mono tw:text-[12px] tw:leading-[18px] tw:text-[var(--bk-ink)]">{`URL pattern · ${state.pattern}`}</p>;
    actions = (
      <>
        <Button size="xs" className={NARROW} disabled={state.saving} onClick={onRetryLink} data-testid="cms-dp-start-retry">
          {state.saving ? "Saving link…" : "Retry link save"}
        </Button>
        {onOpenPage ? (
          <Button size="xs" variant="link" className="tw:h-8 tw:w-[200px] tw:justify-center tw:p-0 tw:text-[13px] tw:font-normal" onClick={onOpenPage} data-testid="cms-dp-start-open">
            {`Open ${state.name} ›`}
          </Button>
        ) : null}
      </>
    );
  }
  return (
    <div
      className="tw:flex tw:flex-col tw:items-start"
      role={state.kind === "link-failed" ? "alert" : state.kind === "creating" ? "status" : undefined}
      data-testid="cms-dp-start"
    >
      <h3 className={TITLE}>{title}</h3>
      <p className={BODY}>{body}</p>
      <div className="tw:mt-4 tw:flex tw:flex-col tw:items-start tw:gap-4">{actions}</div>
      {note ? <div className="tw:mt-3">{note}</div> : null}
    </div>
  );
}
