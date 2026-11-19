import { describe, it, expect } from "vitest";
import { analyzeReadability } from "../readability";
import type { SeoDocument } from "../document";

const para = (id: string, text: string, extra = {}) => ({ elementId: id, kind: "paragraph" as const, text, ...extra });
const doc = (blocks: SeoDocument["blocks"], locale = "en"): SeoDocument => ({
  title: "T", titleSource: "page-name", description: "", slugFile: "a.html", locale, noIndex: false, blocks,
});
const easy = "We bake bread every day. The oven is hot by six. You can buy a loaf at the door. Our team makes soup too. Come and eat with us. Bring a friend along. The coffee is fresh. Kids eat for free on Sunday. We close at nine.";
const ids = (r: ReturnType<typeof analyzeReadability>) => r.findings.map((x) => x.id);

describe("analyzeReadability", () => {
  it("evaluates an English page fully", () => {
    const r = analyzeReadability(doc([para("p", easy), para("q", easy)]));
    expect(r.evaluated).toBe(true);
    expect(ids(r)).toEqual(expect.arrayContaining(["sentence-length", "paragraph-length", "consecutive-starts", "passive-voice", "transition-words", "flesch"]));
    expect(r.findings.find((x) => x.id === "flesch")?.rating).toBe("good");
  });

  it("French is Not evaluated for the language checks, neutral ones still run", () => {
    const r = analyzeReadability(doc([para("p", easy), para("q", easy)], "fr"));
    expect(r).toMatchObject({ evaluated: false, reason: "language" });
    expect(ids(r)).toEqual(expect.arrayContaining(["sentence-length", "paragraph-length", "consecutive-starts"]));
    expect(ids(r)).not.toContain("flesch");
    expect(ids(r)).not.toContain("passive-voice");
  });

  it("fewer than 50 words is empty", () => {
    expect(analyzeReadability(doc([para("p", "Just a few words here.")]))).toEqual({ evaluated: false, reason: "empty", findings: [] });
  });

  it("all text from CMS bindings is a template page", () => {
    expect(analyzeReadability(doc([para("p", easy, { cmsBound: true })])).reason).toBe("cms-template");
  });

  it("flags heavy passive voice", () => {
    const passive = "The bread was baked by the team. The soup was made in the morning. The tables were cleaned at noon. The orders were taken by Sam. The floor was swept. We open early. Guests are welcome. The menu changes often. Staff were trained well. The kitchen is busy.";
    const r = analyzeReadability(doc([para("p", passive), para("q", easy)]));
    expect(r.findings.find((x) => x.id === "passive-voice")?.rating).not.toBe("good");
  });
});
