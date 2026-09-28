/**
 * ComponentRow — the component row of a selected instance (Inspector v4
 * board 26, DD-16), above the type block:
 *
 *   Variant   [Default ▾]
 *   Edit master ↗                ⋯  → Reset to master · Detach instance…
 *
 * The confirms are the instance doors' own (Reset 6979:77597, Detach
 * 6887:78306). Every write passes the P-1 lock gate, and none runs while the
 * panel is read-only (locked / save conflict); Edit master is navigation and
 * stays. What the instance overrides is not listed here — the fields carry
 * their "Overrides master" dots.
 *
 * @license BSD-3-Clause
 */

import { ExternalLink, MoreHorizontal } from "lucide-react";
import * as React from "react";
import type { Composer } from "@/engine";
import type { ComponentDefinition } from "@/shared/types/components";
import {
  type CustomFlowbiteTheme,
  Button,
  ConfirmDialog,
  IconButton,
  Menu,
  MenuItem,
  Popover,
  Select,
  useToast,
} from "@/editor/chrome-ui";
import { requestOpenMaster } from "@/editor/sidebar/tabs/component-library/openMasterRequest";
import { elementLocation } from "@/editor/canvas/utils/elementInfo";
import { canWrite } from "@/engine/commands/commandOperations";
import { Section } from "../shared/controls";
import { labelTestId, rowTestId } from "../shared/controls/ControlRow";
import { useInspectorField } from "../shared/controls/InspectorFieldContext";

interface ComponentRowProps {
  composer: Composer | null;
  elementId: string | null;
}

interface InstanceInfo {
  component: ComponentDefinition;
  instanceId: string;
  currentVariant: string | null;
}

/* Board 26: a 28 row — 108px muted label, 160px control. */
const ROW = "tw:flex tw:h-7 tw:items-center tw:gap-2";
const LABEL = "tw:w-[108px] tw:shrink-0 tw:truncate tw:text-[12px] tw:leading-4 tw:text-[var(--bk-ink-muted)]";

/* The board's 24px control: gray-50 field, 1px border, radius 4, 12px ink-soft. */
const VARIANT_SELECT_THEME: NonNullable<CustomFlowbiteTheme["select"]> = {
  field: {
    select: {
      colors: {
        gray:
          "tw:border-[var(--bk-border)] tw:bg-[color:var(--bk-gray-50)] tw:text-[var(--bk-ink-soft)] " +
          "tw:focus:border-[var(--bk-accent)] tw:focus:ring-0 tw:focus:[box-shadow:var(--bk-shadow-focus)]",
      },
      withAddon: { off: "tw:rounded-[4px]" },
      sizes: { md: "tw:h-6 tw:py-0 tw:pl-2 tw:pr-6 tw:text-[12px] tw:leading-4 tw:bg-[length:12px] tw:bg-[position:right_6px_center]" },
    },
  },
};

const EDIT_MASTER =
  "tw:h-6 tw:w-40 tw:justify-start tw:gap-2 tw:rounded-[4px] tw:border-0 tw:bg-transparent tw:px-2 " +
  "tw:text-[12px] tw:font-normal tw:leading-4 tw:text-[var(--bk-accent-text)] tw:hover:bg-[var(--bk-bg-subtle)] tw:focus:ring-0";

export const ComponentRow: React.FC<ComponentRowProps> = ({ composer, elementId }) => {
  const [info, setInfo] = React.useState<InstanceInfo | null>(null);
  const [menuOpen, setMenuOpen] = React.useState(false);
  const [confirm, setConfirm] = React.useState<"reset" | "detach" | null>(null);
  const { readOnly } = useInspectorField();
  const { addToast } = useToast();
  const variantId = React.useId();

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
  };

  const ask = (what: "reset" | "detach") => {
    setMenuOpen(false);
    setConfirm(what);
  };

  return (
    <Section title="Component" defaultOpen>
      <div data-testid="component-row">
        <div className={ROW} data-testid={rowTestId("Variant")}>
          <label className={LABEL} data-testid={labelTestId("Variant")} htmlFor={variantId}>
            Variant
          </label>
          <Select
            id={variantId}
            data-testid="component-variant"
            className="tw:w-40 tw:shrink-0"
            theme={VARIANT_SELECT_THEME}
            disabled={readOnly}
            aria-readonly={readOnly || undefined}
            value={current?.id ?? ""}
            onChange={(e) => pickVariant(e.target.value)}
          >
            {variants.length === 0 ? <option value="">Default</option> : null}
            {variants.map((v) => (
              <option key={v.id} value={v.id}>
                {v.name}
              </option>
            ))}
          </Select>
        </div>
        <div className="tw:flex tw:items-center tw:gap-1 tw:py-0.5">
          <Button
            color="light"
            size="xs"
            data-testid="component-edit-master"
            className={EDIT_MASTER}
            onClick={() => requestOpenMaster(composer, component.id)}
          >
            <span className="tw:min-w-0 tw:flex-1 tw:truncate tw:text-left">Edit master</span>
            <ExternalLink size={12} aria-hidden="true" className="tw:shrink-0" />
          </Button>
          <Popover
            open={menuOpen}
            onClose={() => setMenuOpen(false)}
            placement="bottom-end"
            label="Instance actions"
            trigger={
              <IconButton
                label="Instance actions"
                size="sm"
                data-testid="component-more"
                aria-haspopup="menu"
                aria-expanded={menuOpen}
                className="tw:size-6 tw:shrink-0 tw:text-[var(--bk-ink-muted)]"
                onClick={() => setMenuOpen((v) => !v)}
              >
                <MoreHorizontal size={16} aria-hidden="true" />
              </IconButton>
            }
          >
            <Menu label="Instance actions">
              <MenuItem data-testid="component-reset" disabled={readOnly} onClick={() => ask("reset")}>
                Reset to master
              </MenuItem>
              <MenuItem data-testid="component-detach" disabled={readOnly} onClick={() => ask("detach")}>
                Detach instance…
              </MenuItem>
            </Menu>
          </Popover>
        </div>
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
      </div>
    </Section>
  );
};

export default ComponentRow;
