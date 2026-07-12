import { describe, it, expect } from "vitest";
import { rewriteImageSources } from "../rewrite-image-sources";

// Real broken output observed from gpt-4o-mini page generation.
const BROKEN = `<section>
  <img src="logo.png" alt="Event Planning Logo" class="h-10 w-auto" />
  <img src="path-to-your-screenshot-or-illustration.jpg" alt="Event Planning Illustration" class="rounded-lg shadow-lg"/>
  <img src="https://example.com/event-planning-screenshot.png" alt="Event Planning Screenshot" class="w-full"/>
</section>`;

describe("rewriteImageSources", () => {
  it("replaces every invented src with a working stock URL", () => {
    const out = rewriteImageSources(BROKEN, "stock");
    // none of the broken originals survive
    expect(out).not.toContain("logo.png");
    expect(out).not.toContain("path-to-your-screenshot");
    expect(out).not.toContain("example.com");
    // all three imgs now point at a real host
    const srcs = [...out.matchAll(/src="([^"]+)"/g)].map((m) => m[1]);
    expect(srcs).toHaveLength(3);
    expect(srcs.every((s) => s.startsWith("https://picsum.photos/seed/"))).toBe(true);
  });

  it("sizes marks small (h-10 logo) and content large (illustration)", () => {
    const out = rewriteImageSources(BROKEN, "stock");
    expect(out).toContain("picsum.photos/seed/event-planning-logo/200/80");
    expect(out).toContain("picsum.photos/seed/event-planning-illustration/1024/640");
  });

  it("placeholders mode emits labelled placehold.co boxes", () => {
    const out = rewriteImageSources(BROKEN, "placeholders");
    expect(out).toContain("https://placehold.co/200x80?text=Event%20Planning%20Logo");
    expect(out).not.toContain("picsum");
  });

  it("none mode drops every image", () => {
    const out = rewriteImageSources(BROKEN, "none");
    expect(out).not.toContain("<img");
  });

  it("injects a src when the tag has none", () => {
    const out = rewriteImageSources(`<img alt="Hero" class="w-full">`, "stock");
    expect(out).toMatch(/<img src="https:\/\/picsum\.photos\/seed\/hero\/1024\/640"/);
  });

  it("leaves non-img HTML untouched", () => {
    const html = `<h1>Book a Call</h1><p>No images here</p>`;
    expect(rewriteImageSources(html, "stock")).toBe(html);
  });
});
