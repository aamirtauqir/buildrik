/**
 * A share link opens the published site — or nothing.
 *
 * Both share entry points used to fall back to `/<slug>`, which is not a route
 * in this app. Every link minted for an unpublished site handed the client a
 * 404 while the modal that minted it said "Anyone with this link can preview
 * the current draft". Walked end to end before the fix: create link on an
 * unpublished site → open in a clean browser → 404 Page Not Found.
 *
 * @license BSD-3-Clause
 */
import { describe, expect, it } from "vitest";
import { shareDestination } from "../share-destination";

describe("shareDestination", () => {
  it("sends a visitor to the published site", () => {
    expect(shareDestination({ publishedUrl: "https://bella.vercel.app" })).toBe(
      "https://bella.vercel.app",
    );
  });

  it("returns nothing for a site that was never published", () => {
    expect(shareDestination({ publishedUrl: null })).toBeNull();
  });

  it("never invents a slug route — `/<slug>` is not a page here", () => {
    const dest = shareDestination({ publishedUrl: null });
    expect(typeof dest === "string" && dest.startsWith("/")).toBe(false);
  });
});
