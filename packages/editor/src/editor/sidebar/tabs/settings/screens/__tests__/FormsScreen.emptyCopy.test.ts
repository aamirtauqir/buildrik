/**
 * The Forms inbox told users to drop a Form block "to start collecting
 * submissions". Nothing collects them.
 *
 * Walked the whole chain: inserting a Form on the canvas exports
 * `<form class=… data-buildrick-id=…>` with no `action` and no submit script,
 * so a published page posts nowhere. The public endpoint
 * (app/api/public/forms/[siteId]/[formBlockId]) is never called by anything we
 * ship, and no code path creates a FormBlock row except site duplication —
 * so `forms.listBlocks` can only ever return the empty list this screen is
 * rendering. The export DOES wire a form when a Formspree/custom webhook URL
 * is set, but the settings section that would set one (shared/forms/
 * FormSettingsSection) has no consumer, so a user cannot reach it either.
 *
 * @license BSD-3-Clause
 */

import { describe, it, expect } from "vitest";
import { readFileSync } from "node:fs";
import { join } from "node:path";

const screen = readFileSync(join(__dirname, "..", "FormsScreen.tsx"), "utf8");
const injector = readFileSync(
  join(__dirname, "..", "..", "..", "..", "..", "..", "engine", "export", "FormspreeInjector.ts"),
  "utf8"
);
const rendered = screen.replace(/\{\/\*[\s\S]*?\*\/\}/g, "");

describe("Forms inbox — empty state", () => {
  it("no longer promises that dropping a block starts collecting", () => {
    expect(rendered).not.toMatch(/start collecting submissions/i);
  });

  it("says submissions are not captured yet", () => {
    expect(rendered).toMatch(/not captured yet/i);
  });

  it("matches the exporter: an action only exists for formspree or a custom URL", () => {
    const fn = injector.slice(injector.indexOf("getFormAction"));
    const body = fn.slice(0, fn.indexOf("getHiddenFields"));
    expect(body).toMatch(/provider === "formspree"/);
    expect(body).toMatch(/provider === "custom"/);
    expect(body).toMatch(/return null/);
  });
});
