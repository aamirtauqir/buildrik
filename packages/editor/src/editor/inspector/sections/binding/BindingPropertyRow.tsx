/**
 * The bindable property row of the Content tab's type block (2L9 boards
 * B5-D01 static, B5-D04 bound, B5-D11…D15 status; Play F2.02):
 *
 *   static   Text   Article title                       [⛁ Bind]
 *   bound    Text   Blog · title
 *                   A clearer point of view
 *                   This page’s record · 1 of 980          ›
 *            Binding status   Empty — showing fallback “Untitled article”.
 *
 * The bind button opens Choose source; a bound row opens the binding detail
 * (`./BindingDetail`). The copy helpers here are shared with the detail and
 * the Dynamic bindings summary.
 *
 * @license BSD-3-Clause
 */
import { ChevronRight, Database } from "lucide-react";
import * as React from "react";
import type { Composer } from "@/engine";
import { IconButton } from "@/editor/chrome-ui";
import { recordTitle } from "@/editor/cms/RecordsTable";
import { useInspectorField } from "@/editor/inspector/shared/controls/InspectorFieldContext";
import { ActionRow, NoteRow } from "../behaviourRows";
import { ChooseSourcePicker } from "./ChooseSourcePicker";
import { openSubview } from "@/editor/inspector/tabs/subviewStore";
import { PROPERTY_LABEL, useCmsBinding, type CmsBindingState } from "./useCmsBinding";

/** "Blog · title" — the source as the row names it. */
export const sourceLabel = (s: CmsBindingState): string =>
  s.binding ? `${s.collection?.name ?? s.binding.collectionName ?? "Collection"} · ${s.binding.fieldSlug}` : "";

/** Where the shown record comes from, in the row's words. */
export function contextLine(s: CmsBindingState, long = false): string {
  if (s.context === "template") {
    if (long) return "This page’s record · each page shows its own";
    return s.preview && s.preview.total ? `This page’s record · ${s.preview.index + 1} of ${s.preview.total}` : "This page’s record";
  }
  if (s.context === "list") return "List item · each copy shows its own";
  const record = s.preview?.record;
  if (s.preview && s.preview.index < 0) return "Specific record · not published — the page shows nothing here";
  return record && s.collection ? `Specific record · ${recordTitle(s.collection, record)}` : "Specific record";
}

/** The "Binding status" line, or null (B5-D11…D15). */
export function statusLine(s: CmsBindingState): string | null {
  const st = s.status;
  const name = s.collection?.name ?? "records";
  if (!st) return null;
  if (st.kind === "loading") return `Loading ${name} records…`;
  if (st.kind === "failed") return `Couldn’t load ${name}. Your binding is kept.`;
  if (st.kind === "field-missing") return `${s.binding?.fieldSlug} no longer exists. Choose a field.`;
  if (st.kind === "incompatible") return `${s.binding?.fieldSlug} is now ${st.type}. Choose a ${PROPERTY_LABEL[s.property].toLowerCase()} field.`;
  return `Empty — showing fallback “${st.fallback}”.`;
}

/** What the element shows when it is not bound. */
function staticValue(composer: Composer | null | undefined, elementId: string, property: CmsBindingState["property"]): string {
  const el = composer?.elements.getElement(elementId);
  if (!el) return "";
  if (property === "src") return (el.getAttribute?.("src") ?? "").split("/").pop() ?? "";
  if (property === "href") return el.getAttribute?.("href") ?? "";
  return (el.getContent?.() ?? "").replace(/<[^>]*>/g, "").trim();
}

export interface BindingPropertyRowProps {
  composer: Composer | null | undefined;
  elementId: string;
  onOpenCreateCollection?: () => void;
}

