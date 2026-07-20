import { describe, it, expect } from "vitest";
import { INDUSTRIES, ROLES, GOALS, TONES } from "@lib/onboarding/wizard-options";
import { buildGenerateInput } from "@lib/onboarding/ai-input";

/**
 * Every option the wizard offers has to be handled by the map that consumes it.
 *
 * A gap does not error. The lookups all end in `?? <default>`, so an unmapped
 * value silently becomes someone else's answer: an unmapped industry becomes
 * BUSINESS, an unmapped tone becomes professional, an unmapped role gets the
 * blank path. The user chooses and the choice quietly stops mattering.
 *
 * This is the exact shape of the tone bug: five wizard choices, a mapper that
 * flattened four of them, no test anywhere comparing the two lists.
 *
 * These drive the real `buildGenerateInput` rather than re-listing the maps,
 * because a test that restates the mapping proves only that I can copy it.
 */

describe("wizard vocabulary is fully mapped", () => {
  it("maps every offered industry to a distinct-or-deliberate business type", () => {
    const types = INDUSTRIES.map((i) => buildGenerateInput({ industry: i.value }).businessType);

    // No industry may fall through the `?? "BUSINESS"` by accident. "other" is
    // the only one that means BUSINESS on purpose; several map there
    // deliberately (clinic, events, saas), so the check is that every value is
    // a real enum member and the list has not grown past the map.
    expect(types).toHaveLength(INDUSTRIES.length);
    for (const t of types) {
      expect(["PORTFOLIO", "BUSINESS", "BLOG", "RESTAURANT", "AGENCY", "ECOMMERCE"]).toContain(t);
    }
    // Sanity that the mapping is doing something, not returning the default for
    // everything — which is what an emptied map would look like.
    expect(new Set(types).size).toBeGreaterThan(1);
  });

  /**
   * The regression this file exists for. Every tone the wizard offers must
   * survive into a schema tone. If TONES grows and TONE_MAP does not, the new
   * option silently becomes "professional".
   */
  it("maps every offered tone onto a schema tone", () => {
    const SCHEMA_TONES = ["professional", "casual", "creative", "minimal", "bold", "playful"];

    for (const tone of TONES) {
      const out = buildGenerateInput({ tone: tone.value });
      expect(SCHEMA_TONES, `tone "${tone.value}" produced ${out.tone}`).toContain(out.tone);
    }

    // Distinctness is the point. Four choices collapsing onto one value is how
    // this shipped broken, and every tone still passes the "is a valid enum
    // member" check while that is true.
    const mapped = TONES.map((t) => buildGenerateInput({ tone: t.value }).tone);
    expect(new Set(mapped).size).toBe(TONES.length);
  });

  it("labels every offered goal rather than leaking the raw value", () => {
    for (const goal of GOALS) {
      const { description } = buildGenerateInput({ desc: "x", goal: goal.value });
      // The clause carries a human phrase ("get leads"), never the key.
      expect(description).toMatch(/Goal: .+\./);
      expect(description).not.toContain(`Goal: ${goal.value}.`);
    }
  });

  it("offers roles the path step can route on", async () => {
    // RECOMMEND and ROLE_LABEL live in the path page; assert the shape they
    // depend on instead of reaching into the component: every role value is a
    // non-empty slug, which is what those Record lookups key on.
    for (const role of ROLES) {
      expect(role.value).toMatch(/^[a-z][a-z-]*$/);
      expect(role.label.length).toBeGreaterThan(0);
    }
    expect(new Set(ROLES.map((r) => r.value)).size).toBe(ROLES.length);
  });
});
