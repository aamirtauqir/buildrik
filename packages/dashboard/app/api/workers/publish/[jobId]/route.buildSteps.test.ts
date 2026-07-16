import { describe, it, expect } from "vitest";
import { buildSteps, STEPS, SKIPPED_STEPS } from "./route";

/**
 * Publish worker — honest step status.
 *
 * Regression for the false-signal bug: "Optimizing images" (step 1) and
 * "Performance check" (step 4) are not run in the MVP, but buildSteps reported
 * them "done" — a green checkmark for work that never happened. They must report
 * "skipped" once the pipeline passes them, never "done".
 */
describe("publish worker · buildSteps honest status", () => {
  const name = (i: number) => STEPS[i];

  it("final state: skipped steps report 'skipped', real steps report 'done'", () => {
    // setStep(4) persists buildSteps(5) — the terminal successful state.
    const steps = buildSteps(STEPS.length);
    const byName = Object.fromEntries(steps.map((s) => [s.name, s.status]));
    expect(byName[name(1)]).toBe("skipped"); // Optimizing images
    expect(byName[name(4)]).toBe("skipped"); // Performance check (Lighthouse)
    expect(byName[name(0)]).toBe("done"); // Generating pages
    expect(byName[name(2)]).toBe("done"); // Deploying to CDN
    expect(byName[name(3)]).toBe("done"); // Verifying SSL
  });

  it("a skipped step is NEVER reported 'done' at any point in the pipeline", () => {
    for (let active = 0; active <= STEPS.length; active++) {
      const steps = buildSteps(active);
      for (const skipIdx of SKIPPED_STEPS) {
        expect(
          steps[skipIdx].status,
          `step ${skipIdx} ("${name(skipIdx)}") must never be "done" (active=${active})`,
        ).not.toBe("done");
      }
    }
  });

  it("a passed skipped step shows 'skipped', a not-yet-reached one shows 'pending'", () => {
    // active index 2 → step 1 already passed (skipped), step 4 not reached (pending)
    const steps = buildSteps(2);
    expect(steps[1].status).toBe("skipped");
    expect(steps[4].status).toBe("pending");
    expect(steps[2].status).toBe("active");
  });

  it("failed state marks the active step 'failed', not 'done'", () => {
    const steps = buildSteps(2, true);
    expect(steps[2].status).toBe("failed");
  });
});
