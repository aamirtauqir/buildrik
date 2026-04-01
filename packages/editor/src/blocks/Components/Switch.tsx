/**
 * Switch/Toggle Block
 * Toggle switch with label for on/off states
 * @license BSD-3-Clause
 */

import type { BlockBuildConfig, Composer } from "../types";

/**
 * Build toggle switch component
 */
function buildSwitch(composer: Composer, parentId: string, dropIndex?: number): string | undefined {
  const wrapper = composer.elements.createElement("container", {
    tagName: "label",
    attributes: {
      class: "switch-wrapper",
    },
    styles: {
      display: "inline-flex",
      alignItems: "center",
      gap: "12px",
      cursor: "pointer",
    },
  });

  composer.elements.addElement(wrapper, parentId, dropIndex);
  const wrapperId = wrapper.getId();

  // Hidden checkbox input
  const input = composer.elements.createElement("input", {
    tagName: "input",
    attributes: {
      type: "checkbox",
      class: "switch-input",
    },
    styles: {
      position: "absolute",
      opacity: "0",
      width: "0",
      height: "0",
    },
  });
  composer.elements.addElement(input, wrapperId);

  // Visual switch track
  const track = composer.elements.createElement("container", {
    tagName: "span",
    attributes: {
      class: "switch-track",
    },
    styles: {
      position: "relative",
      width: "44px",
      height: "24px",
      background: "#cbd5e1",
      borderRadius: "24px",
      transition: "background 0.2s ease",
    },
  });
  composer.elements.addElement(track, wrapperId);

  // Switch thumb/knob
  const thumb = composer.elements.createElement("container", {
    tagName: "span",
    attributes: {
      class: "switch-thumb",
    },
    styles: {
      position: "absolute",
      top: "2px",
      left: "2px",
      width: "20px",
      height: "20px",
      background: "#ffffff",
      borderRadius: "50%",
      boxShadow: "0 2px 4px rgba(0,0,0,0.2)",
      transition: "transform 0.2s ease",
    },
  });
  composer.elements.addElement(thumb, track.getId());

  // Label text
  const label = composer.elements.createElement("text", {
    tagName: "span",
    content: "Toggle Option",
    styles: {
      fontSize: "14px",
      color: "#374151",
    },
  });
  composer.elements.addElement(label, wrapperId);

  return wrapperId;
}

export const switchBlockConfig: BlockBuildConfig = {
  id: "switch",
  label: "Switch / Toggle",
  category: "Components",
  elementType: "container",
  build: buildSwitch,
};
