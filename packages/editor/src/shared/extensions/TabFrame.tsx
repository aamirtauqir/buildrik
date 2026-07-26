/**
 * <TabFrame> — SSOT compound for sidebar tab grammar.
 *
 * Composes PanelShell with the three conventions every tab repeats inline today:
 *   1. Collapsible search row (toggle + input + clear)
 *   2. Filter pills row
 *   3. Standardized empty state
 *
 * PanelShell continues to own header/toolbar/content/footer. TabFrame adds the
 * tab-specific repeats so a sidebar tab's body reads as data + handlers, not
 * layout boilerplate.
 *
 * Migration shape:
 *
 *   <TabFrame>
 *     <TabFrame.Header title="Templates" onClose={onClose} />
 *     <TabFrame.Search
 *       visible={showSearch}
 *       value={searchQ}
 *       onChange={setSearchQ}
 *       onToggle={() => setShowSearch(v => !v)}
 *     />
 *     <TabFrame.Filters>{pills}</TabFrame.Filters>
 *     <TabFrame.Body>
 *       {items.length === 0
 *         ? <TabFrame.Empty icon={<File />} label="No templates" />
 *         : grid}
 *     </TabFrame.Body>
 *     <TabFrame.Footer>{pagination}</TabFrame.Footer>
 *   </TabFrame>
 *
 * Why a separate file from PanelShell:
 *   PanelShell is a primitive (lives in shared/ui/panel/). TabFrame is a
 *   composition specific to the sidebar tabs domain (lives in
 *   shared/extensions/). If a future vibcoder version ships a SidebarTab
 *   primitive, this file deletes and consumers swap import paths — same
 *   pattern documented in CLAUDE.md §shared/extensions/.
 *
 * Pilot migration: deferred to a follow-up commit per execution plan
 * stop-loss rule (TabFrame primitive shipped today, pilot tab when an
 * existing tab is being touched anyway to amortize the chrome rewrite risk).
 *
 * @license BSD-3-Clause
 */

import * as React from "react";
import { Search, X } from "lucide-react";
import { PanelShell } from "@shared/ui/panel";
import type { PanelHeaderProps } from "@/shared/extensions/PanelHeader";
import { Input } from "@/editor/shared/vibcoder/Input";
import { Button } from "@/editor/shared/vibcoder/Button";

// ============================================================================
// Root
// ============================================================================

export interface TabFrameProps extends React.HTMLAttributes<HTMLDivElement> {
  /** Forwarded to PanelShell. Tabs almost always omit (host controls width). */
  width?: "narrow" | "wide" | "fullpage";
  /** Forwarded to PanelShell. */
  bordered?: boolean;
  children: React.ReactNode;
}

interface TabFrameComponent extends React.FC<TabFrameProps> {
  Header: typeof Header;
  Search: typeof SearchRow;
  Filters: typeof Filters;
  Body: typeof Body;
  Empty: typeof Empty;
  Footer: typeof Footer;
}

const TabFrameFn: React.FC<TabFrameProps> = ({
  width,
  bordered,
  className,
  children,
  ...rest
}) => (
  <PanelShell width={width} bordered={bordered} className={className} {...rest}>
    {children}
  </PanelShell>
);

// ============================================================================
// Slot: Header (delegate to PanelShell.Header)
// ============================================================================

const Header: React.FC<PanelHeaderProps> = (props) => <PanelShell.Header {...props} />;
Header.displayName = "TabFrame.Header";

// ============================================================================
// Slot: Search — collapsible inline search row
// ============================================================================

export interface SearchRowProps {
  /** When false, the row is hidden (toggle button still rendered separately by Header). */
  visible: boolean;
  value: string;
  onChange(value: string): void;
  /** Optional clear handler. Defaults to `onChange("")`. */
  onClear?(): void;
  placeholder?: string;
  /** ARIA label for the input. */
  ariaLabel?: string;
  autoFocus?: boolean;
}

const searchWrapStyles: React.CSSProperties = {
  display: "flex",
  alignItems: "center",
  padding: "8px 12px",
  borderBottom: "1px solid var(--bk-border)",
  background: "var(--bk-bg-panel)",
  flexShrink: 0,
};

