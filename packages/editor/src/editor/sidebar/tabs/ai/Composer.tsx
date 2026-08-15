
import * as React from "react";
import { Button, Textarea } from "@/editor/chrome-ui";

export interface ComposerProps {
  onSubmit: (text: string) => void;
  onStop: () => void;
  streaming: boolean;
}

export const Composer: React.FC<ComposerProps> = ({
  onSubmit, onStop, streaming,
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
      <Textarea
        className="bd-ai-composer-input"
        placeholder="Ask AI to change something…"
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
        {streaming ? (
          <Button
            type="button"
            className="bd-ai-composer-stop"
            aria-label="Stop"
            onClick={onStop}
          >■</Button>
        ) : (
          <Button
            type="button"
            className="bd-ai-composer-send"
            aria-label="Send"
            disabled={!trimmed}
            onClick={submit}
          >↑</Button>
        )}
      </div>
    </div>
  );
};
