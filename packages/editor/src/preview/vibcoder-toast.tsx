import { useState } from "react";
import { createRoot } from "react-dom/client";
import { Toast, type ToastTone } from "../editor/shared/vibcoder/Toast";
import { sectionLabel, stack } from "./_galleryStyles";

const stackWide = { ...stack, gap: 16, maxWidth: 480 };

const TONES: ToastTone[] = ["info", "success", "warning", "error", "neutral"];

function Demo() {
  // Per Contract B: caller owns open state. NO internal useState in
  // wrapper. Demo wires a per-tone open map locally; Phase 3
  // NotificationCenter organism will manage queue/stacking.
  const [openMap, setOpenMap] = useState<Record<string, boolean>>(
    Object.fromEntries(TONES.map((t) => [t, true])),
  );
  const dismiss = (tone: string) =>
    setOpenMap((m) => ({ ...m, [tone]: false }));
  const restoreAll = () =>
    setOpenMap(Object.fromEntries(TONES.map((t) => [t, true])));

  return (
    <div style={stackWide}>
      <h2 style={sectionLabel}>tones (controlled open per toast)</h2>
      <button type="button" onClick={restoreAll} style={{ alignSelf: "flex-start" }}>
        Restore all
      </button>
      {TONES.map((tone) => (
        <Toast
          key={tone}
          open={openMap[tone]}
          onOpenChange={(o) => !o && dismiss(tone)}
          tone={tone}
          title={`${tone[0].toUpperCase()}${tone.slice(1)} toast`}
          description={`This is a ${tone} severity message.`}
          action={
            <button type="button" onClick={() => dismiss(tone)}>
              Dismiss
            </button>
          }
          icon={<span>•</span>}
        />
      ))}

      <h2 style={sectionLabel}>title-only (no description, no action)</h2>
      <Toast open onOpenChange={() => {}} title="Saved." />

      <h2 style={sectionLabel}>open=false (renders nothing)</h2>
      <Toast open={false} onOpenChange={() => {}} title="hidden" />
      <small style={{ opacity: 0.6 }}>
        ↑ Verify: no .bd-toast element in DOM above this line.
      </small>
    </div>
  );
}

const root = document.getElementById("react-root");
if (root) createRoot(root).render(<Demo />);
