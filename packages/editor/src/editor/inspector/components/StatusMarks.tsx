/**
 * StatusMarks — the facts about the selected element, under its name, only
 * when true (R-DD-17, DD-16, DD-18): ◆ Component: {name} · ⌁ {Collection.field}
 * (a button — it opens Behaviour › CMS binding; red "· missing" when the
 * collection is gone, board 25) · 🔒 Locked.
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

const MARK = "tw:inline-flex tw:items-center tw:gap-1 tw:text-[11px] tw:leading-4 tw:text-[var(--bk-ink-muted)]";

export function StatusMarks({ composer, elementId, binding, locked }: StatusMarksProps) {
  const instance = composer?.components?.getInstanceByElementId?.(elementId);
  const component = instance ? composer?.components?.getComponent?.(instance.componentId) : undefined;
  if (!component && !binding && !locked) return null;

  return (
    <div className="tw:flex tw:flex-wrap tw:items-center tw:gap-x-3 tw:gap-y-1" data-testid="inspector-status-marks">
      {component ? (
        <span className={MARK} data-testid="inspector-mark-component">
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
          /* Boards 24/25: a bordered chip with ▾ — neutral frame + accent text
             when bound, error border + tint when the source is gone. */
          className={
            "tw:h-6 tw:gap-1 tw:rounded-[4px] tw:border tw:px-1.5 tw:text-[11px] tw:font-normal " +
            (binding.missing
              ? "tw:border-[var(--bk-error)] tw:bg-[var(--bk-error-tint)] tw:text-[var(--bk-error-text)] tw:hover:bg-[var(--bk-error-tint)]"
              : "tw:border-[var(--bk-border)] tw:bg-[var(--bk-bg-panel)] tw:text-[var(--bk-accent-text)] tw:hover:bg-[var(--bk-bg-subtle)]")
          }
        >
          <Link2 size={11} aria-hidden="true" />
          {binding.label}
          {binding.missing ? " · missing" : null}
          <ChevronDown size={11} aria-hidden="true" />
        </Button>
      ) : null}
      {locked ? (
        <span className={MARK} data-testid="inspector-mark-locked">
          <Lock size={11} aria-hidden="true" />
          Locked
        </span>
      ) : null}
    </div>
  );
}
