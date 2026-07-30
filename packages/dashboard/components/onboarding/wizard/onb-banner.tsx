"use client";

/**
 * Inline error banner for wizard steps that can fail after a valid submit
 * (network / server errors) — as opposed to OnbField's per-field error, which
 * is for input the user can fix by editing. Flows in the card below the CTA,
 * not a fixed-position toast. Geometry (10px radius, 18/12px padding, solid
 * 1px border) is measured off the S1 · workspace-setup NETWORK ERROR frame —
 * a solid red outline on white, not a tinted fill.
 */
export function OnbBanner({
  message,
  onRetry,
  retrying,
}: {
  message: string;
  onRetry?: () => void;
  retrying?: boolean;
}) {
  return (
    <div className="flex items-center justify-between gap-3 rounded-lg border border-onb-error bg-white px-[18px] py-3">
      <span className="text-[13px] text-onb-error">⚠ {message}</span>
      {onRetry ? (
        <button
          type="button"
          onClick={onRetry}
          disabled={retrying}
          className="shrink-0 text-[13px] font-semibold text-onb-primary disabled:opacity-50"
        >
          {retrying ? "Retrying…" : "Try again"}
        </button>
      ) : null}
    </div>
  );
}
