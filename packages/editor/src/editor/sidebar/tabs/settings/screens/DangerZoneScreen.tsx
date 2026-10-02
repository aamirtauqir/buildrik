/**
 * DangerZoneScreen — DANGER ZONE (plan rows #41–44, boards M15–M17 — not
 * drawn yet; PD-3, owner only).
 *
 * Lane 0 stub: registered in the nav (OWNER, immediate) so the shell, search
 * and deep links know it. Lane 2 fills it: Archive (hides from the Sites list,
 * the live site stays up — Q-B4), Transfer (`sites.transfer`, the creator or
 * the workspace OWNER — Q-B5) and Delete (the existing DeleteSiteModal;
 * restorable for 30 days — `sites.restore`). Field anchors: `danger-archive`,
 * `danger-transfer`, `danger-delete`.
 *
 * @license BSD-3-Clause
 */

import * as React from "react";
import { Screen, Section } from "../shared";
import type { ScreenProps } from "../types";

export const DangerZoneScreen: React.FC<ScreenProps> = () => (
  <Screen>
    <Section title="Danger zone" desc="Archive, transfer or delete this site. These apply immediately.">
      <p className="tw:col-span-full tw:m-0 tw:text-[length:var(--bk-text-13)] tw:leading-5 tw:text-[var(--bk-ink-muted)]">
        Archive, transfer and delete move here in this release. Until then they are in the dashboard&rsquo;s Sites list.
      </p>
    </Section>
  </Screen>
);
