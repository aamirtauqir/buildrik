/**
 * The webhook event list offered `form.submit — fires on every form
 * submission`. The dispatcher is real (form-submission.service calls
 * deliverWebhook), but it only runs when something POSTs the public forms
 * endpoint, and no published page does — the exported `<form>` has no action
 * and no submit script. So the delivery cannot arrive, and a user who selects
 * that event waits forever.
 *
 * @license BSD-3-Clause
 */

import { describe, it, expect } from "vitest";
import { readFileSync } from "node:fs";
import { join } from "node:path";

const screen = readFileSync(join(__dirname, "..", "WebhooksScreen.tsx"), "utf8");
const rendered = screen.replace(/\/\*[\s\S]*?\*\//g, "");

describe("webhook event labels", () => {
  it("does not promise form.submit fires today", () => {
    expect(rendered).not.toMatch(/fires on every form submission/i);
  });

  it("says why it cannot fire", () => {
    expect(rendered).toMatch(/form capture is unbuilt/i);
  });

  it("leaves the publish event alone — that one really fires", () => {
    expect(rendered).toMatch(/site\.publish — fires after every successful publish/);
  });
});
