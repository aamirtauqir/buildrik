/**
 * REA audit 2026-10-20 #24 (R4 P1-6, R3 P2-16): published forms.
 *
 * Every label on the Contact Form block shipped as a bare `<label>` beside an
 * input with no `id`, so nothing tied the two: a screen reader named each
 * field by its placeholder only, and clicking the label did not focus it.
 * A label that wraps its input is already associated and is left alone; one
 * that already names a field (`for`) keeps it; a field's own `id` is used.
 *
 * The inspector's Required switch writes `required=""` — that has to ship,
 * since an empty value is still the attribute.
 *
 * @license BSD-3-Clause
 */
import { describe, it, expect, beforeAll, vi } from "vitest";
import JSZip from "jszip";
import { Composer } from "@/engine/Composer";
import { ExportEngine } from "../ExportEngine";

beforeAll(() => {
  HTMLCanvasElement.prototype.getContext = (() => ({
    drawImage: () => {}, getImageData: () => ({ data: new Uint8ClampedArray() }),
    putImageData: () => {}, clearRect: () => {},
  })) as unknown as HTMLCanvasElement["getContext"];
  (globalThis as { indexedDB?: unknown }).indexedDB = { open: () => ({}) };
  vi.stubGlobal("fetch", vi.fn(() => Promise.reject(new Error("offline"))));
});

const field = (id: string, label: { id: string; content: string; attributes?: Record<string, string> }, input: Record<string, unknown>) => ({
  id, type: "container" as const, tagName: "div",
  children: [{ id: label.id, type: "label" as const, tagName: "label", content: label.content, attributes: label.attributes, children: [] }, input],
});

function site() {
  const composer = new Composer({} as never);
  composer.importProject({
    pages: [
      {
        id: "home", name: "Home", slug: "", isHome: true,
        root: {
          id: "root", type: "container" as const, tagName: "div",
          children: [{
            id: "form1", type: "form" as const, tagName: "form",
            children: [
              field("f1", { id: "lName", content: "Name" },
                { id: "iName", type: "input", tagName: "input", attributes: { type: "text", name: "fullname", required: "" }, children: [] }),
              field("f2", { id: "lEmail", content: "Email" },
                { id: "iEmail", type: "input", tagName: "input", attributes: { type: "email", name: "email", id: "their-email" }, children: [] }),
              field("f3", { id: "lMsg", content: "Message", attributes: { for: "elsewhere" } },
                { id: "iMsg", type: "textarea", tagName: "textarea", attributes: { name: "message" }, children: [] }),
              {
                id: "lWrap", type: "label" as const, tagName: "label", content: "Agree",
                children: [{ id: "iWrap", type: "input", tagName: "input", attributes: { type: "checkbox", name: "agree" }, children: [] }],
              },
              { id: "sub", type: "button", tagName: "button", content: "Send", attributes: { type: "submit" }, children: [] },
            ],
          }],
        },
      },
    ],
  } as never);
  return composer;
}

const tag = (html: string, id: string) =>
  new RegExp(`<[a-z]+[^>]*data-buildrick-id="${id}"[^>]*>`).exec(html)?.[0] ?? "";

async function publishedHome(): Promise<string> {
  const { files } = await new ExportEngine(site()).exportAllPages({ format: "html", minify: true, rootAbsoluteHrefs: true });
  return files.find((f) => f.name === "index.html")!.content;
}

describe("published form labels (#24)", () => {
  it("ties each label to the field after it", async () => {
    const html = await publishedHome();
    expect(tag(html, "iName")).toContain('id="iName"');
    expect(tag(html, "lName")).toContain('for="iName"');
  });

  it("uses a field's own id rather than giving it a second one", async () => {
    const html = await publishedHome();
    expect(tag(html, "lEmail")).toContain('for="their-email"');
    expect(tag(html, "iEmail").match(/\sid="/g)).toHaveLength(1);
  });

  it("leaves a label that already names a field, and one that wraps its field", async () => {
    const html = await publishedHome();
    expect(tag(html, "lMsg")).toContain('for="elsewhere"');
    expect(tag(html, "iMsg")).not.toMatch(/\sid="/);
    expect(tag(html, "lWrap")).not.toContain("for=");
    expect(tag(html, "iWrap")).not.toMatch(/\sid="/);
  });

  it("ships the Required switch's empty-valued attribute", async () => {
    expect(tag(await publishedHome(), "iName")).toMatch(/\srequired(="")?[\s>/]/);
  });

  it("does the same in the ZIP, with the same success message as Publish", async () => {
    const blob = await new ExportEngine(site()).generateZip(undefined, null, { siteId: "s1", appOrigin: "https://app.example" });
    const zip = await JSZip.loadAsync(await blob.arrayBuffer());
    const html = await zip.file("index.html")!.async("string");
    expect(tag(html, "lName")).toContain('for="iName"');
    expect(html).toContain("data-buildrick-form-success");
  });
});
