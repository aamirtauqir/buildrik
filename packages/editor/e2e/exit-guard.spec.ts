/**
 * The unsaved-work exit guard, driven rather than assumed (blocker F3).
 *
 * WHY THIS FILE EXISTS
 * F3 recorded that the exit guard "did not fire on nudge" and concluded
 * `beforeunload` is "likely undrivable". Nothing behind that word was measured:
 * a repo-wide grep of `e2e/` and `scripts/` for `runBeforeUnload` or
 * `page.on("dialog")` returned nothing, so the harness had never attempted it.
 * Playwright drives this directly. The blocker was four lines, not a browser
 * limitation.
 *
 * THE POSITIVE CONTROL IS THE POINT
 * "No dialog appeared" is worthless on its own — it is exactly what a broken
 * instrument reports. So the first test registers its own always-blocking
 * handler and asserts a dialog IS observed. Only once the instrument has been
 * watched succeeding does the second test's silence mean anything about the
 * product. This is the same rule that caught F2: a null result is the harness
 * until proven otherwise.
 *
 * WHAT IS ASSERTED, AND WHAT IS NOT
 * `StudioHeader.tsx:460-469` prompts only when `isDirty || saveStatus ===
 * "saving" || stranded > 0`, and never when `bypassRef` is set. This file
 * covers the CLEAN branch — a freshly loaded editor with nothing unsaved must
 * not nag on exit, which is a real product promise and the half a user hits
 * most. The DIRTY branch needs a real edit driven into the canvas first; that
 * is a state drive, not a capability gap, and it is named in F3 rather than
 * silently skipped.
 *
 * @license BSD-3-Clause
 */
import { test, expect } from "@playwright/test";

/** Collect any beforeunload prompt raised while closing the page. */
async function closeAndCollectDialog(page: import("@playwright/test").Page): Promise<string | null> {
  let seen: string | null = null;
  page.on("dialog", async (d) => {
    seen = d.type();
    await d.dismiss().catch(() => {});
  });
  await page.close({ runBeforeUnload: true });
  // The prompt is delivered asynchronously after close() resolves.
  await new Promise((r) => setTimeout(r, 500));
  return seen;
}

test.describe("exit guard — beforeunload", () => {
  /**
   * POSITIVE CONTROL. Proves this harness can observe a beforeunload prompt at
   * all. If this test ever goes quiet, every other assertion in this file is
   * meaningless and should be read as "not measured", never as "passed".
   */
  test("the harness can observe a beforeunload prompt (instrument check)", async ({ page }) => {
    await page.addInitScript(() => {
      window.addEventListener("beforeunload", (e) => {
        e.preventDefault();
        // Chrome ignores the string but requires the assignment to prompt.
        (e as BeforeUnloadEvent).returnValue = "";
      });
    });
    await page.goto("/", { waitUntil: "domcontentloaded" });

    const seen = await closeAndCollectDialog(page);
    expect(
      seen,
      "Playwright saw no beforeunload dialog even with an always-blocking handler registered. " +
        "The instrument is broken — do not read the clean-state test below as evidence of anything.",
    ).toBe("beforeunload");
  });

  /**
   * PRODUCT ASSERTION — live since 2026-09-03, and the history is the point.
   *
   * A clean editor SHOULD raise no prompt: `StudioHeader.tsx:460-469` returns
   * early when `!isDirty && saveStatus !== "saving" && stranded === 0`. It
   * intermittently does prompt — measured at roughly 1 run in 3.
   *
   * WHICH OF THE THREE, MEASURED 2026-09-03. `isDirty`, and the guard is
   * RIGHT to fire. Nine fresh loads against `:5050`, each waiting for the
   * topbar to report "Saved" before closing: 3 prompted, 6 did not, and the
   * split is perfect — every prompting run's topbar read "Unsaved changes",
   * every silent run's read "Saved". `sawSaved` was true in all nine, so the
   * editor reports Saved and then turns itself dirty with no user input.
   *
   * That reclassifies the defect. This is not an exit-guard bug and not a
   * flaky test: the guard is correctly reporting real unsaved state, and the
   * product is manufacturing that state out of nothing. It also matters well
   * beyond a close prompt — autosave writes on dirty, and a spontaneous dirty
   * over a project that may not be fully loaded is the documented precondition
   * for the full-snapshot save dropping pages.
   *
   * THE CAUSE, once it was found: booting the editor CREATED A PAGE.
   * `useComposerInit.ts:341` seeds a default page when a project has none, via
   * `PageManager.createPage`, which emits `project:changed` — and the shell's
   * handler treats any such emit as an edit and raises `isDirty` immediately,
   * arming the save behind a 1000ms debounce. So a boot was indistinguishable
   * from an edit, and closing inside that one-second window prompted. The
   * `loadProject` branch had always cleared the flag after importing; the
   * bootstrap branch never did, and now does (`:356`).
   *
   * It was held as `.fixme` until then rather than left red, because a gate
   * that fails a third of the time gets disabled and takes the honest failures
   * with it. It came off on measurement, not on assurance: nine loads, 0
   * prompts, with the guard's own inputs recorded at fire time as
   * `isDirty=false, saveStatus=idle, stranded=0` in all nine. Before the fix
   * the same harness gave 2-3 prompts in 9. If this test ever goes red again,
   * that number is the thing to reproduce first.
   *
   * A NOTE ON THE INSTRUMENT, because it bit me here: use `innerText`, never
   * `textContent`. textContent concatenates across element boundaries with no
   * separator, so the topbar reads "…Untitled ProjectSaved · just now" and a
   * `\bSaved` match never fires. That wait then times out and reports as a
   * PRODUCT failure — I briefly had this test red 3/3 and the cause was my
   * matcher, not the guard.
   */
  test("a clean editor does not prompt on exit", async ({ page }) => {
    const DEMO = "http://localhost:5050/";
    const up = await page.request.get(DEMO).then((r) => r.ok()).catch(() => false);
    test.skip(!up, "demo app not running on :5050 — start `npm run dev`. NOT MEASURED, not passed.");

    await page.goto(DEMO, { waitUntil: "domcontentloaded" });
    await page.waitForSelector('[data-testid="topbar"]', { timeout: 30000 });
    await page.waitForFunction(
      () => /Saved/.test((document.querySelector('[data-testid="topbar"]') as HTMLElement | null)?.innerText ?? ""),
      { timeout: 15000 },
    );

    const seen = await closeAndCollectDialog(page);
    expect(
      seen,
      "A clean editor raised a beforeunload prompt. StudioHeader.tsx:462-464 should return early " +
        "when !isDirty, saveStatus !== 'saving' and there are no stranded mirrors.",
    ).toBeNull();
  });
});
