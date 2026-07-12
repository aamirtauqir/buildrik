export type ImagesPreference = "stock" | "placeholders" | "none";

/**
 * The AI page generator (gpt-4o-mini) invents non-resolving `<img>` src values
 * — "logo.png", "https://example.com/…", "path-to-your-screenshot.jpg" — so
 * every image in a generated draft renders broken. This rewrites each src to a
 * working image URL honoring the user's `images` choice:
 *
 *   stock        → real seeded photos (picsum) so a draft looks finished
 *   placeholders → labelled grey boxes (placehold.co)
 *   none         → drop the <img> entirely
 *
 * Size is inferred from Tailwind height hints on the tag: logos/marks stay
 * small and wide, everything else gets a hero-sized box the surrounding
 * classes then constrain. Pure string transform — no DOM, safe in the worker.
 */
export function rewriteImageSources(html: string, pref: ImagesPreference): string {
  return html.replace(/<img\b[^>]*>/gi, (tag) => {
    if (pref === "none") return "";
    const alt = (tag.match(/\balt=["']([^"']*)["']/i)?.[1] || "Image").trim() || "Image";
    const cls = tag.match(/\bclass=["']([^"']*)["']/i)?.[1] || "";
    const isMark = /\b(logo|partner|brand|avatar|icon)\b/i.test(alt) || /\bh-(?:4|5|6|8|10|12|16)\b/.test(cls);
    const [w, h] = isMark ? [200, 80] : [1024, 640];
    const seed = (alt.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "") || "img").slice(0, 40);
    const src =
      pref === "stock"
        ? `https://picsum.photos/seed/${seed}/${w}/${h}`
        : `https://placehold.co/${w}x${h}?text=${encodeURIComponent(alt)}`;
    return /\bsrc=["'][^"']*["']/i.test(tag)
      ? tag.replace(/\bsrc=["'][^"']*["']/i, `src="${src}"`)
      : tag.replace(/<img/i, `<img src="${src}"`);
  });
}
