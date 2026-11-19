import { describe, it, expect } from "vitest";
import type { Composer } from "@/engine";
import { extractSeoDocument, seoContextFor } from "../extractSeoDocument";
import { analyzeSeo } from "@buildrik/shared/seo/analysis";

function composerWith(pages: unknown[], settings: Record<string, unknown> = {}, bound: string[] = []) {
  return {
    elements: { exportPages: () => pages },
    getProjectSettings: () => settings,
    cms: { bindings: { export: () => Object.fromEntries(bound.map((id) => [id, []])) } },
  } as unknown as Composer;
}

const home = {
  id: "home", name: "Home", slug: "home", isHome: true,
  settings: { seo: { focusKeyphrase: "pizza", noIndex: false } },
  root: { id: "r", type: "container", children: [
    { id: "h1", type: "heading", tagName: "h1", content: "Pizza at {{site.city}}" },
    { id: "i1", type: "image", attributes: { src: "a.png", alt: "Oven" } },
    { id: "i2", type: "image", attributes: { src: "b.png" } },
    { id: "raw", type: "container", content: "<h2>Embedded</h2>", contentFormat: "html" },
  ] },
};
const about = { id: "about", name: "About", slug: "about", settings: {}, root: { id: "r2", type: "container", children: [] } };

describe("extractSeoDocument", () => {
  const c = composerWith([home, about], { seo: { metaTitle: "Bella — pizza", siteName: "Bella" }, siteVariables: [{ key: "city", value: "Lahore" }] }, ["h1"]);

  it("builds blocks in document order with site variables resolved and CMS-bound nodes marked", () => {
    const doc = extractSeoDocument(c, "home")!;
    expect(doc.blocks.map((b) => b.elementId)).toEqual(["h1", "i1", "i2", "raw", "raw"]);
    expect(doc.blocks[0]).toMatchObject({ text: "Pizza at Lahore", cmsBound: true, level: 1 });
    expect(doc.title).toBe("Bella — pizza");
    expect(doc.titleSource).toBe("home-default");
    expect(doc.slugFile).toBe("index.html");
    expect(doc.keyphrase).toBe("pizza");
  });

  it("never claims no issues for markup it could not see", () => {
    const findings = analyzeSeo(extractSeoDocument(c, "home")!, seoContextFor(c, "home"));
    expect(findings.find((f) => f.id === "unchecked-html")?.text).toBe("Some custom HTML wasn't checked.");
    expect(findings.find((f) => f.id === "image-alt")?.elementId).toBe("i2");
  });

  it("overlays the drawer's draft", () => {
    const doc = extractSeoDocument(c, "about", { seoTitle: "Our story", slug: "our-story", keyphrase: "", noIndex: true })!;
    expect(doc).toMatchObject({ title: "Our story", slugFile: "our-story.html", keyphrase: undefined, noIndex: true });
  });

  it("returns null for an unknown page", () => expect(extractSeoDocument(c, "nope")).toBeNull());

  it("the context lists the other live, indexable pages with their emitted titles", () => {
    expect(seoContextFor(c, "home").otherPages).toEqual([{ id: "about", name: "About", title: "About", keyphrase: undefined }]);
  });
});
