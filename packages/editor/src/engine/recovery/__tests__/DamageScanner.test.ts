/**
 * DamageScanner (E-T9, CEO D5/D9): a fixture with each damage type. Only the
 * unambiguous one is repaired; escaped text is offered, never rewritten; a
 * literal "&amp;" in plain text that nothing changes is untouched.
 */
import { describe, it, expect, beforeAll, afterAll } from "vitest";
import type { ProjectData } from "@shared/types";
import { applyDamageRepairs, applyEscapedTextFix, scanDamage, unescapeOnce } from "../DamageScanner";
import { createTestComposer, installEngineBrowserStubs, removeEngineBrowserStubs } from "@/engine/__tests__/test-utils/realComposer";
import { elementSelector } from "@/shared/utils/elementSelector";

beforeAll(installEngineBrowserStubs);
afterAll(removeEngineBrowserStubs);

const fixture = (): ProjectData =>
  ({
    pages: [
      {
        id: "p1",
        name: "Home",
        slug: "",
        root: {
          id: "root",
          type: "container",
          tagName: "div",
          children: [
            { id: "nan", type: "container", tagName: "div", styles: { width: "NaNpx", color: "red" }, children: [] },
            { id: "esc", type: "heading", tagName: "h2", content: "Tom &amp;amp; Jerry &lt;strong&gt;go&lt;/strong&gt;", children: [] },
            { id: "code", type: "text", tagName: "p", content: "Use &amp; in HTML", children: [] },
            { id: "plain", type: "text", tagName: "p", content: "Q&A", contentFormat: "text", children: [] },
            { id: "src", type: "heading", tagName: "h2", content: "Same", styles: { "font-size": "24px" }, children: [] },
            { id: "copy", type: "heading", tagName: "h2", content: "Same", styles: { "font-size": "24px" }, children: [] },
          ],
        },
      },
    ],
    styles: [
      { id: "r1", selector: elementSelector("src"), properties: { "font-size": "32px" }, mediaQuery: "(max-width: 767px)" },
      { id: "r2", selector: elementSelector("nan"), properties: { height: "Infinitypx", gap: "8px" }, mediaQuery: "(max-width: 767px)" },
    ],
  }) as unknown as ProjectData;

describe("scanDamage", () => {
  it("finds each damage type and nothing else", () => {
    const r = scanDamage(fixture());
    expect(r.repairs.map((x) => [x.elementId, x.property, x.before])).toEqual([
      ["nan", "width", "NaNpx"],
      ["nan", "height", "Infinitypx"],
    ]);
    expect(r.candidates.map((c) => c.elementId)).toEqual(["esc"]);
    expect(r.candidates[0].after).toBe("Tom &amp; Jerry <strong>go</strong>");
    expect(r.unverified).toEqual([{ kind: "unverified-styles", elementId: "copy", pageId: "p1", matchId: "src" }]);
  });

  it("a single escaped '&amp;' in markup is how '&' is written — not a finding", () => {
    expect(scanDamage(fixture()).candidates.some((c) => c.elementId === "code")).toBe(false);
  });

  it("plain text: an entity written out is offered, decoded one level", () => {
    expect(unescapeOnce("Tom &amp; Jerry", "text")).toBe("Tom & Jerry");
    expect(unescapeOnce("Q&A", "text")).toBe("Q&A");
  });
});

describe("applying", () => {
  it("removes only the non-finite declarations, in one transaction, and leaves the rest", () => {
    const c = createTestComposer();
    c.importProject(fixture());
    c.history.flushPending();
    const { repairs } = scanDamage(c.exportProject());
    c.beginTransaction("Automatic repair");
    expect(applyDamageRepairs(c, repairs)).toBe(2);
    c.endTransaction();
    expect(c.elements.getElement("nan")!.getStyles()).toEqual({ color: "red" });
    expect(c.styles.getRule(elementSelector("nan"), "(max-width: 767px)")!.properties).toEqual({ gap: "8px" });
    expect(c.elements.getElement("esc")!.getContent()).toBe("Tom &amp;amp; Jerry &lt;strong&gt;go&lt;/strong&gt;");
    expect(c.elements.getElement("code")!.getContent()).toBe("Use &amp; in HTML");

    c.history.flushPending();
    c.history.undo();
    expect(c.elements.getElement("nan")!.getStyles()).toMatchObject({ width: "NaNpx" });
  });

  it("skips a value the user changed since the scan", () => {
    const c = createTestComposer();
    c.importProject(fixture());
    const { repairs } = scanDamage(c.exportProject());
    c.elements.getElement("nan")!.setStyle("width", "120px");
    expect(applyDamageRepairs(c, repairs.filter((r) => !r.where))).toBe(0);
    expect(c.elements.getElement("nan")!.getStyles().width).toBe("120px");
  });

  it("Fix on escaped text writes the decoded text; refuses if the text changed", () => {
    const c = createTestComposer();
    c.importProject(fixture());
    const [cand] = scanDamage(c.exportProject()).candidates;
    expect(applyEscapedTextFix(c, cand)).toBe(true);
    expect(c.elements.getElement("esc")!.getContent()).toBe("Tom &amp; Jerry <strong>go</strong>");
    expect(applyEscapedTextFix(c, cand)).toBe(false);
  });
});
