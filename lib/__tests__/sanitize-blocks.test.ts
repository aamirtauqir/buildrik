/**
 * sanitize-blocks — server-side defense-in-depth for the Page.blocks element
 * tree. The editor sanitizes on import/serialize, but a direct API write could
 * still persist hostile blocks. This strips dangerous markup at the write
 * boundary so the stored tree is clean at rest.
 */
import { describe, it, expect } from "vitest";
import {
  sanitizeBlocks,
  sanitizeComponentPayload,
  sanitizeProjectStyles,
  sanitizeTemplateHtml,
  sanitizeVersionPayload,
  sanitizeGeneratedPageHtml,
} from "../sanitize-blocks";

describe("sanitizeBlocks", () => {
  it("strips on* event-handler attribute keys", () => {
    const blocks = {
      id: "r",
      type: "image",
      tagName: "img",
      attributes: { src: "x", onerror: "alert(1)", onclick: "y" },
    };
    sanitizeBlocks(blocks);
    expect(blocks.attributes).not.toHaveProperty("onerror");
    expect(blocks.attributes).not.toHaveProperty("onclick");
    expect(blocks.attributes.src).toBe("x");
  });

  it("strips javascript: URLs from URL attributes", () => {
    const blocks = { id: "r", type: "link", tagName: "a", attributes: { href: "javascript:alert(1)" } };
    sanitizeBlocks(blocks);
    expect(blocks.attributes).not.toHaveProperty("href");
  });

  it("sanitizes content HTML (removes onerror, keeps text)", () => {
    const blocks = { id: "r", type: "text", tagName: "p", content: '<img src=x onerror="alert(1)">PWNED' };
    sanitizeBlocks(blocks);
    expect(blocks.content).not.toMatch(/onerror/i);
    expect(blocks.content).toContain("PWNED");
  });

  it("recurses into children", () => {
    const blocks = {
      id: "r",
      type: "container",
      tagName: "div",
      children: [{ id: "c", type: "text", tagName: "p", content: '<b onmouseover="x">hi</b>' }],
    };
    sanitizeBlocks(blocks);
    expect(blocks.children[0].content).not.toMatch(/onmouseover/i);
  });

  it("handles array roots and non-object input without throwing", () => {
    expect(() => sanitizeBlocks(null)).not.toThrow();
    expect(() => sanitizeBlocks("str")).not.toThrow();
    expect(() => sanitizeBlocks(undefined)).not.toThrow();
    const arr = [{ id: "a", type: "text", tagName: "p", attributes: { onclick: "x", title: "ok" } }];
    sanitizeBlocks(arr);
    expect(arr[0].attributes).not.toHaveProperty("onclick");
    expect(arr[0].attributes.title).toBe("ok");
  });

  it("keeps safe content, URLs, and editor attributes", () => {
    const blocks = {
      id: "r",
      type: "link",
      tagName: "a",
      attributes: { href: "https://example.com", "data-buildrick-id": "el1", style: "color: red" },
      content: "<b>Hi</b>",
    };
    sanitizeBlocks(blocks);
    expect(blocks.attributes.href).toBe("https://example.com");
    expect(blocks.attributes["data-buildrick-id"]).toBe("el1");
    expect(blocks.content).toContain("<b>Hi</b>");
  });
});

