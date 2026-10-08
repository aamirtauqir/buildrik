/**
 * @license BSD-3-Clause
 */
import { describe, it, expect } from "vitest";
import { publishInputSchema } from "../publish";

/* P1-2 server side: the publishing tab's freshness token is what stops a tab
   that never loaded (or fell behind) from shipping its copy over newer work.
   Pages without it are refused at the transport boundary; a publish that sends
   no pages (cron, dashboard) carries nothing to be stale. */
describe("publishInputSchema freshness token", () => {
  const pages = [{ path: "index.html", html: "<p>x</p>" }];

  it("refuses pages sent without expectedLastEditedAt", () => {
    expect(publishInputSchema.safeParse({ siteId: "s1", pages }).success).toBe(false);
    expect(publishInputSchema.safeParse({ siteId: "s1", pages, expectedLastEditedAt: null }).success).toBe(false);
  });

  it("accepts pages with the token, and a pageless publish without one", () => {
    expect(
      publishInputSchema.safeParse({ siteId: "s1", pages, expectedLastEditedAt: "2026-10-08T10:00:00.000Z" }).success,
    ).toBe(true);
    expect(publishInputSchema.safeParse({ siteId: "s1" }).success).toBe(true);
  });
});
