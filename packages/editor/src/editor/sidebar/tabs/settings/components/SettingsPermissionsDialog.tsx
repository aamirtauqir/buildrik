/**
 * SettingsPermissionsDialog — the Site settings "Permissions ›" door (2L9
 * B8-PM01 245:50300, PM02 252:49216, PM03 252:49487, and the 17 "Permissions
 * return" boards that open it over each screen).
 *
 * The minimum role for changing each settings area, read from
 * `SCREEN_MIN_ROLE` (the same table the read-only banner gates on), with the
 * member's own role marked "· You". The role is asked again on open, so the
 * dialog can say it is checking, and say so when the check fails — the
 * shell's role is null for both, and the board draws them apart.
 *
 * Copy only: every settings write stays role-gated server-side.
 *
 * @license BSD-3-Clause
 */
import * as React from "react";
import { Button, Modal } from "@/editor/chrome-ui";
import { fetchMyRole, type WorkspaceRole } from "@/services/RoleService";
import { DASHBOARD_URL } from "@/shared/utils/runtimeEnv";
import { SCREEN_MIN_ROLE, SETTINGS_NAV, WORKSPACE_LINKS } from "../constants";
import { SET_BTN } from "../shared";

/* B8-PM01's ranks, top down, with the label each prints. DESIGNER changes
   what an Editor can (roleAtLeast ranks it with EDITOR). */
const RANKS: ReadonlyArray<{ role: Exclude<WorkspaceRole, "DESIGNER">; label: string }> = [
  { role: "OWNER", label: "Owner" },
  { role: "ADMIN", label: "Admin" },
  { role: "EDITOR", label: "Editor" },
  { role: "VIEWER", label: "Viewer" },
];

const LABEL_OF: Record<WorkspaceRole, string> = {
  OWNER: "Owner",
  ADMIN: "Admin",
  EDITOR: "Editor",
  DESIGNER: "Editor",
  VIEWER: "Viewer",
};

/** "General, Languages and SEO" — the nav titles, in nav order. */
function areasFor(role: WorkspaceRole): string {
  const names = SETTINGS_NAV.filter((n) => n.kind === "screen" && SCREEN_MIN_ROLE[n.id as keyof typeof SCREEN_MIN_ROLE] === role).map(
    (n) => n.title,
  );
  if (names.length <= 1) return names.join("");
  return `${names.slice(0, -1).join(", ")} and ${names[names.length - 1]}`;
}

function lineFor(role: Exclude<WorkspaceRole, "DESIGNER">): string {
  if (role === "VIEWER") return "No Site settings access.";
  /* The Danger zone names what it holds (B8-PM01). */
  if (role === "OWNER") return `${areasFor("OWNER")}: archive, delete and transfer.`;
  return `${areasFor(role)}.`;
}

type Check = { phase: "checking" } | { phase: "failed" } | { phase: "ready"; role: WorkspaceRole };

const INK = "tw:m-0 tw:text-[length:var(--bk-text-13)] tw:leading-5 tw:text-[var(--bk-ink)]";
const SOFT = "tw:m-0 tw:text-[length:var(--bk-text-13)] tw:leading-5 tw:text-[var(--bk-ink-soft)]";

export const SettingsPermissionsDialog: React.FC<{ open: boolean; onClose: () => void }> = ({ open, onClose }) => {
  const [check, setCheck] = React.useState<Check>({ phase: "checking" });

  const run = React.useCallback(() => {
    setCheck({ phase: "checking" });
    let live = true;
    void fetchMyRole().then((role) => {
      if (live) setCheck(role ? { phase: "ready", role } : { phase: "failed" });
    });
    return () => {
      live = false;
    };
  }, []);

  React.useEffect(() => (open ? run() : undefined), [open, run]);

  const close = (
    <Button type="button" size="xs" variant={check.phase === "failed" ? "secondary" : undefined} className={`${SET_BTN} tw:h-8 tw:w-24`} onClick={onClose} data-testid="set-perm-close">
      Close
    </Button>
  );

  return (
    <Modal
      open={open}
      onClose={onClose}
      title="Permissions"
      width="sm"
      testId="set-perm-dialog"
      footer={
        check.phase === "failed" ? (
          <>
            {close}
            <Button type="button" size="xs" className={`${SET_BTN} tw:h-8 tw:px-6`} onClick={() => run()} data-testid="set-perm-retry">
              Try again
            </Button>
          </>
        ) : (
          close
        )
      }
    >
      {check.phase === "checking" ? (
        <p className={INK} role="status" data-testid="set-perm-checking">
          Checking your access…
        </p>
      ) : check.phase === "failed" ? (
        <p className={INK} role="status" data-testid="set-perm-failed">
          Couldn’t check your access. Your permissions have not changed.
        </p>
      ) : (
        <div className="tw:flex tw:flex-col tw:gap-3" data-testid="set-perm-ranks">
          <p className={INK}>{`Your role: ${LABEL_OF[check.role]}. These are minimum roles for changing site settings.`}</p>
          {RANKS.map(({ role, label }) => (
            <div key={role} className="tw:flex tw:flex-col tw:gap-3" data-testid={`set-perm-rank-${role}`}>
              <span className="tw:text-[length:var(--bk-text-13)] tw:font-medium tw:leading-5 tw:text-[var(--bk-ink)]">
                {LABEL_OF[check.role] === label ? `${label} · You` : label}
              </span>
              <p className={SOFT}>{lineFor(role)}</p>
            </div>
          ))}
          <p className="tw:m-0 tw:text-[length:var(--bk-text-12)] tw:leading-4 tw:text-[var(--bk-ink-soft)]">
            An Admin who created the site can also transfer it.
          </p>
          <a
            href={`${DASHBOARD_URL}${WORKSPACE_LINKS.members}`}
            target="_blank"
            rel="noopener noreferrer"
            className="tw:text-[length:var(--bk-text-13)] tw:leading-5 tw:text-[var(--bk-accent)] tw:no-underline tw:hover:underline"
            data-testid="set-perm-members"
          >
            Manage members in Organization workspace ↗
          </a>
        </div>
      )}
    </Modal>
  );
};
