/**
 * InspectorElementMenu — the header's ⋯ (Inspector v4, board 30).
 *
 * Exactly the rows of `INSPECTOR_MENU` from the one element-action registry
 * (`editor/shared/elementActions.ts`), under the element's name in the
 * groups 2L9 S08 (`255:85835`) draws: Clipboard (Duplicate, Copy style, Paste
 * style — G03: "Copy a style first" under it while disabled), Structure
 * (Save as component…, Bind to CMS field…, Show in Layers), State (Lock,
 * Add interaction, Apply style to all {kind}, Reset style), Delete. The same
 * handlers the canvas menu and the keyboard run. Nothing else lives here any more: AI is the header's ✦ chip,
 * picking is the canvas, the parent is a breadcrumb crumb, hiding is the
 * header's ✕ / ⌘\, and ⌥-click on a section header opens or closes them all.
 *
 * chrome-ui Popover + Menu: Esc closes and returns focus to ⋯, ↑/↓/Home/End
 * move between rows (P-6, §16).
 *
 * @license BSD-3-Clause
 */

import { MoreHorizontal } from "lucide-react";
import * as React from "react";
import type { Composer } from "@/engine";
import { IconButton, Menu, MenuItem, Popover, useToast } from "@/editor/chrome-ui";
import { getLayerName } from "@/editor/panels/layers/hooks/layersPersistence";
import { elementTypeLabel } from "@/shared/constants/elementTypeLabels";
import { useInspectorField } from "../shared/controls/InspectorFieldContext";
import { openSubview } from "../tabs/subviewStore";
import {
  actionLabel,
  ELEMENT_ACTIONS,
  INSPECTOR_MENU,
  isMenuGroup,
  type ElementActionContext,
} from "@/editor/shared/elementActions";

export interface InspectorElementMenuProps {
  composer: Composer | null | undefined;
  selectedElementId: string;
}

const GROUP = "tw:px-2.5 tw:pt-2 tw:pb-0.5 tw:text-[11px] tw:leading-4 tw:text-[var(--bk-ink-muted)]";
const ROW = "tw:!h-auto tw:!min-h-8 tw:!px-2.5 tw:!py-1.5 tw:!text-[12px] tw:!leading-4";

export const InspectorElementMenu: React.FC<InspectorElementMenuProps> = ({ composer, selectedElementId }) => {
  const [open, setOpen] = React.useState(false);
  const { addToast } = useToast();
  const { discrete: runDiscrete } = useInspectorField();
  const close = React.useCallback(() => setOpen(false), []);

  const element = composer?.elements.getElement(selectedElementId) ?? null;
  const rootId = composer?.elements.getActivePage?.()?.root.id;
  const ctx: ElementActionContext | null =
    composer && element ? { composer, element, isRoot: element.getId() === rootId, addToast } : null;

  /* A group's heading only above a visible row of it (2L9 S08). */
  const rows: React.ReactNode[] = [];
  if (open && ctx) {
    rows.push(
      <div key="title" className="tw:px-2.5 tw:pt-1.5 tw:text-[12px] tw:font-semibold tw:leading-4 tw:text-[var(--bk-ink)]" data-testid="inspector-menu-title">
        {getLayerName(ctx.element) ?? elementTypeLabel(ctx.element.getType())}
      </div>,
    );
    let pendingGroup: string | null = null;
    for (const id of INSPECTOR_MENU) {
      if (isMenuGroup(id)) {
        pendingGroup = id.slice(1);
        continue;
      }
      const action = ELEMENT_ACTIONS[id];
      if (action.isVisible && !action.isVisible(ctx)) continue;
      if (pendingGroup) {
        rows.push(
          <div key={`group-${pendingGroup}`} className={GROUP} role="presentation">
            {pendingGroup}
          </div>,
        );
        pendingGroup = null;
      }
      const enabled = action.isEnabled ? action.isEnabled(ctx) : true;
      rows.push(
        <MenuItem
          key={id}
          data-testid={`inspector-menu-${id}`}
          danger={action.danger}
          disabled={enabled !== true}
          title={enabled === true ? undefined : enabled}
          className={ROW}
          onClick={() => {
            close();
            /* 2L9 S20: Reset style reviews first, as the tab's body. */
            if (id === "reset-style") {
              openSubview({ kind: "reset-style", elementId: selectedElementId });
              return;
            }
            /* Its own undo step, after any edit still pending (Reset style
               right after Align used to undo with it — or be overtaken by it). */
            runDiscrete(() => action.run(ctx));
          }}
        >
          <span className="tw:block tw:w-full tw:whitespace-normal tw:text-center">{actionLabel(action, ctx)}</span>
        </MenuItem>,
      );
      /* G03: the reason a row cannot run sits under it ("Copy a style first"). */
      if (enabled !== true) {
        rows.push(
          <div key={`${id}-why`} className="tw:px-2.5 tw:pb-1 tw:text-[11px] tw:leading-4 tw:text-[var(--bk-ink-muted)]" data-testid={`inspector-menu-${id}-reason`}>
            {enabled}
          </div>,
        );
      }
    }
  }

  return (
    <Popover
      open={open}
      onClose={close}
      placement="bottom-end"
      /* 2L9 S08: 280 wide, right edge on the ⋯, reaching over the canvas —
         wider than the 300px column, so it mounts in the overlay root. */
      portal
      label="Element actions"
      className="tw:w-[280px] tw:px-2 tw:py-1"
      trigger={
        <IconButton
          label="Element actions"
          size="sm"
          data-testid="inspector-element-menu"
          aria-haspopup="menu"
          aria-expanded={open}
          onClick={() => setOpen((v) => !v)}
        >
          <MoreHorizontal size={16} aria-hidden="true" />
        </IconButton>
      }
    >
      <Menu label="Element actions" className="tw:min-w-0">
        {rows}
      </Menu>
    </Popover>
  );
};

export default InspectorElementMenu;
