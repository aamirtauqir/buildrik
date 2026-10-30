/**
 * PublishSettingsGuard — Publish pressed while a Site settings screen holds
 * unsaved edits (2L9 GAP-ST-PG 277:41731, PF 277:42171; the save between
 * them, PS 277:41957, is the footer's).
 *
 *   ask     "Save settings first?" — Publish without these changes · Save and
 *           continue · Keep editing (primary). Publish reads SAVED settings,
 *           so the draft would simply not ship.
 *   failed  "Couldn’t save {Screen}" — Keep editing (primary) · Retry save
 *           and continue. The tray has not opened.
 *
 * @license BSD-3-Clause
 */
import * as React from "react";
import { Button, Modal } from "@/editor/chrome-ui";
import { SET_BTN } from "../shared";

export type PublishGuardPhase = "ask" | "failed";

const BTN = `${SET_BTN} tw:h-8 tw:px-4`;
const BODY = "tw:m-0 tw:text-[length:var(--bk-text-13)] tw:leading-5 tw:text-[var(--bk-ink)]";

export const PublishSettingsGuard: React.FC<{
  phase: PublishGuardPhase | null;
  screenName: string;
  onKeepEditing: () => void;
  onPublishWithout: () => void;
  onSaveAndContinue: () => void;
}> = ({ phase, screenName, onKeepEditing, onPublishWithout, onSaveAndContinue }) => (
  <Modal
    open={phase !== null}
    onClose={onKeepEditing}
    title={phase === "failed" ? `Couldn’t save ${screenName}` : "Save settings first?"}
    width={phase === "failed" ? "sm" : "lg"}
    testId="set-publish-guard"
    footer={
      phase === "failed" ? (
        <>
          <Button type="button" size="xs" className={BTN} onClick={onKeepEditing} data-testid="set-publish-guard-keep">
            Keep editing
          </Button>
          <Button type="button" size="xs" variant="secondary" className={BTN} onClick={onSaveAndContinue} data-testid="set-publish-guard-save">
            Retry save and continue
          </Button>
        </>
      ) : (
        <>
          <Button type="button" size="xs" variant="secondary" className={BTN} onClick={onPublishWithout} data-testid="set-publish-guard-without">
            Publish without these changes
          </Button>
          <Button type="button" size="xs" variant="secondary" className={BTN} onClick={onSaveAndContinue} data-testid="set-publish-guard-save">
            Save and continue
          </Button>
          <Button type="button" size="xs" className={BTN} onClick={onKeepEditing} data-testid="set-publish-guard-keep">
            Keep editing
          </Button>
        </>
      )
    }
  >
    <p className={BODY} data-testid="set-publish-guard-body">
      {phase === "failed"
        ? "Your changes remain here. Publish has not opened."
        : `Publish uses saved site settings. Your ${screenName} changes are still unsaved.`}
    </p>
  </Modal>
);
