import { describe, it, expect } from "vitest";

describe("Notification Components", () => {
  it("NOTIFICATION_TABS exports 3 tabs (All, Unread, Account & billing)", async () => {
    // A-20: the "mentions" filter never showed @mentions — it groups
    // security + billing notification types. Relabeled to say what it
    // actually shows; the filter key stays "mentions" to avoid schema churn.
    const mod = await import("@/components/notifications/notification-page");
    expect(mod.NOTIFICATION_TABS).toHaveLength(3);
    const labels = mod.NOTIFICATION_TABS.map((t: { label: string }) => t.label);
    expect(labels).toEqual(["All", "Unread", "Account & billing"]);
    const keys = mod.NOTIFICATION_TABS.map((t: { key: string }) => t.key);
    expect(keys).toEqual(["all", "unread", "mentions"]);
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
