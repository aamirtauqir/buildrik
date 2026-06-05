/**
 * Unit 2 — in-canvas AI command emission. Tests the parse + validate core that
 * turns raw model output into safe, in-scope set-style commands. The exact-id
 * guard, property allow-list, value block-list, and JSON repair are the
 * security-critical surface.
 */
import { describe, it, expect } from "vitest";
import {
  extractValidEditCommands,
  extractValidPageEditCommands,
  extractValidPlan,
  buildEditCommandPrompt,
  buildPageEditCommandPrompt,
  buildPlanPrompt,
  assertProviderConfigured,
} from "@server/services/ai.service";

const EL = "el-1";

describe("assertProviderConfigured (W3 hosted-model guard)", () => {
  it("throws a clear error when the resolved provider has no key", () => {
    const savedA = process.env.ANTHROPIC_API_KEY;
    const savedO = process.env.OLLAMA_BASE_URL;
    delete process.env.ANTHROPIC_API_KEY;
    delete process.env.OLLAMA_BASE_URL;
    expect(() => assertProviderConfigured("claude-sonnet-4-6")).toThrow(/not configured/i);
    expect(() => assertProviderConfigured("ollama")).toThrow(/not configured/i);
    // Ollama configured → ok.
    process.env.OLLAMA_BASE_URL = "http://localhost:11434";
    expect(() => assertProviderConfigured("ollama")).not.toThrow();
    if (savedA === undefined) delete process.env.ANTHROPIC_API_KEY; else process.env.ANTHROPIC_API_KEY = savedA;
    if (savedO === undefined) delete process.env.OLLAMA_BASE_URL; else process.env.OLLAMA_BASE_URL = savedO;
  });
});

describe("extractValidPlan (P4 agent plan)", () => {
  const IDS = new Set(["a", "b"]);

  it("accepts a {steps:[...]} object with element + page scopes", () => {
    const raw = JSON.stringify({
      steps: [
        { title: "Style heading", scope: { kind: "element", id: "a" }, instruction: "make it bold" },
        { title: "Add pricing", scope: { kind: "page" }, instruction: "add a pricing section" },
      ],
    });
    const plan = extractValidPlan(raw, IDS);
    expect(plan).toHaveLength(2);
    expect(plan[0].scope).toEqual({ kind: "element", id: "a" });
    expect(plan[1].scope).toEqual({ kind: "page" });
  });

  it("accepts a bare array and strips ```json fences", () => {
    const raw = '```json\n[{"title":"x","scope":{"kind":"page"},"instruction":"do x"}]\n```';
    expect(extractValidPlan(raw, IDS)).toHaveLength(1);
  });

  it("drops steps with an unknown element id, markup, or missing fields", () => {
    const raw = JSON.stringify({
      steps: [
        { title: "ok", scope: { kind: "element", id: "ghost" }, instruction: "x" },
        { title: "<b>bad</b>", scope: { kind: "page" }, instruction: "x" },
        { title: "no instruction", scope: { kind: "page" } },
        { title: "good", scope: { kind: "element", id: "b" }, instruction: "tweak" },
      ],
    });
    const plan = extractValidPlan(raw, IDS);
    expect(plan).toHaveLength(1);
    expect(plan[0].title).toBe("good");
  });

  it("caps the plan at 8 steps and returns [] on garbage", () => {
    const many = { steps: Array.from({ length: 20 }, (_, i) => ({ title: `s${i}`, scope: { kind: "page" }, instruction: "x" })) };
    expect(extractValidPlan(JSON.stringify(many), IDS)).toHaveLength(8);
    expect(extractValidPlan("not json", IDS)).toEqual([]);
    expect(extractValidPlan(JSON.stringify({ steps: [] }), IDS)).toEqual([]);
  });

  it("buildPlanPrompt lists element ids + fences the request", () => {
    const p = buildPlanPrompt([{ id: "a", type: "heading" }], "build a landing page");
    expect(p).toContain('id="a"');
    expect(p).toContain("<request>build a landing page</request>");
    expect(p).toContain('"steps"');
  });
});

