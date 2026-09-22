/**
 * chipTones — contract tests for the 4-tone chip palette (plan #26, C2).
 *
 * Three places used to carry their own tone vocabularies and drift apart:
 * PublishGateBanner (`error | warn | neutral | hidden`), IssueChip
 * (`neutral | warning | error` with Tailwind defaults `tw:bg-yellow-50` /
 * `tw:bg-red-100`), and Topbar ReviewBadge (`info | warning | success`).
 *
 * This file pins the contract:
 *   - `TONE_FOR_GATE` covers every NextMoveGate value (no holes — a new
 *     gate added to lifecycle.ts would otherwise silently map to `undefined`).
 *   - `TONE_CLASS` only references `--bk-*` tokens. Tailwind defaults
 *     (`tw:bg-yellow-50`, `tw:bg-red-100`) are banned — Gate 24 audit
 *     earlier caught this exact regression.
 *   - `toneForIssues` and `toneForReviewPill` adapters preserve their
 *     documented semantics (errors > warnings > neutral; warning → warn;
 *     info / success → neutral).
 *
 * The visible surfaces (PublishGateBanner, IssueChip, Topbar ReviewBadge)
 * have their own rendering tests in `chrome-ui/__tests__/IssueChip.test.tsx`
 * and `shell/__tests__/StudioHeader.test.tsx`. This file tests the table
 * itself.
 *
 * @license BSD-3-Clause
 */
import { describe, it, expect } from "vitest";
import {
  TONE_FOR_GATE,
  TONE_CLASS,
  toneForIssues,
  toneForReviewPill,
  type Tone,
} from "../chipTones";
import type { NextMoveGate } from "../lifecycle";

describe("chipTones — 4-tone palette SSOT (plan #26, C2)", () => {
  describe("TONE_FOR_GATE — every NextMoveGate value is mapped", () => {
    /* The lifecycle enum has 6 values today. If a 7th lands and this table
       forgets it, TS still compiles (key access returns undefined), so the
       banner would render with `TONE_CLASS[undefined]` = undefined classes.
       Pin the membership so a missing mapping fails loudly here. */
    const EXPECTED_GATES: readonly NextMoveGate[] = [
      "open-errors",
      "changes-requested",
      "waiting",
      "stale-approval",
      "confirm",
      "none",
    ] as const;

    it("contains exactly the six NextMoveGate values", () => {
      expect(Object.keys(TONE_FOR_GATE).sort()).toEqual([...EXPECTED_GATES].sort());
    });

    it("'open-errors' gates a publish — the only error-tone mapping", () => {
      expect(TONE_FOR_GATE["open-errors"]).toBe("error");
    });

    it("'changes-requested' is a non-publish move and must render nothing", () => {
      expect(TONE_FOR_GATE["changes-requested"]).toBe("hidden");
    });

    it("'waiting' is the routine 'sent, no answer yet' — neutral surface", () => {
      expect(TONE_FOR_GATE["waiting"]).toBe("neutral");
    });

    it("'stale-approval' (client signed off, but the site changed) is warn", () => {
      expect(TONE_FOR_GATE["stale-approval"]).toBe("warn");
    });

    it("'confirm' gates nothing — banner would contradict the open-feedback CTA", () => {
      expect(TONE_FOR_GATE["confirm"]).toBe("hidden");
    });

    it("'none' is not a publish move at all", () => {
      expect(TONE_FOR_GATE["none"]).toBe("hidden");
    });
  });

  describe("TONE_CLASS — --bk-* tokens only, never Tailwind defaults", () => {
    it("error tone paints with --bk-error / --bk-error-tint / --bk-error-text", () => {
      const cls = TONE_CLASS.error;
      expect(cls).toContain("tw:border-[var(--bk-error)]");
      expect(cls).toContain("tw:bg-[var(--bk-error-tint)]");
      expect(cls).toContain("tw:text-[var(--bk-error-text)]");
    });

    it("warn tone paints with --bk-warning / --bk-warning-tint / --bk-warning-text", () => {
      const cls = TONE_CLASS.warn;
      expect(cls).toContain("tw:border-[var(--bk-warning)]");
      expect(cls).toContain("tw:bg-[var(--bk-warning-tint)]");
      expect(cls).toContain("tw:text-[var(--bk-warning-text)]");
    });

    it("neutral tone paints with --bk-border / --bk-bg-subtle / --bk-ink", () => {
      const cls = TONE_CLASS.neutral;
      expect(cls).toContain("tw:border-[var(--bk-border)]");
      expect(cls).toContain("tw:bg-[var(--bk-bg-subtle)]");
      expect(cls).toContain("tw:text-[var(--bk-ink)]");
    });

    it("'hidden' is the empty string — callers MUST short-circuit before rendering", () => {
      expect(TONE_CLASS.hidden).toBe("");
    });

    /* Gate 24 audit earlier caught IssueChip reverting to Tailwind defaults.
       Pin every tone so the next revert fails the test, not a screenshot
       review in three weeks. */
    it("contains no Tailwind default colour utilities — only --bk-* tokens", () => {
      const BANNED = [
        "tw:bg-yellow-50",
        "tw:bg-yellow-100",
        "tw:bg-red-50",
        "tw:bg-red-100",
        "tw:text-yellow-800",
        "tw:text-red-700",
      ];
      for (const tone of ["error", "warn", "neutral", "hidden"] as Tone[]) {
        for (const banned of BANNED) {
          expect(TONE_CLASS[tone], `TONE_CLASS.${tone} contains banned "${banned}"`).not.toContain(banned);
        }
      }
    });

    it("every Tone value has a class entry — no holes", () => {
      const expected: Tone[] = ["error", "warn", "neutral", "hidden"];
      for (const t of expected) {
        expect(TONE_CLASS[t], `TONE_CLASS.${t} missing`).toBeDefined();
      }
    });
  });

  describe("toneForIssues — issue count → tone", () => {
    it("zero issues is neutral (the all-clear shield-check glyph)", () => {
      expect(toneForIssues(0, 0)).toBe("neutral");
    });

    it("one or more errors is error (octagon glyph wins)", () => {
      expect(toneForIssues(1, 0)).toBe("error");
      expect(toneForIssues(1, 5)).toBe("error");
      expect(toneForIssues(99, 0)).toBe("error");
    });

    it("warnings only is warn (triangle glyph)", () => {
      expect(toneForIssues(0, 1)).toBe("warn");
      expect(toneForIssues(0, 99)).toBe("warn");
    });

    it("never returns 'hidden' — the IssueChip is always rendered", () => {
      expect(toneForIssues(0, 0)).not.toBe("hidden");
      expect(toneForIssues(1, 0)).not.toBe("hidden");
      expect(toneForIssues(0, 1)).not.toBe("hidden");
    });
  });

  describe("toneForReviewPill — legacy 3-tone → 4-tone adapter", () => {
    it("'warning' maps to 'warn' (the one blocking review state keeps its colour)", () => {
      expect(toneForReviewPill("warning")).toBe("warn");
    });

    it("'info' maps to 'neutral' (T8/D7 rule 3 — information is not instruction)", () => {
      expect(toneForReviewPill("info")).toBe("neutral");
    });

    it("'success' maps to 'neutral' (approved is all-clear, not loud)", () => {
      expect(toneForReviewPill("success")).toBe("neutral");
    });

    it("never returns 'error' — a review state is never error-typed", () => {
      expect(toneForReviewPill("warning")).not.toBe("error");
      expect(toneForReviewPill("info")).not.toBe("error");
      expect(toneForReviewPill("success")).not.toBe("error");
    });
  });
});
