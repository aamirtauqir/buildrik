/**
 * A publish tells you how it ended.
 *
 * The only notification the publish path ever sent fired at the START
 * ("Site X publish started"), so the bell filled with starts and never once
 * said whether a site went live — and `SITE_PUBLISH_FAILED`, a type that has
 * always been in the enum with its own preference category, had no writer at
 * all: a failed deploy notified nobody. Walked live after the change: a queued
 * job with no page payload failed with "No page content to deploy" and left a
 * SITE_PUBLISH_FAILED row naming the site and the reason.
 *
 * The types are asserted here because a typo'd type string still inserts (see
 * `createNotification` — unmapped types skip the preference gate), so it would
 * ship a notification the Settings → Notifications categories cannot mute.
 *
 * @license BSD-3-Clause
 */
import { readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";
import { NotificationType, NOTIFICATION_TYPE_CATEGORY } from "../constants/enums";

const worker = readFileSync(
  join(__dirname, "../../packages/dashboard/app/api/workers/publish/[jobId]/route.ts"),
  "utf8",
);
const service = readFileSync(join(__dirname, "../../server/services/publish.service.ts"), "utf8");

describe("publish notifications", () => {
  it("notifies on success and on failure", () => {
    expect(worker).toMatch(/notifyWorkspaceOwner\([\s\S]*?"SITE_PUBLISHED"/);
    expect(worker).toMatch(/notifyWorkspaceOwner\([\s\S]*?"SITE_PUBLISH_FAILED"/);
  });

  it("no longer announces the start — the outcome is the news", () => {
    /* The phrase survives in the comment explaining why it went, so match the
       CALL, not the prose. */
    expect(service).not.toMatch(/notifyWorkspaceOwner\([\s\S]{0,200}publish started/);
  });

  it("uses types the enum declares, so the preference gate can see them", () => {
    for (const type of ["SITE_PUBLISHED", "SITE_PUBLISH_FAILED"]) {
      expect(NotificationType[type as keyof typeof NotificationType], type).toBe(type);
      expect(NOTIFICATION_TYPE_CATEGORY[type], type).toBeTruthy();
    }
  });
});
