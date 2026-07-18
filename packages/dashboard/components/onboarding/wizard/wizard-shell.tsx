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
  /** "full" = 180px closed by a hairline (setup + template frames); "compact" =
   *  110px, no rule (the whole AI-draft flow). Not derivable from `chrome` —
   *  A4/A5 carry no indicator yet still use the compact header. */
  header?: "full" | "compact";
  /** Content padding, top and bottom. Frames vary (40–100px); 80 is the default. */
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
                {n}
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

/** M2 onboarding wizard chrome. Two header geometries, per the frame gallery:
 *  the setup + template frames use a 180px header closed by a hairline, while
 *  the AI-draft flow uses a shorter 110px header with no rule under it. Header
 *  children are absolutely placed to hit the frames' fixed offsets. */
export function WizardShell({
  chrome,
  onSkip,
  skipping,
  wide,
  header = "full",
  padY = 80,
  children,
}: WizardShellProps) {
  const compact = header === "compact";

  return (
    <div className="min-h-dvh bg-white flex flex-col">
      <header
        className={cn(
          "relative shrink-0",
          compact ? "h-[110px]" : "h-onb-header border-b border-onb-line"
        )}
      >
        <span className={cn("absolute left-12 flex items-center gap-3", compact ? "top-[38px]" : "top-10")}>
          <span className="flex h-8 w-8 items-center justify-center rounded-onb bg-onb-primary text-[17px] font-bold text-white">
            B
          </span>
          <span className="text-lg font-bold text-onb-text">Buildrick</span>
        </span>

        {chrome.variant === "stepper" ? (
          <div className="absolute left-1/2 top-[92px] -translate-x-1/2">
            <StepperDots step={chrome.step} />
          </div>
        ) : null}
        {chrome.variant === "progress" ? (
          <div className="absolute left-1/2 top-[34px] -translate-x-1/2">
            <ProgressBar step={chrome.step} label={chrome.label} />
          </div>
        ) : null}

        {onSkip ? (
          <button
            type="button"
            onClick={onSkip}
            disabled={skipping}
            className={cn(
              "absolute right-12 text-[13px] font-medium text-onb-muted hover:text-onb-text disabled:opacity-50",
              compact ? "top-[44px]" : "top-[46px]"
            )}
          >
            {skipping ? "Skipping…" : "Skip setup"}
          </button>
        ) : null}
      </header>

      <main
        className="flex flex-1 justify-center px-4"
        style={{ paddingTop: padY, paddingBottom: padY }}
      >
        <div className={cn("w-full", wide ? "max-w-[900px]" : "max-w-onb")}>{children}</div>
      </main>
    </div>
  );
}
