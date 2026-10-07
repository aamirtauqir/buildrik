/**
 * The payload set every rich-text / CMS-value path is tested against, and the
 * one assertion: a parsed page holds no script-execution vector.
 */
export const XSS_PAYLOADS = [
  "<img src=x onerror=alert(1)>",
  "<svg><style><img src=x onerror=alert(1)></style></svg>",
  "<math><mtext><table><mglyph><style><img src=x onerror=alert(1)>",
  '<noscript><p title="</noscript><img src=x onerror=alert(1)>">',
  '<a href="jav&#x09;ascript:alert(1)">x</a>',
  '<a href=" JaVaScRiPt:alert(1)">x</a>',
  "<!--><img src=x onerror=alert(1)>-->",
  "<ScRiPt>alert(1)</sCrIpT><P OnClick=alert(1)>t</P><A HREF=JAVASCRIPT:alert(1)>a</A>",
  '<a href="data:text/html,<script>alert(1)</script>">d</a>',
  '<p style="background:url(javascript:alert(1))">s</p><form><button formaction=javascript:alert(1)>b</button></form>',
  '<template><img src=x onerror=alert(1)></template><iframe srcdoc="<script>alert(1)</script>"></iframe>',
  "<form><math><mtext></form><form><mglyph><style></math><img src onerror=alert(1)>",
  '<noscript><a title="</noscript><img src=x onerror=alert(1)>">',
] as const;

const BANNED_TAGS = new Set(["script", "style", "svg", "math", "iframe", "object", "embed", "template", "noscript", "frame", "frameset", "base", "form", "button"]);

/** Why `root` could run script, or null. Every element, every attribute. */
export function executionVector(root: ParentNode, opts: { allowImages?: boolean } = {}): string | null {
  for (const el of Array.from(root.querySelectorAll("*"))) {
    const tag = el.tagName.toLowerCase();
    if (BANNED_TAGS.has(tag)) return `<${tag}>`;
    if (tag === "img" && !opts.allowImages) return "<img>";
    for (const attr of Array.from(el.attributes)) {
      const name = attr.name.toLowerCase();
      if (name.startsWith("on")) return `${tag}[${name}]`;
      if (name === "style" || name === "srcdoc" || name === "formaction") return `${tag}[${name}]`;
      const compact = attr.value.replace(/[\s\x00-\x1f]/g, "").toLowerCase();
      if (compact.startsWith("javascript:") || compact.startsWith("vbscript:") || compact.startsWith("data:")) return `${tag}[${name}=${attr.value}]`;
    }
  }
  return null;
}
