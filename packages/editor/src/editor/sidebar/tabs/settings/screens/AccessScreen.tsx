/**
 * AccessScreen — PUBLISHING › Access (plan row #31, board M13 — not drawn yet).
 *
 * Lane 0 stub: registered in the nav (Pro-gated, ADMIN, footer save) so the
 * shell, search and deep links know it. Lane 2 fills it: the site password
 * (set / change / remove, moved from the dashboard Settings tab; never shows
 * the stored value — `hasPublishedPassword`) and the "Manage share links ↗"
 * door. Field anchors: `access-password`, `access-share-links`.
 *
 * @license BSD-3-Clause
 */

import * as React from "react";
import { Screen, Section } from "../shared";
import type { ScreenProps } from "../types";

export const AccessScreen: React.FC<ScreenProps> = () => (
  <Screen>
    <Section title="Password protection" desc="Keep the published site private behind a password. Applies on the next publish.">
      <p className="tw:col-span-full tw:m-0 tw:text-[length:var(--bk-text-13)] tw:leading-5 tw:text-[var(--bk-ink-muted)]">
        The site password moves here from the dashboard in this release.
      </p>
    </Section>
  </Screen>
);
