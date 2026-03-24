import { describe, it, expect } from "vitest";

describe("Help Components", () => {
  it("HELP_CATEGORY_LIST has 6 categories", async () => {
    const mod = await import("@/components/help/help-center");
    expect(mod.HELP_CATEGORY_LIST).toHaveLength(6);
    expect(mod.HELP_CATEGORY_LIST[0]).toHaveProperty("key");
    expect(mod.HELP_CATEGORY_LIST[0]).toHaveProperty("label");
    expect(mod.HELP_CATEGORY_LIST[0]).toHaveProperty("icon");
  });

  it("KEYBOARD_SHORTCUTS has at least 8 shortcuts", async () => {
    const mod = await import("@/components/help/help-center");
    expect(mod.KEYBOARD_SHORTCUTS).toBeDefined();
    expect(mod.KEYBOARD_SHORTCUTS.length).toBeGreaterThanOrEqual(8);
  });

  it("HelpCenter component exists", async () => {
    const mod = await import("@/components/help/help-center");
    expect(mod.HelpCenter).toBeDefined();
  });

  it("TicketForm component exists", async () => {
    const mod = await import("@/components/help/ticket-form");
    expect(mod.TicketForm).toBeDefined();
  });

  it("ArticleList component exists", async () => {
    const mod = await import("@/components/help/article-list");
    expect(mod.ArticleList).toBeDefined();
  });

  it("ContextualHelp component exists", async () => {
    const mod = await import("@/components/help/contextual-help");
    expect(mod.ContextualHelp).toBeDefined();
  });
});
