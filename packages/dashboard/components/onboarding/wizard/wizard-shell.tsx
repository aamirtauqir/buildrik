"use client";

import { cn } from "@lib/utils";
import { LayoutGrid } from "lucide-react";

type Chrome =
  | { variant: "stepper"; step: 1 | 2 | 3 }
  | { variant: "progress"; step: 1 | 2 | 3; label: string }
  | { variant: "simple" };

interface WizardShellProps {
  chrome: Chrome;
  onSkip?: () => void;
  skipping?: boolean;
  /** Widen the content column for gallery-style frames (T1). */
  wide?: boolean;
  children: React.ReactNode;
}

function StepperDots({ step }: { step: number }) {
  return (
    <div className="flex flex-col items-center gap-2">
      <div className="flex items-center gap-2">
        {[1, 2, 3].map((i) => (
          <span
            key={i}
            className={cn("h-2 w-2 rounded-full transition-colors", i <= step ? "bg-onb-primary" : "bg-onb-line")}
          />
        ))}
      </div>
      <span className="text-xs text-onb-muted">Step {step} of 3</span>
    </div>
  );
}

function ProgressBar({ step, label }: { step: number; label: string }) {
  return (
    <div className="flex flex-col items-center gap-2">
      <span className="text-xs font-medium text-onb-muted">{label} — {step} of 3</span>
      <div className="h-1.5 w-[200px] rounded-full bg-onb-line overflow-hidden">
        <div className="h-full bg-onb-primary transition-all" style={{ width: `${(step / 3) * 100}%` }} />
      </div>
    </div>
  );
}

/** M2 onboarding wizard chrome: white header (logo + Skip) with a phase-specific
 *  center indicator (stepper / progress / none), then the centered content column. */
export function WizardShell({ chrome, onSkip, skipping, wide, children }: WizardShellProps) {
  return (
    <div className="min-h-dvh bg-white flex flex-col">
      <header className="relative flex items-center justify-between px-8 py-5 border-b border-onb-line">
        <span className="flex items-center gap-2">
          <LayoutGrid className="w-7 h-7 text-onb-primary" />
          <span className="text-lg font-bold text-onb-ink">Buildrick</span>
        </span>
        {chrome.variant !== "simple" && (
          <div className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2">
            {chrome.variant === "stepper" ? (
              <StepperDots step={chrome.step} />
            ) : (
              <ProgressBar step={chrome.step} label={chrome.label} />
            )}
          </div>
        )}
        {onSkip ? (
          <button
            type="button"
            onClick={onSkip}
            disabled={skipping}
            className="text-sm text-onb-muted hover:text-onb-text disabled:opacity-50"
          >
            {skipping ? "Skipping…" : "Skip setup"}
          </button>
        ) : (
          <span className="w-16" />
        )}
      </header>

      <main className="flex-1 flex justify-center px-4 py-14">
        <div className={cn("w-full", wide ? "max-w-3xl" : "max-w-onb")}>{children}</div>
      </main>
    </div>
  );
}
