/**
 * CLASS-FIRST-SPEC §6 P0 acceptance 3 (service level, mocked Prisma): a save
 * from an editor that did not load the site in the class style model is
 * refused on a class-model site — nothing is written — and every other save
 * is unchanged. Plus the CLASS_STYLES flags that decide the effective model.
 */
import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";

const updateMany = vi.fn();
vi.mock("@/lib/prisma", () => ({
  prisma: {
    site: { findUnique: vi.fn() },
    $transaction: vi.fn((fn: (tx: unknown) => unknown) =>
      fn({
        page: {
          findMany: vi.fn().mockResolvedValue([]),
          findFirst: vi.fn().mockResolvedValue(null),
          deleteMany: vi.fn().mockResolvedValue({ count: 0 }),
          upsert: vi.fn().mockResolvedValue({}),
          update: vi.fn().mockResolvedValue({}),
        },
        site: { updateMany, findUnique: vi.fn() },
        formBlock: { deleteMany: vi.fn().mockResolvedValue({ count: 0 }) },
      }),
    ),
  },
}));
vi.mock("@/server/services/email.service", () => ({ sendSiteTransferredEmail: vi.fn() }));

import { prisma } from "@/lib/prisma";
import { saveProjectData, saveProjectFromEditor } from "@/server/services/sites.service";
import { effectiveStyleModel, isClassStylesEnabled, newSiteStyleModel } from "@/server/services/class-styles";
import { STYLE_MODEL_CONFLICT } from "@buildrik/shared/schemas/class-styles";

const stored = new Date("2026-10-21T09:00:00.000Z");
const ENV_KEYS = ["CLASS_STYLES", "CLASS_STYLES_WORKSPACES", "CLASS_STYLES_DEFAULT_NEW"] as const;

function siteRow(styleModel: string) {
  vi.mocked(prisma.site.findUnique).mockResolvedValue({
    deletedAt: null,
    lastEditedAt: stored,
    workspaceId: "ws-qa",
    dsSchemaVersion: 3,
    tokensMigrationHold: false,
    projectSettings: {},
    styleModel,
  } as never);
}

const save = (styleModelAck?: "class") =>
  saveProjectData({ siteId: "site-1", pages: [{ id: "p1", blocks: {}, position: 0 }], styles: [], settings: {}, styleModelAck }, stored.toISOString());

beforeEach(() => {
  vi.clearAllMocks();
  updateMany.mockResolvedValue({ count: 1 });
  for (const k of ENV_KEYS) delete process.env[k];
});
afterEach(() => {
  for (const k of ENV_KEYS) delete process.env[k];
});

describe("class-styles flags", () => {
  it("are off by default: every site is element, new sites too", () => {
    expect(isClassStylesEnabled("ws-qa")).toBe(false);
    expect(effectiveStyleModel("class", "ws-qa")).toBe("element");
    expect(newSiteStyleModel("ws-qa")).toBe("element");
  });

  it("CLASS_STYLES_WORKSPACES enables only the listed workspaces; CLASS_STYLES=on enables all", () => {
    process.env.CLASS_STYLES_WORKSPACES = "ws-a, ws-qa";
    expect(effectiveStyleModel("class", "ws-qa")).toBe("class");
    expect(effectiveStyleModel("class", "ws-other")).toBe("element");
    expect(effectiveStyleModel("element", "ws-qa")).toBe("element");
    delete process.env.CLASS_STYLES_WORKSPACES;
    process.env.CLASS_STYLES = "on";
    expect(effectiveStyleModel("class", "ws-other")).toBe("class");
    expect(effectiveStyleModel(null, "ws-other")).toBe("element");
  });

  it("CLASS_STYLES_DEFAULT_NEW starts new sites in class mode only where the switch is on", () => {
    process.env.CLASS_STYLES_DEFAULT_NEW = "on";
    expect(newSiteStyleModel("ws-qa")).toBe("element");
    process.env.CLASS_STYLES_WORKSPACES = "ws-qa";
    expect(newSiteStyleModel("ws-qa")).toBe("class");
  });
});

describe("saveProjectData — stale-editor guard on class-model sites", () => {
  it("refuses a save without the class ack, as a conflict every bundle reads, and writes nothing", async () => {
    process.env.CLASS_STYLES_WORKSPACES = "ws-qa";
    siteRow("class");
    await expect(save()).rejects.toThrow(`${STYLE_MODEL_CONFLICT} SAVE_CONFLICT:${stored.toISOString()}`);
    const err = (await save().catch((e: Error) => e)) as Error;
    expect(/SAVE_CONFLICT:(.+)$/.exec(err.message)?.[1]).toBe(stored.toISOString());
    expect(prisma.$transaction).not.toHaveBeenCalled();
    expect(updateMany).not.toHaveBeenCalled();
  });

  it("accepts the save from an editor that loaded the class model", async () => {
    process.env.CLASS_STYLES_WORKSPACES = "ws-qa";
    siteRow("class");
    await expect(save("class")).resolves.toMatchObject({ success: true });
    expect(updateMany).toHaveBeenCalled();
  });

  it("is inert with the flags off, even for a site whose column says class", async () => {
    siteRow("class");
    await expect(save()).resolves.toMatchObject({ success: true });
  });

  it("leaves legacy sites alone, with or without an ack", async () => {
    process.env.CLASS_STYLES = "on";
    siteRow("element");
    await expect(save()).resolves.toMatchObject({ success: true });
    await expect(save("class")).resolves.toMatchObject({ success: true });
  });

  it("the editor save path threads the ack through", async () => {
    process.env.CLASS_STYLES_WORKSPACES = "ws-qa";
    siteRow("class");
    const project = { version: "1.0", pages: [{ id: "p1", name: "Home", root: {} }], styles: [], assets: [] };
    await expect(saveProjectFromEditor("site-1", project, stored.toISOString(), "u1")).rejects.toThrow(STYLE_MODEL_CONFLICT);
    await expect(saveProjectFromEditor("site-1", project, stored.toISOString(), "u1", "class")).resolves.toMatchObject({ success: true });
  });
});
