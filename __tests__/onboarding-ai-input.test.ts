import { describe, it, expect } from "vitest";
import { buildGenerateInput, DESCRIPTION_BUDGET } from "@lib/onboarding/ai-input";

/**
 * The AI wizard asks three screens of questions. `generateSiteSchema` has fields
 * for four of the answers, so the rest are folded into `description`, which the
 * schema caps at 500 characters. Everything folded shares that budget.
 *
 * This is the only place that arithmetic exists, and until it moved out of the
 * page component nothing could test it.
 */

/** What a user actually types when the field says "One-line description" and
 *  nothing enforces it. 473 characters. */
const LONG_DESC =
  "We are a full-service event planning and coordination company based in Lahore, " +
  "serving corporate clients and private families across Punjab. We handle weddings, " +
  "corporate offsites, product launches and milestone celebrations end to end, " +
  "including venue sourcing, catering coordination, decor design, vendor management, " +
  "guest logistics and day-of execution. Our team has delivered over four hundred " +
  "events since 2018 and we pride ourselves on calm, detail-obsessed delivery.";

const FULL_ANSWERS = {
  industry: "events",
  name: "Bright Events",
  desc: LONG_DESC,
  goal: "leads",
  audience: "Corporate event managers and engaged couples aged 25-40",
  cta: "Book a consultation call",
  location: "Lahore, Pakistan",
  style: "elegant and editorial",
  color: "deep green and cream",
  refs: "zola.com, thebridedept.com",
  tone: "premium",
  pages: ["Home", "Services", "Contact"],
};

describe("buildGenerateInput", () => {
  it("never exceeds the schema's description cap", () => {
    const { description } = buildGenerateInput(FULL_ANSWERS);
    expect(description.length).toBeLessThanOrEqual(DESCRIPTION_BUDGET);
  });

  /**
   * The regression. `desc` used to lead and the joined string was sliced at the
   * end, so a long description ate the budget: with these exact answers five of
   * the seven folded ones were dropped — CTA, location, style, colours and
   * references, which is the entire brand step. The user answered and the model
   * never saw it, with nothing anywhere reporting a problem.
   */
  it("keeps every structured answer even when the description is long", () => {
    const { description } = buildGenerateInput(FULL_ANSWERS);

    expect(description).toContain("Goal:");
    expect(description).toContain("Audience:");
    expect(description).toContain("Primary CTA:");
    expect(description).toContain("Location:");
    expect(description).toContain("Tone:");
    expect(description).toContain("Visual style:");
    expect(description).toContain("Colors:");
    expect(description).toContain("Reference sites:");
  });

  it("still includes as much of the description as fits", () => {
    const { description } = buildGenerateInput(FULL_ANSWERS);
    expect(description.startsWith(LONG_DESC.slice(0, 40))).toBe(true);
  });

  it("uses the whole description when there is room for it", () => {
    const { description } = buildGenerateInput({
      desc: "Event planning and coordination services",
      goal: "leads",
      style: "minimal",
    });
    expect(description).toContain("Event planning and coordination services");
    expect(description).toContain("Goal: get leads.");
    expect(description).toContain("Visual style: minimal.");
  });

  // Clauses are free text too. They must not be cut mid-sentence — half a clause
  // reads as noise. Whole clauses drop from the end instead.
  it("drops whole clauses rather than truncating one mid-sentence", () => {
    const { description } = buildGenerateInput({
      desc: "",
      goal: "leads",
      // Long enough that the references clause genuinely cannot fit after it:
      // goal(17) + audience(471) = 488, leaving no room for the 39-char refs clause.
      audience: "x".repeat(460),
      refs: "should-not-appear.com",
    });
    expect(description).toContain("Goal: get leads.");
    expect(description).not.toContain("should-not-appear.com");
    // Whatever survived ends on a complete clause, not a severed one.
    expect(description.trim().endsWith(".")).toBe(true);
  });

  /**
   * `tone` has a schema field of its own, and it still has to be folded. The
   * worker collapses that field to a 3-value style — professional, casual,
   * creative and playful all become "modern" — so four of the five wizard
   * choices reached the model identical. The clause carries the real answer.
   */
  it("folds tone into the prompt even though the schema has a tone field", () => {
    const { description, tone } = buildGenerateInput({ desc: "A bakery", tone: "premium" });
    expect(tone).toBe("creative");
    expect(description).toContain("Tone: premium.");
  });

  it("maps the non-folded answers onto their own schema fields", () => {
    const out = buildGenerateInput(FULL_ANSWERS);
    expect(out.name).toBe("Bright Events");
    expect(out.businessType).toBe("BUSINESS"); // events → BUSINESS
    expect(out.tone).toBe("creative"); // premium → creative
    expect(out.pages).toEqual(["Home", "Services", "Contact"]);
  });

  it("falls back to sane defaults when optional answers are missing", () => {
    const out = buildGenerateInput({});
    expect(out.name).toBe("My Site");
    expect(out.businessType).toBe("BUSINESS");
    expect(out.tone).toBe("professional");
    expect(out.pages).toEqual(["Home", "About", "Contact"]);
  });
});
