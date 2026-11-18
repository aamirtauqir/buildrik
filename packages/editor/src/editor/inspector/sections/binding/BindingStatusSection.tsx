/**
 * Binding status — the last group of the Content tab while a bound
 * property needs attention (2L9 B5-D11…D15, 173:14104):
 *
 *   Binding status
 *   Couldn’t load Blog. Your binding is kept.      (red for a fault)
 *   [               Retry               ]
 *
 * Loading and the empty-with-fallback note are muted. "Choose field" (a field
 * gone, or no longer the right type) opens the binding's detail, whose
 * Source row holds the field picker.
 *
 * @license BSD-3-Clause
 */
import type * as React from "react";
import type { Composer } from "@/engine";
import { Button } from "@/editor/chrome-ui";
import { openSubview } from "@/editor/inspector/tabs/subviewStore";
import { GROUP_TITLE, WIDE_BUTTON } from "@/editor/inspector/shared/controls/controlClasses";
import { statusLine } from "./BindingPropertyRow";
import { useCmsBinding } from "./useCmsBinding";

export function BindingStatusSection({ composer, elementId }: { composer: Composer | null | undefined; elementId: string }): React.ReactElement | null {
  const state = useCmsBinding(composer, elementId);
  const status = state.missing ? null : statusLine(state);
  if (!status) return null;
  const kind = state.status?.kind;
  const fault = kind === "failed" || kind === "field-missing" || kind === "incompatible";
  return (
    <div className="tw:flex tw:flex-col tw:gap-2 tw:px-3 tw:pb-3" data-testid="binding-status-group">
      <div className={`${GROUP_TITLE} tw:mt-4!`}>Binding status</div>
      <p
        role={fault ? "alert" : undefined}
        className={`tw:m-0 tw:text-[12px] tw:leading-4 ${fault ? "tw:text-[var(--bk-error-text)]" : "tw:text-[var(--bk-ink-muted)]"}`}
        data-testid="binding-status"
      >
        {status}
      </p>
      {kind === "failed" ? (
        <Button color="light" size="xs" className={WIDE_BUTTON} onClick={state.retry} data-testid="binding-retry">
          Retry
        </Button>
      ) : kind === "field-missing" || kind === "incompatible" ? (
        <Button color="light" size="xs" className={WIDE_BUTTON} onClick={() => openSubview({ kind: "binding", elementId })} data-testid="binding-choose-field">
          Choose field
        </Button>
      ) : null}
    </div>
  );
}
