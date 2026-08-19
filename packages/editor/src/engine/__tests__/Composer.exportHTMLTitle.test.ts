/**
 * The preview document's <title>.
 *
 * `Composer.exportHTML` is the third head this codebase assembles — after the
 * single-file export and the publish pipeline — and it is the one behind Quick
 * preview, the preview modal, the client view and the "copy page HTML"
 * command. Both of the others resolve the page's own title; this one stamped
 * the literal "Buildrick Export" on every page, so a preview tab and any HTML
 * copied out of the editor carried our brand name as the page's title.
 * Observed in the running editor before the fix.
 *
 * @license BSD-3-Clause
 */

import { describe, it, expect } from "vitest";
import { Composer } from "../Composer";

function composerWithPage(page: unknown): Composer {
  const c = Object.create(Composer.prototype) as Composer;
  Object.assign(c, {
    elements: { toHTML: () => "<div>hi</div>", getActivePage: () => page },
    styles: { toCSS: () => "" },
    getProjectSettings: () => ({}),
  });
  return c;
}

const titleOf = (html: string) => html.match(/<title>([^<]*)<\/title>/)?.[1] ?? null;

describe("Composer.exportHTML title", () => {
  it("uses the page's SEO meta title first", () => {
    const html = composerWithPage({
      name: "Home",
      settings: { title: "Tab title", seo: { metaTitle: "Bella Cucina — Bookings" } },
    }).exportHTML().combined;
    expect(titleOf(html)).toBe("Bella Cucina — Bookings");
  });

  it("falls back to the page settings title, then the page name", () => {
    expect(
      titleOf(composerWithPage({ name: "Home", settings: { title: "Tab title" } }).exportHTML().combined)
    ).toBe("Tab title");
    expect(titleOf(composerWithPage({ name: "Contact" }).exportHTML().combined)).toBe("Contact");
  });

  it("never stamps the product name on a customer's page", () => {
    const html = composerWithPage({ name: "Pricing" }).exportHTML().combined;
    expect(html).not.toMatch(/Buildrick Export/);
  });

  it("escapes a title that carries markup", () => {
    const html = composerWithPage({ name: "a <b> & c" }).exportHTML().combined;
    expect(titleOf(html)).toBe("a &lt;b&gt; &amp; c");
  });
});
