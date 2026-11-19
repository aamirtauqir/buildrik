/**
 * Page width — boards 145:71013 (B3-C15) and 145:71444 (B3-C16), the body of
 * the popover the canvas bar's "{width} px" opens. Presets switch the
 * authoring width; the field takes any width in range on Enter and keeps the
 * page where it is while the draft is invalid.
 *
 * Tablet and Mobile ARE breakpoint previews at those widths, so they switch
 * to the breakpoint; every other width previews inside the breakpoint it
 * falls in (the caller's `onCustomWidth`, G2-014). The code's fluid Desktop
 * (the page fills the canvas) stays on the topbar breakpoint switcher. The board's "Saved for your editor on this site."
 * is not drawn: the width is held for the session only.
 *
 * @license BSD-3-Clause
 */
import * as React from "react";
import { Button, Menu, MenuItem, TextInput, type Breakpoint } from "@/editor/chrome-ui";
import { CUSTOM_WIDTH_RANGE, parseCustomWidth } from "@/shared/constants/breakpoints";

const PRESETS: ReadonlyArray<{ width: number; label?: string; device?: Breakpoint }> = [
  { width: 1920, label: "Wide" },
  { width: 1440, label: "Desktop" },
  { width: 1280 },
  { width: 1024 },
  { width: 768, label: "Tablet", device: "tablet" },
  { width: 375, label: "Mobile", device: "mobile" },
];

export interface PageWidthPanelProps {
  /** The width the page is authored at now, in px. */
  width: number;
  /** The breakpoint in effect, and whether a custom width overrides it. */
  device: Breakpoint;
  custom: boolean;
  onDeviceChange: (device: Breakpoint) => void;
  onCustomWidth: (width: number) => void;
  onDone: () => void;
}

export function PageWidthPanel({ width, device, custom, onDeviceChange, onCustomWidth, onDone }: PageWidthPanelProps) {
  const [draft, setDraft] = React.useState(String(width));
  const parsed = parseCustomWidth(draft);
  const valid = parsed !== null;

  const pick = (p: (typeof PRESETS)[number]) => {
    if (p.device) onDeviceChange(p.device);
    else onCustomWidth(p.width);
    onDone();
  };

  return (
    <div className="tw:flex tw:w-60 tw:flex-col tw:gap-2 tw:whitespace-normal tw:p-3" data-testid="page-width-panel">
      {/* 145:71013 / 145:71444: the title and a text Close on one row. */}
      <div className="tw:flex tw:items-center">
        <span className="tw:text-[13px] tw:font-medium tw:text-[var(--bk-ink)]">Page width</span>
        <Button
          color="light"
          size="xs"
          data-testid="page-width-close"
          className="tw:-mr-2 tw:ml-auto tw:h-7 tw:border-transparent tw:bg-transparent tw:px-2 tw:text-[13px] tw:font-normal tw:text-[var(--bk-ink)] tw:focus:ring-0"
          onClick={onDone}
        >
          Close
        </Button>
      </div>
      <label className="tw:flex tw:flex-col tw:gap-1 tw:text-[12px] tw:text-[var(--bk-ink-soft)]">
        Width (px)
        <TextInput
          sizing="sm"
          inputMode="numeric"
          className="tw:tabular-nums"
          value={draft}
          color={valid || draft === "" ? undefined : "failure"}
          data-testid="page-width-input"
          onChange={(e) => setDraft(e.target.value.replace(/[^0-9]/g, ""))}
          onKeyDown={(e) => {
            e.stopPropagation();
            if (e.key === "Enter" && parsed !== null) {
              onCustomWidth(parsed);
              onDone();
            }
          }}
        />
      </label>
      {!valid && draft !== "" && (
        <span role="alert" className="tw:text-[11px] tw:leading-4 tw:text-[var(--bk-error-text)]" data-testid="page-width-error">
          {`Enter a number from ${CUSTOM_WIDTH_RANGE.min} to ${CUSTOM_WIDTH_RANGE.max}. The page stays at ${width} px.`}
        </span>
      )}
      <Menu label="Page width presets" className="tw:-mx-1">
        {PRESETS.map((p) => (
          <MenuItem
            key={p.width}
            radio
            tick="trailing"
            selected={p.device ? !custom && device === p.device : custom && width === p.width}
            data-testid={`page-width-preset-${p.width}`}
            onClick={() => pick(p)}
          >
            {p.label ? `${p.width} · ${p.label}` : String(p.width)}
          </MenuItem>
        ))}
      </Menu>
      <span className="tw:text-[11px] tw:leading-4 tw:text-[var(--bk-ink-muted)]">
        {`Custom width: ${CUSTOM_WIDTH_RANGE.min}–${CUSTOM_WIDTH_RANGE.max} px.`}
      </span>
    </div>
  );
}
