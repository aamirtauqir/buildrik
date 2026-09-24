/**
 * A LINK on a section/container (inspector board 4428:141642). Export used to
 * write `href` onto the <section>, where it does nothing. Now the section is
 * wrapped in an <a> that generates no box (display:contents), and a container
 * holding interactive content keeps its inner links and drops its own — an
 * <a> inside an <a> is invalid HTML. See `blockLinkPlan` for the strategy.
 *
 * @license BSD-3-Clause
 */
import { beforeAll, describe, expect, it, vi } from "vitest";
import { Composer } from "../../Composer";
import { ExportEngine } from "../ExportEngine";

type Node = {
  id: string;
  type: string;
  tagName?: string;
  content?: string;
  attributes?: Record<string, string>;
  children: Node[];
};

const heading = (id: string): Node => ({ id, type: "heading", tagName: "h2", content: "Title", children: [] });
const section = (id: string, attributes: Record<string, string>, children: Node[]): Node => ({
  id,
  type: "section",
  tagName: "section",
  attributes,
  children,
});

function pagesWith(child: Node) {
  return [
    { id: "p1", name: "Home", slug: "home", isHome: true, root: { id: "r1", type: "container", tagName: "div", children: [child] } },
    { id: "p2", name: "Menu", slug: "menu", isHome: false, root: { id: "r2", type: "container", tagName: "div", children: [] } },
  ];
}

async function publishHome(child: Node): Promise<string> {
  const composer = {
    elements: { exportPages: vi.fn().mockReturnValue(pagesWith(child)) },
    styles: { generateResponsiveCSS: vi.fn().mockReturnValue(""), generateCSS: vi.fn().mockReturnValue("") },
    getProjectSettings: vi.fn().mockReturnValue(undefined),
  } as unknown as ConstructorParameters<typeof ExportEngine>[0];
  const { files } = await new ExportEngine(composer).exportAllPages({ format: "html" });
  return files.find((f) => f.name === "index.html")!.content;
}

const parse = (html: string) => new DOMParser().parseFromString(html, "text/html");

describe("publish — a linked container", () => {
  it("wraps the section in an <a> that carries the link and generates no box", async () => {
    const html = await publishHome(section("s1", { href: "https://example.com", target: "_blank" }, [heading("h1")]));
    const doc = parse(html);
    const a = doc.querySelector("a")!;
    expect(a.getAttribute("href")).toBe("https://example.com");
    expect(a.getAttribute("target")).toBe("_blank");
    expect(a.getAttribute("style")).toBe("display:contents;color:inherit;text-decoration:inherit");
    const sec = a.firstElementChild!;
    expect(sec.tagName).toBe("SECTION");
    expect(sec.getAttribute("data-buildrick-id")).toBe("s1");
    expect(sec.hasAttribute("href")).toBe(false);
    expect(sec.hasAttribute("target")).toBe(false);
  });

  it("resolves an internal page link on the wrapper", async () => {
    const html = await publishHome(section("s1", { href: "#page:p2" }, [heading("h1")]));
    expect(parse(html).querySelector("a")!.getAttribute("href")).toBe("menu.html");
  });

  it("keeps a button's own role: no wrapper, and no dead href on the section", async () => {
    const button: Node = { id: "b1", type: "button", tagName: "button", content: "Book", children: [] };
    const html = await publishHome(section("s1", { href: "https://example.com" }, [heading("h1"), button]));
    const doc = parse(html);
    expect(doc.querySelectorAll("a")).toHaveLength(0);
    expect(doc.querySelector("section")!.hasAttribute("href")).toBe(false);
  });

  it("nested linked containers: the inner link wins, never <a> inside <a>", async () => {
    const inner = section("s2", { href: "https://inner.example" }, [heading("h2")]);
    const outer = section("s1", { href: "https://outer.example" }, [inner]);
    const html = await publishHome(outer);
    const doc = parse(html);
    expect(html).not.toContain("outer.example");
    expect(doc.querySelectorAll("a a")).toHaveLength(0);
    expect([...doc.querySelectorAll("a")].map((a) => a.getAttribute("href"))).toEqual(["https://inner.example"]);
  });

  it("an unsafe href produces no wrapper at all", async () => {
    const html = await publishHome(section("s1", { href: "javascript:alert(1)" }, [heading("h1")]));
    expect(parse(html).querySelectorAll("a")).toHaveLength(0);
    expect(html).not.toContain("javascript:");
  });

  it("an <a> element and an href-less section are written as before", async () => {
    const link: Node = { id: "l1", type: "link", tagName: "a", content: "Go", attributes: { href: "https://x.example" }, children: [] };
    const html = await publishHome(section("s1", {}, [link]));
    const doc = parse(html);
    expect(doc.querySelectorAll("a")).toHaveLength(1);
    expect(doc.querySelector("a")!.hasAttribute("style")).toBe(false);
  });
});

describe("single-file export — the same rule", () => {
  beforeAll(() => {
    HTMLCanvasElement.prototype.getContext = (() => ({
      drawImage: () => {}, getImageData: () => ({ data: new Uint8ClampedArray() }),
      putImageData: () => {}, clearRect: () => {},
    })) as unknown as HTMLCanvasElement["getContext"];
    (globalThis as { indexedDB?: unknown }).indexedDB = { open: () => ({}) };
  });

  it("wraps a linked section and leaves a button-holding one unwrapped", () => {
    const composer = new Composer({} as never);
    composer.importProject({
      pages: [{
        id: "p", name: "Home", slug: "", isHome: true,
        root: { id: "root", type: "container", tagName: "div", children: [
          section("s1", { href: "https://example.com" }, [heading("h1")]),
          section("s2", { href: "https://dropped.example" }, [{ id: "b", type: "button", tagName: "button", content: "Go", children: [] }]),
        ] },
      }],
    } as never);
    const doc = parse(new ExportEngine(composer).generateHTML());
    const links = [...doc.querySelectorAll("a")];
    expect(links.map((a) => a.getAttribute("href"))).toEqual(["https://example.com"]);
    expect(links[0].firstElementChild!.tagName).toBe("SECTION");
    expect(doc.body.innerHTML).not.toContain("dropped.example");
  });
});
