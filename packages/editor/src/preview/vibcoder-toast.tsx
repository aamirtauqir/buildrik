import { createRoot } from "react-dom/client";
import {
  ToastProvider,
  useToast,
  type ToastTone,
} from "../editor/shared/vibcoder/Toast";
import { sectionLabel, stack } from "./_galleryStyles";

const stackWide = { ...stack, gap: 16, maxWidth: 480 };

const TONES: ToastTone[] = ["info", "success", "warning", "error", "neutral"];

const buttonStyle: React.CSSProperties = {
  alignSelf: "flex-start",
  padding: "6px 12px",
  borderRadius: 4,
  border: "1px solid var(--buildrick-border, #ccc)",
  background: "var(--buildrick-bg-card, white)",
  cursor: "pointer",
};

function Triggers() {
  const { addToast, removeToast, toasts } = useToast();
  return (
    <div style={stackWide}>
      <h2 style={sectionLabel}>tones (push toasts via addToast)</h2>
      {TONES.map((tone) => (
        <button
          key={tone}
          type="button"
          style={buttonStyle}
          onClick={() =>
            addToast({
              tone,
              title: `${tone[0].toUpperCase()}${tone.slice(1)} toast`,
              description: `This is a ${tone} severity message.`,
            })
          }
        >
          Push {tone}
        </button>
      ))}

      <h2 style={sectionLabel}>title-only / description-only</h2>
      <button
        type="button"
        style={buttonStyle}
        onClick={() =>
          addToast({
            tone: "success",
            description: "Saved.",
          })
        }
      >
        Push description-only success
      </button>

      <h2 style={sectionLabel}>with action</h2>
      <button
        type="button"
        style={buttonStyle}
        onClick={() =>
          addToast({
            tone: "info",
            title: "File deleted",
            description: "1 file moved to trash.",
            action: {
              label: "Undo",
              onClick: () => addToast({ description: "Restored." }),
            },
          })
        }
      >
        Push with Undo action
      </button>

      <h2 style={sectionLabel}>custom duration (1s)</h2>
      <button
        type="button"
        style={buttonStyle}
        onClick={() =>
          addToast({
            tone: "warning",
            description: "I disappear in 1 second.",
            duration: 1000,
          })
        }
      >
        Push 1s warning
      </button>

      <h2 style={sectionLabel}>programmatic dismiss</h2>
      <button
        type="button"
        style={buttonStyle}
        onClick={() => {
          for (const t of [...toasts]) removeToast(t.id);
        }}
      >
        Dismiss all ({toasts.length})
      </button>
    </div>
  );
}

function Demo() {
  return (
    <ToastProvider>
      <Triggers />
    </ToastProvider>
  );
}

const root = document.getElementById("react-root");
if (root) createRoot(root).render(<Demo />);
