import * as React from "react";

const containerStyle: React.CSSProperties = {
  padding: "32px 16px",
  textAlign: "center",
  color: "var(--bd-fg-muted)",
  fontSize: 13,
};

export const StylesSection: React.FC = () => (
  <div style={containerStyle}>
    <strong style={{ display: "block", marginBottom: 4, color: "var(--bd-fg-primary)" }}>
      Styles
    </strong>
    Reusable preset styles (buttons, cards, forms…) ship in the next phase.
  </div>
);
