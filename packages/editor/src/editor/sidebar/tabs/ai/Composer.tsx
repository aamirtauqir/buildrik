import * as React from "react";
import type { AIModel } from "./types";
import { ModelPicker } from "./ModelPicker";

export interface ComposerProps {
  model: AIModel;
  onModelChange: (m: AIModel) => void;
  onSubmit: (text: string) => void;
  onStop: () => void;
  streaming: boolean;
}

export const Composer: React.FC<ComposerProps> = ({
  model, onModelChange, onSubmit, onStop, streaming,
}) => {
  const [text, setText] = React.useState("");
  const trimmed = text.trim();

  const submit = () => {
    if (!trimmed) return;
    onSubmit(trimmed);
    setText("");
  };

  return (
    <div className="bd-ai-composer">
      <textarea
        className="bd-ai-composer-input"
        placeholder="Ask Claude…"
        aria-label="Prompt"
        value={text}
        onChange={(e) => setText(e.target.value)}
        onKeyDown={(e) => {
          if (e.key === "Enter" && !e.shiftKey) {
            e.preventDefault();
            submit();
          }
        }}
        rows={2}
      />
      <div className="bd-ai-composer-bar">
        <ModelPicker model={model} onChange={onModelChange} />
        {streaming ? (
          <button
            type="button"
            className="bd-ai-composer-stop"
            aria-label="Stop"
            onClick={onStop}
          >■</button>
        ) : (
          <button
            type="button"
            className="bd-ai-composer-send"
            aria-label="Send"
            disabled={!trimmed}
            onClick={submit}
          >↑</button>
        )}
      </div>
    </div>
  );
};
