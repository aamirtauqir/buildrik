/**
 * WorkspaceDoorScreen — 8139:217358 "Integrations & webhooks · workspace-door",
 * the same card for Members and Billing.
 *
 * Workspace settings are not this site's: the row opens a card in the pane
 * that says whose settings they are and leads to the dashboard. `Close`
 * returns to the Overview; `Open workspace settings ↗` opens the dashboard
 * page in a new tab.
 *
 * @license BSD-3-Clause
 */

import * as React from "react";
import { Button } from "@/editor/chrome-ui";
import { DASHBOARD_URL } from "@/shared/utils/runtimeEnv";
import { SET_BTN, SET_CARD } from "../shared";
import { WORKSPACE_DOOR_COPY, WORKSPACE_LINKS } from "../constants";
import type { SettingsWorkspaceDoorId } from "../types";

export interface WorkspaceDoorScreenProps {
  door: SettingsWorkspaceDoorId;
  /** The row's title — `Integrations & webhooks`. */
  title: string;
  workspaceName: string;
  onClose: () => void;
}

const LINE = "tw:m-0 tw:text-[length:var(--bk-text-14)] tw:leading-5 tw:text-[var(--bk-ink)]";

export const WorkspaceDoorScreen: React.FC<WorkspaceDoorScreenProps> = ({ door, title, workspaceName, onClose }) => {
  const copy = WORKSPACE_DOOR_COPY[door];
  return (
    <section
      className={`${SET_CARD} tw:flex tw:w-160 tw:max-w-full tw:flex-col tw:gap-4 tw:p-6 tw:[box-shadow:var(--bk-shadow-overlay)]`}
      aria-label={`${workspaceName} · ${title}`}
      data-testid={`set-door-${door}`}
    >
      <h3 className="tw:m-0 tw:text-[length:var(--bk-text-20)] tw:font-semibold tw:leading-[30px] tw:tracking-[-0.24px] tw:text-[var(--bk-ink)]">
        {`${workspaceName} · ${title}`}
      </h3>
      <p className={LINE}>{`Workspace settings · Applies to all sites in ${workspaceName}`}</p>
      <p className={LINE}>{copy.what}</p>
      <p className={LINE}>{copy.managed}</p>
      <div className="tw:flex tw:items-center tw:justify-end tw:gap-2">
        <Button type="button" color="light" size="sm" className={`${SET_BTN} tw:h-8 tw:px-4`} onClick={onClose} data-testid="set-door-close">
          Close
        </Button>
        <Button
          type="button"
          size="sm"
          className={`${SET_BTN} tw:h-8 tw:px-4`}
          onClick={() => window.open(`${DASHBOARD_URL}${WORKSPACE_LINKS[door]}`, "_blank", "noopener,noreferrer")}
          data-testid="set-door-open"
        >
          Open workspace settings ↗
        </Button>
      </div>
    </section>
  );
};