describe("sanitizeBlocks — tag and attribute allowlist (S-1a, A19-1)", () => {
  it("drops srcdoc (a same-origin document) whatever its case", () => {
    const blocks = { id: "r", type: "container", tagName: "div", attributes: { srcdoc: "<script>x</script>", SRCDOC: "y", title: "ok" } };
    sanitizeBlocks(blocks);
    expect(blocks.attributes).toEqual({ title: "ok" });
  });

  it("rewrites a disallowed tag to div and keeps the content", () => {
    const blocks = { id: "r", type: "container", tagName: "script", content: "hello" };
    sanitizeBlocks(blocks);
    expect(blocks.tagName).toBe("div");
    expect(blocks.content).toBe("hello");
  });

  it("rewrites a malformed tag that smuggles attributes to div", () => {
    const blocks = { id: "r", type: "image", tagName: "img src=x onerror=alert(1) x" };
    sanitizeBlocks(blocks);
    expect(blocks.tagName).toBe("div");
  });

  it("drops an attribute whose NAME smuggles a handler", () => {
    const blocks = { id: "r", type: "container", tagName: "div", attributes: { "x onerror=alert(1) y": "v", "data-ok": "1" } };
    sanitizeBlocks(blocks);
    expect(blocks.attributes).toEqual({ "data-ok": "1" });
  });

  it("treats srcset, formaction and xlink:href as URL attributes", () => {
    const blocks = {
      id: "r",
      type: "image",
      tagName: "img",
      attributes: {
        srcset: "a.jpg 1x, javascript:alert(1) 2x",
        formaction: "javascript:alert(1)",
        "xlink:href": "data:text/html,<script>x</script>",
        sizes: "100vw",
      },
    };
    sanitizeBlocks(blocks);
    expect(blocks.attributes).toEqual({ sizes: "100vw" });
  });

  it("keeps a safe srcset, including a data:image candidate", () => {
    const blocks = { id: "r", type: "image", tagName: "img", attributes: { srcset: "a.jpg 1x, data:image/png;base64,AAAA 2x" } };
    sanitizeBlocks(blocks);
    expect(blocks.attributes.srcset).toBe("a.jpg 1x, data:image/png;base64,AAAA 2x");
  });

  it("keeps audio, video, svg and its camelCase children, and upper-case DIV", () => {
    const blocks = {
      id: "r",
      type: "container",
      tagName: "DIV",
      children: [
        { id: "a", type: "audio", tagName: "audio" },
        { id: "v", type: "video", tagName: "video" },
        { id: "s", type: "svg", tagName: "svg", children: [{ id: "g", type: "custom", tagName: "linearGradient" }, { id: "p", type: "custom", tagName: "path" }] },
      ],
    };
    sanitizeBlocks(blocks);
    expect(blocks.tagName).toBe("DIV");
    expect(blocks.children.map((c) => c.tagName)).toEqual(["audio", "video", "svg"]);
    expect(blocks.children[2].children?.map((c) => c.tagName)).toEqual(["linearGradient", "path"]);
  });

  it("leaves a missing tagName alone (the editor derives it from the type)", () => {
    const blocks: { id: string; type: string; tagName?: string } = { id: "r", type: "heading" };
    sanitizeBlocks(blocks);
    expect(blocks.tagName).toBeUndefined();
  });

  it("keeps target on a rich-text link, as the editor does", () => {
    const blocks = { id: "r", type: "text", tagName: "p", content: '<a href="/x" target="_blank">x</a>' };
    sanitizeBlocks(blocks);
    expect(blocks.content).toContain('target="_blank"');
  });

  it("reports each change with its reason", () => {
    const reasons: string[] = [];
    sanitizeBlocks({ id: "r", type: "x", tagName: "iframe", attributes: { srcdoc: "y", onclick: "z" } }, (r) => reasons.push(r));
    expect(reasons.sort()).toEqual(["attr-event-handler", "attr-forbidden", "tag"]);
  });
});

describe("sanitizeComponentPayload / sanitizeVersionPayload / sanitizeTemplateHtml", () => {
  it("sanitizes a component master tree and its variant attribute overrides", () => {
    const payload = {
      id: "c",
      masterTree: { id: "m", type: "container", tagName: "iframe", attributes: { srcdoc: "<script>x</script>" } },
      variants: [{ id: "v", attributeOverrides: { onclick: "x", title: "t" } }],
    };
    sanitizeComponentPayload(payload);
    expect(payload.masterTree.tagName).toBe("div");
    expect(payload.masterTree.attributes).toEqual({});
    expect(payload.variants[0].attributeOverrides).toEqual({ title: "t" });
  });

  it("sanitizes every page root in a version snapshot", () => {
    const payload = {
      id: "v",
      snapshot: { pages: [{ id: "p", root: { id: "r", type: "container", tagName: "img src=x onerror=alert(1) x" } }] },
    };
    sanitizeVersionPayload(payload);
    expect(payload.snapshot.pages[0].root.tagName).toBe("div");
  });

  it("tolerates payloads of an unexpected shape", () => {
    expect(() => sanitizeComponentPayload({ html: "<div>x</div>" })).not.toThrow();
    expect(() => sanitizeVersionPayload({ snapshot: "nope" })).not.toThrow();
  });

  it("strips executable markup from template html and keeps the layout", () => {
    const out = sanitizeTemplateHtml(
      '<section style="padding:4px" data-x="1"><iframe srcdoc="<script>x</script>"></iframe><img src=x onerror="alert(1)"><a href="/p" target="_blank">go</a></section>'
    );
    expect(out).not.toMatch(/srcdoc|onerror|<iframe/i);
    expect(out).toContain('style="padding:4px"');
    expect(out).toContain('target="_blank"');
  });
});

