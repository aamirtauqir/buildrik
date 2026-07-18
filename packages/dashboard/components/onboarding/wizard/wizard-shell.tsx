"use client";

import { cn } from "@lib/utils";

type Chrome =
  | { variant: "stepper"; step: 1 | 2 | 3 }
  | { variant: "progress"; step: 1 | 2 | 3; label: string }
  | { variant: "simple" };

interface WizardShellProps {
  chrome: Chrome;
  onSkip?: () => void;
  skipping?: boolean;
  /** Widen the content column for gallery-style frames (T1, A5, E1). */
  wide?: boolean;
  /** Minimum vertical padding around the centered content column. Frames vary
   *  (40–100px); 40 is the default. Content that outgrows the viewport keeps
   *  this as top/bottom breathing room and scrolls instead of centering. */
  padY?: number;
  children: React.ReactNode;
}

const STEP_LABELS = ["Workspace", "Site", "Start"] as const;

/** v3 numbered stepper: filled cobalt circle + label for done/active steps,
 *  outlined slate circle + muted label for upcoming ones, hairline connectors. */
function StepperDots({ step }: { step: number }) {
  return (
    <div className="flex items-center">
      {STEP_LABELS.map((label, i) => {
        const n = i + 1;
        const done = n < step;
        const reached = n <= step;
        return (
          <div key={label} className="flex items-center">
            <span className="flex items-center gap-2">
              <span
                className={cn(
                  "flex h-6 w-6 items-center justify-center rounded-full text-[12px] font-semibold transition-colors",
                  reached ? "bg-onb-primary text-white" : "border border-onb-subtle text-onb-subtle"
                )}
              >
                {done ? (
                  <svg viewBox="0 0 24 24" className="h-3.5 w-3.5" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
                    <path d="M20 6 9 17l-5-5" />
                  </svg>
                ) : (
                  n
                )}
              </span>
              <span
                className={cn(
                  "text-[13px] transition-colors",
                  n === step ? "font-semibold text-onb-text" : reached ? "font-medium text-onb-text" : "font-medium text-onb-subtle"
                )}
              >
                {label}
              </span>
            </span>
            {i < STEP_LABELS.length - 1 && <span className="mx-3 h-px w-10 bg-onb-line" />}
          </div>
        );
      })}
    </div>
  );
}

function ProgressBar({ step, label }: { step: number; label: string }) {
  return (
    <div className="flex w-[200px] flex-col items-center gap-2.5">
      <span className="text-[13px] font-semibold text-onb-primary">
        {label} — {step} of 3
      </span>
      <div className="h-1 w-[200px] overflow-hidden rounded-sm bg-onb-line">
        <div className="h-full bg-onb-primary transition-all" style={{ width: `${(step / 3) * 100}%` }} />
      </div>
    </div>
  );
}

/** M2 onboarding wizard chrome. Per the v3 frame gallery every frame shares one
 *  geometry: a compact 64px header (brand left, "Skip setup" right) closed by a
 *  hairline, above a vertically-centered content column. The step indicator is
 *  NOT part of the header — it renders as the first row of the content column,
 *  below the divider, so it reads as belonging to the page, not the chrome. */
export function WizardShell({
  chrome,
  onSkip,
  skipping,
  wide,
  padY = 40,
  children,
}: WizardShellProps) {
  const indicator =
    chrome.variant === "stepper" ? (
      <StepperDots step={chrome.step} />
    ) : chrome.variant === "progress" ? (
      <ProgressBar step={chrome.step} label={chrome.label} />
    ) : null;

  return (
    <div className="min-h-dvh bg-white flex flex-col">
      <header className="h-onb-header shrink-0 border-b border-onb-line flex items-center justify-between px-12">
        <span className="flex items-center gap-3">
          <span className="flex h-8 w-8 items-center justify-center rounded-onb bg-onb-primary text-[17px] font-bold text-white">
            B
          </span>
          <span className="text-lg font-bold text-onb-text">Buildrick</span>
        </span>

        {onSkip ? (
          <button
            type="button"
            onClick={onSkip}
            disabled={skipping}
            className="text-[13px] font-medium text-onb-muted hover:text-onb-text disabled:opacity-50"
          >
            {skipping ? "Skipping…" : "Skip setup"}
          </button>
        ) : null}
      </header>

      <main
        className="flex flex-1 flex-col items-center justify-center px-4"
        style={{ paddingTop: padY, paddingBottom: padY }}
      >
        {indicator ? <div className="mb-14">{indicator}</div> : null}
        <div className={cn("w-full", wide ? "max-w-[900px]" : "max-w-onb")}>{children}</div>
      </main>
    </div>
  );
}