describe("page-scope (multi-element) extraction", () => {
  const ALLOWED = new Set(["a", "b", "c"]);

  it("accepts commands targeting any id on the page", () => {
    const raw = JSON.stringify([
      { commandId: "set-style", args: { elementId: "a", property: "color", value: "#111" } },
      { commandId: "set-text", args: { elementId: "b", text: "Hello" } },
      { commandId: "set-style", args: { elementId: "c", property: "font-size", value: "20px" } },
    ]);
    expect(extractValidPageEditCommands(raw, ALLOWED)).toHaveLength(3);
  });

  it("drops commands targeting an id NOT on the page (no invented ids)", () => {
    const raw = JSON.stringify([
      { commandId: "set-style", args: { elementId: "a", property: "color", value: "#111" } },
      { commandId: "set-style", args: { elementId: "ghost", property: "color", value: "#222" } },
    ]);
    const r = extractValidPageEditCommands(raw, ALLOWED);
    expect(r).toHaveLength(1);
    expect(r[0].commandId).toBe("set-style");
    if (r[0].commandId === "set-style") expect(r[0].args.elementId).toBe("a");
  });

  it("buildPageEditCommandPrompt lists element ids + fences the request", () => {
    const p = buildPageEditCommandPrompt(
      [{ id: "a", type: "heading", text: "Hi" }, { id: "b", type: "button" }],
      "make headings bigger",
    );
    expect(p).toContain('id="a"');
    expect(p).toContain('id="b"');
    expect(p).toContain("<request>make headings bigger</request>");
  });
});

describe("buildEditCommandPrompt (agent-callable registry)", () => {
  it("includes every agent-callable command rule + the scoped element id", () => {
    const p = buildEditCommandPrompt(EL, "do something");
    for (const id of [
      "set-style", "set-text", "add-element", "delete-element",
      "duplicate-element", "move-element", "set-style-variant",
      "set-attribute", "add-section",
    ]) {
      expect(p).toContain(id);
    }
    expect(p).toContain(EL);
    // The user prompt is fenced as data, never instructions.
    expect(p).toContain("<request>do something</request>");
  });
});

