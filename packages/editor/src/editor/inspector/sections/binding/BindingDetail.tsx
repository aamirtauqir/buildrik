/**
 * Binding detail — the Content tab's subview for one bound property (2L9
 * Play F2.05 `302:13946`, boards B5-D05/D06):
 *
 *   ‹ Back to Content
 *   Text binding
 *   Source     [Blog · title ▾]                (reopens Choose source)
 *              This page’s record · each page shows its own
 *   Record     [A clearer point of view ▾]     (a specific record only)
 *   Format     As written
 *   If empty   [Untitled article]
 *   Preview    A clearer point of view
 *   Open record ›
 *   Unbind — keep shown text
 *   Keeps “A clearer point of view” as static text.
 *
 * Format reads "As written": the binding stores no transform today, so the
 * row says what publish does and offers nothing it would not do.
 * Open record names where the CMS should come back to (C-11: "‹ Heading ·
 * Text binding").
 *
 * @license BSD-3-Clause
 */
import { WIDE_BUTTON } from "@/editor/inspector/shared/controls/controlClasses";
import { ChevronDown } from "lucide-react";
import * as React from "react";
import type { Composer } from "@/engine";
import { Button, useToast } from "@/editor/chrome-ui";
import { EVENTS } from "@/shared/constants/events";
import { elementTypeLabel } from "@/shared/constants/elementTypeLabels";
import { getLayerName } from "@/editor/panels/layers/hooks/layersPersistence";
import { recordTitle } from "@/editor/cms/RecordsTable";
import { ControlRow, SelectRow } from "@/editor/inspector/shared/controls";
import { useInspectorField } from "@/editor/inspector/shared/controls/InspectorFieldContext";
import { CommitRow, NoteRow } from "../behaviourRows";
import { ChooseSourcePicker } from "./ChooseSourcePicker";
import { closeSubview } from "@/editor/inspector/tabs/subviewStore";
import { contextLine, sourceLabel, statusLine } from "./BindingPropertyRow";
import { PROPERTY_LABEL, useCmsBinding } from "./useCmsBinding";

/* F2.05: the preview reads as body text, 14 / regular. */
const VALUE = "tw:min-w-0 tw:truncate tw:text-[14px] tw:leading-5 tw:text-[var(--bk-ink)]";
/* A 28-tall box drawn like the column's selects (2L9 F2.05). */
const SELECTISH =
  "tw:flex tw:h-7 tw:w-full tw:items-center tw:gap-1 tw:rounded-[4px] tw:border tw:border-[var(--bk-border)] tw:bg-[var(--bk-bg-subtle)] " +
  "tw:px-2 tw:text-[12px] tw:font-normal tw:text-[var(--bk-ink)] tw:focus:ring-0";

/** "Heading · Text binding" — where Open record should return to (C-11). */
function bindingOrigin(composer: Composer, elementId: string, property: string): string {
  const el = composer.elements.getElement(elementId);
  const name = getLayerName(el) ?? elementTypeLabel(el?.getType?.() ?? "");
  return `${name} · ${property} binding`;
}

export interface BindingDetailProps {
  composer: Composer | null | undefined;
  elementId: string;
  onOpenCreateCollection?: () => void;
}

