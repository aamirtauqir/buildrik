/**
 * The failed save as the global slot's one bar (owner 2026-10-26, board C05
 * `10:2199`): what failed, that the changes are kept, Retry — and the reasons
 * a retry cannot fix offer none.
 *
 * @license BSD-3-Clause
 */
import { describe, it, expect, vi } from "vitest";
import { BANNER_ID, saveFailedBanner } from "../globalBanners";

const labels = (b: ReturnType<typeof saveFailedBanner>) => (b.actions ?? []).map((a) => a.label);

describe("saveFailedBanner", () => {
  it("shares the connection id, so can't-reach / reconnecting / couldn't-save are one bar", () => {
    const b = saveFailedBanner({ where: "Fieldwork · Home", retry: () => {} });
    expect(b.id).toBe(BANNER_ID.connection);
    expect(b.tone).toBe("error");
  });

  it("plain failure: what failed, that the changes are kept, Retry", () => {
    const retry = vi.fn();
    const b = saveFailedBanner({ where: "Fieldwork · Home", error: "HTTP 500", retry });
    expect(b.message).toBe("Couldn't save Fieldwork · Home. Your changes are kept.");
    expect(labels(b)).toEqual(["Retry"]);
    b.actions![0].onClick();
    expect(retry).toHaveBeenCalledOnce();
  });

  it("a failed save-and-leave says the user is still here; its retry leaves, Keep editing stays", () => {
    const b = saveFailedBanner({ where: "S · Home", leaving: true, retry: () => {}, keepEditing: () => {} });
    expect(b.message).toBe("Couldn't save S · Home. Your changes are kept. You have not left the editor.");
    expect(labels(b)).toEqual(["Retry save & leave", "Keep editing"]);
  });

  it("names a brand refusal instead of blaming the connection, and offers no pointless retry (I1)", () => {
    const b = saveFailedBanner({ where: "S · Home", error: "TOKENS_INVALID: colour 'brand' is not a colour", retry: () => {} });
    expect(b.message).toContain("The brand change was refused: colour 'brand' is not a colour");
    expect(b.message).toContain("undo the last brand change");
    expect(labels(b)).toEqual([]);
  });

  it("does not tell a user whose Brand is read-only to undo a brand change they cannot make", () => {
    const b = saveFailedBanner({ where: "S · Home", error: "TOKENS_INVALID: bad", brandLocked: true, retry: () => {} });
    expect(b.message).toContain("reload to keep editing");
    expect(b.message).not.toContain("undo");
  });

  it("a page limit, a deleted site and a foreign page are not retried", () => {
    expect(labels(saveFailedBanner({ where: "S", error: "PAGE_LIMIT: Free sites hold 10 pages.", retry: () => {} }))).toEqual([]);
    expect(saveFailedBanner({ where: "S", error: "PAGE_LIMIT: Free sites hold 10 pages.", retry: () => {} }).message).toBe(
      "Not saved — page limit reached. Free sites hold 10 pages.",
    );
    expect(labels(saveFailedBanner({ where: "S", error: "SITE_MISSING", retry: () => {} }))).toEqual([]);
    expect(labels(saveFailedBanner({ where: "S", error: "page belongs to another site", retry: () => {} }))).toEqual([]);
  });

  it("a site that never loaded offers Reload, as a warning", () => {
    const b = saveFailedBanner({ where: "S", error: "PROJECT_NOT_LOADED", retry: () => {} });
    expect(b.tone).toBe("warning");
    expect(labels(b)).toEqual(["Reload"]);
  });
});
