interface UsagePipsProps {
  /** Number of pages this asset is used on. 0 = render nothing. */
  count: number;
}

export function UsagePips({ count }: UsagePipsProps) {
  if (count <= 0) return null;
  const visible = Math.min(count, 3);
  const dots = Array.from({ length: visible }, (_, i) => (
    <span key={i} className="med-usage-pip" aria-hidden="true" />
  ));
  const overflow = count > 3 ? (
    <span className="med-usage-pip--overflow" aria-hidden="true" />
  ) : null;
  return (
    <div
      className="med-usage-pips"
      aria-label={`Used on ${count} ${count === 1 ? "page" : "pages"}`}
    >
      {dots}
      {overflow}
    </div>
  );
}
