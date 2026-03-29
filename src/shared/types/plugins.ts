/**
 * Aquibra Plugin System Types
 * Type definitions for the plugin architecture
 *
 * @module types/plugins
 * @license BSD-3-Clause
 */

import type { Composer } from "../../engine";

/**
 * Plugin options - configuration passed to plugins
 * Plugins can extend this interface for custom options
 */
export type PluginOptions = Record<string, unknown>;

/**
 * Plugin interface - all plugins must implement this
 */
export interface Plugin {
  /** Unique plugin identifier */
  id: string;

  /** Plugin name (human-readable) */
  name: string;

  /** Plugin version (semver) */
  version: string;

  /** Plugin description */
  description?: string;

  /** Plugin author */
  author?: string;

  /** Plugin dependencies (other plugin IDs) */
  dependencies?: string[];

  /**
   * Initialize the plugin
   * Called when plugin is loaded
   */
  initialize(composer: Composer, options?: PluginOptions): void | Promise<void>;

  /**
   * Destroy the plugin
   * Called when plugin is unloaded or composer is destroyed
   */
  destroy?(): void | Promise<void>;
}

/**
 * Plugin configuration
 */
export interface PluginConfig {
  /** Plugin instance or constructor */
  plugin: Plugin | PluginConstructor;

  /** Plugin options */
  options?: PluginOptions;

  /** Load plugin from CDN URL */
  url?: string;

  /** Enable/disable plugin */
  enabled?: boolean;
}

/**
 * Plugin constructor type
 */
export type PluginConstructor = new (options?: PluginOptions) => Plugin;

/**
 * Plugin metadata
 */
export interface PluginMetadata {
  id: string;
  name: string;
  version: string;
  description?: string;
  author?: string;
  enabled: boolean;
  loaded: boolean;
  error?: string;
}

/**
 * Plugin capabilities - what a plugin can provide
 */
export interface PluginCapabilities {
  /** Custom element types */
  elements?: string[];

  /** Custom commands */
  commands?: string[];

  /** Custom panels */
  panels?: string[];

  /** Custom blocks */
  blocks?: string[];

  /** Custom toolbar items */
  toolbarItems?: string[];
}

/**
 * Plugin lifecycle hooks
 */
export interface PluginHooks {
  /** Called before plugin initialization */
  beforeInit?: (composer: Composer) => void | Promise<void>;

  /** Called after plugin initialization */
  afterInit?: (composer: Composer) => void | Promise<void>;

  /** Called before plugin destruction */
  beforeDestroy?: () => void | Promise<void>;

  /** Called after plugin destruction */
  afterDestroy?: () => void | Promise<void>;
}

/**
 * Plugin events
 */
export type PluginEvent =
  | "plugin:registered"
  | "plugin:loaded"
  | "plugin:unloaded"
  | "plugin:enabled"
  | "plugin:disabled"
  | "plugin:error";

/**
 * Plugin error types
 */
export class PluginError extends Error {
  constructor(
    public pluginId: string,
    message: string,
    public originalError?: Error
  ) {
    super(`[Plugin: ${pluginId}] ${message}`);
    this.name = "PluginError";
  }
}
