/**
 * Tabs Block
 * Tabbed interface for organizing content sections
 * @license BSD-3-Clause
 */

import type { BlockBuildConfig, Composer } from "../types";

/**
 * Build tabbed interface component
 */
function buildTabs(composer: Composer, parentId: string, dropIndex?: number): string | undefined {
  const tabsWrapper = composer.elements.createElement("container", {
    tagName: "div",
    attributes: {
      class: "tabs",
    },
    styles: {
      width: "100%",
    },
  });

  composer.elements.addElement(tabsWrapper, parentId, dropIndex);
  const tabsId = tabsWrapper.getId();

  // Tab navigation bar
  const tabNav = composer.elements.createElement("container", {
    tagName: "div",
    attributes: {
      class: "tabs-nav",
      role: "tablist",
    },
    styles: {
      display: "flex",
      borderBottom: "2px solid #e2e8f0",
      marginBottom: "16px",
    },
  });
  composer.elements.addElement(tabNav, tabsId);

  const tabs = ["Tab 1", "Tab 2", "Tab 3"];

  // Create tab buttons
  tabs.forEach((tabLabel, index) => {
    const tabButton = composer.elements.createElement("button", {
      tagName: "button",
      attributes: {
        class: `tab-button${index === 0 ? " active" : ""}`,
        role: "tab",
        "aria-selected": index === 0 ? "true" : "false",
      },
      styles: {
        padding: "12px 20px",
        background: "transparent",
        border: "none",
        borderBottom: index === 0 ? "2px solid #8b5cf6" : "2px solid transparent",
        marginBottom: "-2px",
        cursor: "pointer",
        fontSize: "14px",
        fontWeight: index === 0 ? "600" : "500",
        color: index === 0 ? "#8b5cf6" : "#64748b",
        transition: "all 0.2s ease",
      },
    });
    composer.elements.addElement(tabButton, tabNav.getId());

    const buttonText = composer.elements.createElement("text", {
      tagName: "span",
      content: tabLabel,
    });
    composer.elements.addElement(buttonText, tabButton.getId());
  });

  // Tab content panels
  tabs.forEach((tabLabel, index) => {
    const tabPanel = composer.elements.createElement("container", {
      tagName: "div",
      attributes: {
        class: `tab-panel${index === 0 ? " active" : ""}`,
        role: "tabpanel",
      },
      styles: {
        display: index === 0 ? "block" : "none",
        padding: "20px",
        background: "#f8fafc",
        borderRadius: "8px",
        minHeight: "120px",
      },
    });
    composer.elements.addElement(tabPanel, tabsId);

    const panelContent = composer.elements.createElement("paragraph", {
      tagName: "p",
      content: `Content for ${tabLabel}. Click to edit this text and add your own content.`,
      styles: {
        margin: "0",
        color: "#64748b",
        lineHeight: "1.6",
      },
    });
    composer.elements.addElement(panelContent, tabPanel.getId());
  });

  return tabsId;
}

export const tabsBlockConfig: BlockBuildConfig = {
  id: "tabs",
  label: "Tabs",
  category: "Components",
  elementType: "container",
  build: buildTabs,
};