describe("URL schemes a browser would still run (S-1 review fix 2)", () => {
  it.each([
    "java\tscript:alert(1)",
    "java\nscript:alert(1)",
    "java\rscript:alert(1)",
    "\x01javascript:alert(1)",
    " \x00vbscript:msgbox(1)",
    "JaVaScRiPt:alert(1)",
    "data:text/html,<script>alert(1)</script>",
    "\tdata:text/html,x",
  ])("drops href=%j", (href) => {
    const blocks = { id: "r", type: "link", tagName: "a", attributes: { href } };
    sanitizeBlocks(blocks);
    expect(blocks.attributes).not.toHaveProperty("href");
  });

  it.each(["https://x.com/a", "/p", "#top", "mailto:a@b.c", "data:image/png;base64,AAAA", "page.html"])(
    "keeps href=%j",
    (href) => {
      const blocks = { id: "r", type: "link", tagName: "a", attributes: { href } };
      sanitizeBlocks(blocks);
      expect(blocks.attributes.href).toBe(href);
    }
  );
});

describe("target links get rel=noopener noreferrer (S-1 review fix 3)", () => {
  it("adds it to rich-text content, merging an existing rel", () => {
    const blocks = {
      id: "r",
      type: "text",
      tagName: "p",
      content: '<a href="/a" target="_blank">a</a><a href="/b" target="_blank" rel="nofollow">b</a><a href="/c">c</a>',
    };
    sanitizeBlocks(blocks);
    expect(blocks.content).toContain('<a href="/a" target="_blank" rel="noopener noreferrer">a</a>');
    expect(blocks.content).toContain('rel="nofollow noopener noreferrer"');
    expect(blocks.content).toContain('<a href="/c">c</a>');
  });

  it("adds it to user-template html", () => {
    expect(sanitizeTemplateHtml('<a href="/x" target="_blank">x</a>')).toContain('rel="noopener noreferrer"');
  });
});

describe("component instance overrides (S-1 review round 2)", () => {
  it("sanitizes content overrides and drops unsafe attribute overrides on write", () => {
    const overrides = [
      { op: "replace", path: "#/children[0]/content/content", value: '<img src=x onerror="alert(1)">Owned' },
      { op: "replace", path: "#/children[1]/attribute/href", value: "java\tscript:alert(1)" },
      { op: "replace", path: "#/children[1]/attribute/x onerror=y", value: "1" },
      { op: "replace", path: "#/children[1]/attribute/srcdoc", value: "<script>x</script>" },
      { op: "replace", path: "#/children[1]/attribute/title", value: "kept" },
      { op: "replace", path: "#/style/color", value: "red" },
    ];
    const blocks = {
      id: "r",
      type: "container",
      tagName: "div",
      children: [{ id: "i", type: "container", tagName: "div", data: { componentInstance: { componentId: "c", overrides } } }],
    };
    const reasons: string[] = [];
    sanitizeBlocks(blocks, (r) => reasons.push(r));
    const kept = blocks.children[0].data.componentInstance.overrides;
    expect(kept.map((o) => o.path)).toEqual([
      "#/children[0]/content/content",
      "#/children[1]/attribute/title",
      "#/style/color",
    ]);
    expect(kept[0].value).toContain("Owned");
    expect(kept[0].value).not.toMatch(/onerror/i);
    expect(reasons.filter((r) => r === "override")).toHaveLength(4);
  });

  it("tolerates overrides of an unexpected shape", () => {
    const blocks = { id: "r", type: "container", tagName: "div", data: { componentInstance: { overrides: "nope" } } };
    expect(() => sanitizeBlocks(blocks)).not.toThrow();
  });
});

