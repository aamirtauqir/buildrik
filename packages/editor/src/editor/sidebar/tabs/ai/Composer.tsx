
import * as React from "react";
import { Button, Textarea } from "@/editor/chrome-ui";

export interface ComposerProps {
  onSubmit: (text: string) => void;
  /** A run is live: the field shows only the prompt — Stop is under the
   *  Thinking band / run band (board 4418:104577). */
  streaming: boolean;
  /** "7 left today" (board 4418:104313, G2-129) — only when the quota read
   *  answered; absent otherwise. */
  quotaLabel?: string;
  /** Draw "Plan changes" under the field. The run boards (4418:104837 …
   *  105548) show the field alone while a run is on screen; Enter still
   *  sends whenever nothing is streaming. Default: not while streaming. */
  showPlan?: boolean;
}

export const Composer: React.FC<ComposerProps> = ({
  onSubmit, streaming, quotaLabel, showPlan = !streaming,
}) => {
  const [text, setText] = React.useState("");
  const trimmed = text.trim();

  /* The prompt stays in the field after sending (board 4418:106919: "Your
     prompt is still here"). A run that finishes cleanly remounts this
     component from AITab, which is what empties it. */
  const submit = () => {
    if (!trimmed || streaming) return;
    onSubmit(trimmed);
  };

  /* Boards 4418:104313 / 104454 / 6881:63246: the field (248 wide, the
     counter in its corner), then "Plan changes" as a 28-tall primary of its
     own under it, on the left. It used to sit inside the field as a 22-tall
     chip. */
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
            /* FA-1 escape rule: the FIRST Escape here just blurs the field
               (useColumnPanelEscape's isTyping guard ignores an Escape whose
               target is this textarea, so the panel does not close under a
               user still composing). Escape from an unfocused field is a
               second press and reaches that window listener, which returns
               to the Inspector. */
            if (e.key === "Escape") {
              e.currentTarget.blur();
            }
          }}
          rows={2}
        />
        {quotaLabel ? (
          <span className="bd-ai-composer-quota" data-testid="ai-quota">
            {quotaLabel}
          </span>
        ) : null}
      </div>
      {showPlan ? (
        <Button
          type="button"
          size="xs"
          className="tw:mt-3 tw:h-7 tw:rounded-md tw:px-2 tw:text-[13px] tw:font-medium tw:focus:ring-0 tw:disabled:bg-[var(--bk-accent)] tw:disabled:text-[var(--bk-accent-on)] tw:disabled:opacity-40"
          disabled={!trimmed || streaming}
          onClick={submit}
          data-testid="ai-plan-changes"
        >
          Plan changes
        </Button>
      ) : null}
    </div>
  );
};
