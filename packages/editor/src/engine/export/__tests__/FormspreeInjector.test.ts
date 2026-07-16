/**
 * FormspreeInjector — form action rewriting + hidden-field injection for
 * exported HTML.
 *
 * @license BSD-3-Clause
 */

import { describe, it, expect } from "vitest";
import { FormspreeInjector } from "../FormspreeInjector";

const injector = new FormspreeInjector();

describe("FormspreeInjector.getFormAction", () => {
  it("returns null without settings", () => {
    expect(injector.getFormAction(undefined)).toBeNull();
  });

  it("builds the Formspree endpoint from the form ID", () => {
    expect(injector.getFormAction({ provider: "formspree", formId: "xyzabc123" })).toBe(
      "https://formspree.io/f/xyzabc123"
    );
  });

  it("returns null for formspree provider without a formId", () => {
    expect(injector.getFormAction({ provider: "formspree" })).toBeNull();
    // actionUrl alone doesn't count for the formspree provider.
    expect(
      injector.getFormAction({ provider: "formspree", actionUrl: "https://x.example/submit" })
    ).toBeNull();
  });

  it("returns the custom actionUrl for the custom provider", () => {
    expect(
      injector.getFormAction({ provider: "custom", actionUrl: "https://api.acme.com/contact" })
    ).toBe("https://api.acme.com/contact");
  });

  it("returns null for custom provider without an actionUrl", () => {
    expect(injector.getFormAction({ provider: "custom" })).toBeNull();
  });
});

describe("FormspreeInjector.getHiddenFields", () => {
  it("returns '' without settings or for non-formspree providers", () => {
    expect(injector.getHiddenFields(undefined)).toBe("");
    expect(
      injector.getHiddenFields({
        provider: "custom",
        actionUrl: "https://x.example",
        successRedirect: "/thanks",
      })
    ).toBe("");
  });

  it("returns '' for formspree with no redirect/subject configured", () => {
    expect(injector.getHiddenFields({ provider: "formspree", formId: "abc" })).toBe("");
  });

  it("emits _next for successRedirect", () => {
    expect(
      injector.getHiddenFields({ provider: "formspree", formId: "abc", successRedirect: "/thanks" })
    ).toBe('<input type="hidden" name="_next" value="/thanks">');
  });

  it("emits _subject for emailSubject", () => {
    expect(
      injector.getHiddenFields({ provider: "formspree", formId: "abc", emailSubject: "New lead" })
    ).toBe('<input type="hidden" name="_subject" value="New lead">');
  });

  it("emits both fields newline-joined, _next first", () => {
    const out = injector.getHiddenFields({
      provider: "formspree",
      formId: "abc",
      successRedirect: "/thanks",
      emailSubject: "New lead",
    });
    expect(out).toBe(
      '<input type="hidden" name="_next" value="/thanks">\n' +
        '<input type="hidden" name="_subject" value="New lead">'
    );
  });

  it("HTML-escapes field values (no attribute breakout)", () => {
    const out = injector.getHiddenFields({
      provider: "formspree",
      formId: "abc",
      emailSubject: `A & B "quoted" <tag> 'x'`,
    });
    expect(out).toContain('value="A &amp; B &quot;quoted&quot; &lt;tag&gt; &#039;x&#039;"');
    expect(out).not.toContain('value="A & B');
  });
});

describe("FormspreeInjector.processHTML", () => {
  it("rewrites the matching form's action and forces method POST", () => {
    const html = '<form id="contact-form" class="cta"><input name="email"></form>';
    const out = injector.processHTML(html, [
      { id: "contact-form", formSettings: { provider: "formspree", formId: "xyzabc123" } },
    ]);
    expect(out).toContain(
      '<form id="contact-form" class="cta" action="https://formspree.io/f/xyzabc123" method="POST">'
    );
  });

  it("strips pre-existing action and method attributes before rewriting", () => {
    const html = '<form action="/old" method="GET" id="f1"></form>';
    const out = injector.processHTML(html, [
      { id: "f1", formSettings: { provider: "formspree", formId: "newid" } },
    ]);
    expect(out).not.toContain('action="/old"');
    expect(out).not.toContain('method="GET"');
    expect(out).toContain('action="https://formspree.io/f/newid" method="POST"');
  });

  it("injects hidden fields right after the form opening tag", () => {
    const html = '<form id="f1"><input name="email"></form>';
    const out = injector.processHTML(html, [
      {
        id: "f1",
        formSettings: { provider: "formspree", formId: "abc", successRedirect: "/thanks" },
      },
    ]);
    expect(out).toContain(
      'method="POST">\n<input type="hidden" name="_next" value="/thanks"><input name="email">'
    );
  });

  it("leaves forms without settings or without a resolvable action untouched", () => {
    const html = '<form id="f1" action="/keep"></form>';
    expect(injector.processHTML(html, [{ id: "f1" }])).toBe(html);
    expect(
      injector.processHTML(html, [{ id: "f1", formSettings: { provider: "formspree" } }])
    ).toBe(html);
  });

  it("leaves non-matching form IDs untouched", () => {
    const html = '<form id="other" action="/keep"></form>';
    const out = injector.processHTML(html, [
      { id: "f1", formSettings: { provider: "formspree", formId: "abc" } },
    ]);
    expect(out).toBe(html);
  });

  it("processes multiple forms independently", () => {
    const html = '<form id="a"></form><section><form id="b"></form></section>';
    const out = injector.processHTML(html, [
      { id: "a", formSettings: { provider: "formspree", formId: "aaa111bbb" } },
      { id: "b", formSettings: { provider: "custom", actionUrl: "https://api.x/y" } },
    ]);
    expect(out).toContain('<form id="a" action="https://formspree.io/f/aaa111bbb" method="POST">');
    expect(out).toContain('<form id="b" action="https://api.x/y" method="POST">');
  });

  it("matches single-quoted id attributes and mixed-case <FORM> tags", () => {
    const html = "<FORM id='f1'></FORM>";
    const out = injector.processHTML(html, [
      { id: "f1", formSettings: { provider: "formspree", formId: "abc" } },
    ]);
    expect(out).toContain('action="https://formspree.io/f/abc" method="POST"');
  });

  it.todo(
    "BUG: form.id is interpolated into a RegExp without escaping — an id containing " +
      "regex metacharacters (e.g. 'form.1', 'f+1') builds a pattern that can over-match " +
      "or throw. processHTML should escape the id before `new RegExp(...)`."
  );
});

describe("FormspreeInjector.getFormAttributes", () => {
  it("returns action + method POST when resolvable", () => {
    expect(
      injector.getFormAttributes({ provider: "formspree", formId: "xyzabc123" })
    ).toEqual({ action: "https://formspree.io/f/xyzabc123", method: "POST" });
  });

  it("returns an empty object when no action resolves", () => {
    expect(injector.getFormAttributes(undefined)).toEqual({});
    expect(injector.getFormAttributes({ provider: "custom" })).toEqual({});
  });
});
