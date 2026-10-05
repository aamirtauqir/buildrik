/**
 * Design system constants
 * @license BSD-3-Clause
 */

import type { StylePreset } from "./types";

export { DEFAULT_TOKENS } from "@/engine/designSystem/defaultTokens";

/**
 * Default style presets seeded into a fresh project. Each binding's tokenId
 * MUST resolve against an entry in DEFAULT_TOKENS (engine/designSystem/defaultTokens.ts) — verified by the
 * preset binding integrity test. Variant strings are user-facing in beginner
 * mode; pick semantic names not implementation names ("primary" not "blue").
 */
export const DEFAULT_PRESETS: StylePreset[] = [
  // Buttons — three semantic variants.
  {
    id: "button-primary", friendlyName: "Primary button", category: "button", variant: "primary",
    bindings: {
      "background-color": { tokenId: "color-primary" },
      "color":            { tokenId: "color-background" },
      "border-radius":    { tokenId: "btn-radius" },
      "padding-inline":   { tokenId: "btn-padding-x" },
      "height":           { tokenId: "btn-height-md" },
      "font-size":        { tokenId: "btn-font-size" },
      "font-weight":      { tokenId: "btn-font-weight" },
    },
  },
  {
    id: "button-secondary", friendlyName: "Secondary button", category: "button", variant: "secondary",
    bindings: {
      "background-color": { tokenId: "color-secondary" },
      "color":            { tokenId: "color-text" },
      "border-radius":    { tokenId: "btn-radius" },
      "padding-inline":   { tokenId: "btn-padding-x" },
      "height":           { tokenId: "btn-height-md" },
    },
  },
  {
    id: "button-ghost", friendlyName: "Ghost button", category: "button", variant: "ghost",
    bindings: {
      "color":            { tokenId: "color-primary" },
      "border-radius":    { tokenId: "btn-radius" },
      "padding-inline":   { tokenId: "btn-padding-x" },
      "height":           { tokenId: "btn-height-md" },
    },
  },

  // Cards — elevated and flat.
  {
    id: "card-elevated", friendlyName: "Elevated card", category: "card", variant: "elevated",
    bindings: {
      "background-color": { tokenId: "color-background" },
      "border-radius":    { tokenId: "radius-lg" },
      "box-shadow":       { tokenId: "shadow-md" },
    },
  },
  {
    id: "card-flat", friendlyName: "Flat card", category: "card", variant: "flat",
    bindings: {
      "background-color": { tokenId: "color-background" },
      "border-radius":    { tokenId: "radius-lg" },
      "border":           { tokenId: "border-default" },
    },
  },

  // Form fields — default text input.
  {
    id: "form-input-default", friendlyName: "Text input", category: "form", variant: "default",
    bindings: {
      "border":           { tokenId: "input-border" },
      "border-radius":    { tokenId: "input-radius" },
      "padding-inline":   { tokenId: "input-padding-x" },
      "height":           { tokenId: "input-height" },
      "font-size":        { tokenId: "font-size-base" },
    },
  },

  // Links — default + muted.
  {
    id: "link-default", friendlyName: "Default link", category: "link", variant: "default",
    bindings: {
      "color":            { tokenId: "color-primary" },
    },
  },
  {
    id: "link-muted", friendlyName: "Muted link", category: "link", variant: "muted",
    bindings: {
      "color":            { tokenId: "color-muted" },
    },
  },

  // Badges — semantic palette.
  {
    id: "badge-success", friendlyName: "Success badge", category: "badge", variant: "success",
    bindings: {
      "background-color": { tokenId: "color-success" },
      "color":            { tokenId: "color-background" },
      "border-radius":    { tokenId: "radius-full" },
    },
  },
  {
    id: "badge-error", friendlyName: "Error badge", category: "badge", variant: "error",
    bindings: {
      "background-color": { tokenId: "color-error" },
      "color":            { tokenId: "color-background" },
      "border-radius":    { tokenId: "radius-full" },
    },
  },

  // Alerts — info + error.
  {
    id: "alert-info", friendlyName: "Info alert", category: "alert", variant: "info",
    bindings: {
      "background-color": { tokenId: "color-background" },
      "border":           { tokenId: "border-default" },
      "border-radius":    { tokenId: "radius-md" },
      "color":            { tokenId: "color-text" },
    },
  },
  {
    id: "alert-error", friendlyName: "Error alert", category: "alert", variant: "error",
    bindings: {
      "background-color": { tokenId: "color-error" },
      "color":            { tokenId: "color-background" },
      "border-radius":    { tokenId: "radius-md" },
    },
  },

  // Tooltips — single default.
  {
    id: "tooltip-default", friendlyName: "Tooltip", category: "tooltip", variant: "default",
    bindings: {
      "background-color": { tokenId: "color-text" },
      "color":            { tokenId: "color-background" },
      "border-radius":    { tokenId: "radius-sm" },
      "font-size":        { tokenId: "font-size-sm" },
    },
  },

  // Modals — default surface.
  {
    id: "modal-default", friendlyName: "Modal panel", category: "modal", variant: "default",
    bindings: {
      "background-color": { tokenId: "color-background" },
      "border-radius":    { tokenId: "radius-lg" },
      "box-shadow":       { tokenId: "shadow-xl" },
      "z-index":          { tokenId: "zindex-modal" },
    },
  },

  // Nav — top bar.
  {
    id: "nav-topbar", friendlyName: "Top bar", category: "nav", variant: "topbar",
    bindings: {
      "background-color": { tokenId: "color-background" },
      "border":           { tokenId: "border-default" },
      "height":           { tokenId: "input-height" },
    },
  },

  // Table — default surface.
  {
    id: "table-default", friendlyName: "Default table", category: "table", variant: "default",
    bindings: {
      "border":           { tokenId: "border-default" },
      "border-radius":    { tokenId: "radius-md" },
      "font-size":        { tokenId: "font-size-base" },
    },
  },

  // Layout — section + container.
  {
    id: "layout-section", friendlyName: "Page section", category: "layout", variant: "section",
    bindings: {
      "padding-block":    { tokenId: "section-padding-y" },
      "padding-inline":   { tokenId: "layout-padding-x" },
    },
  },
  {
    id: "layout-container", friendlyName: "Container", category: "layout", variant: "container",
    bindings: {
      "max-width":        { tokenId: "sizing-container" },
      "margin-inline":    { tokenId: "layout-padding-x" },
    },
  },
];