export function BindingDetail({ composer, elementId, onOpenCreateCollection }: BindingDetailProps) {
  const state = useCmsBinding(composer, elementId);
  const { readOnly } = useInspectorField();
  const { addToast } = useToast();
  const [picking, setPicking] = React.useState(false);
  const { label } = state;
  const back = () => closeSubview("binding");

  /* The binding went away (unbound here or undone elsewhere): back to Content. */
  React.useEffect(() => {
    if (!state.binding) closeSubview("binding");
  }, [state.binding]);
  if (!composer || !state.binding) return null;

  const shown = state.preview?.value || state.binding.fallback || "";
  const status = statusLine(state);
  const openRecord = () => {
    if (!state.preview?.record || !state.collection) return;
    composer.emit(EVENTS.UI_CMS_OPEN, {
      collectionId: state.collection.id,
      recordId: state.preview.record.id,
      origin: bindingOrigin(composer, elementId, label),
    });
  };

  return (
    <div className="tw:flex tw:flex-col tw:px-3 tw:py-2" data-testid="binding-detail">
      <Button
        type="button"
        variant="link"
        size="xs"
        data-testid="binding-detail-back"
        onClick={back}
        className="tw:self-center tw:h-10 tw:px-0 tw:text-[13px] tw:font-normal"
      >
        ‹ Back to Content
      </Button>
      <h3 className="tw:m-0 tw:pb-1 tw:pt-3 tw:text-[13px] tw:font-semibold tw:text-[var(--bk-ink)]">{label} binding</h3>
      {/* 2L9 F2.05: the source reads like a select; it opens Choose source. */}
      <ControlRow label="Source">
        <ChooseSourcePicker
          state={state}
          open={picking}
          onClose={() => setPicking(false)}
          onOpenCreateCollection={onOpenCreateCollection}
          block
          trigger={
            <Button
              type="button"
              color="light"
              size="xs"
              data-testid="binding-change-source"
              aria-label={`Change source · ${sourceLabel(state)}`}
              aria-haspopup="menu"
              aria-disabled={readOnly || undefined}
              onClick={() => {
                if (!readOnly) setPicking((v) => !v);
              }}
              className={`${SELECTISH} tw:flex-1`}
            >
              <span className="tw:min-w-0 tw:flex-1 tw:truncate tw:text-left" data-testid="binding-detail-source">
                {sourceLabel(state)}
              </span>
              <ChevronDown size={12} aria-hidden="true" className="tw:shrink-0 tw:text-[var(--bk-ink-muted)]" />
            </Button>
          }
        />
      </ControlRow>
      <NoteRow testId="binding-detail-context">{contextLine(state, true)}</NoteRow>
      {state.context === "record" && state.collection ? (
        <SelectRow
          label="Record"
          value={state.binding.itemId && state.binding.itemId !== "context" ? state.binding.itemId : ""}
          placeholder="Newest published record"
          onChange={(id) => {
            if (!readOnly) state.setRecord(id);
          }}
          options={state.records.map((r) => ({
            value: r.id,
            label: `${recordTitle(state.collection!, r)}${r.status === "published" ? "" : " · Draft"}`,
          }))}
        />
      ) : null}
      {/* One format today: publish writes the value as written. */}
      <ControlRow label="Format">
        <span className={SELECTISH} data-testid="binding-detail-format">
          <span className="tw:flex-1">As written</span>
          <ChevronDown size={12} aria-hidden="true" className="tw:shrink-0 tw:text-[var(--bk-ink-muted)]" />
        </span>
      </ControlRow>
      <CommitRow
        label="If empty"
        value={state.binding.fallback ?? ""}
        placeholder="Leave blank"
        onCommit={(v) => {
          if (!readOnly) state.setFallback(v);
        }}
        testId="binding-detail-fallback"
      />
      <div className="tw:flex tw:flex-col tw:gap-2 tw:py-2">
        <span className="tw:text-[13px] tw:leading-4 tw:text-[var(--bk-ink-muted)]">Preview</span>
        <span className={VALUE} data-testid="binding-detail-preview">
          {state.status?.kind === "loading" ? "Loading…" : shown || "—"}
        </span>
      </div>
      {status ? (
        <NoteRow tone={state.status?.kind === "empty-fallback" || state.status?.kind === "loading" ? "muted" : "error"} testId="binding-detail-status">
          {status}
        </NoteRow>
      ) : null}
      <Button
        type="button"
        variant="link"
        size="xs"
        onClick={openRecord}
        disabled={!state.preview?.record}
        data-testid="binding-open-record"
        className="tw:self-center tw:h-10 tw:text-[13px] tw:font-normal"
      >
        Open record ›
      </Button>
      <Button
        type="button"
        color="light"
        size="xs"
        onClick={() => {
          if (readOnly) return;
          /* 2L9 D11: the static value stays; one Undo brings the binding back. */
          const receipt = state.unbind();
          if (receipt && composer) addToast({ description: receipt, action: { label: "Undo", onClick: composer.history.captureUndo() } });
        }}
        data-testid="binding-unbind"
        className={WIDE_BUTTON}
      >
        Unbind — keep shown text
      </Button>
      {shown ? <NoteRow testId="binding-unbind-note">Keeps “{shown}” as static text.</NoteRow> : null}
    </div>
  );
}