describe("style declarations (S-1 review round 3)", () => {
  it("drops breakout / dangerous declarations from styles and every breakpoint map on write", () => {
    const blocks = {
      id: "r",
      type: "container",
      tagName: "div",
      styles: {
        color: "red}</style><script>alert(1)</script>",
        width: "expression(alert(1))",
        "x y": "1",
        padding: "4px",
        backgroundImage: "url(https://cdn.example.com/a.png)",
        background: "linear-gradient(90deg, #fff 0%, rgba(0,0,0,.5) 100%)",
        borderColor: "var(--buildrick-design-primary)",
      },
      breakpointStyles: {
        tablet: { color: "blue</style>", margin: "8px" },
        mobile: { background: "url(javascript:alert(1))" },
        desktop: "nope",
      },
    };
    const reasons: string[] = [];
    sanitizeBlocks(blocks, (r) => reasons.push(r));
    expect(blocks.styles).toEqual({
      padding: "4px",
      backgroundImage: "url(https://cdn.example.com/a.png)",
      background: "linear-gradient(90deg, #fff 0%, rgba(0,0,0,.5) 100%)",
      borderColor: "var(--buildrick-design-primary)",
    });
    expect(blocks.breakpointStyles.tablet).toEqual({ margin: "8px" });
    expect(blocks.breakpointStyles.mobile).toEqual({});
    expect(reasons.filter((r) => r === "style")).toHaveLength(5);
  });
});

describe("malformed override entries (S-1 review round 3)", () => {
  it("removes entries that are not ops and resets a non-array list", () => {
    const good = { op: "replace", path: "#/style/color", value: "red" };
    const a = { id: "a", type: "container", data: { componentInstance: { overrides: [null, "x", { path: 5 }, { op: "replace" }, good] } } };
    const b = { id: "b", type: "container", data: { componentInstance: { overrides: "nope" } } };
    sanitizeBlocks([a, b]);
    expect(a.data.componentInstance.overrides).toEqual([good]);
    expect(b.data.componentInstance.overrides).toEqual([]);
  });
});

const HOSTILE_SELECTOR = "a{}</style><script>alert(1)</script><style>";

describe("project style rules and element ids (S-1 review round 4)", () => {
  function rules() {
    return [
      { id: "s1", selector: '[data-buildrick-id="el-a1"]', properties: { color: "red" }, mediaQuery: "(max-width: 767px)" },
      { id: "s2", selector: HOSTILE_SELECTOR, properties: { color: "red" } },
      { id: "s3", selector: ".ok", properties: { color: "blue" }, mediaQuery: "(max-width: 767px){}</style><script>alert(1)</script><style>" },
      { id: "s4", selector: '[data-buildrick-id="el-a1"]:hover', properties: { color: "red}</style>", padding: "4px" } },
      { id: "t1", kind: "color", cssVar: "--primary", value: "#1A56DB" },
      { id: "s5", selector: 7, properties: {} },
    ];
  }

  it("drops a rule whose selector or media query could leave the stylesheet, keeps the rest", () => {
    const reasons: string[] = [];
    const styles = rules();
    sanitizeProjectStyles(styles, (reason) => reasons.push(reason));
    expect(styles.map((r) => r.id)).toEqual(["s1", "s4", "t1"]);
    expect(styles[1]).toMatchObject({ properties: { padding: "4px" } });
    expect(JSON.stringify(styles)).not.toMatch(/<\/style|<script/i);
    expect(reasons.filter((r) => r === "style-rule")).toHaveLength(3);
    expect(reasons).toContain("style");
  });

  it("tolerates a non-list styles value", () => {
    expect(sanitizeProjectStyles({ a: 1 })).toEqual({ a: 1 });
    expect(sanitizeProjectStyles(undefined)).toBeUndefined();
  });

  it("sanitizes the style rules in a version snapshot", () => {
    const payload = { id: "v", snapshot: { pages: [], styles: rules() } };
    sanitizeVersionPayload(payload);
    expect(payload.snapshot.styles.map((r) => r.id)).toEqual(["s1", "s4", "t1"]);
  });

  it("gives an element with an id that could leave a selector a fresh one, keeping the node", () => {
    const reasons: string[] = [];
    const tree = {
      id: "root",
      type: "container",
      children: [
        { id: 'x"]{}</style><script>alert(1)</script>', type: "text", content: "Hi" },
        { id: "el-ok_1", type: "text" },
      ],
    };
    sanitizeBlocks(tree, (reason) => reasons.push(reason));
    const [bad, good] = tree.children;
    expect(bad.id).toMatch(/^[A-Za-z0-9_-]+$/);
    expect(bad.content).toBe("Hi");
    expect(good.id).toBe("el-ok_1");
    expect(tree.id).toBe("root");
    expect(reasons).toEqual(["id"]);
  });
});

