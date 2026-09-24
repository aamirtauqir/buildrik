import * as React from "react";
import { ChevronDown } from "lucide-react";
import { Button, Popover, Menu, MenuItem } from "@/editor/chrome-ui";
import type { AIScope, AIScopeStatus } from "./types";

export interface ScopeChipProps {
  scope: AIScope;
  status: AIScopeStatus;
  /** The scopes the band can switch to (boards 6891:73760 / 73974). Without
   *  it, or with one option, the band is a plain line. */
  options?: () => AIScope[];
  onChoose?: (scope: AIScope) => void;
}

function describeScope(scope: AIScope): string {
  switch (scope.kind) {
    case "element":
      return scope.label;
    case "multi":
      return `${scope.ids.length} selected elements`;
    case "similar":
      return `All ${scope.noun} like this (${scope.ids.length})`;
    case "site":
      return `Whole site (${scope.pages} pages)`;
    default:
      /* Board 4418:104313 reads "Scope: Page". */
      return "Page";
  }
}

const sameScope = (a: AIScope, b: AIScope) => a.kind === b.kind;

/* Every AI board opens the panel with a tinted band reading "Scope: <what>"
   — what the run is allowed to touch, in the run's own words. No board draws
   a lock glyph on it (4418:104577 is mid-run); a live run still freezes the
   scope, and the band says so to assistive tech and on hover. */
export const ScopeChip: React.FC<ScopeChipProps> = ({ scope, status, options, onChoose }) => {
  const [open, setOpen] = React.useState(false);
  const [list, setList] = React.useState<AIScope[]>([]);
  const locked = status === "locked";
  const text = (
    <span className="bd-ai-scope-text" data-testid="ai-scope-text">
      Scope: <span className="bd-ai-scope-target">{describeScope(scope)}</span>
    </span>
  );
  const lockedLabel = locked ? "Scope locked while the run is live" : undefined;

  if (!options || !onChoose) {
    return (
      <div className="bd-ai-scope" role="status" aria-live="polite" aria-label={lockedLabel} title={lockedLabel} data-testid="ai-scope">
        {text}
      </div>
    );
  }

  return (
    <div className="bd-ai-scope" role="status" aria-live="polite" data-testid="ai-scope">
      <Popover
        open={open}
        onClose={() => setOpen(false)}
        block
        label="Scope"
        className="tw:w-full"
        trigger={
          <Button
            type="button"
            variant="ghost"
            size="xs"
            className="tw:h-4 tw:w-full tw:justify-start tw:gap-1 tw:rounded-none tw:border-0 tw:bg-transparent tw:p-0 tw:text-left tw:text-[11px] tw:leading-4 tw:font-normal tw:text-inherit tw:hover:bg-transparent tw:focus:ring-0 tw:disabled:opacity-100 tw:disabled:bg-transparent"
            aria-haspopup="menu"
            aria-expanded={open}
            aria-label={lockedLabel ? `Scope: ${describeScope(scope)} — ${lockedLabel}` : `Scope: ${describeScope(scope)} — change`}
            title={lockedLabel}
            disabled={locked}
            data-testid="ai-scope-trigger"
            onClick={() => {
              setList(options());
              setOpen((v) => !v);
            }}
          >
            {text}
            {locked ? null : <ChevronDown size={12} aria-hidden="true" className="tw:ml-auto tw:opacity-70" />}
          </Button>
        }
      >
        <Menu label="Scope">
          {list.map((s) => (
            <MenuItem
              key={s.kind}
              selected={sameScope(s, scope)}
              tick="trailing"
              data-testid={`ai-scope-option-${s.kind}`}
              onClick={() => {
                onChoose(s);
                setOpen(false);
              }}
            >
              {describeScope(s)}
            </MenuItem>
          ))}
        </Menu>
      </Popover>
    </div>
  );
};
