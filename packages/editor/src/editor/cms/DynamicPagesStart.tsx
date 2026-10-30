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
import { ACTION, NOTE } from "./paneStyles";

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

const TITLE = "tw:m-0 tw:text-[14px] tw:font-semibold tw:leading-5 tw:text-[var(--bk-ink)]";
const BODY = "tw:m-0 tw:text-[13px] tw:leading-5 tw:text-[var(--bk-ink-soft)]";

export function DynamicPagesStart({ state, onCreate, onChooseExisting, onRetryLink, onOpenPage }: DynamicPagesStartProps) {
  let title: string;
  let body: string;
  let actions: React.ReactNode;
  let note: string | null = null;
  if (state.kind === "empty" || state.kind === "missing") {
    title = state.kind === "empty" ? `Create a page for every ${state.collection} record` : "Collection page missing";
    body =
      state.kind === "empty"
        ? `Build one template from ${state.collection} fields. Each published record gets its own URL.`
        : "The linked page is no longer in your pages. The collection link still exists.";
    note = state.kind === "empty" ? "No pages will be generated until a collection page is linked." : "Publishing generates none of these until a page is linked.";
    const create = (
      <Button key="create" size="xs" className={ACTION} variant={state.kind === "empty" ? "primary" : "secondary"} onClick={onCreate} data-testid="cms-dp-start-create">
        Create collection page
      </Button>
    );
    const choose = (
      <Button key="choose" size="xs" className={ACTION} variant={state.kind === "empty" ? "secondary" : "primary"} onClick={onChooseExisting} data-testid="cms-dp-start-choose">
        {state.kind === "empty" ? "Choose an existing page" : "Choose page"}
      </Button>
    );
    actions = state.kind === "empty" ? [create, choose] : [choose, create];
  } else if (state.kind === "creating") {
    title = `Creating ${state.name}…`;
    body = "Creating the page, then saving its collection link. Keep this tab open.";
    actions = (
      <Button size="xs" className={ACTION} disabled data-testid="cms-dp-start-creating">
        Creating…
      </Button>
    );
  } else {
    title = "Page created, link not saved";
    body = `${state.name} is in your pages. Retry saves only the collection link; it will not create another page.`;
    note = `URL pattern · ${state.pattern}`;
    actions = (
      <>
        <Button size="xs" className={ACTION} disabled={state.saving} onClick={onRetryLink} data-testid="cms-dp-start-retry">
          {state.saving ? "Saving link…" : "Retry link save"}
        </Button>
        {onOpenPage ? (
          <Button size="xs" variant="link" className="tw:h-auto tw:min-h-0 tw:p-0 tw:text-[13px]" onClick={onOpenPage} data-testid="cms-dp-start-open">
            {`Open ${state.name} ›`}
          </Button>
        ) : null}
      </>
    );
  }
  return (
    <div
      className="tw:flex tw:w-[480px] tw:flex-col tw:gap-2"
      role={state.kind === "link-failed" ? "alert" : state.kind === "creating" ? "status" : undefined}
      data-testid="cms-dp-start"
    >
      <h3 className={TITLE}>{title}</h3>
      <p className={BODY}>{body}</p>
      <div className="tw:mt-2 tw:flex tw:items-center tw:gap-3">{actions}</div>
      {note ? <p className={`${NOTE} tw:m-0`}>{note}</p> : null}
    </div>
  );
}
