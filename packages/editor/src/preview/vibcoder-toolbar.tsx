import { useState } from "react";
import { createRoot } from "react-dom/client";
import {
  Toolbar,
  ToolbarGroup,
  ToolbarLabel,
  ToolbarSpacer,
} from "../editor/shared/vibcoder/Toolbar";
import { Button } from "../editor/shared/vibcoder/Button";
import { IconButton } from "../editor/shared/vibcoder/IconButton";
import { Icon } from "../editor/shared/vibcoder/Icon";
import { SearchInput } from "../editor/shared/vibcoder/SearchInput";
import { sectionLabel, stack } from "./_galleryStyles";

const stackWide = { ...stack, gap: 24 };

function Demo() {
  const [q, setQ] = useState("");

  return (
    <div style={stackWide}>
      <h2 style={sectionLabel}>default — groups + label + spacer (composed)</h2>
      <Toolbar>
        <ToolbarGroup>
          <ToolbarLabel>FILTER</ToolbarLabel>
          <Button variant="secondary">All</Button>
          <Button variant="secondary">Drafts</Button>
        </ToolbarGroup>
        <ToolbarGroup>
          <ToolbarLabel>SORT</ToolbarLabel>
          <Button variant="secondary">Recent</Button>
        </ToolbarGroup>
        <ToolbarSpacer />
        <ToolbarGroup>
          <SearchInput
            value={q}
            onChange={setQ}
            placeholder="Quick filter"
            size="sm"
            clearable
          />
          <IconButton aria-label="Settings">
            <Icon name="settings" />
          </IconButton>
        </ToolbarGroup>
      </Toolbar>

      <h2 style={sectionLabel}>--sm + --dense (compact secondary toolbar)</h2>
      <Toolbar size="sm" variant="dense">
        <ToolbarGroup>
          <IconButton aria-label="Bold">
            <Icon name="plus" />
          </IconButton>
          <IconButton aria-label="Italic">
            <Icon name="minus" />
          </IconButton>
        </ToolbarGroup>
        <ToolbarGroup>
          <IconButton aria-label="Undo">
            <Icon name="undo" />
          </IconButton>
          <IconButton aria-label="Redo">
            <Icon name="redo" />
          </IconButton>
        </ToolbarGroup>
      </Toolbar>

      <h2 style={sectionLabel}>--inset (no border, flush inside parent card)</h2>
      <div
        style={{
          background: "var(--bd-bg-card)",
          border: "1px solid var(--bd-border)",
          borderRadius: 8,
          padding: 12,
        }}
      >
        <Toolbar variant="inset">
          <ToolbarGroup>
            <Button variant="primary">New</Button>
            <Button variant="ghost">Cancel</Button>
          </ToolbarGroup>
        </Toolbar>
      </div>

      <h2 style={sectionLabel}>--floating (elevated overlay)</h2>
      <Toolbar variant="floating">
        <ToolbarGroup>
          <ToolbarLabel>VIEW</ToolbarLabel>
          <Button variant="ghost">Grid</Button>
          <Button variant="ghost">List</Button>
        </ToolbarGroup>
      </Toolbar>
    </div>
  );
}

const root = document.getElementById("react-root");
if (root) createRoot(root).render(<Demo />);