// controller review round 2: a regex "is this substitution inside a URL
// attribute" detector is bypassable (unquoted attributes, a non-first
// srcset candidate, style="url(...)", case). This runs a real parser
// (DOMPurify/jsdom) instead of pattern-matching HTML context. Consumer:
// `cms.service.ts`'s `generateDynamicPages`, over the WHOLE substituted page.
/**
 * A clean dynamic page as publish produces it: ExportEngine.wrapInDocument's
 * minified shell (DOCTYPE, `<html lang>`, meta charset/viewport), SEOInjector's
 * head (description, canonical, og:*, twitter:*, icon, robots, JSON-LD), the
 * inlined stylesheet (exportPublishPages), the Google Fonts links
 * (googleFontsHeadLinks — boolean `crossorigin`, a raw `&` in the href), the
 * locale-redirect snippet, and the body the publish worker hands on: a wired
 * form (x2's `_return`/honeypot fields, `data-success-message`, the form page
 * script), a slider with its runtime script, srcset with a data: image, SVG
 * `<use xlink:href>`, `whatsapp:`/`mailto:`/`tel:` links, and ids/names that
 * are also DOM property names (DOMPurify's clobbering check strips those).
 * Hand-built from those emitters, not captured from a live publish.
 */
const EXPORTED_PAGE = [
  "<!DOCTYPE html>",
  '<html lang="en"><head>',
  '<meta charset="UTF-8">',
  '<meta name="viewport" content="width=device-width, initial-scale=1.0">',
  "<title>Bella Cucina — Menu</title>",
  '<meta name="description" content="Seasonal plates &amp; natural wine.">',
  '<link rel="canonical" href="https://bella.example.com/menu">',
  '<meta property="og:locale" content="en">',
  '<meta property="og:type" content="website">',
  '<meta property="og:title" content="Bella Cucina — Menu">',
  '<meta property="og:description" content="Seasonal plates &amp; natural wine.">',
  '<meta property="og:image" content="https://cdn.example.com/og.jpg">',
  '<meta property="og:url" content="https://bella.example.com/menu">',
  '<meta property="og:site_name" content="Bella Cucina">',
  '<meta name="twitter:card" content="summary_large_image">',
  '<meta name="twitter:title" content="Bella Cucina — Menu">',
  '<link rel="icon" href="/favicon.png">',
  '<meta name="robots" content="index, follow">',
  '<script type="application/ld+json">{"@context":"https://schema.org","@type":"WebPage","name":"Bella Cucina — Menu","url":"https://bella.example.com/menu"}</script>',
  "<style>body{margin:0;font-family:Inter}.hero{background:url(/bg.jpg)}.a>.b{content:\"<\"}</style>",
  '<link rel="preconnect" href="https://fonts.googleapis.com">',
  '<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>',
  '<link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=Inter:wght@400;600&display=swap">',
  '<script>(function(){try{if(sessionStorage.getItem("brk-locale-redirect"))return;var p=location.pathname;if(p.length>1&&p.indexOf("/fr/")<0){}}catch(e){}})();</script>',
  "</head><body>",
  '<nav class="buildrick-el-nav"><a href="/">Home</a><a href="/menu" target="_blank" rel="noopener noreferrer">Menu</a>',
  '<a href="whatsapp://send?text=Hi">WhatsApp</a><a href="mailto:hi@bella.example.com">Email</a><a href="tel:+15551234">Call</a></nav>',
  '<section id="location" class="hero" style="background:url(&quot;/hero.jpg&quot;) center/cover;color:#fff" data-buildrick-id="el-1">',
  '<h1 id="title">Tom &amp; Jerry &lt;3</h1>',
  '<img src="/dish.jpg" srcset="data:image/png;base64,iVBORw0KGgo= 1x, /dish@2x.jpg 2x" alt="Dish" loading="lazy" width="640" height="480">',
  '<picture><source srcset="/dish.webp 1x, /dish@2x.webp 2x" type="image/webp"><img src="/dish.jpg" alt=""></picture>',
  '<video src="/clip.mp4" poster="/clip.jpg" controls muted playsinline></video>',
  '<svg viewBox="0 0 24 24" width="24" height="24" aria-hidden="true"><use xlink:href="#icon-star"></use></svg>',
  "</section>",
  '<div class="bk-slider" data-buildrick-slider="1" data-autoplay="true" data-interval="5000" data-buildrick-id="el-2">',
  '<div class="bk-slide"><img src="/s1.jpg" alt="One"></div><div class="bk-slide"><img src="/s2.jpg" alt="Two"></div></div>',
  '<form data-buildrick-id="el-3" name="reserve" aria-label="Reserve" action="https://app.buildrick.io/api/public/forms/site1/el-3" method="POST" data-success-message="Thanks — see you soon!">',
  '<input type="hidden" name="_return" value="">',
  '<input type="text" name="_honeypot" tabindex="-1" autocomplete="off" aria-hidden="true" style="position:absolute;left:-9999px;width:1px;height:1px;overflow:hidden" data-buildrick-honeypot="1">',
  '<label for="email">Email</label><input id="email" type="email" name="email" required placeholder="you@example.com">',
  '<button type="submit" name="submit">Book</button><button formaction="/alt" name="action">Alt</button></form>',
  "<script data-buildrick-slider-runtime>(function(){var s=document.querySelectorAll('[data-buildrick-slider]');for(var i=0;i<s.length;i++){if(s[i].children.length<2)continue;}})();</script>",
  '<script data-buildrick-form-success>(function(){\ntry{\nvar r=document.querySelectorAll(\'input[name="_return"]\');\nfor(var i=0;i<r.length;i++){r[i].value=location.href;}\n}catch(e){}\n})();</script>',
  "</body></html>",
].join("");

