/**
 * SA-08 — General's flush must not wipe social-link platforms it does not
 * render a field for (instagram/youtube/github). The screen only owns
 * twitter/facebook/linkedin locally; flushing must merge those three into
 * whatever `current.seo.socialLinks` already carries, not replace the object.
 *
 * @license BSD-3-Clause
 */
import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { render, screen, fireEvent, act, waitFor, cleanup } from "@testing-library/react";
import * as React from "react";
import { createMockComposer } from "@/editor/sidebar/__tests__/test-utils/mockComposer";

const { api } = vi.hoisted(() => ({
  api: {
    siteDetail: {
      settings: { get: { query: vi.fn() } },
    },
  },
}));

vi.mock("@/services/api-client", () => ({
  getBuildrikClient: () => api,
}));

import { SiteSettingsScreen } from "../SiteSettingsScreen";
import { SiteColumnsLockedContext } from "../../shared";

beforeEach(() => {
  api.siteDetail.settings.get.query.mockReset();
});

afterEach(() => cleanup());

const settingsWithFullSocialLinks = () => ({
  seo: {
    siteName: "Composer Name",
    favicon: "https://composer.test/favicon.ico",
    language: "en",
    socialLinks: {
      twitter: "https://x.com/a",
      instagram: "https://instagram.com/a",
      youtube: "https://youtube.com/@a",
      github: "https://github.com/a",
    },
  },
});

function setup() {
  const composer = createMockComposer({ projectSettings: settingsWithFullSocialLinks() });
  let flush: (() => void) | null = null;
  const registerFlushHandler = vi.fn((h: (() => void) | null) => {
    flush = h;
  });
  render(
    <SiteSettingsScreen
      composer={composer}
      projectId={null}
      registerFlushHandler={registerFlushHandler}
    />,
    {
      wrapper: ({ children }: { children: React.ReactNode }) => (
        <SiteColumnsLockedContext.Provider value={false}>{children}</SiteColumnsLockedContext.Provider>
      ),
    },
  );
  return { composer, getFlush: () => flush };
}

describe("SiteSettingsScreen — SA-08 flush preserves social links the screen does not show", () => {
  it("keeps instagram/youtube/github when Twitter is edited and the screen flushes", async () => {
    const { composer, getFlush } = setup();

    const twitter = screen.getByLabelText("Twitter") as HTMLInputElement;
    fireEvent.change(twitter, { target: { value: "https://x.com/b" } });

    await waitFor(() => expect(getFlush()).toBeTypeOf("function"));
    act(() => getFlush()!());

    const settings = composer.getProjectSettings() as ReturnType<typeof settingsWithFullSocialLinks>;
    expect(settings.seo.socialLinks).toEqual({
      twitter: "https://x.com/b",
      facebook: "",
      linkedin: "",
      instagram: "https://instagram.com/a",
      youtube: "https://youtube.com/@a",
      github: "https://github.com/a",
    });
  });
});

/* T8: the composer's copy of the columns is what `loadProject` merged; when
   that column read failed, `current.seo.socialLinks` is undefined and a spread
   of it keeps nothing. The screen's own row read carries every platform. */
describe("SiteSettingsScreen — flush keeps the Site row's social links when the composer has none", () => {
  it("merges into the server-loaded row, not the composer's missing copy", async () => {
    api.siteDetail.settings.get.query.mockResolvedValue({
      name: "Row Name",
      favicon: null,
      defaultLocale: "en",
      enabledLocales: ["en"],
      socialLinks: {
        twitter: "https://x.com/a",
        facebook: "https://facebook.com/a",
        linkedin: "https://linkedin.com/in/a",
        instagram: "https://instagram.com/a",
        youtube: "https://youtube.com/@a",
        github: "https://github.com/a",
      },
    });
    const composer = createMockComposer({ projectSettings: { seo: { siteName: "Row Name", language: "en" } } });
    let flush: (() => void) | null = null;
    render(
      <SiteSettingsScreen
        composer={composer}
        projectId="s1"
        registerFlushHandler={(h: (() => void) | null) => {
          flush = h;
        }}
      />,
      {
        wrapper: ({ children }: { children: React.ReactNode }) => (
          <SiteColumnsLockedContext.Provider value={false}>{children}</SiteColumnsLockedContext.Provider>
        ),
      },
    );

    const twitter = (await screen.findByLabelText("Twitter")) as HTMLInputElement;
    fireEvent.change(twitter, { target: { value: "https://x.com/b" } });
    await waitFor(() => expect(flush).toBeTypeOf("function"));
    act(() => flush!());

    const settings = composer.getProjectSettings() as { seo: { socialLinks: Record<string, string> } };
    expect(settings.seo.socialLinks).toEqual({
      twitter: "https://x.com/b",
      facebook: "https://facebook.com/a",
      linkedin: "https://linkedin.com/in/a",
      instagram: "https://instagram.com/a",
      youtube: "https://youtube.com/@a",
      github: "https://github.com/a",
    });
  });
});
