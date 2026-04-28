export function MultiPropPanel({ children }: { children: React.ReactNode }) {
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 12, padding: 16, background: "white" }}>
      {children}
    </div>
  );
}

export function OffGridGap({ children }: { children: React.ReactNode }) {
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
      {children}
    </div>
  );
}

export function ComputedGap({ children, dense }: { children: React.ReactNode; dense?: boolean }) {
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: dense ? 4 : 8 }}>
      {children}
    </div>
  );
}
