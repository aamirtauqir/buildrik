/**
 * ComponentRow — the instance identity block (2L9 boards 241:16522 IC01,
 * 241:17608 IC03, 36:2 "Component instance"), drawn ABOVE the tabs while a
 * component instance is selected:
 *
 *   ◇ Hero card · instance
 *   Component library · v4
 *   Variant   [Default ▾]   ("Variant unavailable" + why, when the
 *             instance's variant was removed — IC04 241:18146)
 *   Edit main component ›
 *   Reset to main component · 3 overrides     (disabled: "No overrides to reset")
 *   Detach instance
 *
 * Reset keeps its confirm. Detach applies directly with a "{name} detached ·
 * Undo" receipt (IC06): since B-12 the engine records the detach as one
 * document history step, and the receipt's Undo is bound to it
 * (`history.captureUndo`). Every write passes the P-1 lock gate, and none runs while
 * the panel is read-only (locked / save conflict); Edit main component is
 * navigation and stays. Which fields the instance overrides is not listed
 * here — the fields carry their "Overrides master" dots.
 *
 * @license BSD-3-Clause
 */

import * as React from "react";
import type { Composer } from "@/engine";
import type { ComponentDefinition } from "@/shared/types/components";
import { Button, ConfirmDialog, useToast } from "@/editor/chrome-ui";
import { requestOpenMaster } from "@/editor/sidebar/tabs/component-library/openMasterRequest";
import { detachInstanceWithUndo } from "@/editor/sidebar/tabs/component-library/instantiate";
import { canWrite } from "@/engine/commands/commandOperations";
import { SelectRow } from "../shared/controls";
import { NoteRow } from "./behaviourRows";
import { useInspectorField } from "../shared/controls/InspectorFieldContext";
import { WIDE_BUTTON } from "../shared/controls/controlClasses";
import { EVENTS } from "@/shared/constants/events";
import { Diamond } from "lucide-react";

interface ComponentRowProps {
  composer: Composer | null;
  elementId: string | null;
}

interface InstanceInfo {
  component: ComponentDefinition;
  instanceId: string;
  currentVariant: string | null;
  /** One per overridden property (the instance's patch ops). */
  overrides: number;
}

/* A component with no variants still reads its one choice (board 26). */
const NO_VARIANTS = [{ value: "", label: "Default" }];

const REFRESH_EVENTS = [EVENTS.COMPONENT_UPDATED, EVENTS.INSTANCE_DETACHED, EVENTS.COMPONENT_DELETED, EVENTS.ELEMENT_UPDATED] as const;

/* One full-width text action per row, left-aligned (IC01). */
const ACTION =
  "tw:h-7 tw:w-full tw:justify-start tw:rounded-[4px] tw:border-0 tw:bg-transparent tw:px-0 " +
  "tw:text-[12px] tw:font-normal tw:leading-4 tw:text-[var(--bk-accent-text)] tw:hover:bg-[var(--bk-bg-subtle)] tw:focus:ring-0 " +
  "tw:disabled:text-[var(--bk-ink-muted)] tw:disabled:hover:bg-transparent";

