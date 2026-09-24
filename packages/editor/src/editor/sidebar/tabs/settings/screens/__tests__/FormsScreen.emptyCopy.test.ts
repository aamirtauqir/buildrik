/**
 * The Forms inbox empty state. It once promised that dropping a Form block
 * "starts collecting submissions" (false: nothing listed until publish), then
 * said submissions were "not captured yet" (false since a10f19233: publish
 * points every action-less form at /api/public/forms/<siteId>/<elementId> and
 * creates the FormBlock row this screen lists — root lib/publish-forms.ts).
 * The editor's own exporter still sets an action only for Formspree / a
 * custom URL; the publish step supplies the default.
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

  it("says a published Form block is what fills the inbox", () => {
    expect(rendered).toMatch(/Publish a page with a Form block/);
    expect(rendered).not.toMatch(/not captured yet/i);
  });

  it("matches the exporter: an action only exists for formspree or a custom URL", () => {
    const fn = injector.slice(injector.indexOf("getFormAction"));
    const body = fn.slice(0, fn.indexOf("getHiddenFields"));
    expect(body).toMatch(/provider === "formspree"/);
    expect(body).toMatch(/provider === "custom"/);
    expect(body).toMatch(/return null/);
  });
});
