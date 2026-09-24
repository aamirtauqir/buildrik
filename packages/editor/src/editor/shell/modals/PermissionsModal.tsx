/**
 * Permissions — board 4418:133026. What this role can and cannot do in the
 * editor, each unavailable action naming the role it needs. Opened from the
 * viewer notice's "View permission details" (board 4418:126059).
 *
 * The rows restate the server's gates (sites/review/media/members routers);
 * they are copy, not checks — every write stays role-gated server-side.
 *
 * @license BSD-3-Clause
 */
import * as React from "react";
import { Button, Modal } from "@/editor/chrome-ui";
import type { WorkspaceRole } from "@/services/RoleService";

const DENIED: ReadonlyArray<[capability: string, reason: string, detail: string]> = [
  ["Edit page content", "Editors can edit", "Text, images and styles are locked for viewers."],
  ["Publish", "Editors can publish", "Publishing needs editor rank, then the approval gate."],
  ["Send for review", "Editors can send", "Review rounds are started by the people doing the work."],
  ["Upload media", "Editors can upload", "The media library is read-only for viewers."],
  ["Manage members", "Only an admin can invite", "Roles and invites are admin controls."],
  ["Delete this site", "Only the workspace owner can delete a site", "Deleting the site requires its workspace owner."],
  ["Apply a template", "Viewers cannot apply templates", "Creating a page or replacing Home changes site content."],
];

const ROW =
  "tw:flex tw:h-16 tw:items-center tw:gap-4 tw:rounded-[var(--bk-radius-md)] tw:border tw:border-[var(--bk-border)] " +
  "tw:bg-[var(--bk-bg-card)] tw:px-4";
const CAPABILITY =
  "tw:flex tw:h-8 tw:min-w-[150px] tw:items-center tw:justify-center tw:px-4 tw:text-[13px] tw:leading-5 tw:font-medium tw:text-[var(--bk-ink)]";
const REASON =
  "tw:flex tw:h-[22px] tw:flex-none tw:items-center tw:rounded tw:bg-[var(--bk-ink)] tw:px-2 tw:text-[11px] tw:leading-4 tw:text-[var(--bk-bg-card)]";
const DETAIL = "tw:m-0 tw:min-w-0 tw:flex-1 tw:text-[12px] tw:leading-[18px] tw:text-[var(--bk-ink-muted)]";

export const PermissionsModal: React.FC<{ open: boolean; role: WorkspaceRole; onClose: () => void }> = ({
  open,
  role,
  onClose,
}) => {
  const ALLOWED_ROW = <AllowedRow onBack={onClose} />;
  return (
  <Modal
    open={open}
    onClose={onClose}
    title={`Permissions — signed in as a ${role}`}
    width="wide"
    closeButton
    dismissOnScrimClick
    testId="permissions-modal"
  >
    <p className="tw:m-0 tw:mb-4 tw:text-[13px] tw:leading-5 tw:text-[var(--bk-ink-soft)]">
      Viewer access lets you inspect the work. Editing, publishing, uploading and applying templates require editor
      access. Each unavailable action explains the role it needs.
    </p>
    <div className="tw:flex tw:flex-col tw:gap-2.5" data-testid="permissions-rows">
      {/* Board order: the allowed row sits second, under "Edit page content". */}
      {DENIED.map(([capability, reason, detail], i) => (
        <React.Fragment key={capability}>
          <div className={ROW} data-testid="permissions-denied">
            <span className={CAPABILITY}>{capability}</span>
            <span className={REASON}>{reason}</span>
            <p className={DETAIL}>{detail}</p>
          </div>
          {i === 0 ? ALLOWED_ROW : null}
        </React.Fragment>
      ))}
    </div>
  </Modal>
  );
};

/* "Open the editor · Allowed — read-only · Try it ›". You are in the editor
   already, so both put you back in it. */
const AllowedRow: React.FC<{ onBack: () => void }> = ({ onBack }) => (
  <div className={ROW}>
        <Button size="sm" onClick={onBack} className="tw:h-8 tw:min-h-0 tw:min-w-[150px] tw:rounded-[var(--bk-radius-sm)] tw:text-[13px]">
          Open the editor
        </Button>
        <span className="tw:flex tw:h-[22px] tw:flex-none tw:items-center tw:gap-1 tw:rounded tw:bg-[var(--bk-success-tint)] tw:px-2 tw:text-[11px] tw:leading-4 tw:text-[var(--bk-success-text)]">
          <span className="tw:size-1.5 tw:rounded-full tw:bg-[var(--bk-success)]" aria-hidden="true" />
          Allowed — read-only
        </span>
        <Button
          color="light"
          size="xs"
          onClick={onBack}
          className="tw:h-auto tw:min-h-0 tw:border-0 tw:bg-transparent tw:p-0 tw:text-[12px] tw:leading-[18px] tw:font-medium tw:text-[var(--bk-accent)] tw:focus:ring-0"
        >
          Try it ›
        </Button>
        <p className={DETAIL}>Every page opens; every editing control is disabled.</p>
      </div>
);
