/**
 * BK-44 on the publish writer (`exportAllPages` → renderPageElement): a radio
 * or checkbox with no value of its own submits its label's text, never the
 * browser's "on"; a value the user set wins.
 *
 * @license BSD-3-Clause
 */
import { describe, expect, it, vi } from "vitest";
import { ExportEngine } from "../ExportEngine";

const choice = (id: string, label: string, extra: Record<string, string> = {}) => ({
  id,
  type: "radio",
  tagName: "label",
  children: [
    { id: `${id}-in`, type: "input", tagName: "input", attributes: { type: "radio", name: "size", ...extra }, children: [] },
    { id: `${id}-t`, type: "text", tagName: "span", content: label, contentFormat: "text", children: [] },
  ],
});

async function publish(children: unknown[]): Promise<Document> {
  const pages = [{ id: "p1", name: "Home", slug: "home", isHome: true, root: { id: "r1", type: "container", tagName: "div", children } }];
  const composer = {
    elements: { exportPages: vi.fn().mockReturnValue(pages) },
    styles: { generateResponsiveCSS: vi.fn().mockReturnValue(""), generateCSS: vi.fn().mockReturnValue("") },
    getProjectSettings: vi.fn().mockReturnValue(undefined),
  } as unknown as ConstructorParameters<typeof ExportEngine>[0];
  const { files } = await new ExportEngine(composer).exportAllPages({ format: "html" });
  return new DOMParser().parseFromString(files.find((f) => f.name === "index.html")!.content, "text/html");
}

describe("published choices carry a value (BK-44)", () => {
  it("label text by default, the user's value when set, and nothing on other inputs", async () => {
    const doc = await publish([
      choice("r1", "Small"),
      choice("r2", "Tom & Jerry"),
      choice("r3", "Large", { value: "lg" }),
      { id: "t", type: "input", tagName: "input", attributes: { type: "text", name: "note" }, children: [] },
    ]);
    const values = [...doc.querySelectorAll<HTMLInputElement>('input[type="radio"]')].map((i) => i.getAttribute("value"));
    expect(values).toEqual(["Small", "Tom & Jerry", "lg"]);
    expect(doc.querySelector('input[name="note"]')!.hasAttribute("value")).toBe(false);
  });
});
