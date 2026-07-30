"use client";

export function WizardProgress({ step, total }: { step: number; total: number }) {
  const percentage = Math.round((step / total) * 100);
  return (
    <div className="mb-8">
      <div className="h-1.5 rounded-full" style={{ backgroundColor: "var(--color-bg-subtle)" }}>
        <div className="h-1.5 rounded-full transition-all duration-300" style={{ width: `${percentage}%`, backgroundColor: "var(--color-primary)" }} />
      </div>
      <p className="mt-2 text-center text-body-sm" style={{ color: "var(--color-text-muted)" }}>Step {step} of {total}</p>
    </div>
  );
}
