import { describe, it, expect } from "vitest";
import { generateWorkspaceAppScripts } from "../marketplace-app-scripts";

const VALID = { propertyId: "5f9a1b2c3d4e5f6a7b8c9d0e", widgetId: "1abc2def3" };

describe("generateWorkspaceAppScripts — Live Chat (Tawk.to)", () => {
  it("emits the Tawk loader with the embed URL when config is valid", () => {
    const out = generateWorkspaceAppScripts([{ appId: "live-chat", config: VALID }]);
    expect(out).toContain("https://embed.tawk.to/5f9a1b2c3d4e5f6a7b8c9d0e/1abc2def3");
    expect(out).toContain("Tawk_API");
  });

  it("accepts the literal 'default' widget id", () => {
    const out = generateWorkspaceAppScripts([{ appId: "live-chat", config: { propertyId: VALID.propertyId, widgetId: "default" } }]);
    expect(out).toContain(`embed.tawk.to/${VALID.propertyId}/default`);
  });

  it("emits nothing when config is missing or malformed", () => {
    expect(generateWorkspaceAppScripts([{ appId: "live-chat", config: null }])).toBe("");
    expect(generateWorkspaceAppScripts([{ appId: "live-chat", config: {} }])).toBe("");
    expect(generateWorkspaceAppScripts([{ appId: "live-chat", config: { propertyId: "nope", widgetId: "x" } }])).toBe("");
  });
});

describe("generateWorkspaceAppScripts — gating", () => {
  it("ignores non-configurable / unknown app ids", () => {
    expect(generateWorkspaceAppScripts([{ appId: "commerce", config: VALID }])).toBe("");
    expect(generateWorkspaceAppScripts([{ appId: "memberships", config: {} }])).toBe("");
    expect(generateWorkspaceAppScripts([{ appId: "made-up", config: VALID }])).toBe("");
  });

  it("returns '' for an empty install list", () => {
    expect(generateWorkspaceAppScripts([])).toBe("");
  });

  it("skips a broken row but still emits a valid sibling", () => {
    const out = generateWorkspaceAppScripts([
      { appId: "commerce", config: {} },
      { appId: "live-chat", config: VALID },
    ]);
    expect(out).toContain("embed.tawk.to");
  });
});
