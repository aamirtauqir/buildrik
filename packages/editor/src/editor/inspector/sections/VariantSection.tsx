/**
 * VariantSection — the inspector's instance doors.
 *
 * Two board states, one component:
 * - Component with variants — 4418:112330: a tinted band, "VARIANT" and a
 *   [Large ▾] trigger, the property name under the label, "Reset to master".
 *   The trigger's menu (6918:74827) lists the variants, then "Edit master ›"
 *   and "Detach instance".
 * - No variants — 6881:68947: two plain 28px rows, "Edit master · {name} ›"
 *   and "Detach this instance". "Reset to master" stays as a third row so an
 *   instance's own edits can still be undone (designer-notes).
 *
 * Detach confirms (6887:78306) and Reset confirms (6979:77597). Neither is
 * gated on Pro mode any more (G2-125 / G2-069) — detaching used to live only
 * behind the density toggle, in the Applies-to row.
 *
 * @license BSD-3-Clause
 */

import * as React from "react";
import type { Composer } from "../../../engine";
import type { ComponentDefinition } from "../../../shared/types/components";
import { Button, ConfirmDialog, Menu, MenuItem, MenuSeparator, Popover, useToast } from "@/editor/chrome-ui";
import { requestOpenMaster } from "@/editor/sidebar/tabs/component-library/openMasterRequest";
import { elementLocation } from "@/editor/canvas/utils/elementInfo";

interface VariantSectionProps {
  composer: Composer | null;
  elementId: string | null;
}

interface InstanceInfo {
  component: ComponentDefinition;
  instanceId: string;
  currentVariant: string | null;
}

const DOOR_ROW =
  "tw:flex tw:w-full tw:h-7 tw:items-center tw:gap-2 tw:pl-7 tw:pr-4 tw:py-1 tw:rounded-none tw:border-0 " +
  "tw:bg-transparent tw:text-[13px] tw:leading-5 tw:font-normal tw:text-[var(--bk-ink)] tw:justify-start " +
  "tw:hover:bg-[var(--bk-bg-subtle)] tw:focus:ring-0";

