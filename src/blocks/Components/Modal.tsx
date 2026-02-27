/**
 * Modal Block
 * Dialog/popup container component
 * @license BSD-3-Clause
 */

import type { BlockBuildConfig, Composer } from "../types";

/**
 * Build modal dialog component
 */
function buildModal(composer: Composer, parentId: string, dropIndex?: number): string | undefined {
  // Modal trigger button
  const trigger = composer.elements.createElement("button", {
    tagName: "button",
    attributes: {
      class: "modal-trigger",
    },
    styles: {
      padding: "12px 24px",
      background: "#8b5cf6",
      color: "#ffffff",
      border: "none",
      borderRadius: "8px",
      fontSize: "14px",
      fontWeight: "600",
      cursor: "pointer",
      transition: "background 0.2s ease",
    },
  });

  composer.elements.addElement(trigger, parentId, dropIndex);
  const triggerId = trigger.getId();

  const triggerText = composer.elements.createElement("text", {
    tagName: "span",
    content: "Open Modal",
  });
  composer.elements.addElement(triggerText, triggerId);

  // Modal container (hidden by default - shown via JS/CSS)
  const modal = composer.elements.createElement("container", {
    tagName: "div",
    attributes: {
      class: "modal-overlay",
      role: "dialog",
      "aria-modal": "true",
    },
    styles: {
      position: "fixed",
      top: "0",
      left: "0",
      right: "0",
      bottom: "0",
      background: "rgba(0, 0, 0, 0.5)",
      display: "none", // Hidden by default
      alignItems: "center",
      justifyContent: "center",
      zIndex: "1000",
    },
  });
  composer.elements.addElement(modal, parentId);

  // Modal content box
  const modalContent = composer.elements.createElement("container", {
    tagName: "div",
    attributes: {
      class: "modal-content",
    },
    styles: {
      background: "#ffffff",
      borderRadius: "12px",
      maxWidth: "480px",
      width: "100%",
      maxHeight: "90vh",
      overflow: "auto",
      boxShadow: "0 20px 60px rgba(0, 0, 0, 0.3)",
    },
  });
  composer.elements.addElement(modalContent, modal.getId());

  // Modal header
  const header = composer.elements.createElement("container", {
    tagName: "div",
    attributes: {
      class: "modal-header",
    },
    styles: {
      display: "flex",
      justifyContent: "space-between",
      alignItems: "center",
      padding: "20px 24px",
      borderBottom: "1px solid #e2e8f0",
    },
  });
  composer.elements.addElement(header, modalContent.getId());

  const title = composer.elements.createElement("heading", {
    tagName: "h3",
    content: "Modal Title",
    styles: {
      margin: "0",
      fontSize: "18px",
      fontWeight: "600",
    },
  });
  composer.elements.addElement(title, header.getId());

  const closeBtn = composer.elements.createElement("button", {
    tagName: "button",
    attributes: {
      class: "modal-close",
    },
    styles: {
      background: "transparent",
      border: "none",
      fontSize: "24px",
      cursor: "pointer",
      color: "#94a3b8",
      padding: "0",
      lineHeight: "1",
    },
  });
  composer.elements.addElement(closeBtn, header.getId());

  const closeIcon = composer.elements.createElement("text", {
    tagName: "span",
    content: "×",
  });
  composer.elements.addElement(closeIcon, closeBtn.getId());

  // Modal body
  const body = composer.elements.createElement("container", {
    tagName: "div",
    attributes: {
      class: "modal-body",
    },
    styles: {
      padding: "24px",
    },
  });
  composer.elements.addElement(body, modalContent.getId());

  const bodyText = composer.elements.createElement("paragraph", {
    tagName: "p",
    content: "This is the modal content. Add your text, forms, or any other content here.",
    styles: {
      margin: "0",
      color: "#64748b",
      lineHeight: "1.6",
    },
  });
  composer.elements.addElement(bodyText, body.getId());

  return triggerId;
}

export const modalBlockConfig: BlockBuildConfig = {
  id: "modal",
  label: "Modal / Dialog",
  category: "Components",
  elementType: "container",
  build: buildModal,
};
