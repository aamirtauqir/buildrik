import React, { useState } from "react";
import { createRoot } from "react-dom/client";
import { ListRow } from "../editor/shared/vibcoder/ListRow";
import { Icon } from "../editor/shared/vibcoder/Icon";
import { Count } from "../editor/shared/vibcoder/Count";
import { Kbd } from "../editor/shared/vibcoder/Kbd";
import { sectionLabel, stack } from "./_galleryStyles";

const stackP = { ...stack, gap: 4 };

function Demo() {
  const [selected, setSelected] = useState<string | null>("layout");
  return (
    <>
      <h2 style={sectionLabel}>default</h2>
      <div style={stackP}>
        <ListRow title="Hero section" />
        <ListRow title="Features grid" meta="3 columns" />
        <ListRow title="Footer" path="components/footer.tsx" />
      </div>

      <h2 style={{ ...sectionLabel, marginTop: 24 }}>with slots</h2>
      <div style={stackP}>
        <ListRow
          title="Pages"
          lead={<Icon name="pages" />}
          tail={<Count>12</Count>}
        />
        <ListRow
          title="Open command palette"
          lead={<Icon name="search" />}
          tail={<Kbd>K</Kbd>}
        />
      </div>

      <h2 style={{ ...sectionLabel, marginTop: 24 }}>selected (controlled)</h2>
      <div style={stackP}>
        {["layout", "design", "settings"].map((id) => (
          <ListRow
            key={id}
            title={id[0].toUpperCase() + id.slice(1)}
            selected={selected === id}
            aria-selected={selected === id}
            onClick={() => setSelected(id)}
          />
        ))}
      </div>

      <h2 style={{ ...sectionLabel, marginTop: 24 }}>variants</h2>
      <div style={stackP}>
        <ListRow title="Small" size="sm" />
        <ListRow title="Large" size="lg" />
        <ListRow title="Bordered" bordered />
        <ListRow title="Inline" inline meta="meta inline with title" />
        <ListRow title="Timeline entry" timeline meta="2 hours ago" />
        <ListRow title="Unread notification" unread meta="3 minutes ago" />
        <ListRow title="Ghost row" ghost meta="no hover background" />
      </div>

      <h2 style={{ ...sectionLabel, marginTop: 24 }}>disabled</h2>
      <div style={stackP}>
        <ListRow title="Disabled item" disabled meta="cannot click" />
      </div>
    </>
  );
}

const root = document.getElementById("react-root");
if (root) createRoot(root).render(<Demo />);
