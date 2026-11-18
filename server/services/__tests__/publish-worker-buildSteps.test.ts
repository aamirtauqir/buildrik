import { describe, it, expect } from "vitest";
import { buildPublishSteps, PUBLISH_STEPS, SKIPPED_PUBLISH_STEPS } from "@buildrik/shared/schemas/publish";

/**
 * Publish worker — honest step status.
 *
 * "Optimizing images" (1) and "Performance check" (4) are not run in the MVP.
 * They must never report "done" (a green check for work that didn't happen),
 * and since A-32 (2L9 B8-PB07) they report "skipped" from the job's first
 * write, so the editor counts the three steps that run, not five.
 */
describe("publish worker · buildPublishSteps honest status", () => {
  const name = (i: number) => PUBLISH_STEPS[i];

  it("final state: skipped steps report 'skipped', real steps report 'done'", () => {
    const byName = Object.fromEntries(buildPublishSteps(PUBLISH_STEPS.length).map((s) => [s.name, s.status]));
    expect(byName[name(1)]).toBe("skipped");
    expect(byName[name(4)]).toBe("skipped");
    expect(byName[name(0)]).toBe("done");
    expect(byName[name(2)]).toBe("done");
    expect(byName[name(3)]).toBe("done");
  });

  it("a skipped step reports 'skipped' at every point, queued included", () => {
    for (let active = -1; active <= PUBLISH_STEPS.length; active++) {
      const steps = buildPublishSteps(active);
      for (const skipIdx of SKIPPED_PUBLISH_STEPS) {
        expect(steps[skipIdx].status, `step ${skipIdx} (active=${active})`).toBe("skipped");
      }
    }
  });

  it("queued (-1): every step that runs is pending — three of them", () => {
    const run = buildPublishSteps(-1).filter((s) => s.status !== "skipped");
    expect(run.map((s) => s.status)).toEqual(["pending", "pending", "pending"]);
  });

  it("mid-run: passed steps done, the active one active, the rest pending", () => {
    const steps = buildPublishSteps(2);
    expect(steps[0].status).toBe("done");
    expect(steps[2].status).toBe("active");
    expect(steps[3].status).toBe("pending");
  });

  it("failed state marks the active step 'failed', not 'done'", () => {
    expect(buildPublishSteps(2, true)[2].status).toBe("failed");
  });
});
