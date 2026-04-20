/**
 * Aquibra Tabs Component
 * @license BSD-3-Clause
 */

import * as React from "react";

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
  const [active, setActive] = React.useState(activeTab || tabs[0]?.id);

  const handleChange = (tabId: string) => {
    setActive(tabId);
    onChange?.(tabId);
  };

  const sizeStyles = {
    sm: { padding: "6px 12px", fontSize: 12 },
    md: { padding: "8px 16px", fontSize: 13 },
    lg: { padding: "10px 20px", fontSize: 14 },
  };

  const activeContent = tabs.find((t) => t.id === active)?.content;

  const handleKeyDown = (e: React.KeyboardEvent<HTMLButtonElement>) => {
    if (e.key === "ArrowRight" || e.key === "ArrowLeft") {
      e.preventDefault();
      const currentIndex = tabs.findIndex((t) => t.id === active);
      if (currentIndex === -1) return;
      const delta = e.key === "ArrowRight" ? 1 : -1;
      const nextIndex = (currentIndex + delta + tabs.length) % tabs.length;
      const nextTab = tabs[nextIndex];
      if (!nextTab.disabled) {
        handleChange(nextTab.id);
      }
    }
  };

  return (
    <div className="buildrick-tabs">
      <div
        className={`buildrick-tabs-list buildrick-tabs-${variant}`}
        role="tablist"
        style={{
          display: "flex",
          gap: variant === "pills" ? 4 : 0,
          borderBottom: variant === "underline" ? "1px solid var(--buildrick-border)" : "none",
          background: variant === "default" ? "var(--buildrick-bg-panel-secondary)" : "transparent",
          borderRadius: variant === "default" ? "var(--buildrick-radius-sm)" : 0,
          padding: variant === "default" ? 4 : 0,
        }}
      >
        {tabs.map((tab) => {
          const isActive = tab.id === active;
          return (
            <button
              key={tab.id}
              onClick={() => !tab.disabled && handleChange(tab.id)}
              disabled={tab.disabled}
              role="tab"
              aria-selected={isActive}
              tabIndex={isActive ? 0 : -1}
              onKeyDown={handleKeyDown}
              style={{
                ...sizeStyles[size],
                flex: fullWidth ? 1 : "none",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                gap: 6,
                border: "none",
                cursor: tab.disabled ? "not-allowed" : "pointer",
                fontWeight: isActive ? 600 : 400,
                transition: "all 0.15s ease",
                opacity: tab.disabled ? 0.5 : 1,
                ...getVariantStyles(variant, isActive),
              }}
            >
              {tab.icon}
              {tab.label}
            </button>
          );
        })}
      </div>
      {activeContent && (
        <div className="buildrick-tabs-content" style={{ marginTop: 16 }}>
          {activeContent}
        </div>
      )}
    </div>
  );
};

function getVariantStyles(variant: TabsProps["variant"], isActive: boolean): React.CSSProperties {
  switch (variant) {
    case "pills":
      return {
        background: isActive ? "var(--buildrick-accent)" : "transparent",
        color: isActive ? "var(--buildrick-text-on-accent)" : "var(--buildrick-text-secondary)",
        borderRadius: "var(--buildrick-radius-sm)",
      };
    case "underline":
      return {
        background: "transparent",
        color: isActive ? "var(--buildrick-accent)" : "var(--buildrick-text-secondary)",
        borderBottom: isActive ? "2px solid var(--buildrick-accent)" : "2px solid transparent",
        borderRadius: 0,
        marginBottom: -1,
      };
    default:
      return {
        background: isActive ? "var(--buildrick-bg-panel)" : "transparent",
        color: isActive ? "var(--buildrick-text-primary)" : "var(--buildrick-text-secondary)",
        borderRadius: "var(--buildrick-radius-sm)",
      };
  }
}

export default Tabs;
