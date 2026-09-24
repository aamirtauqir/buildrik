/**
 * The inspector column for a workspace VIEWER — board 4418:126059. A viewer
 * opens the editor read-only (`?view=readonly`, dashboard redirect), where
 * the column used to be absent altogether: nothing on screen said why every
 * control was off, or who could do what. "View permission details" opens
 * the Permissions dialog (4418:133026).
 *
 * @license BSD-3-Clause
 */
import * as React from "react";
import { Button } from "@/editor/chrome-ui";
import type { WorkspaceRole } from "@/services/RoleService";
import { PermissionsModal } from "./modals/PermissionsModal";

const ROLE_LABEL: Record<WorkspaceRole, string> = {
  VIEWER: "Viewer",
  EDITOR: "Editor",
  DESIGNER: "Designer",
  ADMIN: "Admin",
  OWNER: "Owner",
};

export const ViewerRoleNotice: React.FC<{ role: WorkspaceRole }> = ({ role }) => {
  const [open, setOpen] = React.useState(false);
  return (
    <div className="tw:flex tw:w-full tw:flex-col tw:items-start tw:gap-1.5 tw:px-3 tw:py-2 tw:text-[var(--bk-ink)]" data-testid="viewer-role-notice">
      <p className="tw:m-0 tw:text-[14px] tw:leading-5">Workspace role: {ROLE_LABEL[role]}</p>
      <p className="tw:m-0 tw:text-[13px] tw:leading-5">
        You can inspect the site. Editing, uploads, templates, review requests and publishing require a permitted
        role.
      </p>
      <p className="tw:m-0 tw:text-[12px] tw:leading-[18px]">Manage members: Admin. Delete site: Workspace owner.</p>
      <p className="tw:m-0 tw:text-[11px] tw:leading-4">Viewing mode is a separate display option.</p>
      <Button
        color="light"
        size="xs"
        onClick={() => setOpen(true)}
        className="tw:h-7 tw:min-h-0 tw:border-transparent tw:bg-transparent tw:px-3 tw:text-[13px] tw:leading-5 tw:font-medium tw:text-[var(--bk-gray-700)]"
        data-testid="viewer-permission-details"
      >
        View permission details
      </Button>
      <PermissionsModal open={open} role={role} onClose={() => setOpen(false)} />
    </div>
  );
};
