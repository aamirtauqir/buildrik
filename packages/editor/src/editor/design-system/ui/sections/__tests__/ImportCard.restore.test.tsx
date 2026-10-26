/**
 * ImportCard — 2L9 B6-B17 / B6-B49: a "Before import" restore point first;
 * offline, "Apply with local recovery only?"; applied, the result card.
 *
 * @license BSD-3-Clause
 */
import { describe, it, expect, beforeEach, vi } from "vitest";
import { render, fireEvent, act, waitFor } from "@testing-library/react";
import * as React from "react";
import { ImportCard } from "../ImportCard";
import { TokenRegistryProvider } from "@/editor/design-system/state/TokenRegistryContext";
import { ToastProvider } from "@/editor/chrome-ui";
import { makeFakeComposer } from "@/editor/design-system/ui/__tests__/brandWorkspaceHarness";

const take = vi.fn(async (..._a: unknown[]) => true);
vi.mock("@/editor/design-system/state/useBrandRestorePoints", () => ({ takeRestorePoint: (...a: unknown[]) => take(...a) }));
vi.mock("@/services/BuildrikSyncProvider", () => ({ getSiteIdFromUrl: () => "s1" }));

let composer = makeFakeComposer();
const mount = () =>
  render(
    <ToastProvider>
      <TokenRegistryProvider composer={composer}>
        <ImportCard composer={composer} />
      </TokenRegistryProvider>
    </ToastProvider>,
  );
const FILE = new File(
  [JSON.stringify([{ id: "color-imported", name: "Imported", value: "#0055FF", category: "colors", cssVar: "--x", type: "color", kind: "color" }])],
  "studio-tokens.json",
  { type: "application/json" },
);
async function dryRun(u: ReturnType<typeof mount>) {
  await act(async () => {
    fireEvent.drop(u.getByTestId("import-drop-zone"), { dataTransfer: { files: [FILE] } });
  });
  await u.findByTestId("import-apply");
}

beforeEach(() => {
  take.mockReset();
  take.mockResolvedValue(true);
  composer = makeFakeComposer();
});

describe("ImportCard — restore point, offline, result", () => {
  it("takes a 'Before import' restore point, applies once, then shows the result card", async () => {
    const u = mount();
    await dryRun(u);
    fireEvent.click(u.getByTestId("import-apply"));
    const result = await u.findByTestId("import-result");
    expect(take).toHaveBeenCalledWith(composer, "s1", "import");
    expect(composer.designSystem.setTokens).toHaveBeenCalledTimes(1);
    expect(result.textContent).toContain("Imported studio-tokens.json · Update matching");
    expect(result.textContent).toContain("Applied 1 of 1, as shown in the preview. Restore point “Before import” was saved first.");
  });

  it("no restore point → nothing applied, Retry", async () => {
    take.mockResolvedValueOnce(false);
    const u = mount();
    await dryRun(u);
    fireEvent.click(u.getByTestId("import-apply"));
    expect(await u.findByTestId("import-restore-failed")).toBeTruthy();
    expect(composer.designSystem.setTokens).not.toHaveBeenCalled();
    expect(u.getByTestId("import-apply").textContent).toBe("Retry");
  });

  it("offline asks first; 'Apply locally' applies with no restore point", async () => {
    const spy = vi.spyOn(navigator, "onLine", "get").mockReturnValue(false);
    try {
      const u = mount();
      await dryRun(u);
      fireEvent.click(u.getByTestId("import-apply"));
      const dialog = await u.findByTestId("import-offline-dialog");
      expect(dialog.textContent).toContain("Apply with local recovery only?");
      expect(composer.designSystem.setTokens).not.toHaveBeenCalled();
      fireEvent.click(u.getByTestId("import-apply-local"));
      await waitFor(() => expect(composer.designSystem.setTokens).toHaveBeenCalledTimes(1));
      expect(take).not.toHaveBeenCalled();
      expect((await u.findByTestId("import-result")).textContent).not.toContain("Restore point");
    } finally {
      spy.mockRestore();
    }
  });
});
