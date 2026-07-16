/**
 * PageRouter — path↔pageId bi-map tests.
 *
 * Covers registration (slug-style and id-style paths, as wired by
 * PageManager.registerRoute: `/${slug}` or `/${id}`), unregistration,
 * lookup misses, path normalization (leading /, trailing slash,
 * lowercasing) and re-registration semantics of both map directions.
 *
 * @license BSD-3-Clause
 */

import { beforeEach, describe, expect, it } from "vitest";
import { PageRouter } from "../PageRouter";

describe("PageRouter", () => {
  let router: PageRouter;

  beforeEach(() => {
    router = new PageRouter();
  });

  describe("register + resolve", () => {
    it("resolves a registered slug path to its page id", () => {
      router.register("/about", "page-1");
      expect(router.resolve("/about")).toBe("page-1");
    });

    it("supports id-style registration (PageManager fallback when no slug)", () => {
      router.register("/page-abc123", "page-abc123");
      expect(router.resolve("/page-abc123")).toBe("page-abc123");
    });

    it("returns null for an unregistered path", () => {
      expect(router.resolve("/missing")).toBeNull();
    });

    it("returns null on an empty router even for root", () => {
      expect(router.resolve("/")).toBeNull();
    });

    it("re-registering the same path with a new page id replaces both directions", () => {
      router.register("/x", "p1");
      router.register("/x", "p2");

      expect(router.resolve("/x")).toBe("p2");
      expect(router.getPath("p2")).toBe("/x");
      // Old page id's reverse mapping is cleaned up:
      expect(router.getPath("p1")).toBeNull();
      expect(router.getAllRoutes()).toEqual([{ path: "/x", pageId: "p2" }]);
    });

    it("re-registering the same path with the same page id is idempotent", () => {
      router.register("/same", "p1");
      router.register("/same", "p1");

      expect(router.resolve("/same")).toBe("p1");
      expect(router.getPath("p1")).toBe("/same");
      expect(router.getAllRoutes()).toHaveLength(1);
    });

    it("registering the SAME page id under a new path leaves the old forward route in place (current behavior)", () => {
      // register() only cleans the old *reverse* mapping when the PATH is
      // re-registered — not when the PAGE ID moves to a new path. The old
      // forward entry survives as an alias.
      router.register("/old", "p1");
      router.register("/new", "p1");

      expect(router.resolve("/new")).toBe("p1");
      expect(router.getPath("p1")).toBe("/new"); // reverse points at latest
      expect(router.resolve("/old")).toBe("p1"); // stale forward entry remains
      expect(router.getAllRoutes()).toHaveLength(2);
    });

    it.todo(
      "BUG: bi-map invariant breaks when a pageId is re-registered under a new path — " +
        "register('/old','p1') then register('/new','p1') leaves '/old' in the forward map " +
        "(resolve('/old') === 'p1' while getPath('p1') === '/new'); a subsequent " +
        "unregister('/new') then deletes p1's reverse entry while '/old' STILL resolves to p1, " +
        "leaving a route with no reverse mapping. register() should also delete " +
        "reverseRoutes.get(pageId)'s old forward entry. (PageManager sidesteps this by calling " +
        "unregister(oldSlug) first in reregisterRoute, but PageRouter's own API allows the drift.)"
    );

    it("current behavior: unregister after pageId re-registration strands the stale alias", () => {
      router.register("/old", "p1");
      router.register("/new", "p1");
      router.unregister("/new");

      // Forward alias survives, reverse mapping is gone — asymmetric state.
      expect(router.resolve("/old")).toBe("p1");
      expect(router.getPath("p1")).toBeNull();
    });
  });

  describe("unregister", () => {
    it("removes both directions for a registered path", () => {
      router.register("/contact", "p9");
      router.unregister("/contact");

      expect(router.resolve("/contact")).toBeNull();
      expect(router.getPath("p9")).toBeNull();
      expect(router.getAllRoutes()).toEqual([]);
    });

    it("is a no-op for an unknown path", () => {
      router.register("/keep", "p1");
      expect(() => router.unregister("/never-registered")).not.toThrow();
      expect(router.resolve("/keep")).toBe("p1");
    });

    it("normalizes the path before unregistering", () => {
      router.register("/about", "p1");
      router.unregister("About/"); // no leading /, trailing /, wrong case
      expect(router.resolve("/about")).toBeNull();
      expect(router.getPath("p1")).toBeNull();
    });
  });

  describe("getPath", () => {
    it("returns the normalized path for a registered page id", () => {
      router.register("Team/", "p-team");
      expect(router.getPath("p-team")).toBe("/team");
    });

    it("returns null for an unknown page id", () => {
      expect(router.getPath("ghost")).toBeNull();
    });
  });

  describe("normalization", () => {
    it("adds a leading slash when missing", () => {
      router.register("pricing", "p1");
      expect(router.resolve("/pricing")).toBe("p1");
      expect(router.resolve("pricing")).toBe("p1");
      expect(router.getPath("p1")).toBe("/pricing");
    });

    it("strips a single trailing slash", () => {
      router.register("/blog/", "p1");
      expect(router.resolve("/blog")).toBe("p1");
      expect(router.resolve("/blog/")).toBe("p1");
      expect(router.getPath("p1")).toBe("/blog");
    });

    it("keeps the root path '/' intact (trailing slash not stripped)", () => {
      router.register("/", "home");
      expect(router.resolve("/")).toBe("home");
      expect(router.getPath("home")).toBe("/");
    });

    it("normalizes the empty string to root", () => {
      router.register("", "home");
      expect(router.resolve("/")).toBe("home");
      expect(router.resolve("")).toBe("home");
      expect(router.getPath("home")).toBe("/");
    });

    it("lowercases paths on both register and resolve", () => {
      router.register("/About-Us", "p1");
      expect(router.resolve("/about-us")).toBe("p1");
      expect(router.resolve("/ABOUT-US")).toBe("p1");
      expect(router.getPath("p1")).toBe("/about-us");
    });

    it("does NOT lowercase page ids (only paths are normalized)", () => {
      router.register("/a", "Page-MixedCase");
      expect(router.resolve("/a")).toBe("Page-MixedCase");
      expect(router.getPath("Page-MixedCase")).toBe("/a");
      expect(router.getPath("page-mixedcase")).toBeNull();
    });

    it("handles unicode slugs (locale-aware lowercase, no ASCII folding)", () => {
      router.register("/Über-Uns", "p1");
      expect(router.resolve("/über-uns")).toBe("p1");
      expect(router.getPath("p1")).toBe("/über-uns");

      router.register("/日本語", "p2");
      expect(router.resolve("/日本語")).toBe("p2");
    });

    it("does not otherwise mutate the path (spaces and inner slashes survive)", () => {
      router.register("/my page/sub", "p1");
      expect(router.resolve("/My Page/Sub")).toBe("p1");
      expect(router.getPath("p1")).toBe("/my page/sub");
    });

    it("current behavior: only ONE trailing slash is stripped", () => {
      router.register("/docs//", "p1");
      // '/docs//' → '/docs/' (single strip). Neither '/docs' nor '/docs/'
      // (which itself normalizes to '/docs') matches the stored key.
      expect(router.resolve("/docs")).toBeNull();
      expect(router.resolve("/docs/")).toBeNull();
      expect(router.resolve("/docs//")).toBe("p1");
      expect(router.getPath("p1")).toBe("/docs/");
    });

    it.todo(
      "BUG(minor): normalizePath strips only one trailing slash and is not idempotent — " +
        "register('/docs//') stores '/docs/', which resolve('/docs') and resolve('/docs/') " +
        "(→ '/docs') can never match; only the exact double-slash query finds it. Trailing " +
        "slashes should be stripped in a loop (or via replace(/\\/+$/, ''))."
    );

    it("'//' (double slash) normalizes to '/'", () => {
      router.register("//", "home");
      expect(router.resolve("/")).toBe("home");
      expect(router.getPath("home")).toBe("/");
    });
  });

  describe("getAllRoutes", () => {
    it("returns an empty array when nothing is registered", () => {
      expect(router.getAllRoutes()).toEqual([]);
    });

    it("returns all normalized path/pageId pairs", () => {
      router.register("/", "home");
      router.register("About/", "p-about");
      router.register("contact", "p-contact");

      expect(router.getAllRoutes()).toEqual([
        { path: "/", pageId: "home" },
        { path: "/about", pageId: "p-about" },
        { path: "/contact", pageId: "p-contact" },
      ]);
    });
  });

  describe("clear", () => {
    it("empties both maps", () => {
      router.register("/a", "p1");
      router.register("/b", "p2");
      router.clear();

      expect(router.resolve("/a")).toBeNull();
      expect(router.resolve("/b")).toBeNull();
      expect(router.getPath("p1")).toBeNull();
      expect(router.getPath("p2")).toBeNull();
      expect(router.getAllRoutes()).toEqual([]);
    });

    it("router is usable again after clear", () => {
      router.register("/a", "p1");
      router.clear();
      router.register("/a", "p2");
      expect(router.resolve("/a")).toBe("p2");
    });
  });
});
