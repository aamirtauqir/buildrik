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
 * THE UNDO STACK IS PART OF THIS, added after a third instance.
 * The same bootstrap seeding that raised the dirty flag also left the editor
 * booting with a NON-EMPTY UNDO STACK: each seeded `createPage` emits
 * `project:changed`, the recorder turns each into an undo patch, and the first
 * Cmd+Z therefore rewinds past project initialisation. Measured consequence:
 * on a freshly loaded editor, with no user action at all, one Cmd+Z on the
 * Brand colour view wiped all 39 colour tokens and the panel read "No colors
 * yet". `HistoryManager` already solves this for the server-load path — it
 * wipes the stack and records one baseline, its comment noting the import
 * phase's intermediate states are "NOT user-undoable steps" — and the
 * bootstrap path never got the same treatment.
 *
 * So this gate asserts BOTH halves of "boot left nothing behind": no dirty
 * flag, and nothing to undo. One assertion at boot catches the whole family,
 * which is cheap next to an unrequested autosave write or a wiped token list.
 *
 * WHAT IT CANNOT SEE, stated rather than implied: `useSaveState`'s own flag
 * (`useSaveState.ts:40`, the settings screens) is not reachable from the page
 * and is NOT asserted here. Two of three flags are covered.
 *
 * A FOURTH INSTANCE, same day, and this one destroyed data. The same bootstrap
 * seeding put the app's own startup on the UNDO stack: each `createPage` emits
 * `project:changed` and the recorder turns it into a patch, so a freshly loaded
 * editor had the footer Undo ENABLED with the user having done nothing. One
 * Cmd+Z rewound past initialisation, and the Brand panel faithfully reloaded a
 * state with no design tokens — all 39 colours replaced by "No colors yet."
 * under a footer reading "Brand is up to date". It was filed as a Brand bug and
 * was not one.
 *
 * So the invariant is wider than the dirty flags: a fresh boot must leave
 * NOTHING to undo either. An enabled Undo on an untouched editor is the visible
 * tell for this whole family, and it is asserted below.
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
    /* 25s per load, not 15. Eight boots is inherently slow, and at 15s this
       died with `page.waitForTimeout: Test ended` on a machine running two
       suites at once — which reads exactly like an assertion failure and is
       not one. A duration-shaped failure with no assertion text is a starved
       process until a solo re-run says otherwise. */
    test.setTimeout(LOADS * 25_000);

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
    const undoDisabled: (boolean | null)[] = [];
    /* null = no Undo control found, which must fail loudly rather than pass as
       "not enabled" — an absent instrument is not a clean result. */
    const undoEnabled: (boolean | null)[] = [];

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

      /* Read BEFORE any interaction — the whole point is that a bare boot
         should leave nothing undoable. A missing button reports null and is
         asserted separately, so a renamed control cannot quietly pass. */
      undoDisabled.push(
        await page.evaluate(() => {
          const b = [...document.querySelectorAll("button")].find((n) =>
            /undo/i.test(n.getAttribute("aria-label") ?? ""),
          ) as HTMLButtonElement | undefined;
          return b ? b.disabled || b.getAttribute("aria-disabled") === "true" : null;
        }),
      );

      /* The recorder arms a setTimeout(0) that arms a 500ms coalesce timer, so
         a seeding patch does not reach the stack for at least that long. The
         first version of this read ran before it and reported "not enabled" on
         a build that WAS broken — the negative test passed, which is the only
         reason it was caught. Settle well past the window before reading. */
      await page.waitForTimeout(2500);

      /* The UNDO stack, read the way a user sees it. Asking the button rather
         than the manager is deliberate: the defect was that the affordance and
         the stack agreed, and both were wrong, so a green reading here means
         nothing is offered to undo, whatever the internals say. */
      undoEnabled.push(
        await page.evaluate(() => {
          const btn = [...document.querySelectorAll("button")].find((b) =>
            /undo/i.test(b.getAttribute("aria-label") ?? b.title ?? ""),
          );
          return btn ? !(btn as HTMLButtonElement).disabled : null;
        }),
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
    const undoMissing = undoDisabled.filter((d) => d === null).length;
    expect(
      undoMissing,
      `No control with an "Undo" aria-label was found on ${undoMissing}/${LOADS} loads, so the undo ` +
        "assertion below measured nothing. If the control was renamed, update this selector — do not " +
        "read a pass here as a clean boot.",
    ).toBe(0);

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

    /* Nothing to undo. The footer Undo control is the observable proxy for
       `canUndo()`, which is `length > 1` — correct logic that was being fed a
       stack containing the app's own startup. A control that is ENABLED here
       means boot left undoable work behind, whatever it happens to undo. */
    const undoArmed = undoDisabled.filter((d) => d === false).length;
    expect(
      undoArmed,
      `The Undo control was ENABLED after a bare boot on ${undoArmed}/${LOADS} loads. Boot seeding is ` +
        "leaving patches on the undo stack, so the user's first Cmd+Z rewinds past project " +
        "initialisation. This is the bootstrap half of the fix HistoryManager already applies to the " +
        "server-load path.",
    ).toBe(0);

    const engineTouched = engineDirty.filter((n) => n > 0).length;
    expect(
      engineTouched,
      `Composer.markDirty fired during boot on ${engineTouched}/${LOADS} loads — the engine dirty flag ` +
        "is meant to mean a user edit. This is the registerDefaults shape.",
    ).toBe(0);

    /* The instrument first, again: if no Undo control was found the readings
       below are vacuous, and "no button" must not read as "not enabled". */
    const missing = undoEnabled.filter((v) => v === null).length;
    expect(
      missing,
      `No Undo control found on ${missing}/${LOADS} loads — this assertion cannot see anything. ` +
        "Fix the selector before trusting a pass.",
    ).toBe(0);

    const undoOffered = undoEnabled.filter((v) => v === true).length;
    expect(
      undoOffered,
      `Undo was ENABLED on an untouched editor on ${undoOffered}/${LOADS} loads. Boot put its own ` +
        "startup on the history stack, so the first Cmd+Z rewinds past initialisation — that is how " +
        "all 39 Brand colour tokens were replaced by \"No colors yet.\" under a footer reading " +
        "\"Brand is up to date\". Seeding must end with flushPending() then clear().",
    ).toBe(0);
  });
});