export function BindingPropertyRow({ composer, elementId, onOpenCreateCollection }: BindingPropertyRowProps) {
  const state = useCmsBinding(composer, elementId);
  const { readOnly } = useInspectorField();
  const [picking, setPicking] = React.useState(false);
  const label = PROPERTY_LABEL[state.property];
  /* A deleted source is said and repaired in Dynamic bindings (board S36). */
  if (state.missing) return null;

  const bindButton = (
    <IconButton
      label={`Bind ${label.toLowerCase()}…`}
      size="sm"
      data-testid="binding-bind"
      aria-haspopup="menu"
      aria-expanded={picking}
      aria-disabled={readOnly || undefined}
      className="tw:size-6 tw:shrink-0 tw:text-[var(--bk-ink-muted)]"
      onClick={() => {
        if (!readOnly) setPicking((v) => !v);
      }}
    >
      <Database size={14} aria-hidden="true" />
    </IconButton>
  );
  const picker = (trigger: React.ReactNode) => (
    <ChooseSourcePicker state={state} open={picking} onClose={() => setPicking(false)} trigger={trigger} onOpenCreateCollection={onOpenCreateCollection} />
  );

  const status = statusLine(state);
  if (!state.binding) {
    /* 2L9 161:8480: the property's name, its bind button at the right; the
       value itself is on the canvas (and in the image source row). */
    return (
      <div className="tw:flex tw:h-8 tw:items-center tw:justify-between" data-testid="binding-row">
        <span className="tw:text-[12px] tw:leading-4 tw:text-[var(--bk-ink-soft)]" title={staticValue(composer, elementId, state.property)}>
          {label}
        </span>
        {picker(bindButton)}
      </div>
    );
  }

  return (
    <>
      <div className="bdi-row-ctrl tw:items-start" data-testid="binding-row">
        <span className="bdi-lb">{label}</span>
        <div
          role="button"
          tabIndex={0}
          aria-label={`${label} binding · ${sourceLabel(state)} — open binding`}
          data-testid="binding-open"
          className="bdi-row-content tw:flex tw:cursor-pointer tw:items-start tw:gap-1 tw:rounded-[4px] tw:hover:bg-[var(--bk-bg-subtle)] tw:focus-visible:outline-none tw:focus-visible:[box-shadow:var(--bk-shadow-focus)]"
          onClick={() => openSubview({ kind: "binding", elementId })}
          onKeyDown={(e) => {
            if (e.key === "Enter" || e.key === " ") {
              e.preventDefault();
              openSubview({ kind: "binding", elementId });
            }
          }}
        >
          <span className="tw:flex tw:min-w-0 tw:flex-1 tw:flex-col tw:text-[12px] tw:leading-4">
            <span className="tw:truncate tw:font-medium tw:text-[var(--bk-accent-text)]" data-testid="binding-source">
              {sourceLabel(state)}
            </span>
            <span className="tw:truncate tw:text-[var(--bk-ink)]" data-testid="binding-preview">
              {state.status?.kind === "loading" ? "Loading…" : state.status && state.status.kind !== "empty-fallback" ? "Preview unavailable" : state.preview?.value || state.binding.fallback || "—"}
            </span>
            <span className="tw:truncate tw:text-[11px] tw:text-[var(--bk-ink-muted)]" data-testid="binding-context">
              {contextLine(state)}
            </span>
          </span>
          <ChevronRight size={12} aria-hidden="true" className="tw:mt-0.5 tw:shrink-0 tw:text-[var(--bk-ink-muted)]" />
        </div>
      </div>
      {status ? (
        <>
          <NoteRow tone={state.status?.kind === "empty-fallback" || state.status?.kind === "loading" ? "muted" : "error"} testId="binding-status">
            Binding status · {status}
          </NoteRow>
          {state.status?.kind === "failed" ? (
            <ActionRow onClick={state.retry} testId="binding-retry">
              Retry
            </ActionRow>
          ) : state.status?.kind === "field-missing" || state.status?.kind === "incompatible" ? (
            picker(
              <ActionRow onClick={() => setPicking(true)} testId="binding-choose-field">
                Choose field
              </ActionRow>,
            )
          ) : null}
        </>
      ) : null}
    </>
  );
}