export const VariantSection: React.FC<VariantSectionProps> = ({ composer, elementId }) => {
  const [info, setInfo] = React.useState<InstanceInfo | null>(null);
  const [menuOpen, setMenuOpen] = React.useState(false);
  const [confirm, setConfirm] = React.useState<"reset" | "detach" | null>(null);
  const { addToast } = useToast();

  React.useEffect(() => {
    const instance = composer && elementId ? composer.components?.getInstanceByElementId(elementId) : null;
    const component = instance ? composer?.components?.getComponent(instance.componentId) : null;
    setInfo(
      instance && component
        ? { component, instanceId: instance.elementId, currentVariant: instance.variantSelection?.variantId ?? null }
        : null,
    );
  }, [composer, elementId]);

  if (!composer || !info) return null;
  const { component, instanceId } = info;
  const variants = component.variants ?? [];
  const properties = component.variantProperties ?? [];
  const hasVariants = properties.length > 0 && variants.length > 0;
  const current = variants.find((v) => v.id === info.currentVariant) ?? variants[0];

  const pickVariant = (variantId: string) => {
    setMenuOpen(false);
    composer.components?.updateInstanceVariant?.(instanceId, variantId);
    setInfo({ ...info, currentVariant: variantId });
  };

  const editMaster = () => {
    setMenuOpen(false);
    requestOpenMaster(composer, component.id);
  };

  const detach = async () => {
    setConfirm(null);
    try {
      const ok = await composer.components.detachInstance(instanceId);
      if (ok) {
        setInfo(null);
        return;
      }
      addToast({ description: "Couldn't detach this instance. It may already be detached.", tone: "error" });
    } catch {
      addToast({ description: "Couldn't detach this instance. Try again.", tone: "error" });
    }
  };

  const reset = () => {
    setConfirm(null);
    void composer.components?.resetInstance?.(instanceId);
  };

  const resetLink = (
    <Button
      color="light"
      size="xs"
      data-testid="variant-reset"
      className="tw:h-auto tw:border-transparent tw:bg-transparent tw:px-0 tw:text-[11px] tw:font-normal tw:text-[var(--bk-accent)] tw:focus:ring-0"
      onClick={() => setConfirm("reset")}
    >
      Reset to master
    </Button>
  );

  return (
    <>
      {hasVariants ? (
        <div className="tw:bg-[var(--bk-accent-tint)] tw:px-4 tw:py-2" data-testid="variant-band">
          <div className="tw:flex tw:items-start tw:justify-between tw:gap-2">
            <div className="tw:min-w-0">
              <div className="tw:text-[11px] tw:leading-4 tw:font-medium tw:tracking-wide tw:text-[var(--bk-ink-muted)]">VARIANT</div>
              <div className="tw:text-[11px] tw:leading-4 tw:text-[var(--bk-ink-muted)]">
                {properties.map((p) => p.name).join(" · ")}
              </div>
            </div>
            <Popover
              open={menuOpen}
              onClose={() => setMenuOpen(false)}
              placement="bottom-end"
              label="Variant"
              trigger={
                <Button
                  color="light"
                  size="xs"
                  data-testid="variant-trigger"
                  aria-haspopup="menu"
                  aria-expanded={menuOpen}
                  className="tw:h-[26px] tw:w-[160px] tw:rounded tw:justify-start tw:bg-white tw:border-[var(--bk-border)] tw:px-2 tw:text-[12px] tw:font-normal tw:text-[var(--bk-ink)] tw:focus:ring-0"
                  onClick={() => setMenuOpen((v) => !v)}
                >
                  <span className="tw:truncate">{current?.name ?? "Default"}</span>
                  <span aria-hidden className="tw:ml-1 tw:text-[var(--bk-ink-muted)]">▾</span>
                </Button>
              }
            >
              <Menu label="Variant" data-testid="variant-menu">
                {variants.map((v) => (
                  <MenuItem key={v.id} selected={v.id === current?.id} onClick={() => pickVariant(v.id)}>
                    {v.name}
                  </MenuItem>
                ))}
                <MenuSeparator />
                <MenuItem data-testid="variant-edit-master" onClick={editMaster}>
                  Edit master ›
                </MenuItem>
                <MenuItem
                  data-testid="variant-detach"
                  onClick={() => {
                    setMenuOpen(false);
                    setConfirm("detach");
                  }}
                >
                  Detach instance
                </MenuItem>
              </Menu>
            </Popover>
          </div>
          {resetLink}
        </div>
      ) : (
        <div data-testid="variant-band">
          <Button color="light" data-testid="instance-edit-master" className={DOOR_ROW} onClick={editMaster}>
            {`Edit master · ${component.name}  ›`}
          </Button>
          <Button color="light" data-testid="instance-detach" className={DOOR_ROW} onClick={() => setConfirm("detach")}>
            Detach this instance
          </Button>
          <Button color="light" data-testid="variant-reset" className={DOOR_ROW} onClick={() => setConfirm("reset")}>
            Reset to master
          </Button>
        </div>
      )}
      <ConfirmDialog
        open={confirm === "detach"}
        onClose={() => setConfirm(null)}
        onConfirm={() => void detach()}
        title={`Detach this ${component.name} instance?`}
        message={`${elementLocation(composer, instanceId)} · This instance becomes an independent container. Its content and appearance are kept; it will no longer follow updates to the ${component.name} master.`}
        confirmLabel="Detach instance"
        testId="instance-detach-confirm"
      />
      <ConfirmDialog
        open={confirm === "reset"}
        onClose={() => setConfirm(null)}
        onConfirm={reset}
        title={`Reset ${component.name} to master?`}
        message="Overrides on this instance will be discarded."
        confirmLabel="Reset"
        testId="instance-reset-confirm"
      />
    </>
  );
};

export default VariantSection;
