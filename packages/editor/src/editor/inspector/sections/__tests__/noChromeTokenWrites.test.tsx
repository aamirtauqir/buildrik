/**
 * P-3 guard (P0, 2026-09-27): an Inspector write path wrote
 * `linear-gradient(90deg, var(--bk-accent), var(--bk-success))` into a
 * customer element. `--bk-*` are the editor chrome's own tokens — they never
 * exist in exported HTML, so the published gradient rendered as nothing.
 *
 * Walks every style section the Inspector renders: clicks every button,
 * picks every option of every select, types into every field — across the
 * states that change what those sections show (empty, flex, grid, gradient,
 * image) — and asserts no value handed to `onChange` / `onBatchChange`
 * carries a chrome token.
 *
 * @license BSD-3-Clause
 */
import * as React from "react";
import { describe, it, expect, afterEach } from "vitest";
import { render, fireEvent, cleanup } from "@testing-library/react";
import { BackgroundSection } from "../BackgroundSection";
import { BorderSection } from "../BorderSection";
import { EffectsSection } from "../EffectsSection";
import { GridSection } from "../GridSection";
import { SizeSection } from "../SizeSection";
import { SpacingSection } from "../SpacingSection";
import { VisibilitySection } from "../VisibilitySection";
import { FlexboxSection } from "../flexbox";
import { LayoutSection } from "../layout";
import { TypographySection } from "../typography";

type Write = (property: string, value: string) => void;
type Batch = (changes: Record<string, string>) => void;
type SectionProps = { styles: Record<string, string>; onChange: Write; onBatchChange: Batch };

const SECTIONS: Record<string, React.FC<SectionProps>> = {
  Background: (p) => <BackgroundSection {...p} isOpen advancedExpanded onAdvancedToggle={() => {}} />,
  Border: (p) => <BorderSection {...p} isOpen advancedExpanded onAdvancedToggle={() => {}} />,
  Effects: (p) => <EffectsSection {...p} isOpen />,
  Grid: (p) => <GridSection {...p} isGridContainer isGridItem isOpen />,
  Size: (p) => <SizeSection {...p} isOpen advancedExpanded onAdvancedToggle={() => {}} />,
  Spacing: (p) => <SpacingSection {...p} isOpen advancedExpanded onAdvancedToggle={() => {}} />,
  Visibility: (p) => <VisibilitySection {...p} isOpen />,
  Flexbox: (p) => <FlexboxSection {...p} isFlexItem isOpen />,
  Layout: (p) => <LayoutSection {...p} isOpen advancedExpanded onAdvancedToggle={() => {}} />,
  Typography: (p) => <TypographySection {...p} isOpen advancedExpanded onAdvancedToggle={() => {}} />,
};

const STATES: Record<string, Record<string, string>> = {
  empty: {},
  flex: { display: "flex" },
  grid: { display: "grid" },
  gradient: { background: "linear-gradient(90deg, #111111, #eeeeee)" },
  image: { "background-image": "url('https://x/y.png')" },
};

/** Section under a stateful host, so a write can open the controls it leads to. */
function Host({ Section, initial, writes }: { Section: React.FC<SectionProps>; initial: Record<string, string>; writes: string[] }) {
  const [styles, setStyles] = React.useState(initial);
  const onChange: Write = (property, value) => {
    writes.push(`${property}: ${value}`);
    setStyles((s) => ({ ...s, [property]: value }));
  };
  const onBatchChange: Batch = (changes) => {
    Object.entries(changes).forEach(([k, v]) => writes.push(`${k}: ${v}`));
    setStyles((s) => ({ ...s, ...changes }));
  };
  return <Section styles={styles} onChange={onChange} onBatchChange={onBatchChange} />;
}

function exercise(container: HTMLElement) {
  // Last unclicked button first: a control a click reveals renders after the
  // one that revealed it, so it is reached before an earlier sibling hides it
  // again (Gradient → Linear, before Color / Image switch the type away).
  const clicked = new Set<Element>();
  for (let i = 0; i < 300; i++) {
    const next = Array.from(container.querySelectorAll("button")).reverse().find((b) => !clicked.has(b));
    if (!next) break;
    clicked.add(next);
    fireEvent.click(next);
  }
  container.querySelectorAll("select").forEach((sel) => {
    Array.from(sel.options).forEach((o) => sel.isConnected && fireEvent.change(sel, { target: { value: o.value } }));
  });
  container.querySelectorAll("input").forEach((input) => {
    if (!input.isConnected || input.type === "checkbox" || input.type === "radio" || input.type === "file") return;
    const value = input.type === "range" || input.type === "number" ? "12" : "ff0000";
    fireEvent.change(input, { target: { value } });
    fireEvent.blur(input);
  });
}

afterEach(() => cleanup());

describe("P-3 guard — no Inspector style write carries an editor chrome token", () => {
  for (const [name, Section] of Object.entries(SECTIONS)) {
    for (const [state, initial] of Object.entries(STATES)) {
      it(`${name} · ${state}`, () => {
        const writes: string[] = [];
        const { container } = render(<Host Section={Section} initial={initial} writes={writes} />);
        exercise(container);
        expect(writes.filter((w) => w.includes("--bk-"))).toEqual([]);
      });
    }
  }

  it("Background · Gradient → Linear writes a site-safe gradient (the walk is not vacuous)", () => {
    const writes: string[] = [];
    const { container, getByRole } = render(<Host Section={SECTIONS.Background} initial={{}} writes={writes} />);
    fireEvent.click(getByRole("button", { name: "gradient" }));
    fireEvent.click(getByRole("button", { name: "Linear" }));
    exercise(container);
    expect(writes.some((w) => /^background: (linear|radial)-gradient\(/.test(w))).toBe(true);
    expect(writes.filter((w) => w.includes("--bk-"))).toEqual([]);
  });
});
