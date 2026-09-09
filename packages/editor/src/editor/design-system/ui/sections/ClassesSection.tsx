/**
 * ClassesSection — board 153:2 (Brand · Classes).
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

export interface ClassesSectionProps {
  composer?: Composer | null;
}

/** `.name` → how many elements carry it, most-used first. */
function tally(composer: Composer | null | undefined): [string, number][] {
  const all = composer?.elements?.getAllElements?.() ?? [];
  const counts = new Map<string, number>();
  for (const el of all) {
    for (const cls of el.getClasses?.() ?? []) {
      const name = String(cls).trim();
      if (!name) continue;
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
      <p className="tw:m-0 tw:px-3 tw:py-3 tw:text-xs tw:leading-normal tw:text-[var(--bk-ink-muted)]">
        No classes yet. A class is a name you put on elements so they can share
        one rule — add one from an element&apos;s Classes section.
      </p>
    );
  }

  return (
    <ul className="tw:m-0 tw:flex tw:list-none tw:flex-col tw:p-0" data-testid="brand-classes">
      {rows.map(([name, count]) => (
        /* 44 tall, 16 in, 11/16 both lines, and NO rule between rows —
           153:9..153:27 draw five of these flush against each other. The
           divider made a two-line row look like a table; the board separates
           them by the 16px line rhythm alone. */
        <li
          key={name}
          data-testid={`brand-class-${name}`}
          className="tw:flex tw:h-11 tw:flex-col tw:justify-center tw:px-4 tw:text-[11px] tw:leading-4"
        >
          <span
            data-testid={`brand-class-name-${name}`}
            className="tw:font-medium tw:[font-family:var(--bk-font-mono)] tw:text-[var(--bk-ink)]"
          >
            {`.${name}`}
          </span>
          <span
            data-testid={`brand-class-usage-${name}`}
            className="tw:text-[var(--bk-ink-muted)]"
          >
            {/* One text node, not three. `used {count}&times;` split into
                "used" / "1" / "×", and check-board-copy.mjs compares TEXT
                NODES — so the board's `used 12×` had nothing to match and read
                as copy the product does not render. */}
            {`used ${count}\u00d7`}
          </span>
        </li>
      ))}
    </ul>
  );
};

export default ClassesSection;