export const ComponentRow: React.FC<ComponentRowProps> = ({ composer, elementId }) => {
  const [info, setInfo] = React.useState<InstanceInfo | null>(null);
  const [confirm, setConfirm] = React.useState<"reset" | null>(null);
  const { readOnly } = useInspectorField();
  const { addToast } = useToast();

  React.useEffect(() => {
    const read = () => {
      const instance = composer && elementId ? composer.components?.getInstanceByElementId(elementId) : null;
      const component = instance ? composer?.components?.getComponent(instance.componentId) : null;
      setInfo(
        instance && component
          ? {
              component,
              instanceId: instance.elementId,
              currentVariant: instance.variantSelection?.variantId ?? null,
              overrides: instance.overrides?.length ?? 0,
            }
          : null,
      );
    };
    read();
    if (!composer) return;
    /* A rename of the main component, a detach elsewhere, a new override:
       the block reads them as they happen (L2-028). */
    for (const evt of REFRESH_EVENTS) composer.on(evt, read);
    return () => {
      for (const evt of REFRESH_EVENTS) composer.off(evt, read);
    };
  }, [composer, elementId]);

  if (!composer || !info) return null;
  const { component, instanceId, overrides } = info;
  const variants = component.variants ?? [];
  const current = variants.find((v) => v.id === info.currentVariant) ?? variants[0];
  /* IC04: the instance names a variant its component no longer has — the
     default renders (ComponentVariantResolver finds nothing), and the row
     says so instead of quietly reading "Default". */
  const missingVariant = !!info.currentVariant && !variants.some((v) => v.id === info.currentVariant);

  /* P-1: a variant swap, reset or detach rewrites this instance — lock gate
     first (it says so when it refuses). */
  const writable = () => !readOnly && canWrite(composer, instanceId);

  const pickVariant = (id: string) => {
    if (!id || !writable()) return;
    composer.components?.updateInstanceVariant?.(instanceId, id);
    setInfo({ ...info, currentVariant: id });
  };

  const detach = async () => {
    if (!writable()) return;
    const { ok, toast } = await detachInstanceWithUndo(composer, instanceId, component.name);
    if (ok) setInfo(null);
    addToast(toast);
  };

  const reset = () => {
    setConfirm(null);
    if (!writable()) return;
    setInfo({ ...info, overrides: 0 });
    /* The reset re-mounts the instance (sync removes the old subtree and
       pastes the master's, ids kept by position), which dropped the
       selection: the Inspector fell back to the page. Keep it on the
       instance (2L9 IC02 walk). */
    void Promise.resolve(composer.components?.resetInstance?.(instanceId)).then(() => {
      const el = composer.elements?.getElement?.(instanceId);
      if (el && !composer.selection?.getSelectedIds?.().includes(instanceId)) composer.selection?.select(el);
    });
  };

  return (
    <div
      className="tw:flex tw:flex-col tw:border-b tw:border-[var(--bk-border)] tw:px-4 tw:py-2"
      data-testid="component-row"
      role="group"
      aria-label={`${component.name} instance`}
    >
        {/* IC01: the identity in the accent, its source muted under it. */}
        <div
          className="tw:flex tw:min-w-0 tw:items-center tw:gap-1.5 tw:text-[14px] tw:font-semibold tw:leading-5 tw:text-[var(--bk-accent-text)]"
          data-testid="component-identity"
        >
          <Diamond size={14} aria-hidden="true" className="tw:shrink-0" />
          <span className="tw:truncate">{component.name} · instance</span>
        </div>
        <div className="tw:pb-1 tw:text-[12px] tw:leading-4 tw:text-[var(--bk-ink-muted)]" data-testid="component-source">
          {/* G15 / G16: where the master can be used — the library, or this page. */}
          {component.pageId ? `This page · ${composer.elements.getAllPages().find((p) => p.id === component.pageId)?.name ?? "page"}` : "Component library"} · v
          {component.version}
        </div>
        <SelectRow
          label="Variant"
          placeholder={missingVariant ? "Variant unavailable" : null}
          value={missingVariant ? "" : (current?.id ?? "")}
          options={variants.length === 0 ? NO_VARIANTS : variants.map((v) => ({ value: v.id, label: v.name }))}
          onChange={pickVariant}
        />
        {missingVariant ? (
          <p className="tw:m-0 tw:pb-1 tw:text-[12px] tw:leading-4 tw:text-[var(--bk-warning-text)]" role="status" data-testid="component-variant-missing">
            The selected variant was removed from {component.name}. Showing the default until you choose another.
          </p>
        ) : null}
        <Button
          color="light"
          size="xs"
          data-testid="component-edit-master"
          className={ACTION}
          onClick={() => requestOpenMaster(composer, component.id, instanceId)}
        >
          Edit main component ›
        </Button>
        <Button
          color="light"
          size="xs"
          data-testid="component-reset"
          className={`${WIDE_BUTTON} tw:my-1`}
          disabled={overrides === 0}
          aria-disabled={readOnly || undefined}
          onClick={() => {
            if (!readOnly) setConfirm("reset");
          }}
        >
          {overrides > 0 ? `Reset to main component · ${overrides} override${overrides === 1 ? "" : "s"}` : "Reset to main component"}
        </Button>
        {overrides === 0 ? <NoteRow testId="component-reset-reason">No overrides to reset</NoteRow> : null}
        <Button
          color="light"
          size="xs"
          data-testid="component-detach"
          className={ACTION}
          aria-disabled={readOnly || undefined}
          onClick={() => {
            if (!readOnly) void detach();
          }}
        >
          Detach instance
        </Button>
        <ConfirmDialog
          open={confirm === "reset"}
          onClose={() => setConfirm(null)}
          onConfirm={reset}
          /* 2L9 241:17060. The board's "(including Tablet, Mobile and :hover)"
             is left out: the instance's override list holds element paths,
             not the breakpoint or state each was made in. */
          title="Reset this instance?"
          message={`Its ${overrides} override${overrides === 1 ? "" : "s"} will be removed. Content from the main component replaces them.`}
          confirmLabel="Reset"
          testId="instance-reset-confirm"
        />
    </div>
  );
};

export default ComponentRow;
