/**
 * Settings Phase B (BE-3) — the Settings Save's client half in
 * BuildrikSyncProvider.
 *
 * `planSettingsSave` splits what a screen's flush returned into the changed
 * Site columns (→ `siteDetail.settings.update`), the changed JSON-only keys
 * (→ `siteDetail.projectSettings.update`) and whether anything else changed
 * that no mutation covers yet. `saveSiteSettings` runs both mutations, names
 * every refused field by its settings path, and only advances the autosave
 * mirror's baseline when the whole save landed — so the next autosave neither
 * re-sends the columns nor sends the old values back over a partial save.
 *
 * @license BSD-3-Clause
 */
import { describe, it, expect, vi, beforeEach } from "vitest";

const m = vi.hoisted(() => ({
  settingsUpdate: vi.fn(),
  projectSettingsUpdate: vi.fn(),
  saveProject: vi.fn(),
  sitesGet: vi.fn(),
  pagesList: vi.fn(),
  settingsGet: vi.fn(),
  myRole: vi.fn(),
}));

vi.mock("../api-client", () => {
  const client = {
    sites: { get: { query: m.sitesGet }, saveProject: { mutate: m.saveProject }, myRole: { query: m.myRole } },
    pages: { list: { query: m.pagesList } },
    siteDetail: {
      settings: { get: { query: m.settingsGet }, update: { mutate: m.settingsUpdate } },
      projectSettings: { update: { mutate: m.projectSettingsUpdate } },
    },
  };
  return { createBuildrikApiClient: vi.fn(() => client), getBuildrikClient: vi.fn(() => client) };
});

import {
  loadProject,
  planSettingsSave,
  saveProject,
  saveSiteSettings,
  SettingsSaveError,
  updateProjectSettings,
  updateSiteColumns,
} from "../BuildrikSyncProvider";
import type { ProjectData } from "@/shared/types/project";

/** A tRPC client error as the server's errorFormatter shapes it. */
const zodRefusal = (issues: Array<{ path: string; message: string }>) =>
  Object.assign(new Error(issues.map((i) => `${i.path}: ${i.message}`).join("; ")), { data: { zodIssues: issues } });

beforeEach(() => {
  Object.values(m).forEach((fn) => fn.mockReset());
  m.settingsUpdate.mockResolvedValue({});
  m.projectSettingsUpdate.mockResolvedValue({ saved: {}, warnings: { legacyAnalyticsIds: [] } });
});

describe("planSettingsSave", () => {
  it("routes changed columns and JSON-only keys; leaves the unchanged out", () => {
    const before = {
      seo: { siteName: "Bella", metaTitle: "Old", socialLinks: { twitter: "https://x.com/a" } },
      analytics: { googleAnalytics: { enabled: false, measurementId: "" } },
      customCode: { headScripts: "", bodyScripts: "", globalCss: "a{}" },
      redirects: { suggestFrom404s: true },
    };
    const next = {
      ...before,
      seo: { ...before.seo, metaTitle: "New", defaultOgImage: "" },
      analytics: { googleAnalytics: { enabled: true, measurementId: "G-ABCD123456" } },
      customCode: { ...before.customCode, globalCss: "b{}" },
    };
    expect(planSettingsSave(before, next)).toEqual({
      columns: { metaTitle: "New", ogImage: null },
      projectSettings: {
        analytics: { googleAnalytics: { enabled: true, measurementId: "G-ABCD123456" } },
        customCode: { globalCss: "b{}" },
      },
      unrouted: false,
    });
  });

  it("says when a change has no settings mutation yet (SEO's Twitter handle)", () => {
    const before = { seo: { twitterHandle: "@a" } };
    expect(planSettingsSave(before, { seo: { twitterHandle: "@b" } })).toEqual({ columns: {}, projectSettings: null, unrouted: true });
    expect(planSettingsSave(before, before)).toEqual({ columns: {}, projectSettings: null, unrouted: false });
  });
});

