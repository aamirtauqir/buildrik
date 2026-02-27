/**
 * Aquibra Accordion Component
 * @license BSD-3-Clause
 */

import * as React from "react";

export interface AccordionItem {
  id: string;
  title: React.ReactNode;
  content: React.ReactNode;
  icon?: React.ReactNode;
  disabled?: boolean;
}

export interface AccordionProps {
  items: AccordionItem[];
  defaultOpen?: string[];
  allowMultiple?: boolean;
  onChange?: (openIds: string[]) => void;
}

export const Accordion: React.FC<AccordionProps> = ({
  items,
  defaultOpen = [],
  allowMultiple = false,
  onChange,
}) => {
  const [openIds, setOpenIds] = React.useState<string[]>(defaultOpen);

  const toggle = (id: string) => {
    let newOpenIds: string[];

    if (openIds.includes(id)) {
      newOpenIds = openIds.filter((i) => i !== id);
    } else {
      newOpenIds = allowMultiple ? [...openIds, id] : [id];
    }

    setOpenIds(newOpenIds);
    onChange?.(newOpenIds);
  };

  return (
    <div className="aqb-accordion">
      {items.map((item) => {
        const isOpen = openIds.includes(item.id);
        return (
          <div key={item.id} className="aqb-accordion-item" style={{ marginBottom: 4 }}>
            <button
              onClick={() => !item.disabled && toggle(item.id)}
              disabled={item.disabled}
              style={{
                width: "100%",
                padding: "12px 16px",
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
                gap: 8,
                background: "var(--aqb-bg-panel-secondary)",
                border: "none",
                borderRadius: isOpen ? "8px 8px 0 0" : 8,
                color: "var(--aqb-text-primary)",
                cursor: item.disabled ? "not-allowed" : "pointer",
                fontWeight: 500,
                fontSize: 13,
                opacity: item.disabled ? 0.5 : 1,
                transition: "all 0.15s ease",
              }}
            >
              <span style={{ display: "flex", alignItems: "center", gap: 8 }}>
                {item.icon}
                {item.title}
              </span>
              <span
                style={{
                  transform: isOpen ? "rotate(180deg)" : "rotate(0)",
                  transition: "transform 0.2s ease",
                }}
              >
                ▼
              </span>
            </button>
            <div
              style={{
                maxHeight: isOpen ? 1000 : 0,
                overflow: "hidden",
                transition: "max-height 0.3s ease",
                background: "var(--aqb-bg-panel)",
                borderRadius: "0 0 8px 8px",
              }}
            >
              <div style={{ padding: 16 }}>{item.content}</div>
            </div>
          </div>
        );
      })}
    </div>
  );
};

export default Accordion;
