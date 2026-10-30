/**
 * WorkspaceDoorDialog — "Organization workspace · Members" (2L9 GAP-ST-ORG
 * 277:38019, and its Billing / Integrations and draft siblings).
 *
 * A workspace row is not this site's setting: the row opens the dashboard
 * page in a new tab and this dialog says so over the screen, which keeps its
 * draft — so no unsaved guard and no pane change. "Back to Site settings"
 * closes it. The board's "Design handoff only…" line is prototype copy.
 *
 * @license BSD-3-Clause
 */
import * as React from "react";
import { Button, Modal } from "@/editor/chrome-ui";
import { SET_BTN } from "../shared";

export const WorkspaceDoorDialog: React.FC<{ title: string | null; onClose: () => void }> = ({ title, onClose }) => (
  <Modal
    open={title !== null}
    onClose={onClose}
    title={`Organization workspace · ${title ?? ""}`}
    width="sm"
    testId="set-door-dialog"
    footer={
      <Button type="button" size="xs" className={`${SET_BTN} tw:h-8 tw:px-7`} onClick={onClose} data-testid="set-door-back">
        Back to Site settings
      </Button>
    }
  >
    <p className="tw:m-0 tw:text-[length:var(--bk-text-13)] tw:leading-5 tw:text-[var(--bk-ink)]">
      This opens the named organization page in a separate tab. Your Site settings screen and any draft stay here.
    </p>
  </Modal>
);
