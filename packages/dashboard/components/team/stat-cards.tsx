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
          className="rounded-xl border border-[#E8E8E8] bg-white p-5"
        >
          <p className="text-xs font-medium uppercase tracking-wide" style={{ color: "#7A7A7A" }}>
            {card.label}
          </p>
          <p className="mt-2 text-2xl font-bold" style={{ color: "#0D0D0D" }}>
            {card.value}
          </p>
        </div>
      ))}
    </div>
  );
}
