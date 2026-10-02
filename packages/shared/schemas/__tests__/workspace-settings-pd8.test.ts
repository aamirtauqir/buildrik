/**
 * Settings Phase B, BE-10 (PD-8) — the workspace schemas no longer carry
 * defaultLanguage / timezone / sharing `notify`: sent values are stripped,
 * never stored. (The columns stay until a separate migration.)
 *
 * @license BSD-3-Clause
 */
import { describe, it, expect } from "vitest";
import { updateWorkspaceSchema, workspaceSharingSettingsSchema } from "../account";

describe("workspace schemas (BE-10, PD-8)", () => {
  it("no longer carry defaultLanguage, timezone or notify — sent values are stripped", () => {
    expect(updateWorkspaceSchema.parse({ name: "Acme", defaultLanguage: "fr", timezone: "UTC" })).toEqual({ name: "Acme" });
    expect(workspaceSharingSettingsSchema.parse({ requirePw: true, notify: false })).toEqual({ requirePw: true });
  });
});
