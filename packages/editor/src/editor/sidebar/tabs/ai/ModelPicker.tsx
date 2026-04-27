import { Button } from "@/editor/shared/vibcoder/Button";
import * as React from "react";
import type { AIModel } from "./types";

const MODELS: ReadonlyArray<{ id: AIModel; label: string }> = [
  { id: "claude-opus-4-7", label: "claude · opus-4-7" },
  { id: "claude-sonnet-4-6", label: "claude · sonnet-4-6" },
  { id: "claude-haiku-4-5", label: "claude · haiku-4-5" },
  { id: "gpt-4o-mini", label: "openai · gpt-4o-mini" },
];

export interface ModelPickerProps {
  model: AIModel;
  onChange: (model: AIModel) => void;
}

export const ModelPicker: React.FC<ModelPickerProps> = ({ model, onChange }) => {
  const [open, setOpen] = React.useState(false);
  const current = MODELS.find((m) => m.id === model) ?? MODELS[1];
  return (
    <div className="bd-ai-model">
      <Button
        type="button"
        className="bd-ai-model-trigger"
        aria-label="Model"
        aria-haspopup="menu"
        aria-expanded={open}
        onClick={() => setOpen((v) => !v)}
      >
        {current.label.replace(/^.+ · /, "")}
      </Button>
      {open && (
        <div className="bd-ai-model-menu" role="menu">
          {MODELS.map((m) => (
            <Button
              key={m.id}
              type="button"
              role="menuitem"
              className="bd-ai-model-item"
              aria-current={m.id === model}
              onClick={() => {
                onChange(m.id);
                setOpen(false);
              }}
            >
              {m.label}
            </Button>
          ))}
        </div>
      )}
    </div>
  );
};
