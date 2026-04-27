// PHASE 5 DELETE — Phase 4 adapter shim. Replaces hand-rolled Tabs.
/**
 * Adapter shim — translates legacy data-driven Tabs API to the vibcoder
 * Tabs/Tab compound (composition) shape.
 *
 * Strategy: bridge. The legacy API is `<Tabs tabs={[{id,label,content}, ...]}>`.
 * Vibcoder ships `<Tabs value onValueChange><Tab id>...</Tab></Tabs>` as a
 * controlled compound — the shim materialises the trigger row + the active
 * tab's content panel internally so legacy callers keep their data-driven
 * shape.
 *
 * Prop translations (Phase 4 T4.B mapping):
 *   tabs (Tab[])       → mapped to <Tab id={t.id}>{t.label}</Tab> children
 *                        inside the vibcoder Tabs root. Disabled tabs forward
 *                        the disabled prop. Icons are rendered alongside the
 *                        label inside each Tab.
 *   activeTab (string) → wired to vibcoder `value`. The shim is internally
 *                        controlled (useState seeded from activeTab) so the
 *                        legacy uncontrolled pattern keeps working. If
 *                        activeTab changes externally, the local state is
 *                        synced via useEffect.
 *   onChange (id)      → wired to vibcoder `onValueChange`. Fires AFTER
 *                        local state updates, matching legacy semantics.
 *   variant            → marker className "bd-tabs--{variant}" — vibcoder
 *                        ships only the underlined shape; pills/default
 *                        intent retained as a class hook for future CSS
 *                        targeting. "default" emits no marker.
 *   size               → marker className "bd-tabs--{size}". "md" (default)
 *                        emits no marker.
 *   fullWidth          → marker className "bd-tabs--full". (Vibcoder
 *                        underlined Tabs do not stretch by default.)
 *
 * Content panel rendering: the active tab's `content` is rendered below the
 * Tabs row in a `<div class="bd-tabs__panel">`. Vibcoder explicitly scopes
 * panel rendering to the caller (per Phase 2 docstring), so the shim takes
 * over that responsibility — legacy callers expect the content to render.
 *
 * Untranslatable: arrow-key navigation between tabs is dropped — vibcoder
 * Tab handles click activation only. (The legacy implementation re-fired
 * onChange on Arrow keys; vibcoder's Phase 5 will likely add this via a
 * Tabs-level keyboard handler. Acceptable Phase 4 regression — chrome
 * consumers click tabs.)
 *
 * @license BSD-3-Clause
 */

import * as React from "react";
import {
  Tabs as VibcoderTabs,
  Tab as VibcoderTab,
} from "@/editor/shared/vibcoder";

export interface Tab {
  id: string;
  label: React.ReactNode;
  icon?: React.ReactNode;
  disabled?: boolean;
  content?: React.ReactNode;
}

export interface TabsProps {
  tabs: Tab[];
  activeTab?: string;
  onChange?: (tabId: string) => void;
  variant?: "default" | "pills" | "underline";
  size?: "sm" | "md" | "lg";
  fullWidth?: boolean;
}

export const Tabs: React.FC<TabsProps> = ({
  tabs,
  activeTab,
  onChange,
  variant = "default",
  size = "md",
  fullWidth = false,
}) => {
  const [active, setActive] = React.useState<string>(
    activeTab ?? tabs[0]?.id ?? "",
  );

  // Sync external activeTab changes into local state.
  React.useEffect(() => {
    if (activeTab !== undefined && activeTab !== active) {
      setActive(activeTab);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeTab]);

  const handleValueChange = (next: string) => {
    setActive(next);
    onChange?.(next);
  };

  const rootClassName =
    [
      variant !== "default" && `bd-tabs--${variant}`,
      size !== "md" && `bd-tabs--${size}`,
      fullWidth && "bd-tabs--full",
    ]
      .filter(Boolean)
      .join(" ") || undefined;

  const activeContent = tabs.find((t) => t.id === active)?.content;

  return (
    <div className="buildrick-tabs">
      <VibcoderTabs
        value={active}
        onValueChange={handleValueChange}
        className={rootClassName}
      >
        {tabs.map((t) => (
          <VibcoderTab key={t.id} id={t.id} disabled={t.disabled}>
            {t.icon}
            {t.label}
          </VibcoderTab>
        ))}
      </VibcoderTabs>
      {activeContent !== undefined && activeContent !== null && (
        <div className="bd-tabs__panel">{activeContent}</div>
      )}
    </div>
  );
};

export default Tabs;
