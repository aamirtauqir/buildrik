/**
 * Export Utilities
 * Helper functions for export modal and preview
 * @license BSD-3-Clause
 */

// ============================================================================
// PREVIEW UTILITIES
// ============================================================================

const FORBIDDEN_PROTOCOLS = ["javascript:", "data:", "vbscript:"];
const FORBIDDEN_STYLE_TOKENS = ["expression", "url("];

/**
 * The one stylesheet host the preview may keep.
 *
 * Every <link> was stripped, which is right for arbitrary external CSS and
 * wrong for the site's own fonts: the exported page fetches its families from
 * Google, and the preview showed the same document with the fetch removed —
 * so a site set in Lora previewed in whatever serif the viewer happened to
 * have. Same host the editor itself loads fonts from when you pick one.
 */
const ALLOWED_STYLESHEET_HOSTS = ["https://fonts.googleapis.com/"];

function isAllowedStylesheet(el: Element): boolean {
  const rel = (el.getAttribute("rel") || "").toLowerCase();
  if (!rel.split(/\s+/).includes("stylesheet")) return false;
  const href = el.getAttribute("href") || "";
  return ALLOWED_STYLESHEET_HOSTS.some((h) => href.startsWith(h));
}

/**
 * Sanitize HTML for safe preview rendering — removes dangerous elements/attributes
 */
export function sanitizeHTMLForPreview(html: string): string {
  try {
    const doc = new DOMParser().parseFromString(html, "text/html");
    doc
      .querySelectorAll("script,iframe,object,embed,link,meta[http-equiv],base,form")
      .forEach((n) => {
        if (n.tagName === "LINK" && isAllowedStylesheet(n)) return;
        n.remove();
      });

    doc.querySelectorAll("*").forEach((el) => {
      [...el.attributes].forEach((attr) => {
        const name = attr.name.toLowerCase();
        const value = attr.value.toLowerCase();
        if (name.startsWith("on") || name === "srcdoc") {
          el.removeAttribute(attr.name);
        } else if (
          (name === "src" || name === "href") &&
          FORBIDDEN_PROTOCOLS.some((p) => value.startsWith(p))
        ) {
          el.removeAttribute(attr.name);
        } else if (
          name === "style" &&
          FORBIDDEN_STYLE_TOKENS.some((t) => value.replace(/\s+/g, "").includes(t))
        ) {
          el.removeAttribute(attr.name);
        }
      });
    });
    /* Keep the page's own stylesheet. The rebuilt head used to carry nothing
       but a charset, so every <style> the export wrote was dropped and the
       "Quick preview" — the one surface whose whole job is "this is what a
       visitor sees" — showed the page without its CSS. The same token filter
       the style ATTRIBUTES get is applied to the sheet, and script-bearing
       elements were already removed above. */
    const styles = [...doc.head.querySelectorAll("style"), ...doc.body.querySelectorAll("style")]
      .map((el) => el.textContent ?? "")
      .filter((css) => {
        const flat = css.replace(/\s+/g, "").toLowerCase();
        return !FORBIDDEN_STYLE_TOKENS.some((t) => flat.includes(t));
      })
      .map((css) => `<style>${css}</style>`)
      .join("");
    /* And the font stylesheet, for the same reason and by the same shape: the
       head is REBUILT here, so anything not collected is gone whatever the
       filter above allows. The export names the site's families and fetches
       them; without this the preview named them and fetched nothing, so a site
       set in Lora previewed in whatever serif the viewer's machine had. */
    const fontLinks = [
      ...doc.head.querySelectorAll("link"),
      ...doc.body.querySelectorAll("link"),
    ]
      .filter(isAllowedStylesheet)
      .map((el) => {
        const href = (el.getAttribute("href") ?? "").replace(/["<>]/g, "");
        return `<link rel="stylesheet" href="${href}">`;
      })
      .join("");
    const body = doc.body.textContent !== null ? doc.body.outerHTML : "<body></body>";
    return `<!DOCTYPE html><html><head><meta charset="utf-8">${fontLinks}${styles}</head>${body}</html>`;
  } catch {
    return "<!DOCTYPE html><html><body>Preview unavailable</body></html>";
  }
}

/**
 * Create a sandboxed preview iframe in the target window
 */
export function setupPreviewWindow(targetWindow: Window, html: string): void {
  while (targetWindow.document.head.firstChild)
    targetWindow.document.head.removeChild(targetWindow.document.head.firstChild);
  while (targetWindow.document.body.firstChild)
    targetWindow.document.body.removeChild(targetWindow.document.body.firstChild);

  const iframe = targetWindow.document.createElement("iframe");
  iframe.setAttribute("sandbox", "allow-same-origin allow-forms allow-pointer-lock");
  iframe.setAttribute("referrerpolicy", "no-referrer");
  Object.assign(iframe.style, { border: "0", width: "100%", height: "100vh" });
  iframe.srcdoc = html;
  targetWindow.document.body.appendChild(iframe);
  targetWindow.document.title = "Buildrick Preview";
}

// ============================================================================
// FILE UTILITIES
// ============================================================================

/**
 * Download content as a file
 */
export function downloadFile(content: string, filename: string, mimeType: string): void {
  const blob = new Blob([content], { type: mimeType });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}