const searchBoxStyles: React.CSSProperties = {
  display: "flex",
  alignItems: "center",
  gap: 6,
  flex: 1,
  height: 28,
  padding: "0 8px",
  border: "1px solid var(--bk-border)",
  borderRadius: 4,
  background: "var(--bk-bg-card, var(--bk-bg-panel))",
};

const searchInputStyles: React.CSSProperties = {
  flex: 1,
  border: "none",
  outline: "none",
  background: "transparent",
  fontSize: 12,
  color: "var(--bk-ink)",
};

const SearchRow: React.FC<SearchRowProps> = ({
  visible,
  value,
  onChange,
  onClear,
  placeholder = "Search…",
  ariaLabel = "Search",
  autoFocus = true,
}) => {
  if (!visible) return null;
  return (
    <div style={searchWrapStyles}>
      <div style={searchBoxStyles}>
        <Search size={14} aria-hidden="true" />
        <Input
          type="search"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder={placeholder}
          aria-label={ariaLabel}
          autoFocus={autoFocus}
          style={searchInputStyles}
        />
        {value.length > 0 && (
          <Button
            variant="ghost"
            onClick={() => (onClear ? onClear() : onChange(""))}
            aria-label="Clear search"
            style={{ padding: 2 }}
          >
            <X size={12} />
          </Button>
        )}
      </div>
    </div>
  );
};
SearchRow.displayName = "TabFrame.Search";

// ============================================================================
// Slot: Filters — pills row (forwards to PanelShell.Toolbar)
// ============================================================================

export interface FiltersProps {
  children: React.ReactNode;
  className?: string;
}

const Filters: React.FC<FiltersProps> = ({ children, className }) => (
  <PanelShell.Toolbar className={className}>{children}</PanelShell.Toolbar>
);
Filters.displayName = "TabFrame.Filters";

// ============================================================================
// Slot: Body (delegate to PanelShell.Content)
// ============================================================================

export interface BodyProps {
  density?: "compact" | "standard" | "card";
  children: React.ReactNode;
  className?: string;
  noScroll?: boolean;
}

const Body: React.FC<BodyProps> = (props) => <PanelShell.Content {...props} />;
Body.displayName = "TabFrame.Body";

// ============================================================================
// Slot: Empty — standardized empty state
// ============================================================================

export interface EmptyProps {
  /** Optional icon node (16-24px recommended). */
  icon?: React.ReactNode;
  /** Primary label, e.g. "No templates yet". */
  label: string;
  /** Optional secondary text. */
  hint?: string;
  /** Optional CTA element (button, link). */
  action?: React.ReactNode;
}

const emptyStyles: React.CSSProperties = {
  display: "flex",
  flexDirection: "column",
  alignItems: "center",
  justifyContent: "center",
  gap: 8,
  padding: "32px 16px",
  textAlign: "center",
  color: "var(--bk-ink-muted)",
};

const emptyLabelStyles: React.CSSProperties = {
  fontSize: 13,
  fontWeight: 500,
  color: "var(--bk-ink)",
};

const emptyHintStyles: React.CSSProperties = {
  fontSize: 12,
  color: "var(--bk-ink-muted)",
};

const Empty: React.FC<EmptyProps> = ({ icon, label, hint, action }) => (
  <div style={emptyStyles} role="status">
    {icon}
    <div style={emptyLabelStyles}>{label}</div>
    {hint && <div style={emptyHintStyles}>{hint}</div>}
    {action && <div style={{ marginTop: 4 }}>{action}</div>}
  </div>
);
Empty.displayName = "TabFrame.Empty";

// ============================================================================
// Slot: Footer (delegate to PanelShell.Footer)
// ============================================================================

const Footer: React.FC<{ children: React.ReactNode; className?: string }> = (props) => (
  <PanelShell.Footer {...props} />
);
Footer.displayName = "TabFrame.Footer";

// ============================================================================
// Export compound
// ============================================================================

export const TabFrame = TabFrameFn as TabFrameComponent;
TabFrameFn.displayName = "TabFrame";
TabFrame.Header = Header;
TabFrame.Search = SearchRow;
TabFrame.Filters = Filters;
TabFrame.Body = Body;
TabFrame.Empty = Empty;
TabFrame.Footer = Footer;

export default TabFrame;
