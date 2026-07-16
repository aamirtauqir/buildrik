/**
 * templateActions.applyTemplate — transaction wrapping contract.
 *
 * @license BSD-3-Clause
 */
import { describe, it, expect, vi } from "vitest";
import type { Composer } from "../../engine";
import { applyTemplate } from "../templateActions";
import type { Template } from "../TemplateLibrary";

function makeComposer(importImpl?: () => void) {
  const calls: string[] = [];
  const composer = {
    beginTransaction: vi.fn((label: string) => calls.push(`begin:${label}`)),
    endTransaction: vi.fn(() => calls.push("end")),
    elements: {
      importHTMLToActivePage: vi.fn((html: string) => {
        calls.push(`import:${html}`);
        importImpl?.();
      }),
    },
  };
  return { composer: composer as unknown as Composer, raw: composer, calls };
}

const template = (html: string): Template => ({
  id: "t1",
  name: "T",
  category: "Basic",
  thumbnail: "",
  html,
});

describe("applyTemplate", () => {
  it("wraps importHTMLToActivePage in a named transaction, in order", () => {
    const { composer, raw, calls } = makeComposer();
    applyTemplate(composer, template("<div>hi</div>"));

    expect(calls).toEqual(["begin:apply-template", "import:<div>hi</div>", "end"]);
    expect(raw.beginTransaction).toHaveBeenCalledWith("apply-template");
    expect(raw.elements.importHTMLToActivePage).toHaveBeenCalledWith("<div>hi</div>");
  });

  it("imports an empty string when template.html is empty/missing (blank template)", () => {
    const { composer, raw } = makeComposer();
    applyTemplate(composer, template(""));
    expect(raw.elements.importHTMLToActivePage).toHaveBeenCalledWith("");
  });

  it("still ends the transaction when the import throws (finally), and re-throws", () => {
    const { composer, raw } = makeComposer(() => {
      throw new Error("bad html");
    });
    expect(() => applyTemplate(composer, template("<div/>"))).toThrow("bad html");
    expect(raw.endTransaction).toHaveBeenCalledTimes(1);
  });
});
