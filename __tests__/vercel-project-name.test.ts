/**
 * SA-06: the Vercel project a site deploys to is pinned. Once a site has a
 * `vercelProjectName`, every Vercel call (deploy, domain attach/detach, form
 * origin checks) uses it — so renaming the slug never moves the live site to a
 * fresh project. Sites that were never pinned fall back to the slug.
 *
 * @license BSD-3-Clause
 */
import { describe, it, expect } from "vitest";
import { resolveVercelProjectName, slugifyProjectName } from "@/lib/vercel";

describe("resolveVercelProjectName", () => {
  it("prefers the pinned name", () => {
    expect(resolveVercelProjectName({ slug: "new", vercelProjectName: "buildrik-site-old" })).toBe("buildrik-site-old");
  });

  it("falls back to the slug", () => {
    expect(resolveVercelProjectName({ slug: "new", vercelProjectName: null })).toBe(slugifyProjectName("new"));
  });
});
