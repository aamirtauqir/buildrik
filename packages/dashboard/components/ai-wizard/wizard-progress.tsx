"use client";

export function WizardProgress({ step, total }: { step: number; total: number }) {
  const percentage = Math.round((step / total) * 100);
  return (
    <div className="mb-8">
      <div className="h-1.5 rounded-full" style={{ backgroundColor: "#F4F4F4" }}>
        <div className="h-1.5 rounded-full transition-all duration-300" style={{ width: `${percentage}%`, backgroundColor: "var(--color-primary)" }} />
      </div>
      <p className="mt-2 text-center text-xs" style={{ color: "#B0B0B0" }}>Step {step} of {total}</p>
    </div>
  );
}
