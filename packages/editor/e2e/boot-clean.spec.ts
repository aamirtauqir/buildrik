/**
 * A fresh boot must leave the project CLEAN — no dirty flag raised, nothing
 * queued, nothing to save.
 *
 * WHY THIS FILE EXISTS
 * Three defects of one shape landed in a single day (2026-09-03), on three
 * different flags, each previously "solved" at exactly one call site:
 *
 *   - `GlobalStyleManager.registerDefaults` called `markDirty` while
 *     registering the seven built-in styles      → engine flag
 *   - `useComposerInit` seeded a default page via `PageManager.createPage`,
 *     which emits `project:changed`              → UI flag
 *   - `Composer.setProjectSettingsRaw` exists ONLY because someone hit this
 *     on the settings path and fixed that path   → settings flag
 *
 * Load-path work must not look like user work. The codebase keeps solving that
 * one site at a time and never generalises, so this asserts the invariant
 * itself: boot, settle, and every flag the exit guard can see is down.
 *
 * The risk is not the exit prompt. A spurious dirty triggers AUTOSAVE, and the
 * save is a full snapshot that drops pages omitted from it — an unrequested
 * write over a project that may not be fully hydrated is the documented
 * data-loss precondition. The prompt is only the visible edge.
 *
 * WHY IT LOOPS
 * The UI flag rises synchronously and the save is armed behind a 1000ms
 * debounce (`THRESHOLDS.AUTOSAVE_DEBOUNCE`), so a boot-dirty is only visible
 * for about a second and a single load misses it roughly two times in three.
 * Eight loads bring that to (2/3)^8 ≈ 4%. A one-shot version of this test
 * would have passed over every one of the three defects above.
 *
 * WHAT IT CANNOT SEE, stated rather than implied: `useSaveState`'s own flag
 * (`useSaveState.ts:40`, the settings screens) is not reachable from the page
 * and is NOT asserted here. Two of three flags are covered.
 *
 * @license BSD-3-Clause
 */
import { test, expect } from "@playwright/test";

const DEMO = "http://localhost:5050/";
const LOADS = 8;

type ExitReason = { isDirty: boolean; saveStatus: string; stranded: number };

test.describe("boot leaves the project clean", () => {
  test("no dirty flag survives a fresh boot", async ({ browser }) => {
    /* Eight full boots, each a fresh context, run well past Playwright's 30s
       default — the first version of this test died on that budget and
       reported it as `waitForSelector: Test ended`, which reads exactly like a
       product failure. A duration-shaped failure with no assertion text is a
       timeout until proven otherwise. */
    test.setTimeout(LOADS * 15_000);

    const up = await browser
      .newContext()
      .then(async (c) => {
        const p = await c.newPage();
        const ok = await p.goto(DEMO).then((r) => !!r?.ok()).catch(() => false);
        await c.close();
        return ok;
      });
    test.skip(!up, "demo app not running on :5050 — start `npm run dev`. NOT MEASURED, not passed.");

    const prompted: number[] = [];
    const reasons: (ExitReason | null)[] = [];
    const engineDirty: number[] = [];

    for (let i = 0; i < LOADS; i++) {
      const ctx = await browser.newContext();
      const page = await ctx.newPage();
      let sawDialog = false;
      page.on("dialog", async (d) => {
        sawDialog = true;
        await d.dismiss().catch(() => {});
      });

      await page.goto(DEMO, { waitUntil: "domcontentloaded" });
      await page.waitForSelector('[data-testid="topbar"]', { timeout: 30000 });
      await page
        .waitForFunction(
          () => /Saved/.test((document.querySelector('[data-testid="topbar"]') as HTMLElement | null)?.innerText ?? ""),
          { timeout: 15000 },
        )
        .catch(() => {});

      /* The ENGINE flag, read before the close: `Composer.markDirty` records a
         stack on its first transition under a DEV guard, so a non-empty trace
         means boot touched `Composer.state.dirty`. This is the half that
         catches a `registerDefaults`-shaped regression. */
      engineDirty.push(
        await page.evaluate(() => (window as unknown as { __bkDirtyTrace?: unknown[] }).__bkDirtyTrace?.length ?? 0),
      );

      /* The UI flag, read at the only moment it is exposed: the guard records
         its own inputs when `beforeunload` fires. Registered here rather than
         via addInitScript so this listener runs AFTER the guard's own and sees
         the pushed record; localStorage carries it past the close. */
      await page.evaluate(() => {
        window.addEventListener("beforeunload", () => {
          try {
            const w = window as unknown as { __bkExitReason?: unknown[] };
            localStorage.setItem("__bkBootClean", JSON.stringify(w.__bkExitReason ?? []));
          } catch {
            /* storage disabled — the assertion below reports it as unrecorded */
          }
        });
      });

      await page.close({ runBeforeUnload: true });
      await new Promise((r) => setTimeout(r, 700));

      const after = await ctx.newPage();
      await after.goto(DEMO, { waitUntil: "commit" });
      const raw = await after.evaluate(() => {
        try {
          return localStorage.getItem("__bkBootClean");
        } catch {
          return null;
        }
      });
      const parsed: ExitReason[] = raw ? JSON.parse(raw) : [];
      reasons.push(parsed[0] ?? null);
      if (sawDialog) prompted.push(i + 1);
      await ctx.close();
    }

    /* THE INSTRUMENT CHECK, first. If the guard never recorded, every
       assertion below is vacuous — this is the same rule that keeps the
       positive control in exit-guard.spec.ts. One run of mine came back
       prompted with an empty record because this listener lost the ordering
       race, and a silent pass there would have hidden a real prompt. */
    const unrecorded = reasons.filter((r) => r === null).length;
    expect(
      unrecorded,
      `${unrecorded}/${LOADS} loads recorded no exit reason. The guard's DEV recorder did not run, ` +
        "so this test measured nothing — do not read a pass here as a clean boot.",
    ).toBe(0);

    expect(
      prompted,
      `Boot raised something the exit guard cares about on run(s) ${prompted.join(", ")}. ` +
        `Recorded state: ${JSON.stringify(reasons.filter(Boolean))}`,
    ).toEqual([]);

    for (const [i, r] of reasons.entries()) {
      expect(r!.isDirty, `run ${i + 1}: the UI dirty flag was raised by boot alone`).toBe(false);
      expect(r!.stranded, `run ${i + 1}: boot left mirrors queued`).toBe(0);
      expect(r!.saveStatus, `run ${i + 1}: boot triggered a save`).not.toBe("saving");
    }

    const engineTouched = engineDirty.filter((n) => n > 0).length;
    expect(
      engineTouched,
      `Composer.markDirty fired during boot on ${engineTouched}/${LOADS} loads — the engine dirty flag ` +
        "is meant to mean a user edit. This is the registerDefaults shape.",
    ).toBe(0);
  });
});
