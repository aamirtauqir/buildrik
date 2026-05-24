// Regression: V1 walk Iter 19 — publish saved the deployment-specific URL
// (which Vercel SSO-gates) instead of the canonical project alias (public).
// Result: every published site showed "Authentication Required" to end users.
// Found by /qa on 2026-05-24.
// Report: packages/editor/src/.gstack/qa-reports/qa-report-buildrik-2026-05-24.md

import { describe, it, expect } from "vitest";
import { pickPublicUrl } from "@/lib/vercel";

describe("pickPublicUrl — canonical alias preference", () => {
  it("prefers the shortest alias (canonical project URL) over the deployment URL", () => {
    expect(
      pickPublicUrl({
        url: "buildrik-site-test-hp5wvrdxw-shah8.vercel.app",
        alias: [
          "buildrik-site-test-shah8.vercel.app",
          "buildrik-site-test.vercel.app",
        ],
      }),
    ).toBe("https://buildrik-site-test.vercel.app");
  });

  it("returns single alias when only one is assigned", () => {
    expect(
      pickPublicUrl({
        url: "deploy-hash-shah8.vercel.app",
        alias: ["my-site.vercel.app"],
      }),
    ).toBe("https://my-site.vercel.app");
  });

  it("falls back to projectName.vercel.app when alias array is empty and projectName provided", () => {
    expect(
      pickPublicUrl(
        { url: "deploy-hash-shah8.vercel.app", alias: [] },
        "buildrik-site-test-qa1",
      ),
    ).toBe("https://buildrik-site-test-qa1.vercel.app");

    expect(
      pickPublicUrl(
        { url: "deploy-hash-shah8.vercel.app" },
        "buildrik-site-test-qa1",
      ),
    ).toBe("https://buildrik-site-test-qa1.vercel.app");
  });

  it("falls back to the deployment URL only when neither alias nor projectName available", () => {
    expect(
      pickPublicUrl({
        url: "deploy-hash-shah8.vercel.app",
        alias: [],
      }),
    ).toBe("https://deploy-hash-shah8.vercel.app");
  });

  it("never returns the SSO-gated team-scoped URL when a shorter alias exists", () => {
    const result = pickPublicUrl({
      url: "site-abc-shah8.vercel.app",
      alias: [
        "site-shah8.vercel.app",
        "site.vercel.app",
      ],
    });
    expect(result).not.toContain("shah8");
    expect(result).toBe("https://site.vercel.app");
  });
});
