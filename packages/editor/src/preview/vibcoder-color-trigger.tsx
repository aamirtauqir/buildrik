import { useState } from "react";
import { createRoot } from "react-dom/client";
import { ColorTrigger } from "../editor/shared/vibcoder/ColorTrigger";
import { sectionLabel, stack } from "./_galleryStyles";

const stackWide = { ...stack, gap: 16, maxWidth: 480 };
const row = { display: "flex" as const, gap: 12, alignItems: "center" as const };

function Demo() {
  // Per Contract B: caller owns value + open state. Demo shows local
  // useState driving the controlled props — wrapper itself stays stateless.
  const [value, setValue] = useState("#2D6DFF");
  const [openId, setOpenId] = useState<string | null>(null);

  const cycle = () => {
    const palette = ["#2D6DFF", "#FF3366", "#22C55E", "#F59E0B", "#0F172A"];
    const next = palette[(palette.indexOf(value) + 1) % palette.length];
    setValue(next);
  };

  return (
    <div style={stackWide}>
      <h2 style={sectionLabel}>default (md) — controlled value + open</h2>
      <div style={row}>
        <ColorTrigger
          value={value}
          onChange={setValue}
          showHash
          open={openId === "primary"}
          onOpenChange={(o) => setOpenId(o ? "primary" : null)}
        />
        <button type="button" onClick={cycle}>
          cycle value
        </button>
      </div>
      <small style={{ opacity: 0.6 }}>
        open={String(openId === "primary")} · openId={String(openId)}
      </small>

      <h2 style={sectionLabel}>sizes</h2>
      <div style={row}>
        <ColorTrigger size="sm" value="#FF3366" onChange={() => {}} />
        <ColorTrigger value="#FF3366" onChange={() => {}} />
        <ColorTrigger size="lg" value="#FF3366" onChange={() => {}} />
      </div>

      <h2 style={sectionLabel}>variant: add (dashed swatch)</h2>
      <ColorTrigger
        variant="add"
        value=""
        onChange={() => {}}
        open={openId === "add"}
        onOpenChange={(o) => setOpenId(o ? "add" : null)}
      />

      <h2 style={sectionLabel}>variant: inline (inspector embed)</h2>
      <ColorTrigger
        variant="inline"
        value="#0F172A"
        onChange={() => {}}
        showHash
        alpha="80%"
      />
    </div>
  );
}

const root = document.getElementById("react-root");
if (root) createRoot(root).render(<Demo />);
