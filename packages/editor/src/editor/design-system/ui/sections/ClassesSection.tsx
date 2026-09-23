/**
 * ClassesSection — Brand › Classes, board 7316:83357 (C1 (ii); was the
 * drawer's 153:2).
 *
 * One bordered card, a 48px row per class: `.name` in 14px ink over
 * "used N×". Departures, recorded: the board's "+ Add class" and per-row ›
 * have no code behind them — a class exists only on the elements that carry
 * it (there is no site-level class registry, see below) and there is no class
 * detail — so neither is drawn. Classes in the engine's own `buildrick-`
 * namespace (the page root's) are not the site's and are not listed.
 *
 * Every CSS class the pages actually carry, and how many elements carry it.
 * The brand panel had no such screen: classes could be typed onto elements one
 * at a time in the inspector, and nothing anywhere would tell you which ones
 * existed, how often, or whether a name had been typed two ways.
 *
 * The count is measured off the live element tree rather than a registry.
 * `composer.styles.getGlobalClasses()` — which the inspector's suggestion list
 * calls — is not implemented on the engine at all, so that list has always
 * come back empty; the tree is the only thing that knows.
 *
 * @license BSD-3-Clause
 */

import * as React from "react";
import type { Composer } from "../../../../engine";
import { EVENTS } from "../../../../shared/constants/events";
import { BrandCard, BrandRow } from "../BrandCard";

export interface ClassesSectionProps {
  composer?: Composer | null;
}

/** The engine's own class namespace — `buildrick-page-root` is on every page. */
const ENGINE_PREFIX = "buildrick-";

/** `.name` → how many elements carry it, most-used first. */
function tally(composer: Composer | null | undefined): [string, number][] {
  const all = composer?.elements?.getAllElements?.() ?? [];
  const counts = new Map<string, number>();
  for (const el of all) {
    for (const cls of el.getClasses?.() ?? []) {
      const name = String(cls).trim();
      if (!name || name.startsWith(ENGINE_PREFIX)) continue;
      counts.set(name, (counts.get(name) ?? 0) + 1);
    }
  }
  return [...counts.entries()].sort((a, b) => b[1] - a[1] || a[0].localeCompare(b[0]));
}

export const ClassesSection: React.FC<ClassesSectionProps> = ({ composer }) => {
  const [rows, setRows] = React.useState<[string, number][]>(() => tally(composer));

  React.useEffect(() => {
    setRows(tally(composer));
    if (!composer) return;
    const refresh = () => setRows(tally(composer));
    composer.on(EVENTS.ELEMENT_UPDATED, refresh);
    composer.on(EVENTS.ELEMENT_CREATED, refresh);
    composer.on(EVENTS.ELEMENT_DELETED, refresh);
    return () => {
      composer.off(EVENTS.ELEMENT_UPDATED, refresh);
      composer.off(EVENTS.ELEMENT_CREATED, refresh);
      composer.off(EVENTS.ELEMENT_DELETED, refresh);
    };
  }, [composer]);

  if (rows.length === 0) {
    return (
      <p className="tw:m-0 tw:py-3 tw:text-[length:var(--bk-text-13)] tw:leading-5 tw:text-[var(--bk-ink-muted)]">
        No classes yet. A class is a name you put on elements so they can share
        one rule — add one from an element&apos;s Classes section.
      </p>
    );
  }

  return (
    <BrandCard label="Classes" data-testid="brand-classes">
      {rows.map(([name, count]) => (
        <BrandRow
          key={name}
          data-testid={`brand-class-${name}`}
          name={<span data-testid={`brand-class-name-${name}`}>{`.${name}`}</span>}
          /* One text node, not three — check-board-copy.mjs compares text
             nodes, so `used {count}&times;` split three ways never matched. */
          sub={<span data-testid={`brand-class-usage-${name}`}>{`used ${count}\u00d7`}</span>}
        />
      ))}
    </BrandCard>
  );
};

export default ClassesSection;
