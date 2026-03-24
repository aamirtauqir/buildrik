import { describe, it, expect } from "vitest";

describe("Notification Components", () => {
  it("NOTIFICATION_TABS exports 3 tabs (All, Unread, Mentions)", async () => {
    const mod = await import("@/components/notifications/notification-page");
    expect(mod.NOTIFICATION_TABS).toHaveLength(3);
    const labels = mod.NOTIFICATION_TABS.map((t: { label: string }) => t.label);
    expect(labels).toEqual(["All", "Unread", "Mentions"]);
  });

  it("NotificationDropdown component exists", async () => {
    const mod = await import("@/components/notifications/notification-dropdown");
    expect(mod.NotificationDropdown).toBeDefined();
  });

  it("NotificationPage component exists", async () => {
    const mod = await import("@/components/notifications/notification-page");
    expect(mod.NotificationPage).toBeDefined();
  });
});

describe("Search Components", () => {
  it("CommandPalette exports PALETTE_SECTIONS with 3 sections", async () => {
    const mod = await import("@/components/search/command-palette");
    expect(mod.PALETTE_SECTIONS).toHaveLength(3);
    const keys = mod.PALETTE_SECTIONS.map((s: { key: string }) => s.key);
    expect(keys).toEqual(["recent", "actions", "navigation"]);
  });

  it("SEARCH_SCOPES exports 6 scopes", async () => {
    const mod = await import("@/components/search/command-palette");
    expect(mod.SEARCH_SCOPES).toHaveLength(6);
    const keys = mod.SEARCH_SCOPES.map((s: { key: string }) => s.key);
    expect(keys).toEqual(["sites", "pages", "team", "settings", "actions", "help"]);
  });

  it("CommandPalette component exists", async () => {
    const mod = await import("@/components/search/command-palette");
    expect(mod.CommandPalette).toBeDefined();
  });
});
