/**
 * LiveUrlConfirm — design-2l9 board 63:15255: "Update URL" on a live page
 * asks first. Live is real state, decided by the caller: the site has been
 * published and the page is not hidden from publish.
 *
 * @license BSD-3-Clause
 */
import * as React from "react";
import { ConfirmDialog } from "@/editor/chrome-ui";

export interface LiveUrlChange {
  pageId: string;
  /** The page's name now (before the rename). */
  current: string;
  /** The new name the rename carries. */
  name: string;
  from: string;
  to: string;
}

export function LiveUrlConfirm({ change, onCancel, onConfirm }: { change: LiveUrlChange; onCancel: () => void; onConfirm: () => void }) {
  return (
    <ConfirmDialog
      open
      title="Change this live page’s URL?"
      message={`${change.current} is live at ${change.from}. Changing it to ${change.to} can break old links after publishing. You can add a redirect after the change.`}
      confirmLabel="Change URL"
      onClose={onCancel}
      onConfirm={onConfirm}
    />
  );
}
