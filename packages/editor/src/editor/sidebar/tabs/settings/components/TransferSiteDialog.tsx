/**
 * TransferSiteDialog — 8137:217348 `Transfer <site>` (560); the success is
 * the screen's toast (8137:217625 "Site transferred").
 *
 * `New owner` lists the workspace's admins and editors (`team.list`, the
 * dashboard's own rule for who can take a site), each as `<name> · <Role>`;
 * `Type <site> to confirm` arms `Transfer site`, which resolves with the
 * chosen member — the screen runs `sites.transfer` (the creator or the
 * workspace OWNER, Q-B5). A refusal stays in the dialog with the server's
 * sentence.
 *
 * @license BSD-3-Clause
 */

import * as React from "react";
import { Button, ModalBody, ModalContent, ModalRoot } from "@/editor/chrome-ui";
import {
  LIBRARY_MODAL_BODY,
  LIBRARY_MODAL_BTN_GHOST,
  LIBRARY_MODAL_BTN_PRIMARY,
  LIBRARY_MODAL_FOOT,
  LIBRARY_MODAL_TITLE,
} from "@/editor/media/components/libraryModal";
import { Input, Select } from "../shared";

export interface TransferMember {
  userId: string;
  fullName: string;
  role: string;
}

export interface TransferSiteDialogProps {
  open: boolean;
  siteName: string;
  /** null while the members load. */
  members: TransferMember[] | null;
  /** Rejects with the server's sentence. */
  onTransfer(member: TransferMember): Promise<void>;
  onCancel(): void;
}

const roleLabel = (role: string) => role.charAt(0) + role.slice(1).toLowerCase();
const LABEL_11 = "tw:text-[length:var(--bk-text-11)] tw:leading-4 tw:text-[var(--bk-ink)]";

export function TransferSiteDialog({ open, siteName, members, onTransfer, onCancel }: TransferSiteDialogProps) {
  const [memberId, setMemberId] = React.useState("");
  const [typed, setTyped] = React.useState("");
  const [busy, setBusy] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);

  React.useEffect(() => {
    if (open) return;
    setMemberId("");
    setTyped("");
    setError(null);
    setBusy(false);
  }, [open]);

  // The first eligible member is preselected, as the board draws a name in the field.
  React.useEffect(() => {
    if (open && !memberId && members && members.length > 0) setMemberId(members[0].userId);
  }, [open, memberId, members]);

  const member = members?.find((m) => m.userId === memberId) ?? null;
  const armed = !!member && typed.trim() === siteName.trim() && !busy;

  const run = async () => {
    if (!armed || !member) return;
    setBusy(true);
    setError(null);
    try {
      await onTransfer(member);
    } catch (e) {
      setError(e instanceof Error && e.message ? e.message : "The site was not transferred. Try again.");
      setBusy(false);
    }
  };

  const title = `Transfer ${siteName}`;
  return (
    <ModalRoot open={open} onClose={busy ? undefined : onCancel}>
      <ModalContent size="question" srTitle={title} data-testid="set-danger-transfer-dialog">
        <h2 className={LIBRARY_MODAL_TITLE}>{title}</h2>
        <ModalBody className="tw:flex tw:flex-col tw:gap-4">
          <p className={LIBRARY_MODAL_BODY}>Choose another workspace member to own this site.</p>
          <div className="tw:flex tw:flex-col tw:gap-1">
            <label htmlFor="danger-transfer-member" className={LABEL_11}>
              New owner
            </label>
            <Select
              id="danger-transfer-member"
              value={memberId}
              disabled={busy || !members || members.length === 0}
              onChange={(e) => setMemberId(e.target.value)}
              data-testid="set-danger-transfer-member"
            >
              {members === null ? <option value="">Loading members…</option> : null}
              {members !== null && members.length === 0 ? <option value="">No other admins or editors</option> : null}
              {(members ?? []).map((m) => (
                <option key={m.userId} value={m.userId}>
                  {m.fullName} · {roleLabel(m.role)}
                </option>
              ))}
            </Select>
          </div>
          <div className="tw:flex tw:flex-col tw:gap-1">
            <label htmlFor="danger-transfer-typed" className={LABEL_11}>
              Type {siteName} to confirm
            </label>
            <Input
              id="danger-transfer-typed"
              value={typed}
              autoComplete="off"
              spellCheck={false}
              disabled={busy}
              onChange={(e) => setTyped(e.target.value)}
              placeholder={siteName}
              data-testid="set-danger-transfer-typed"
            />
          </div>
          {error ? (
            <p className="tw:m-0 tw:text-[length:var(--bk-text-13)] tw:leading-5 tw:text-[var(--bk-error-text)]" role="alert">
              {error}
            </p>
          ) : null}
        </ModalBody>
        <div className={LIBRARY_MODAL_FOOT}>
          <Button size="xs" variant="ghost" className={LIBRARY_MODAL_BTN_GHOST} disabled={busy} onClick={onCancel}>
            Cancel
          </Button>
          <Button
            size="xs"
            className={LIBRARY_MODAL_BTN_PRIMARY}
            disabled={!armed}
            aria-busy={busy || undefined}
            onClick={() => void run()}
            data-testid="set-danger-transfer-confirm"
          >
            Transfer site
          </Button>
        </div>
      </ModalContent>
    </ModalRoot>
  );
}
