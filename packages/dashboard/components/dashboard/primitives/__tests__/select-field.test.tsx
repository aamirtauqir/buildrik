/**
 * One select shape, and a guard that keeps it that way.
 *
 * Before `SelectField`, the dashboard's `<select>` elements rendered in six
 * shapes: `rounded-md border px-3 py-2` (profile), `rounded-md border px-2
 * py-1.5` (redirects), `rounded-lg border px-3 py-1.5` (theme, submissions),
 * `rounded-lg border px-3 py-2` (media, ticket) and a local
 * `SELECT_FIELD_CLASS` in workspace-form at a fixed 42px. Two radii, three
 * paddings, two focus treatments — the same "one control, many shapes" defect
 * the 2026-08-27 audit named for buttons, still live for selects.
 *
 * The shape assertions are jsdom-safe on purpose: they check the classes and
 * the DOM the primitive emits, not computed pixels, because jsdom applies no
 * Tailwind stylesheet (see `check-button-variants.mjs` for the browser-side
 * measurement). The inventory test is the one that actually prevents drift.
 */
import { describe, it, expect } from "vitest";
import { readFileSync, readdirSync, statSync } from "node:fs";
import path from "node:path";
import { render, screen } from "@testing-library/react";
import { SelectField } from "../select-field";

const DASHBOARD_ROOT = path.resolve(__dirname, "../../../..");

/** Raw `<select>` is allowed only here, and each entry states why. */
const ALLOWED_RAW_SELECT: Record<string, string> = {
  "components/dashboard/primitives/select-field.tsx": "the primitive itself",
  "components/onboarding/wizard/onb-select.tsx":
    "onboarding runs its own token namespace (h-onb-input, rounded-onb, text-onb-text) until its reskin — pulling the dashboard DS in here would mix two systems",
  "components/site-detail/tab-nav.tsx":
    "the narrow-viewport tab switcher: a nav control that happens to be a <select>, not a form field",
};

function tsxFilesUnder(dir: string, acc: string[] = []): string[] {
  for (const entry of readdirSync(dir)) {
    if (entry === "node_modules" || entry === ".next" || entry === "__tests__") continue;
    const full = path.join(dir, entry);
    if (statSync(full).isDirectory()) tsxFilesUnder(full, acc);
    else if (entry.endsWith(".tsx")) acc.push(full);
  }
  return acc;
}

describe("SelectField", () => {
  it("takes the chevron off the operating system", () => {
    render(
      <SelectField aria-label="Language" defaultValue="en">
        <option value="en">English</option>
      </SelectField>,
    );
    // appearance-none is what stops the platform painting its own arrow; the
    // lucide chevron is what replaces it. Both, or the control looks different
    // on every OS.
    expect(screen.getByLabelText("Language").className).toContain("appearance-none");
    expect(document.querySelector("svg")).not.toBeNull();
  });

  it("wears InputField's ring, so a select and an input beside it match", () => {
    const { container } = render(
      <SelectField aria-label="Timezone" defaultValue="UTC">
        <option value="UTC">UTC</option>
      </SelectField>,
    );
    const wrapper = container.firstElementChild!;
    const input = readFileSync(path.join(DASHBOARD_ROOT, "components/dashboard/primitives/input-field.tsx"), "utf-8");
    for (const cls of ["h-[42px]", "rounded-lg", "shadow-[inset_0_0_0_1px_var(--color-border-input)]"]) {
      expect(wrapper.className, `SelectField is missing ${cls}`).toContain(cls);
      expect(input, `InputField no longer carries ${cls} — the two shapes have drifted`).toContain(cls);
    }
  });

  it("sm is exactly Button sm, not a third height", () => {
    const { container } = render(
      <SelectField size="sm" aria-label="Frequency" defaultValue="off">
        <option value="off">Off</option>
      </SelectField>,
    );
    // h-9 = 36px = flowbite Button size="sm". It was h-8 (32px) for an
    // afternoon, which put a 32px select beside a 36px button on the site
    // redirects row — the defect this file exists to prevent.
    expect(container.firstElementChild!.className).toContain("h-9");
    expect(container.firstElementChild!.className).not.toContain("h-[42px]");
  });

  it("no screen hand-rolls a <select> outside the declared exceptions", () => {
    const offenders: string[] = [];
    for (const dir of ["app", "components"]) {
      for (const file of tsxFilesUnder(path.join(DASHBOARD_ROOT, dir))) {
        const rel = path.relative(DASHBOARD_ROOT, file);
        if (rel in ALLOWED_RAW_SELECT) continue;
        // `<select` with a following newline or space — the opening tag, not
        // the word inside a comment or a string.
        if (/<select[\s>]/.test(readFileSync(file, "utf-8"))) offenders.push(rel);
      }
    }
    expect(
      offenders,
      `Build it from SelectField so it takes the one shape, or add it to ALLOWED_RAW_SELECT with the role it plays:\n  ${offenders.join("\n  ")}`,
    ).toEqual([]);
  });
});
