import React from "react";
import { createRoot } from "react-dom/client";
import { Link } from "../editor/shared/vibcoder/Link";
import { sectionLabel, stack, darkSurface } from "./_galleryStyles";

const stackP = { ...stack, gap: 12 };

function Demo() {
  return (
    <>
      <h2 style={sectionLabel}>default</h2>
      <div style={stackP}>
        <p>Open the <Link href="#">page settings</Link> panel to edit metadata.</p>
        <p>Try hovering: <Link href="#">hover me to thicken the rule</Link>.</p>
      </div>

      <h2 style={{ ...sectionLabel, marginTop: 24 }}>muted</h2>
      <div style={stackP}>
        <p>Last edited 3 minutes ago — <Link href="#" tone="muted">view history</Link></p>
      </div>

      <h2 style={{ ...sectionLabel, marginTop: 24 }}>no underline</h2>
      <div style={stackP}>
        <p><Link href="#" noUnderline>Underline appears on hover only</Link></p>
      </div>

      <h2 style={{ ...sectionLabel, marginTop: 24 }}>external (auto target=_blank + rel)</h2>
      <div style={stackP}>
        <p>
          Read the <Link href="https://example.com" external>Buildrik changelog</Link> for what shipped.
        </p>
      </div>

      <h2 style={{ ...sectionLabel, marginTop: 24 }}>inverse on dark surface</h2>
      <div style={darkSurface}>
        <p style={{ margin: 0 }}>
          Need help? <Link href="#" tone="inverse">Contact support</Link> or
          {" "}
          <Link href="https://example.com" tone="inverse" external>browse docs</Link>.
        </p>
      </div>

      <h2 style={{ ...sectionLabel, marginTop: 24 }}>disabled (aria-disabled)</h2>
      <div style={stackP}>
        <p><Link href="#" disabled>Publish (requires save)</Link></p>
      </div>
    </>
  );
}

const root = document.getElementById("react-root");
if (root) createRoot(root).render(<Demo />);