describe("sanitizeGeneratedPageHtml", () => {
  it("returns a clean exported page byte-for-byte (og:* meta, JSON-LD, form/slider scripts, whatsapp:, DOM-named ids)", () => {
    expect(sanitizeGeneratedPageHtml(EXPORTED_PAGE)).toBe(EXPORTED_PAGE);
  });

  it("still catches a dangerous substitution inside that page, and keeps the rest", () => {
    const hostile = EXPORTED_PAGE.replace('href="/menu" target', 'href="javascript:alert(1)" target');
    const out = sanitizeGeneratedPageHtml(hostile);
    expect(out).not.toMatch(/javascript:/i);
    expect(out).toContain('<meta property="og:title" content="Bella Cucina — Menu">');
    expect(out).toContain('href="whatsapp://send?text=Hi"');
    expect(out).toContain('id="title"');
    expect(out).toContain('name="submit"');
  });

  it("a substituted value that spells a span placeholder cannot restore a script into an attribute (SAFE_FOR_XML)", () => {
    // Entity-escaped as substitution leaves it; the parser decodes it to the
    // literal placeholder text, which serialization would write back raw.
    const forged = "&lt;style&gt;/*BD_DYNPAGE_SPAN_0*/&lt;/style&gt;";
    const html =
      '<html><head><script>var q = "\\" onmouseover=alert(1) x=\\"";</script></head>' +
      `<body><div title="${forged}">x</div><a href="javascript:alert(1)">y</a></body></html>`;
    const out = sanitizeGeneratedPageHtml(html);
    expect(out.match(/<script>/g)).toHaveLength(1);
    expect(out).toContain("<div>x</div>");
  });

  it("drops srcdoc (the shared FORBIDDEN_ATTRIBUTES) from a generated page", () => {
    const out = sanitizeGeneratedPageHtml('<html><body><iframe srcdoc="&lt;img src=x onerror=alert(1)&gt;" title="ok"></iframe>x</div></body></html>');
    expect(out).not.toMatch(/srcdoc/i);
    expect(out).toContain('title="ok"');
  });

  it("removes a javascript: href regardless of quoting, case, or whitespace", () => {
    const html =
      '<html><body>' +
      '<a href="javascript:alert(1)">quoted</a>' +
      "<a href=javascript:alert(1)>unquoted</a>" +
      '<a HREF="  JavaScript:alert(1)">uppercase+whitespace</a>' +
      "</body></html>";
    const out = sanitizeGeneratedPageHtml(html);
    expect(out).not.toMatch(/javascript:/i);
  });

  it("filters a dangerous srcset candidate without dropping the safe ones", () => {
    const html = '<html><body><img srcset="/a.jpg 1x, javascript:alert(1) 2x, /b.jpg 3x"></body></html>';
    const out = sanitizeGeneratedPageHtml(html);
    expect(out).not.toMatch(/javascript:/i);
    expect(out).toContain("/a.jpg");
    expect(out).toContain("/b.jpg");
  });

  it("removes a style attribute whose url() resolves to a dangerous scheme", () => {
    const html = '<html><body><div style="background:url(javascript:alert(1));color:red">x</div></body></html>';
    const out = sanitizeGeneratedPageHtml(html);
    expect(out).not.toMatch(/javascript:/i);
  });

  it("drops a style whose url() the old STYLE_URL_RE could not see (quote/paren mismatch), keeps a data:image one", () => {
    const html =
      '<html><body><div style="background:url(&quot;javascript:a\')&quot;)">x</div>' +
      '<div style="background:url(&quot;data:image/png;base64,AAAA&quot;)">y</div></body></html>';
    const out = sanitizeGeneratedPageHtml(html);
    expect(out).not.toMatch(/javascript:/i);
    expect(out).toContain("data:image/png;base64,AAAA");
  });

  it("keeps a data: image srcset candidate whole — its base64 comma is not a candidate break", () => {
    const html = '<html><body><img srcset="data:image/png;base64,AAAA 1x, /b.png 2x"></body></html>';
    const out = sanitizeGeneratedPageHtml(html);
    expect(out).toContain('srcset="data:image/png;base64,AAAA 1x, /b.png 2x"');
  });

  it("leaves a safe style url() and every other URL-bearing attribute shape untouched", () => {
    const html =
      '<html><body>' +
      '<div style="background:url(/bg.jpg);color:red">x</div>' +
      '<img srcset="/a.jpg 1x, /b.jpg 2x">' +
      '<a href="https://example.com">ok</a>' +
      "</body></html>";
    const out = sanitizeGeneratedPageHtml(html);
    expect(out).toContain("url(/bg.jpg)");
    expect(out).toContain('srcset="/a.jpg 1x, /b.jpg 2x"');
    expect(out).toContain('href="https://example.com"');
  });

  it("preserves DOCTYPE, which DOMPurify's WHOLE_DOCUMENT mode drops on its own", () => {
    const out = sanitizeGeneratedPageHtml("<!DOCTYPE html><html><body>x</body></html>");
    expect(out.startsWith("<!DOCTYPE html>")).toBe(true);
  });

  it("keeps script/style content byte-for-byte, even when it contains HTML-tag-shaped text that could confuse a naive parser", () => {
    const html =
      '<html><head><script>var s = "<b>not a tag</b>&amp;";</script></head>' +
      "<body><style>.a{content:'<x>'}</style>x</body></html>";
    const out = sanitizeGeneratedPageHtml(html);
    expect(out).toContain('<script>var s = "<b>not a tag</b>&amp;";</script>');
    expect(out).toContain("<style>.a{content:'<x>'}</style>");
  });

  it("keeps a hook-immune legitimate tag/attribute pair (SVG <use xlink:href>) and a same-site form formaction", () => {
    const html =
      '<html><body><svg><use xlink:href="#icon"></use></svg>' +
      '<form><button formaction="/alt">go</button></form></body></html>';
    const out = sanitizeGeneratedPageHtml(html);
    expect(out).toContain('<use xlink:href="#icon">');
    expect(out).toContain('formaction="/alt"');
  });

  it("still strips an on* event-handler attribute (defense-in-depth, not overridden by the allow-everything hook)", () => {
    const html = '<html><body><a onclick="alert(1)">x</a></body></html>';
    const out = sanitizeGeneratedPageHtml(html);
    expect(out).not.toMatch(/onclick/i);
  });
});
