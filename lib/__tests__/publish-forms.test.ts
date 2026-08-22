/**
 * A published form used to post nowhere — see publish-forms.ts.
 */
import { describe, it, expect } from "vitest";
import { planFormWiring, wireForms } from "../publish-forms";

const opts = { siteId: "site-1", appOrigin: "https://app.buildrick.io", path: "contact.html" };

const FORM = `<form data-buildrick-id="f1" class="c">
  <input data-buildrick-id="e1" type="email" name="email" placeholder="Email">
  <textarea name="message"></textarea>
  <input type="checkbox" name="subscribe">
  <button type="submit">Send</button>
</form>`;

describe("wireForms", () => {
  it("points an actionless form at the public endpoint", () => {
    const { html, forms } = wireForms(FORM, opts);
    expect(html).toContain(
      'action="https://app.buildrick.io/api/public/forms/site-1/f1" method="POST"',
    );
    expect(forms).toHaveLength(1);
    expect(forms[0].blockId).toBe("f1");
  });

  it("reports the fields, skipping the submit and anything unnamed", () => {
    const { forms } = wireForms(FORM, opts);
    expect(forms[0].fields).toEqual([
      { name: "email", type: "email" },
      { name: "message", type: "textarea" },
      { name: "subscribe", type: "checkbox" },
    ]);
  });

  it("leaves a form the user already pointed somewhere", () => {
    const external = '<form id="f2" action="https://formspree.io/f/abc" method="POST"></form>';
    const { html, forms } = wireForms(external, opts);
    expect(html).toBe(external);
    expect(forms).toHaveLength(0);
  });

  it("handles a page with two forms, and one without an id", () => {
    const two = `${FORM}<form data-buildrick-id="f3"><input name="q"></form><form><input name="x"></form>`;
    const { forms, html } = wireForms(two, opts);
    expect(forms.map((f) => f.blockId)).toEqual(["f1", "f3"]);
    expect(html.match(/action="https:\/\/app\.buildrick\.io/g)).toHaveLength(2);
  });

  it("names a form after its label when it has one", () => {
    const labelled = '<form data-buildrick-id="f4" aria-label="Newsletter"><input name="e"></form>';
    expect(wireForms(labelled, opts).forms[0].name).toBe("Newsletter");
    expect(wireForms('<form data-buildrick-id="f5"></form>', opts).forms[0].name).toBe(
      "Form on contact.html",
    );
  });

  it("does not touch a page with no forms", () => {
    const page = "<html><body><p>no forms here</p></body></html>";
    expect(wireForms(page, opts)).toEqual({ html: page, forms: [] });
  });
});

describe("planFormWiring", () => {
  const pages = [{ path: "contact.html", html: FORM }];

  it("wires every page and lets the sweep run when the origin is known", () => {
    const plan = planFormWiring(pages, { siteId: "site-1", appOrigin: "https://app.buildrick.io" });
    expect(plan.error).toBeNull();
    expect(plan.deactivateMissing).toBe(true);
    expect(plan.forms.map((f) => f.blockId)).toEqual(["f1"]);
    expect(plan.pages[0]?.html).toContain('action="https://app.buildrick.io/api/public/forms/site-1/f1"');
  });

  it("refuses the deploy rather than shipping a form that posts nowhere", () => {
    const plan = planFormWiring(pages, { siteId: "site-1", appOrigin: "" });
    expect(plan.error).toMatch(/NEXT_PUBLIC_APP_URL/);
  });

  it("never sweeps rows off when wiring could not run", () => {
    const plan = planFormWiring(pages, { siteId: "site-1", appOrigin: "" });
    expect(plan.deactivateMissing).toBe(false);
    expect(plan.forms).toEqual([]);
  });

  it("lets a site with no forms publish without an origin", () => {
    const plan = planFormWiring([{ path: "index.html", html: "<p>hi</p>" }], {
      siteId: "site-1",
      appOrigin: "",
    });
    expect(plan.error).toBeNull();
    expect(plan.deactivateMissing).toBe(false);
  });

  it("ignores a form the owner already pointed elsewhere when deciding to refuse", () => {
    const plan = planFormWiring(
      [{ path: "c.html", html: '<form id="f2" action="https://formspree.io/x"></form>' }],
      { siteId: "site-1", appOrigin: "" },
    );
    expect(plan.error).toBeNull();
  });
});
