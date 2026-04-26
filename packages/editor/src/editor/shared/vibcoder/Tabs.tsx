/**
 * Vibcoder Tabs + PillGroup wrappers — segmented + underlined tabs.
 * Renders the bd-tabs and bd-pillgroup composites from
 * src/themes/components/molecules/tabs.css.
 *
 * The CSS file ships TWO conceptually separate molecules; both ship in
 * this single wrapper file (per the manifest entry that points both
 * `bdr-tabs` and `bdr-pillgroup` at `molecules/tabs.{css,html}`):
 *
 *   bd-tabs       underlined panel tabs (active via aria-selected="true")
 *                 → exports Tabs + Tab
 *   bd-pillgroup  segmented control (active via aria-pressed="true")
 *                 → exports PillGroup + PillButton
 *
 * Sub-component manifest (Contract C — sibling exports per Phase 2 spec):
 *   Tabs        bd-tabs container, role="tablist"
 *   Tab         bd-tabs__tab button, role="tab", consumes Tabs context
 *   PillGroup   bd-pillgroup container (segmented control wrapper)
 *   PillButton  bd-pillgroup__btn, consumes PillGroup context
 *
 * Contract B (always-controlled state) — Phase 2 mandate:
 *   Tabs:       value + onValueChange REQUIRED. NO defaultValue. NO
 *               internal useState. The active tab id is caller-owned.
 *   PillGroup:  value + onValueChange REQUIRED — same shape as Tabs.
 *
 * Internal React context (NOT exported) wires parent ↔ child without
 * prop drilling. Each compound ships its own context — they're not
 * shared because the active-state ARIA attr differs (aria-selected vs
 * aria-pressed) and conflating them would invite caller error.
 *
 * NO TabPanel exported. Phase 2 explicitly scopes panel rendering to
 * the caller — they own the same `value` they pass to Tabs and switch
 * panel content based on it. Keeps the molecule a pure trigger row.
 *
 * Polymorphism choice (per Phase 2 Contract D guidance): COMPOSITION.
 *   Caller composes <Tab id="…">label</Tab> children explicitly. No
 *   data-driven `tabs={[…]}` API. Source CSS exposes `__tab` as a
 *   composable slot, not a data field.
 *
 * Why no shared Tabs/PillGroup context: the active-state ARIA contract
 * differs (aria-selected vs aria-pressed) and the visual selectors
 * differ (.is-active vs .is-on). Sharing one context would require Tab
 * to introspect "am I in a Tabs or a PillGroup?" — invitation to bugs.
 *
 * Variant union from `vibcoder-variants.mjs molecules/tabs`:
 *   (no .bd-X--Y modifier classes — visual state lives entirely on
 *   .is-active / .is-on / aria-selected / aria-pressed)
 *
 * @license BSD-3-Clause
 */
import {
  type ButtonHTMLAttributes,
  type HTMLAttributes,
  type ReactNode,
  createContext,
  forwardRef,
  useContext,
} from "react";

// ---- Tabs (underlined) ----

interface TabsContextValue {
  value: string;
  onValueChange: (next: string) => void;
}

const TabsContext = createContext<TabsContextValue | null>(null);

export interface TabsProps
  extends Omit<HTMLAttributes<HTMLDivElement>, "onChange"> {
  /** Active tab id. REQUIRED — no defaultValue, no uncontrolled mode. */
  value: string;
  /** Fires when an inactive Tab is clicked. REQUIRED. */
  onValueChange: (next: string) => void;
  children: ReactNode;
}

export const Tabs = forwardRef<HTMLDivElement, TabsProps>(
  ({ value, onValueChange, className, children, ...rest }, ref) => {
    const classes = ["bd-tabs", className].filter(Boolean).join(" ");
    return (
      <TabsContext.Provider value={{ value, onValueChange }}>
        <div ref={ref} className={classes} role="tablist" {...rest}>
          {children}
        </div>
      </TabsContext.Provider>
    );
  },
);
Tabs.displayName = "Tabs";

export interface TabProps
  extends Omit<ButtonHTMLAttributes<HTMLButtonElement>, "id" | "value"> {
  /** Unique tab identifier. Must match a value the parent Tabs owns. */
  id: string;
  children: ReactNode;
}

export const Tab = forwardRef<HTMLButtonElement, TabProps>(
  (
    { id, children, disabled, className, type = "button", onClick, ...rest },
    ref,
  ) => {
    const ctx = useContext(TabsContext);
    if (!ctx) {
      throw new Error("Tab must be rendered inside <Tabs>");
    }
    const isActive = ctx.value === id;
    const classes = [
      "bd-tabs__tab",
      isActive && "is-active",
      className,
    ]
      .filter(Boolean)
      .join(" ");
    return (
      <button
        ref={ref}
        type={type}
        role="tab"
        aria-selected={isActive}
        disabled={disabled}
        className={classes}
        onClick={(e) => {
          onClick?.(e);
          if (!e.defaultPrevented && !disabled && !isActive)
            ctx.onValueChange(id);
        }}
        {...rest}
      >
        {children}
      </button>
    );
  },
);
Tab.displayName = "Tab";

// ---- PillGroup (segmented control) ----

interface PillGroupContextValue {
  value: string;
  onValueChange: (next: string) => void;
}

const PillGroupContext = createContext<PillGroupContextValue | null>(null);

export interface PillGroupProps
  extends Omit<HTMLAttributes<HTMLDivElement>, "onChange"> {
  /** Active pill id. REQUIRED — no defaultValue, no uncontrolled mode. */
  value: string;
  /** Fires when an inactive PillButton is clicked. REQUIRED. */
  onValueChange: (next: string) => void;
  children: ReactNode;
}

export const PillGroup = forwardRef<HTMLDivElement, PillGroupProps>(
  ({ value, onValueChange, className, children, ...rest }, ref) => {
    const classes = ["bd-pillgroup", className].filter(Boolean).join(" ");
    return (
      <PillGroupContext.Provider value={{ value, onValueChange }}>
        <div ref={ref} className={classes} role="group" {...rest}>
          {children}
        </div>
      </PillGroupContext.Provider>
    );
  },
);
PillGroup.displayName = "PillGroup";

export interface PillButtonProps
  extends Omit<ButtonHTMLAttributes<HTMLButtonElement>, "id" | "value"> {
  /** Unique pill identifier. Must match a value the parent PillGroup owns. */
  id: string;
  children: ReactNode;
}

export const PillButton = forwardRef<HTMLButtonElement, PillButtonProps>(
  (
    { id, children, disabled, className, type = "button", onClick, ...rest },
    ref,
  ) => {
    const ctx = useContext(PillGroupContext);
    if (!ctx) {
      throw new Error("PillButton must be rendered inside <PillGroup>");
    }
    const isOn = ctx.value === id;
    const classes = [
      "bd-pillgroup__btn",
      isOn && "is-on",
      className,
    ]
      .filter(Boolean)
      .join(" ");
    return (
      <button
        ref={ref}
        type={type}
        aria-pressed={isOn}
        disabled={disabled}
        className={classes}
        onClick={(e) => {
          onClick?.(e);
          if (!e.defaultPrevented && !disabled && !isOn)
            ctx.onValueChange(id);
        }}
        {...rest}
      >
        {children}
      </button>
    );
  },
);
PillButton.displayName = "PillButton";
