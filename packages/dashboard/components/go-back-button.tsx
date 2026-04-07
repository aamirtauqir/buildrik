"use client";

export function GoBackButton() {
  return (
    <button
      onClick={() => window.history.back()}
      className="px-4 py-2 rounded-lg text-sm font-medium border cursor-pointer"
      style={{ borderColor: "#E8E8E8", color: "#0D0D0D" }}
    >
      Go Back
    </button>
  );
}
