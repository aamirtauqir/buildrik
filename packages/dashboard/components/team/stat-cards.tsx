"use client";

interface TeamStatCardsProps {
  total: number;
  active: number;
  pending: number;
}

export function TeamStatCards({ total, active, pending }: TeamStatCardsProps) {
  const cards = [
    { label: "Total Members", value: total },
    { label: "Active", value: active },
    { label: "Pending Invitations", value: pending },
  ];

  return (
    <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
      {cards.map((card) => (
        <div
          key={card.label}
          className="rounded-xl border border-[var(--color-border-default)] bg-white p-5"
        >
          <p className="text-xs font-medium uppercase tracking-wide" style={{ color: "var(--color-text-secondary)" }}>
            {card.label}
          </p>
          <p className="mt-2 text-2xl font-bold" style={{ color: "var(--color-text-primary)" }}>
            {card.value}
          </p>
        </div>
      ))}
    </div>
  );
}
