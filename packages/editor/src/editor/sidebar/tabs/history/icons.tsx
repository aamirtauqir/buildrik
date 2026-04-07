/**
 * History Tab Icons
 * @license BSD-3-Clause
 */

export function VersionsIcon() {
  return (
    <svg
      width="14"
      height="14"
      viewBox="0 0 14 14"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.5"
    >
      <circle cx="7" cy="7" r="5" />
      <path d="M7 4v3l2 1" />
    </svg>
  );
}

export function ActivityIcon() {
  return (
    <svg
      width="14"
      height="14"
      viewBox="0 0 14 14"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.5"
    >
      <path d="M2 7h2l2-4 2 8 2-4h2" />
    </svg>
  );
}

export function UndoIcon() {
  return (
    <svg
      width="14"
      height="14"
      viewBox="0 0 14 14"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.5"
    >
      <path d="M3 5h6a3 3 0 1 1 0 6H7" />
      <path d="M5 3L3 5l2 2" />
    </svg>
  );
}

export function RedoIcon() {
  return (
    <svg
      width="14"
      height="14"
      viewBox="0 0 14 14"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.5"
    >
      <path d="M11 5H5a3 3 0 0 0 0 6h2" />
      <path d="M9 3l2 2-2 2" />
    </svg>
  );
}

export function ClearIcon() {
  return (
    <svg
      width="14"
      height="14"
      viewBox="0 0 14 14"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.5"
    >
      <path d="M3 4h8" />
      <path d="M5 4V3a1 1 0 0 1 1-1h2a1 1 0 0 1 1 1v1" />
      <path d="M4 4v7a1 1 0 0 0 1 1h4a1 1 0 0 0 1-1V4" />
      <path d="M6 6v4" />
      <path d="M8 6v4" />
    </svg>
  );
}

export function ChevronIcon({ expanded }: { expanded: boolean }) {
  return (
    <svg
      width="12"
      height="12"
      viewBox="0 0 12 12"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.5"
      style={{
        transform: expanded ? "rotate(90deg)" : "rotate(0deg)",
        transition: "transform 0.15s ease",
      }}
    >
      <path d="M4 2l4 4-4 4" />
    </svg>
  );
}
