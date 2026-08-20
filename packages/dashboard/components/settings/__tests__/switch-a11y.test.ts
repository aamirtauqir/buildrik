/**
 * The settings switches say what they are and whether they're on.
 *
 * Every toggle in Settings is a hand-rolled `<button>` whose only visible state
 * is the pill's colour. Read live: the notification toggle had a name and no
 * state ("Toggle in-app for Site Updates, button" — identical on or off), the
 * workspace toggles had `aria-pressed` but no name at all ("button, pressed"),
 * and the integrations Toggle had neither role, state nor name. This locks the
 * trio — role, state, name — on all three components.
 *
 * @license BSD-3-Clause
 */
import { readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";

const read = (f: string) => readFileSync(join(__dirname, "..", f), "utf8");

describe("settings switches", () => {
  it("notification preferences: role, state and a name", () => {
    const src = read("notification-prefs.tsx");
    expect(src).toMatch(/role="switch"/);
    expect(src).toMatch(/aria-checked=\{pref\.inApp\}/);
    expect(src).toMatch(/aria-label=\{`In-app notifications for \$\{pref\.category\}`\}/);
  });

  it("workspace settings: every switch carries all three", () => {
    const src = read("workspace-form.tsx");
    expect((src.match(/role="switch"/g) ?? []).length).toBe(4);
    expect((src.match(/aria-checked=\{/g) ?? []).length).toBe(4);
    expect(
      (src.match(
        /aria-label="(Edits need approval before publishing|Require password on shared links|Allow editors to share|Activity summary emails)"/g,
      ) ?? []).length,
    ).toBe(4);
    // aria-pressed is for toggle BUTTONS; a switch reports aria-checked.
    expect(src).not.toMatch(/aria-pressed/);
  });

  it("integrations: the shared Toggle takes a label and reports state", () => {
    const src = read("integrations-tab.tsx");
    expect(src).toMatch(/role="switch"/);
    expect(src).toMatch(/aria-checked=\{checked\}/);
    expect(src).toMatch(/aria-label=\{label\}/);
    const calls = src.match(/<Toggle\b[\s\S]{0,200}?\/>/g) ?? [];
    expect(calls.length).toBeGreaterThan(0);
    for (const call of calls) expect(call, call).toMatch(/label=/);
  });
});
