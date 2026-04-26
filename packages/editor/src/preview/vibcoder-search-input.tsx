import { useState } from "react";
import { createRoot } from "react-dom/client";
import { SearchInput } from "../editor/shared/vibcoder/SearchInput";
import { Kbd } from "../editor/shared/vibcoder/Kbd";
import { sectionLabel, stack } from "./_galleryStyles";

const stackWide = { ...stack, gap: 16, maxWidth: 360 };

function Demo() {
  // Contract B: caller owns value + onChange. Demo uses local useState
  // driving controlled value — the wrapper itself stays stateless.
  const [q1, setQ1] = useState("");
  const [q2, setQ2] = useState("preset value");
  const [q3, setQ3] = useState("");

  return (
    <div style={stackWide}>
      <h2 style={sectionLabel}>default — empty value, no clear button</h2>
      <SearchInput value={q1} onChange={setQ1} placeholder="Search files…" />
      <small style={{ opacity: 0.6 }}>q1 = "{q1}"</small>

      <h2 style={sectionLabel}>clearable — preset value, clear button shows</h2>
      <SearchInput
        value={q2}
        onChange={setQ2}
        placeholder="Search…"
        clearable
      />
      <small style={{ opacity: 0.6 }}>q2 = "{q2}"</small>

      <h2 style={sectionLabel}>--sm size + clearable</h2>
      <SearchInput
        value={q3}
        onChange={setQ3}
        placeholder="Quick filter"
        clearable
        size="sm"
      />

      <h2 style={sectionLabel}>--lg size with kbd hint</h2>
      <SearchInput
        value=""
        onChange={() => {}}
        placeholder="Search anything"
        size="lg"
        kbd={<Kbd>⌘K</Kbd>}
      />

      <h2 style={sectionLabel}>--error variant</h2>
      <SearchInput value="bad query" onChange={() => {}} error />

      <h2 style={sectionLabel}>disabled</h2>
      <SearchInput value="locked" onChange={() => {}} disabled />
    </div>
  );
}

const root = document.getElementById("react-root");
if (root) createRoot(root).render(<Demo />);
