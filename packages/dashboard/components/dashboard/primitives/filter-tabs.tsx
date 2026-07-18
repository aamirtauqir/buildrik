"use client";

/** UI kit — segmented tab control (grey track, white active pill). Shared
 *  across screens (Media type/sort filters, Templates/Libraries switcher). */
export function FilterTabs<T extends string>({
  value,
  onChange,
  options,
}: {
  value: T;
  onChange: (value: T) => void;
  options: readonly { value: T; label: string }[];
}) {
  return (
    <div className="flex items-center gap-0.5 rounded-lg p-1" style={{ backgroundColor: "var(--color-bg-subtle)" }}>
      {options.map((opt) => {
        const active = opt.value === value;
        return (
          <button
            key={opt.value}
            type="button"
            onClick={() => onChange(opt.value)}
            className="rounded-md px-3.5 py-1.5 text-[13px] transition-colors"
            style={{
              backgroundColor: active ? "var(--color-bg-surface)" : "transparent",
              color: active ? "var(--color-text-primary)" : "var(--color-text-secondary)",
              fontWeight: active ? 600 : 500,
            }}
          >
            {opt.label}
          </button>
        );
      })}
    </div>
  );
}
