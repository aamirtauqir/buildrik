
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

  /* The prompt stays in the field after sending (board 4418:106919: "Your
     prompt is still here"). A run that finishes cleanly remounts this
     component from AITab, which is what empties it. */
  const submit = () => {
    if (!trimmed) return;
    onSubmit(trimmed);
  };

  /* Boards 170:7 / 170:36 / 170:48 / 171:74 draw the prompt block as 72 tall:
     8 above a 52-tall input, 12 below. It measured 100, because the send
     control sat in a row of its own UNDER the input — and no AI board draws
     that row at all. The control is not deleted (Enter alone is not a visible
     way to send); it moves inside the field, where the boards leave the space
     empty. */
  return (
    <div className="bd-ai-composer" data-testid="ai-prompt">
      <div className="bd-ai-composer-field">
        <Textarea
          className="bd-ai-composer-input"
          data-testid="ai-prompt-input"
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
            disabled={!trimmed}
            onClick={submit}
          >
            {/* Board 4418:104454's primary is a labelled "Plan changes" — the
                panel only plans and runs (decision #23). It was a bare ↑. */}
            Plan changes
          </Button>
        )}
      </div>
    </div>
  );
};