describe("extractValidEditCommands", () => {
  it("parses a clean JSON array of valid commands", () => {
    const raw = JSON.stringify([
      { commandId: "set-style", args: { elementId: EL, property: "color", value: "#000000" } },
    ]);
    const r = extractValidEditCommands(raw, EL);
    expect(r).toHaveLength(1);
    expect(r[0].args).toEqual({ elementId: EL, property: "color", value: "#000000" });
  });

  it("strips markdown ```json fences", () => {
    const raw =
      '```json\n[{"commandId":"set-style","args":{"elementId":"el-1","property":"padding","value":"24px"}}]\n```';
    expect(extractValidEditCommands(raw, EL)).toHaveLength(1);
  });

  it("repairs prose-wrapped JSON (extracts the first array)", () => {
    const raw =
      'Sure! Here you go:\n[{"commandId":"set-style","args":{"elementId":"el-1","property":"font-size","value":"32px"}}]\nHope that helps.';
    expect(extractValidEditCommands(raw, EL)).toHaveLength(1);
  });

  it("drops commands targeting a different element (exact-id scope guard)", () => {
    const raw = JSON.stringify([
      { commandId: "set-style", args: { elementId: "other-el", property: "color", value: "#fff" } },
    ]);
    expect(extractValidEditCommands(raw, EL)).toHaveLength(0);
  });

  it("drops a property outside the allow-list (e.g. pseudo-state)", () => {
    const raw = JSON.stringify([
      { commandId: "set-style", args: { elementId: EL, property: "color:hover", value: "#f00" } },
    ]);
    expect(extractValidEditCommands(raw, EL)).toHaveLength(0);
  });

  it.each([
    "url(javascript:alert(1))",
    "expression(alert(1))",
    "url(data:text/html,x)",
  ])("drops an unsafe value: %s", (value) => {
    const raw = JSON.stringify([
      { commandId: "set-style", args: { elementId: EL, property: "background", value } },
    ]);
    expect(extractValidEditCommands(raw, EL)).toHaveLength(0);
  });

  it("returns [] for malformed / non-JSON output", () => {
    expect(extractValidEditCommands("not json at all", EL)).toEqual([]);
  });

  it("returns [] when the model returns a JSON object instead of an array", () => {
    expect(extractValidEditCommands('{"foo":"bar"}', EL)).toEqual([]);
  });

  it("keeps only the valid entries from a mixed batch", () => {
    const raw = JSON.stringify([
      { commandId: "set-style", args: { elementId: EL, property: "color", value: "#111" } },
      { commandId: "set-style", args: { elementId: "evil", property: "color", value: "#222" } },
      { commandId: "remove-element", args: { elementId: EL } },
      { commandId: "set-style", args: { elementId: EL, property: "border-radius", value: "8px" } },
    ]);
    const r = extractValidEditCommands(raw, EL);
    expect(r).toHaveLength(2);
    expect(r.map((c) => (c.commandId === "set-style" ? c.args.property : "?"))).toEqual([
      "color",
      "border-radius",
    ]);
  });

  it("accepts a valid set-text command", () => {
    const raw = JSON.stringify([
      { commandId: "set-text", args: { elementId: EL, text: "Welcome to Buildrik" } },
    ]);
    const r = extractValidEditCommands(raw, EL);
    expect(r).toHaveLength(1);
    expect(r[0]).toEqual({ commandId: "set-text", args: { elementId: EL, text: "Welcome to Buildrik" } });
  });

  it("drops set-text containing markup (angle brackets)", () => {
    const raw = JSON.stringify([
      { commandId: "set-text", args: { elementId: EL, text: "<script>alert(1)</script>" } },
    ]);
    expect(extractValidEditCommands(raw, EL)).toHaveLength(0);
  });

  it("drops empty set-text", () => {
    const raw = JSON.stringify([
      { commandId: "set-text", args: { elementId: EL, text: "" } },
    ]);
    expect(extractValidEditCommands(raw, EL)).toHaveLength(0);
  });

  it("handles a mixed style + text batch", () => {
    const raw = JSON.stringify([
      { commandId: "set-style", args: { elementId: EL, property: "color", value: "#fff" } },
      { commandId: "set-text", args: { elementId: EL, text: "Hello" } },
    ]);
    const r = extractValidEditCommands(raw, EL);
    expect(r).toHaveLength(2);
    expect(r.map((c) => c.commandId)).toEqual(["set-style", "set-text"]);
  });

  it("accepts a valid add-element command with text", () => {
    const raw = JSON.stringify([
      { commandId: "add-element", args: { elementId: EL, elementType: "button", text: "Buy now" } },
    ]);
    const r = extractValidEditCommands(raw, EL);
    expect(r).toHaveLength(1);
    expect(r[0]).toEqual({
      commandId: "add-element",
      args: { elementId: EL, elementType: "button", text: "Buy now" },
    });
  });

  it("accepts add-element without text (e.g. a container)", () => {
    const raw = JSON.stringify([
      { commandId: "add-element", args: { elementId: EL, elementType: "container" } },
    ]);
    expect(extractValidEditCommands(raw, EL)).toHaveLength(1);
  });

  it("drops add-element with a non-allow-listed type", () => {
    const raw = JSON.stringify([
      { commandId: "add-element", args: { elementId: EL, elementType: "image" } },
      { commandId: "add-element", args: { elementId: EL, elementType: "script" } },
    ]);
    expect(extractValidEditCommands(raw, EL)).toHaveLength(0);
  });

  it("drops add-element whose text contains markup", () => {
    const raw = JSON.stringify([
      { commandId: "add-element", args: { elementId: EL, elementType: "heading", text: "<img src=x>" } },
    ]);
    expect(extractValidEditCommands(raw, EL)).toHaveLength(0);
  });

  it("accepts delete-element and duplicate-element for the scoped id", () => {
    const raw = JSON.stringify([
      { commandId: "delete-element", args: { elementId: EL } },
      { commandId: "duplicate-element", args: { elementId: EL } },
    ]);
    const r = extractValidEditCommands(raw, EL);
    expect(r.map((c) => c.commandId)).toEqual(["delete-element", "duplicate-element"]);
  });

  it("drops delete-element targeting a different element (exact-id guard)", () => {
    const raw = JSON.stringify([
      { commandId: "delete-element", args: { elementId: "other" } },
    ]);
    expect(extractValidEditCommands(raw, EL)).toHaveLength(0);
  });

  it("accepts move-element up/down", () => {
    const raw = JSON.stringify([
      { commandId: "move-element", args: { elementId: EL, direction: "up" } },
      { commandId: "move-element", args: { elementId: EL, direction: "down" } },
    ]);
    expect(extractValidEditCommands(raw, EL)).toHaveLength(2);
  });

  it("drops move-element with an invalid direction", () => {
    const raw = JSON.stringify([
      { commandId: "move-element", args: { elementId: EL, direction: "left" } },
    ]);
    expect(extractValidEditCommands(raw, EL)).toHaveLength(0);
  });

  it("accepts add-section with valid children", () => {
    const raw = JSON.stringify([
      {
        commandId: "add-section",
        args: {
          elementId: EL,
          sectionType: "section",
          children: [
            { elementType: "heading", text: "Pricing" },
            { elementType: "button", text: "Buy" },
          ],
        },
      },
    ]);
    const r = extractValidEditCommands(raw, EL);
    expect(r).toHaveLength(1);
    expect(r[0].commandId).toBe("add-section");
  });

  it("drops add-section with a non-container sectionType", () => {
    const raw = JSON.stringify([
      { commandId: "add-section", args: { elementId: EL, sectionType: "button", children: [{ elementType: "text" }] } },
    ]);
    expect(extractValidEditCommands(raw, EL)).toHaveLength(0);
  });

  it("drops add-section with a bad child type or markup", () => {
    const badType = JSON.stringify([
      { commandId: "add-section", args: { elementId: EL, sectionType: "section", children: [{ elementType: "image" }] } },
    ]);
    const markup = JSON.stringify([
      { commandId: "add-section", args: { elementId: EL, sectionType: "section", children: [{ elementType: "heading", text: "<b>x</b>" }] } },
    ]);
    expect(extractValidEditCommands(badType, EL)).toHaveLength(0);
    expect(extractValidEditCommands(markup, EL)).toHaveLength(0);
  });

  it("drops add-section with empty children", () => {
    const raw = JSON.stringify([
      { commandId: "add-section", args: { elementId: EL, sectionType: "section", children: [] } },
    ]);
    expect(extractValidEditCommands(raw, EL)).toHaveLength(0);
  });

  it("accepts set-style-variant with a pseudo state, a breakpoint, or both", () => {
    const raw = JSON.stringify([
      { commandId: "set-style-variant", args: { elementId: EL, property: "color", value: "#00f", pseudo: "hover" } },
      { commandId: "set-style-variant", args: { elementId: EL, property: "display", value: "block", breakpoint: "mobile" } },
      { commandId: "set-style-variant", args: { elementId: EL, property: "gap", value: "8px", pseudo: "focus", breakpoint: "tablet" } },
    ]);
    expect(extractValidEditCommands(raw, EL)).toHaveLength(3);
  });

  it("rejects set-style-variant with neither pseudo nor breakpoint, or invalid ones", () => {
    const none = JSON.stringify([
      { commandId: "set-style-variant", args: { elementId: EL, property: "color", value: "#000" } },
    ]);
    const badPseudo = JSON.stringify([
      { commandId: "set-style-variant", args: { elementId: EL, property: "color", value: "#000", pseudo: "evil" } },
    ]);
    const badBp = JSON.stringify([
      { commandId: "set-style-variant", args: { elementId: EL, property: "color", value: "#000", breakpoint: "watch" } },
    ]);
    const badProp = JSON.stringify([
      { commandId: "set-style-variant", args: { elementId: EL, property: "content", value: "x", pseudo: "hover" } },
    ]);
    expect(extractValidEditCommands(none, EL)).toHaveLength(0);
    expect(extractValidEditCommands(badPseudo, EL)).toHaveLength(0);
    expect(extractValidEditCommands(badBp, EL)).toHaveLength(0);
    expect(extractValidEditCommands(badProp, EL)).toHaveLength(0);
  });

  it("accepts set-page-setting WITHOUT an elementId (config command bypasses the scope guard)", () => {
    const raw = JSON.stringify([
      { commandId: "set-page-setting", args: { setting: "metaTitle", value: "Pricing — Acme" } },
      { commandId: "set-page-setting", args: { setting: "metaDescription", value: "Plans and pricing for Acme." } },
    ]);
    // EL is the allowed element id; these commands have no elementId yet still validate.
    expect(extractValidEditCommands(raw, EL)).toHaveLength(2);
  });

  it("rejects set-page-setting with bad setting, over-length, or markup", () => {
    const bad = JSON.stringify([{ commandId: "set-page-setting", args: { setting: "slug", value: "x" } }]);
    const longTitle = JSON.stringify([{ commandId: "set-page-setting", args: { setting: "metaTitle", value: "x".repeat(61) } }]);
    const markup = JSON.stringify([{ commandId: "set-page-setting", args: { setting: "metaDescription", value: "<script>" } }]);
    expect(extractValidEditCommands(bad, EL)).toHaveLength(0);
    expect(extractValidEditCommands(longTitle, EL)).toHaveLength(0);
    expect(extractValidEditCommands(markup, EL)).toHaveLength(0);
  });

  it("accepts insert-component shape (id validated editor-side), rejects empty/oversized id", () => {
    const ok = JSON.stringify([{ commandId: "insert-component", args: { elementId: EL, componentId: "card" } }]);
    expect(extractValidEditCommands(ok, EL)).toHaveLength(1);
    const empty = JSON.stringify([{ commandId: "insert-component", args: { elementId: EL, componentId: "" } }]);
    const huge = JSON.stringify([{ commandId: "insert-component", args: { elementId: EL, componentId: "x".repeat(101) } }]);
    expect(extractValidEditCommands(empty, EL)).toHaveLength(0);
    expect(extractValidEditCommands(huge, EL)).toHaveLength(0);
  });

  it("accepts expanded layout/position/typography style properties", () => {
    const raw = JSON.stringify([
      { commandId: "set-style", args: { elementId: EL, property: "justify-content", value: "space-between" } },
      { commandId: "set-style", args: { elementId: EL, property: "position", value: "absolute" } },
      { commandId: "set-style", args: { elementId: EL, property: "grid-template-columns", value: "1fr 1fr" } },
      { commandId: "set-style", args: { elementId: EL, property: "text-transform", value: "uppercase" } },
    ]);
    expect(extractValidEditCommands(raw, EL)).toHaveLength(4);
  });

  it("still rejects url()-bearing values on the new properties", () => {
    const raw = JSON.stringify([
      { commandId: "set-style", args: { elementId: EL, property: "filter", value: "url(#evil)" } },
    ]);
    expect(extractValidEditCommands(raw, EL)).toHaveLength(0);
  });

  it("accepts set-attribute for href / alt / target", () => {
    const raw = JSON.stringify([
      { commandId: "set-attribute", args: { elementId: EL, attribute: "href", value: "https://buildrik.com" } },
      { commandId: "set-attribute", args: { elementId: EL, attribute: "alt", value: "Team photo" } },
      { commandId: "set-attribute", args: { elementId: EL, attribute: "target", value: "_blank" } },
    ]);
    expect(extractValidEditCommands(raw, EL)).toHaveLength(3);
  });

  it("accepts set-attribute src with http(s)/relative, rejects data:/blob:/js + url-breakers", () => {
    for (const value of ["https://cdn.x.com/a.png", "/assets/logo.svg", "images/hero.jpg"]) {
      const raw = JSON.stringify([{ commandId: "set-attribute", args: { elementId: EL, attribute: "src", value } }]);
      expect(extractValidEditCommands(raw, EL)).toHaveLength(1);
    }
    for (const value of ["data:image/png;base64,xxx", "blob:http://x", "javascript:alert(1)", 'https://x.com/a.png")', "x'onload"]) {
      const raw = JSON.stringify([{ commandId: "set-attribute", args: { elementId: EL, attribute: "src", value } }]);
      expect(extractValidEditCommands(raw, EL)).toHaveLength(0);
    }
  });

  it("rejects set-attribute href with a javascript:/data: URI", () => {
    for (const value of ["javascript:alert(1)", " JavaScript:x", "data:text/html,x", "vbscript:x"]) {
      const raw = JSON.stringify([
        { commandId: "set-attribute", args: { elementId: EL, attribute: "href", value } },
      ]);
      expect(extractValidEditCommands(raw, EL)).toHaveLength(0);
    }
  });

  it("rejects set-attribute with a disallowed attribute or bad target", () => {
    const onclick = JSON.stringify([
      { commandId: "set-attribute", args: { elementId: EL, attribute: "onclick", value: "x()" } },
    ]);
    const badTarget = JSON.stringify([
      { commandId: "set-attribute", args: { elementId: EL, attribute: "target", value: "_evil" } },
    ]);
    const markupAlt = JSON.stringify([
      { commandId: "set-attribute", args: { elementId: EL, attribute: "alt", value: "<img onerror=x>" } },
    ]);
    expect(extractValidEditCommands(onclick, EL)).toHaveLength(0);
    expect(extractValidEditCommands(badTarget, EL)).toHaveLength(0);
    expect(extractValidEditCommands(markupAlt, EL)).toHaveLength(0);
  });
});
