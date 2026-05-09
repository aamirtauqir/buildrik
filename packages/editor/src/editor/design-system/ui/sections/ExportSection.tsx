import * as React from "react";

const containerStyle: React.CSSProperties = {
  padding: "32px 16px",
  textAlign: "center",
  color: "var(--bd-fg-muted)",
  fontSize: 13,
};

export const ExportSection: React.FC = () => (
  <div style={containerStyle}>
    <strong style={{ display: "block", marginBottom: 4, color: "var(--bd-fg-primary)" }}>
      Export
    </strong>
    Token import/export modals are still reachable via the header dropdown.
    Dedicated workspace lands in S5.
  </div>
);
