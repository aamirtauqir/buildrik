import * as React from "react";
export const Foo: React.FC = () => (
  <div
    style={{
      color: "var(--buildrick-text-primary)",
      background: "var(--buildrick-bg-card)",
      borderTop: "1px solid var(--buildrick-border)",
      borderBottom: "1px solid var(--buildrick-border-focus)",
    }}
  >
    hi
  </div>
);