describe("saveSiteSettings", () => {
  it("runs both mutations and never sites.saveProject", async () => {
    m.projectSettingsUpdate.mockResolvedValue({ saved: {}, warnings: { legacyAnalyticsIds: ["googleTagManager"] } });
    const result = await saveSiteSettings("s1", {
      columns: { metaTitle: "New" },
      projectSettings: { redirects: { suggestFrom404s: false } },
      unrouted: false,
    });
    expect(m.settingsUpdate).toHaveBeenCalledWith({ id: "s1", metaTitle: "New" });
    expect(m.projectSettingsUpdate).toHaveBeenCalledWith({ siteId: "s1", patch: { redirects: { suggestFrom404s: false } } });
    expect(m.saveProject).not.toHaveBeenCalled();
    expect(result.legacyAnalyticsIds).toEqual(["googleTagManager"]);
  });

  it("sends nothing for an empty plan", async () => {
    await saveSiteSettings("s1", { columns: {}, projectSettings: null, unrouted: false });
    expect(m.settingsUpdate).not.toHaveBeenCalled();
    expect(m.projectSettingsUpdate).not.toHaveBeenCalled();
  });

  it("names every refused field by its settings path, from both mutations", async () => {
    m.settingsUpdate.mockRejectedValue(
      zodRefusal([
        { path: "ogImage", message: "Use an https:// address or a path on this site (/image.png)." },
        { path: "socialLinks.instagram", message: "Use an https:// link." },
        { path: "slug", message: "taken" },
      ]),
    );
    m.projectSettingsUpdate.mockRejectedValue(
      zodRefusal([{ path: "patch.analytics.googleAnalytics.measurementId", message: "Use only letters, numbers, - and _." }]),
    );
    const error = await saveSiteSettings("s1", {
      columns: { ogImage: "javascript:x" },
      projectSettings: { analytics: {} },
      unrouted: false,
    }).catch((e: unknown) => e);
    expect(error).toBeInstanceOf(SettingsSaveError);
    expect((error as SettingsSaveError).fieldErrors).toEqual({
      "seo.defaultOgImage": "Use an https:// address or a path on this site (/image.png).",
      "seo.socialLinks.instagram": "Use an https:// link.",
      slug: "taken",
      "analytics.googleAnalytics.measurementId": "Use only letters, numbers, - and _.",
    });
  });

  it("updateProjectSettings (an immediate JSON-only write, e.g. Redirects' 404 switch) answers with the server's result", async () => {
    m.projectSettingsUpdate.mockResolvedValue({ saved: { redirects: { suggestFrom404s: false } }, warnings: { legacyAnalyticsIds: [] } });
    await expect(updateProjectSettings("s1", { redirects: { suggestFrom404s: false } })).resolves.toMatchObject({
      saved: { redirects: { suggestFrom404s: false } },
    });
    m.projectSettingsUpdate.mockRejectedValue(zodRefusal([{ path: "patch.customCode.globalCss", message: "Too long" }]));
    await expect(updateProjectSettings("s1", { customCode: { globalCss: "x" } })).rejects.toMatchObject({
      fieldErrors: { "customCode.globalCss": "Too long" },
    });
  });

  it("updateSiteColumns (a screen's own save) refuses the same way", async () => {
    m.settingsUpdate.mockRejectedValue(zodRefusal([{ path: "cspPolicy", message: "Too long" }]));
    await expect(updateSiteColumns("s1", { cspPolicy: "x" })).rejects.toMatchObject({
      name: "SettingsSaveError",
      fieldErrors: { cspPolicy: "Too long" },
    });
  });
});

/* The mirror inside autosave (`saveProject`) sends the columns that differ from
   its baseline. A Settings Save that landed moves the baseline; one that did
   not, does not. */
describe("saveSiteSettings and the autosave mirror's baseline", () => {
  const project = (metaTitle: string): ProjectData => ({
    version: "1",
    pages: [],
    styles: [],
    assets: [],
    settings: { seo: { siteName: "Bella", language: "en", metaTitle } },
  });

  beforeEach(async () => {
    m.sitesGet.mockResolvedValue({ name: "Bella", lastEditedAt: "2026-10-01T00:00:00.000Z" });
    m.pagesList.mockResolvedValue([]);
    m.settingsGet.mockResolvedValue({ name: "Bella", defaultLocale: "en", metaTitle: "Old" });
    m.myRole.mockResolvedValue({ role: "ADMIN" });
    m.saveProject.mockResolvedValue({ success: true, savedAt: "2026-10-01T00:00:01.000Z" });
    await loadProject("s1");
  });

  it("after a landed save, autosave does not re-send the column", async () => {
    await saveSiteSettings("s1", { columns: { metaTitle: "New" }, projectSettings: null, unrouted: false });
    m.settingsUpdate.mockClear();
    await saveProject("s1", project("New"));
    expect(m.saveProject).toHaveBeenCalledTimes(1);
    expect(m.settingsUpdate).not.toHaveBeenCalled();
  });

  it("after a refused save, autosave does not send the old value back over the server", async () => {
    m.projectSettingsUpdate.mockRejectedValueOnce(new Error("offline"));
    await expect(
      saveSiteSettings("s1", { columns: { metaTitle: "New" }, projectSettings: { redirects: { suggestFrom404s: false } }, unrouted: false }),
    ).rejects.toBeInstanceOf(SettingsSaveError);
    m.settingsUpdate.mockClear();
    // The composer still holds "Old" (nothing was adopted): no diff, nothing sent.
    await saveProject("s1", project("Old"));
    expect(m.settingsUpdate).not.toHaveBeenCalled();
  });
});
