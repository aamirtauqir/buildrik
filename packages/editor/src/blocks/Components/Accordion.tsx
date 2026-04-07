/**
 * Accordion/FAQ Block
 * Collapsible content sections for FAQs, product details, etc.
 * @license BSD-3-Clause
 */

import type { BlockBuildConfig, Composer } from "../types";

/**
 * Build accordion with programmatic element creation
 * Creates structured accordion with proper element hierarchy
 */
function buildAccordion(
  composer: Composer,
  parentId: string,
  dropIndex?: number
): string | undefined {
  const accordion = composer.elements.createElement("accordion", {
    tagName: "div",
    attributes: {
      class: "accordion",
      "data-allow-multiple": "false",
    },
    styles: {
      width: "100%",
      maxWidth: "640px",
    },
  });

  composer.elements.addElement(accordion, parentId, dropIndex);
  const accordionId = accordion.getId();

  // Create 3 default accordion items
  const items = [
    {
      title: "What is Aquibra?",
      content:
        "Aquibra is a professional visual web page builder that lets you create beautiful, responsive websites without writing code.",
    },
    {
      title: "Is it free to use?",
      content:
        "Yes! Aquibra offers a free tier with core features. Premium plans unlock advanced functionality and remove limitations.",
    },
    {
      title: "Can I export my designs?",
      content:
        "Absolutely! Export your designs as clean HTML/CSS code, or publish directly to your custom domain.",
    },
  ];

  items.forEach((item, index) => {
    // Accordion item wrapper
    const itemEl = composer.elements.createElement("container", {
      tagName: "div",
      attributes: {
        class: `accordion-item${index === 0 ? " open" : ""}`,
      },
      styles: {
        border: "1px solid #e2e8f0",
        borderRadius: "8px",
        marginBottom: "8px",
        overflow: "hidden",
      },
    });
    composer.elements.addElement(itemEl, accordionId);

    // Header button
    const header = composer.elements.createElement("button", {
      tagName: "button",
      attributes: {
        class: "accordion-header",
      },
      styles: {
        width: "100%",
        display: "flex",
        justifyContent: "space-between",
        alignItems: "center",
        padding: "16px 20px",
        background: "#fff",
        border: "none",
        cursor: "pointer",
        fontSize: "16px",
        fontWeight: "500",
        textAlign: "left",
      },
    });
    composer.elements.addElement(header, itemEl.getId());

    // Title text
    const titleEl = composer.elements.createElement("text", {
      tagName: "span",
      content: item.title,
    });
    composer.elements.addElement(titleEl, header.getId());

    // Content area
    const contentArea = composer.elements.createElement("container", {
      tagName: "div",
      attributes: {
        class: "accordion-content",
      },
      styles: {
        maxHeight: index === 0 ? "200px" : "0",
        overflow: "hidden",
        transition: "max-height 0.3s ease",
      },
    });
    composer.elements.addElement(contentArea, itemEl.getId());

    // Content inner wrapper
    const contentInner = composer.elements.createElement("container", {
      tagName: "div",
      styles: {
        padding: "0 20px 16px",
      },
    });
    composer.elements.addElement(contentInner, contentArea.getId());

    // Content paragraph
    const contentText = composer.elements.createElement("paragraph", {
      tagName: "p",
      content: item.content,
      styles: {
        margin: "0",
        color: "#64748b",
        lineHeight: "1.6",
      },
    });
    composer.elements.addElement(contentText, contentInner.getId());
  });

  return accordionId;
}

export const accordionBlockConfig: BlockBuildConfig = {
  id: "accordion",
  label: "Accordion / FAQ",
  category: "Components",
  elementType: "accordion",
  build: buildAccordion,
};
