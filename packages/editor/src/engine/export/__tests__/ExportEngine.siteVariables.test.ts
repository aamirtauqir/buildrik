/**
 * {{site.<key>}} in text is written out with the variable's value (G3-075:
 * CMS › Variables were stored and shown but never substituted — the export
 * carried the raw braces). A site without variables exports unchanged.
 *
 * @license BSD-3-Clause
 */
import { describe, it, expect, vi } from "vitest";
import { ExportEngine } from "../ExportEngine";

const text = (id: string, content: string, extra: Record<string, unknown> = {}) => ({ id, type: "text", tagName: "p", content, children: [], ...extra });
const PAGES = [
  {
    id: "home", name: "Home", slug: "home", isHome: true,
    root: {
      id: "r", type: "container", tagName: "div",
      children: [
        text("a", "Call {{site.phone}} or {{ site.email }}"),
        text("b", "Unknown {{site.nope}} stays"),
        text("c", "<b>{{site.name}}</b>", { contentFormat: "html" }),
      ],
    },
  },
];

function exportHome(siteVariables?: Array<{ key: string; value: string }>) {
  const composer = {
    elements: { exportPages: vi.fn().mockReturnValue(PAGES) },
    styles: { generateResponsiveCSS: vi.fn().mockReturnValue(""), generateCSS: vi.fn().mockReturnValue("") },
    getProjectSettings: vi.fn().mockReturnValue(siteVariables ? { siteVariables } : undefined),
  } as unknown as ConstructorParameters<typeof ExportEngine>[0];
  return new ExportEngine(composer).exportAllPages({ format: "html" }).then(({ files }) => files.find((f) => f.name === "index.html")!.content);
}

describe("ExportEngine — site variables", () => {
  it("writes each {{site.key}} as its value, escaped", async () => {
    const html = await exportHome([
      { key: "phone", value: "555-0100" },
      { key: "email", value: "a@b.co" },
      { key: "name", value: "Tom & <Jerry>" },
    ]);
    expect(html).toContain("Call 555-0100 or a@b.co");
    expect(html).toContain("Unknown {{site.nope}} stays");
    expect(html).toContain("<b>Tom &amp; &lt;Jerry&gt;</b>");
    expect(html).not.toContain("<Jerry>");
  });

  it("leaves the output alone when the site has no variables", async () => {
    const html = await exportHome();
    expect(html).toContain("Call {{site.phone}} or {{ site.email }}");
    expect(html).toContain("<b>{{site.name}}</b>");
  });
});
