import * as React from "react";

const containerStyle: React.CSSProperties = {
  padding: "32px 16px",
  textAlign: "center",
  color: "var(--bd-fg-muted)",
  fontSize: 13,
};

export const ComponentsSection: React.FC = () => (
  <div style={containerStyle}>
    <strong style={{ display: "block", marginBottom: 4, color: "var(--bd-fg-primary)" }}>
      Components
    </strong>
    Component catalog summary lands when the Components panel ships.
    <div style={{ marginTop: 12, fontSize: 12 }}>
      Use the <strong>Components</strong> rail tab to browse existing components.
    </div>
  </div>
);
