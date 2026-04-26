/**
 * Vibcoder CommandPalette — combobox UI for command discovery / fuzzy search.
 *
 * Engine: cmdk (by Paco Coursey). Provides combobox state machine, filter,
 * keyboard nav, virtual focus, ARIA. The cmdk `CommandDialog` export wraps
 * everything inside a Radix.Dialog (focus trap, Esc, click-outside, portal).
 *
 * Skin: bd-cmd CSS classes from src/themes/components/organisms/command-palette.css.
 *
 * Sibling exports (Contract C):
 *   CommandPalette        — root (cmdk.CommandDialog) with open + onOpenChange
 *   CommandPaletteInput   — search input (cmdk.CommandInput) — bd-cmd__search-input
 *   CommandPaletteList    — scrollable result list (cmdk.CommandList) — bd-cmd__body
 *   CommandPaletteSection — labeled group (cmdk.CommandGroup) — bd-cmd__section / bd-cmd__label
 *   CommandPaletteItem    — selectable item (cmdk.CommandItem) — bd-cmd__item
 *   CommandPaletteEmpty   — empty-state (cmdk.CommandEmpty) — bd-cmd__empty
 *
 * Plan adaptations (Phase 3 finding for M5):
 *   - CSS root class is `.bd-cmd` (not `.bd-cmdk` as plan code-block stated).
 *     Modifier classes follow `bd-cmd__*` shape verbatim from CSS.
 *   - Plan named the group sibling `CommandPaletteGroup`. Renamed to
 *     `CommandPaletteSection` to match the source CSS class `.bd-cmd__section`
 *     (the heading inside it uses `.bd-cmd__label`).
 *   - cmdk exports `CommandDialog` flat (not `Command.Dialog` namespace as plan
 *     showed). Imported as flat name.
 *   - cmdk's CommandDialog wraps in Radix.Dialog internally and exposes
 *     `container` prop directly, so we wire useOverlayContainer() to it (E3).
 *
 * E2/E4: NO cmdk types re-exported (CommandLoadingProps, etc.). All public
 *   types are vibcoder-shaped.
 * E3: portals through OverlayMount via container prop on cmdk.CommandDialog.
 * B: always-controlled (open + onOpenChange required, no defaultOpen).
 *
 * @license BSD-3-Clause
 */
import {
  CommandDialog,
  CommandInput,
  CommandList,
  CommandItem,
  CommandGroup,
  CommandEmpty,
} from "cmdk";
import {
  forwardRef,
  type HTMLAttributes,
  type InputHTMLAttributes,
  type ReactNode,
} from "react";
import { useOverlayContainer } from "./OverlayMount";

export interface CommandPaletteProps {
  open: boolean;
  onOpenChange: (next: boolean) => void;
  /** Accessible label for the dialog (default "Command palette"). */
  label?: string;
  children: ReactNode;
}

export interface CommandPaletteInputProps
  extends Omit<InputHTMLAttributes<HTMLInputElement>, "value" | "onChange"> {
  value?: string;
  onValueChange?: (value: string) => void;
  placeholder?: string;
}

export interface CommandPaletteListProps extends HTMLAttributes<HTMLDivElement> {
  children: ReactNode;
}

export interface CommandPaletteItemProps
  extends Omit<HTMLAttributes<HTMLDivElement>, "onSelect"> {
  /** Search/filter key (cmdk uses this to filter). */
  value?: string;
  onSelect?: (value: string) => void;
  disabled?: boolean;
  children: ReactNode;
}

export interface CommandPaletteSectionProps
  extends HTMLAttributes<HTMLDivElement> {
  /** Section heading text — rendered inside .bd-cmd__label by cmdk. */
  heading?: string;
  children: ReactNode;
}

export interface CommandPaletteEmptyProps extends HTMLAttributes<HTMLDivElement> {
  children: ReactNode;
}

export function CommandPalette({
  open,
  onOpenChange,
  label = "Command palette",
  children,
}: CommandPaletteProps) {
  const container = useOverlayContainer();
  return (
    <CommandDialog
      open={open}
      onOpenChange={onOpenChange}
      label={label}
      container={container ?? undefined}
      contentClassName="bd-cmd"
    >
      {children}
    </CommandDialog>
  );
}
CommandPalette.displayName = "CommandPalette";

// Wrap input inside .bd-cmd__search wrapper so the CSS layout works
// (the input itself gets bd-cmd__search-input).
export const CommandPaletteInput = forwardRef<
  HTMLInputElement,
  CommandPaletteInputProps
>(({ className, ...rest }, ref) => {
  const classes = ["bd-cmd__search-input", className].filter(Boolean).join(" ");
  return (
    <div className="bd-cmd__search">
      <CommandInput ref={ref} className={classes} {...rest} />
    </div>
  );
});
CommandPaletteInput.displayName = "CommandPaletteInput";

export const CommandPaletteList = forwardRef<
  HTMLDivElement,
  CommandPaletteListProps
>(({ children, className, ...rest }, ref) => {
  const classes = ["bd-cmd__body", className].filter(Boolean).join(" ");
  return (
    <CommandList ref={ref} className={classes} {...rest}>
      {children}
    </CommandList>
  );
});
CommandPaletteList.displayName = "CommandPaletteList";

export const CommandPaletteItem = forwardRef<
  HTMLDivElement,
  CommandPaletteItemProps
>(({ value, onSelect, disabled, children, className, ...rest }, ref) => {
  const classes = ["bd-cmd__item", className].filter(Boolean).join(" ");
  return (
    <CommandItem
      ref={ref}
      value={value}
      onSelect={onSelect}
      disabled={disabled}
      className={classes}
      {...rest}
    >
      {children}
    </CommandItem>
  );
});
CommandPaletteItem.displayName = "CommandPaletteItem";

export const CommandPaletteSection = forwardRef<
  HTMLDivElement,
  CommandPaletteSectionProps
>(({ heading, children, className, ...rest }, ref) => {
  const classes = ["bd-cmd__section", className].filter(Boolean).join(" ");
  return (
    <CommandGroup ref={ref} heading={heading} className={classes} {...rest}>
      {children}
    </CommandGroup>
  );
});
CommandPaletteSection.displayName = "CommandPaletteSection";

export const CommandPaletteEmpty = forwardRef<
  HTMLDivElement,
  CommandPaletteEmptyProps
>(({ children, className, ...rest }, ref) => {
  const classes = ["bd-cmd__empty", className].filter(Boolean).join(" ");
  return (
    <CommandEmpty ref={ref} className={classes} {...rest}>
      {children}
    </CommandEmpty>
  );
});
CommandPaletteEmpty.displayName = "CommandPaletteEmpty";
