/**
 * L4-035: clicking a server-check row in Issues ("No favicon set…", "SEO
 * configured", "Domain connected") opened Brand. Those rows open the pane
 * that fixes them — the same doors the Publish panel's checks already use.
 *
 * @license BSD-3-Clause
 */
import { describe, it, expect, vi } from "vitest";
import { openPublishCheckFix } from "../PublishTab";
import { EVENTS } from "@/shared/constants/events";

describe("openPublishCheckFix", () => {
  it.each([
    ["Favicon", EVENTS.UI_SETTINGS_OPEN, { screen: "general" }],
    ["SEO configured", EVENTS.UI_SETTINGS_OPEN, { screen: "seo" }],
    ["Domain connected", EVENTS.UI_SETTINGS_OPEN, { screen: "domains" }],
    ["Pages ready", "ui:switch-tab", { tab: "pages" }],
  ])("%s opens its fix", (label, event, payload) => {
    const composer = { emit: vi.fn() };
    expect(openPublishCheckFix(composer as never, label)).toBe(true);
    expect(composer.emit).toHaveBeenCalledWith(event, payload);
  });

  it("says no for a check without a door", () => {
    const composer = { emit: vi.fn() };
    expect(openPublishCheckFix(composer as never, "Something else")).toBe(false);
    expect(composer.emit).not.toHaveBeenCalled();
  });
});
