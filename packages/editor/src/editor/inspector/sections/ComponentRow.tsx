/**
 * ComponentRow — the instance identity block (2L9 boards 241:16522 IC01,
 * 241:17608 IC03, 36:2 "Component instance"), drawn ABOVE the tabs while a
 * component instance is selected:
 *
 *   ◇ Hero card · instance
 *   Component library · v4
 *   Variant   [Default ▾]
 *   Edit main component ›
 *   Reset to main component · 3 overrides     (disabled: "No overrides to reset")
 *   Detach instance
 *
 * Reset and Detach keep their confirms. The board applies Detach directly
 * with an Undo receipt (IC06), but detaching is not on the document history
 * — the engine drops the instance link outside it — so without the confirm
 * nothing could bring the instance back (`code:detach-not-undoable`,
 * REQUESTS #12). Every write passes the P-1 lock gate, and none runs while
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
import { elementLocation } from "@/editor/canvas/utils/elementInfo";
import { canWrite } from "@/engine/commands/commandOperations";
import { SelectRow } from "../shared/controls";
import { NoteRow } from "./behaviourRows";
import { useInspectorField } from "../shared/controls/InspectorFieldContext";

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

/* One full-width text action per row, left-aligned (IC01). */
const ACTION =
  "tw:h-7 tw:w-full tw:justify-start tw:rounded-[4px] tw:border-0 tw:bg-transparent tw:px-0 " +
  "tw:text-[12px] tw:font-normal tw:leading-4 tw:text-[var(--bk-accent-text)] tw:hover:bg-[var(--bk-bg-subtle)] tw:focus:ring-0 " +
  "tw:disabled:text-[var(--bk-ink-muted)] tw:disabled:hover:bg-transparent";

export const ComponentRow: React.FC<ComponentRowProps> = ({ composer, elementId }) => {
  const [info, setInfo] = React.useState<InstanceInfo | null>(null);
  const [confirm, setConfirm] = React.useState<"reset" | "detach" | null>(null);
  const { readOnly } = useInspectorField();
  const { addToast } = useToast();

  React.useEffect(() => {
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
  }, [composer, elementId]);

  if (!composer || !info) return null;
  const { component, instanceId, overrides } = info;
  const variants = component.variants ?? [];
  const current = variants.find((v) => v.id === info.currentVariant) ?? variants[0];

  /* P-1: a variant swap, reset or detach rewrites this instance — lock gate
     first (it says so when it refuses). */
  const writable = () => !readOnly && canWrite(composer, instanceId);

  const pickVariant = (id: string) => {
    if (!id || !writable()) return;
    composer.components?.updateInstanceVariant?.(instanceId, id);
    setInfo({ ...info, currentVariant: id });
  };

  const detach = async () => {
    setConfirm(null);
    if (!writable()) return;
    try {
      const ok = await composer.components.detachInstance(instanceId);
      if (ok) {
        setInfo(null);
        addToast({ description: `${component.name} instance detached`, tone: "info" });
        return;
      }
      addToast({ description: "Couldn't detach this instance. It may already be detached.", tone: "error" });
    } catch {
      addToast({ description: "Couldn't detach this instance. Try again.", tone: "error" });
    }
  };

  const reset = () => {
    setConfirm(null);
    if (!writable()) return;
    void composer.components?.resetInstance?.(instanceId);
    setInfo({ ...info, overrides: 0 });
  };

  return (
    <div
      className="tw:flex tw:flex-col tw:border-b tw:border-[var(--bk-border)] tw:px-4 tw:py-2"
      data-testid="component-row"
      role="group"
      aria-label={`${component.name} instance`}
    >
        <div className="tw:truncate tw:text-[13px] tw:font-semibold tw:leading-5 tw:text-[var(--bk-ink)]" data-testid="component-identity">
          ◇ {component.name} · instance
        </div>
        <div className="tw:pb-1 tw:text-[11px] tw:leading-4 tw:text-[var(--bk-ink-muted)]" data-testid="component-source">
          Component library · v{component.version}
        </div>
        <SelectRow
          label="Variant"
          placeholder={null}
          value={current?.id ?? ""}
          options={variants.length === 0 ? NO_VARIANTS : variants.map((v) => ({ value: v.id, label: v.name }))}
          onChange={pickVariant}
        />
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
          className={ACTION}
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
            if (!readOnly) setConfirm("detach");
          }}
        >
          Detach instance
        </Button>
        <ConfirmDialog
          open={confirm === "detach"}
          onClose={() => setConfirm(null)}
          onConfirm={() => void detach()}
          title={`Detach this ${component.name} instance?`}
          message={`${elementLocation(composer, instanceId)} · This instance becomes an independent container. Its content and appearance are kept; it will no longer follow updates to the ${component.name} main component.`}
          confirmLabel="Detach instance"
          testId="instance-detach-confirm"
        />
        <ConfirmDialog
          open={confirm === "reset"}
          onClose={() => setConfirm(null)}
          onConfirm={reset}
          title={`Reset ${component.name} to main component?`}
          message={`The ${overrides} override${overrides === 1 ? "" : "s"} on this instance will be discarded.`}
          confirmLabel="Reset"
          testId="instance-reset-confirm"
        />
    </div>
  );
};

export default ComponentRow;
