/**
 * InspectorElementMenu — the header's ⋯ (Inspector v4, board 30).
 *
 * Exactly the rows of `INSPECTOR_MENU` from the one element-action registry
 * (`editor/shared/elementActions.ts`): Duplicate ⌘D · Copy style ⌥⌘C · Paste
 * style ⌥⌘V · Apply style to all {kind} on this page (N) · Reset style — Save
 * as component… · Lock — Delete ⌫. The same handlers the canvas menu and the
 * keyboard run. Nothing else lives here any more: AI is the header's ✦ chip,
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
import { IconButton, Menu, MenuItem, MenuSeparator, Popover, useToast } from "@/editor/chrome-ui";
import { formatShortcutHint, isMac } from "@/editor/canvas/menus/MenuItem";
import {
  actionLabel,
  ELEMENT_ACTIONS,
  INSPECTOR_MENU,
  type ElementActionContext,
} from "@/editor/shared/elementActions";

export interface InspectorElementMenuProps {
  composer: Composer | null | undefined;
  selectedElementId: string;
}

const ROW = "tw:!h-auto tw:!min-h-8 tw:!py-1.5 tw:!text-[12px] tw:!leading-4";

export const InspectorElementMenu: React.FC<InspectorElementMenuProps> = ({ composer, selectedElementId }) => {
  const [open, setOpen] = React.useState(false);
  const { addToast } = useToast();
  const close = React.useCallback(() => setOpen(false), []);

  const element = composer?.elements.getElement(selectedElementId) ?? null;
  const rootId = composer?.elements.getActivePage?.()?.root.id;
  const ctx: ElementActionContext | null =
    composer && element ? { composer, element, isRoot: element.getId() === rootId, addToast } : null;

  /* Rules only between visible rows, never doubled or trailing. */
  const rows: React.ReactNode[] = [];
  if (open && ctx) {
    let pendingRule = false;
    for (const id of INSPECTOR_MENU) {
      if (id === "---") {
        pendingRule = rows.length > 0;
        continue;
      }
      const action = ELEMENT_ACTIONS[id];
      if (action.isVisible && !action.isVisible(ctx)) continue;
      if (pendingRule) rows.push(<MenuSeparator key={`rule-${rows.length}`} />);
      pendingRule = false;
      const enabled = action.isEnabled ? action.isEnabled(ctx) : true;
      rows.push(
        <MenuItem
          key={id}
          data-testid={`inspector-menu-${id}`}
          danger={action.danger}
          disabled={enabled !== true}
          title={enabled === true ? undefined : enabled}
          kbd={action.shortcut ? formatShortcutHint(action.shortcut, isMac()) : undefined}
          className={ROW}
          onClick={() => {
            close();
            action.run(ctx);
          }}
        >
          <span className="tw:block tw:whitespace-normal">{actionLabel(action, ctx)}</span>
          {enabled === true ? null : (
            <span className="tw:block tw:text-[11px] tw:text-[var(--bk-ink-muted)]">{enabled}</span>
          )}
        </MenuItem>
      );
    }
  }

  return (
    <Popover
      open={open}
      onClose={close}
      placement="bottom-end"
      label="Element actions"
      className="tw:w-60 tw:p-1"
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
