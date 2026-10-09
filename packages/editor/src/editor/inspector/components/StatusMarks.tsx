/**
 * StatusMarks — the facts about the selected element, only when true
 * (R-DD-17, DD-16, DD-18): ◆ Component: {name} · ⌁ {Collection.field}
 * (a button — it opens Behaviour › CMS binding; red "· missing" when the
 * collection is gone, board 25) · 🔒 Locked.
 *
 * Its own row under the header, above the tabs (boards 23–26) — not inside
 * the header's padding, where it sat 16–20px higher than every board. The
 * boards pad it by what it holds: the binding chip 4 · 12 (24 and 25 agree);
 * a text mark 8 · 16 — the one-line note padding boards 26, 27 and 28 all
 * draw. Board 23 alone draws its 🔒 note 6 / 2 · 16 (24 tall); it follows the
 * majority here, so that row is 8px taller than board 23's.
 *
 * @license BSD-3-Clause
 */

import { ChevronDown, Diamond, Link2, Lock } from "lucide-react";
import * as React from "react";
import type { Composer } from "@/engine";
import { Button } from "@/editor/chrome-ui";
import { EVENTS } from "@/shared/constants/events";
import type { ElementBinding } from "../hooks/useElementBinding";

export interface StatusMarksProps {
  composer: Composer | null | undefined;
  elementId: string;
  binding: ElementBinding | null;
  locked: boolean;
}

/* The row's 4 · 12 plus this 4 · 4 = a text mark's 8 · 16. */
const MARK = "tw:inline-flex tw:items-center tw:px-1 tw:py-1 tw:text-[11px] tw:leading-4 tw:text-[var(--bk-ink-muted)]";

/* The mark reads the master's name at render; a rename elsewhere (the
   component detail screen) must re-render it (L2-028). */
const COMPONENT_EVENTS = [EVENTS.COMPONENT_UPDATED, EVENTS.INSTANCE_DETACHED, EVENTS.COMPONENT_DELETED] as const;

export function StatusMarks({ composer, elementId, binding, locked }: StatusMarksProps) {
  const [, bump] = React.useReducer((n: number) => n + 1, 0);
  React.useEffect(() => {
    if (!composer) return;
    for (const evt of COMPONENT_EVENTS) composer.on(evt, bump);
    return () => {
      for (const evt of COMPONENT_EVENTS) composer.off(evt, bump);
    };
  }, [composer]);
  const instance = composer?.components?.getInstanceByElementId?.(elementId);
  const component = instance ? composer?.components?.getComponent?.(instance.componentId) : undefined;
  if (!component && !binding && !locked) return null;

  return (
    <div className="tw:flex tw:flex-wrap tw:items-center tw:gap-x-3 tw:gap-y-1 tw:px-3 tw:py-1" data-testid="inspector-status-marks">
      {component ? (
        <span className={`${MARK} tw:gap-1`} data-testid="inspector-mark-component">
          <Diamond size={11} aria-hidden="true" />
          Component: {component.name}
        </span>
      ) : null}
      {binding ? (
        <Button
          color="light"
          size="xs"
          data-testid="inspector-bound-chip"
          data-tone={binding.missing ? "missing" : "bound"}
          title={binding.missing ? `Source missing — ${binding.label}` : `Bound to ${binding.label}`}
          onClick={() => composer?.emit(EVENTS.UI_INSPECTOR_FOCUS_SECTION, { section: "cms-binding" })}
          /* Boards 24/25: a 28-tall chip with ▾, 12px label, 12px glyphs —
             gray-50 fill + accent text when bound (no stroke), error border +
             tint when the source is gone. */
          className={
            "tw:h-7 tw:gap-1.5 tw:rounded-[4px] tw:border tw:px-1.5 tw:text-[12px] tw:font-normal " +
            (binding.missing
              ? "tw:border-[var(--bk-error)] tw:bg-[var(--bk-error-tint)] tw:text-[var(--bk-error-text)] tw:hover:bg-[var(--bk-error-tint)]"
              : "tw:border-transparent tw:bg-[var(--bk-gray-50)] tw:text-[var(--bk-accent-text)] tw:hover:bg-[var(--bk-bg-subtle)]")
          }
        >
          <Link2 size={12} aria-hidden="true" />
          {binding.label}
          {binding.missing ? " · missing" : null}
          <ChevronDown size={12} aria-hidden="true" />
        </Button>
      ) : null}
      {locked ? (
        <span className={`${MARK} tw:gap-2`} data-testid="inspector-mark-locked">
          <Lock size={12} aria-hidden="true" />
          Locked
        </span>
      ) : null}
    </div>
  );
}
