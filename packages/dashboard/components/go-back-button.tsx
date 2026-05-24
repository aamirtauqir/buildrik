"use client";

export function GoBackButton() {
  return (
    <button
      onClick={() => window.history.back()}
      className="px-4 py-2 rounded-lg text-sm font-medium border cursor-pointer"
      style={{ borderColor: "var(--color-border-default)", color: "var(--color-text-primary)" }}
    >
      Go Back
    </button>
  );
}
