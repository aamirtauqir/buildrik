/**
 * Aquibra Plugin Manager
 * Manages plugin lifecycle and registration
 *
 * @module engine/PluginManager
 * @license BSD-3-Clause
 */

import { EVENTS } from "../shared/constants";
import type { Plugin, PluginConfig, PluginMetadata } from "../shared/types/plugins";
import type { Composer } from "./Composer";
import { EventEmitter } from "./EventEmitter";

/**
 * Plugin Manager
 * Handles plugin registration, loading, and lifecycle
 */
export class PluginManager extends EventEmitter {
  private composer: Composer;
  private plugins: Map<string, Plugin> = new Map();
  private metadata: Map<string, PluginMetadata> = new Map();
  private loadingPromises: Map<string, Promise<void>> = new Map();

  constructor(composer: Composer) {
    super();
    this.composer = composer;
  }

  /**
   * Register a plugin
   */
  async register(config: PluginConfig): Promise<void> {
    const plugin =
      typeof config.plugin === "function" ? new config.plugin(config.options) : config.plugin;

    const { id, name, version } = plugin;

    // Check if already registered
    if (this.plugins.has(id)) {
      throw new Error(`Plugin "${id}" is already registered`);
    }

    // Check dependencies
    if (plugin.dependencies) {
      for (const depId of plugin.dependencies) {
        if (!this.plugins.has(depId)) {
          throw new Error(`Plugin "${id}" depends on "${depId}" which is not registered`);
        }
      }
    }

    // Store metadata
    this.metadata.set(id, {
      id,
      name,
      version,
      description: plugin.description,
      author: plugin.author,
      enabled: config.enabled !== false,
      loaded: false,
    });

    // Store plugin
    this.plugins.set(id, plugin);

    this.emit(EVENTS.PLUGIN_REGISTERED, { id, plugin });

    // Auto-load if enabled
    if (config.enabled !== false) {
      await this.load(id);
    }
  }

  /**
   * Load a plugin from CDN URL (hardened)
   *
   * Security:
   * - Only allows https URLs
   * - Optional host allowlist (options.allowedHosts or defaults)
   * - Optional subresource integrity and crossOrigin support
   */
  async loadFromUrl(
    url: string,
    options?: {
      allowedHosts?: string[];
      integrity?: string;
      crossOrigin?: "anonymous" | "use-credentials";
    }
  ): Promise<void> {
    try {
      const parsed = new URL(url);
      if (parsed.protocol !== "https:") {
        throw new Error(`Plugins must be loaded over HTTPS. Received: ${parsed.protocol}`);
      }

      const defaultAllowedHosts = ["cdn.jsdelivr.net", "unpkg.com", "esm.sh"];
      const allowedHosts =
        options?.allowedHosts && options.allowedHosts.length > 0
          ? options.allowedHosts
          : defaultAllowedHosts;

      if (!allowedHosts.includes(parsed.hostname)) {
        throw new Error(
          `Plugin host "${
            parsed.hostname
          }" is not allowed. Allowed hosts: ${allowedHosts.join(", ")}`
        );
      }

      // Dynamic script loading with integrity support
      const script = document.createElement("script");
      script.src = parsed.toString();
      script.async = true;
      if (options?.integrity) {
        script.integrity = options.integrity;
        script.crossOrigin = options.crossOrigin || "anonymous";
      }

      await new Promise<void>((resolve, reject) => {
        script.onload = () => resolve();
        script.onerror = () => reject(new Error(`Failed to load plugin from ${parsed.toString()}`));
        document.head.appendChild(script);
      });

      this.emit(EVENTS.PLUGIN_LOADED_FROM_URL, { url: parsed.toString() });
    } catch (error) {
      this.emit(EVENTS.PLUGIN_ERROR, { url, error });
      throw error;
    }
  }

  /**
   * Load/initialize a plugin
   */
  async load(id: string): Promise<void> {
    const plugin = this.plugins.get(id);
    const meta = this.metadata.get(id);

    if (!plugin || !meta) {
      throw new Error(`Plugin "${id}" not found`);
    }

    if (meta.loaded) {
      return; // Already loaded
    }

    // Check if already loading
    const existingPromise = this.loadingPromises.get(id);
    if (existingPromise) {
      return existingPromise;
    }

    // Create loading promise
    const loadPromise = (async () => {
      try {
        // Initialize plugin
        await plugin.initialize(this.composer);

        // Update metadata
        meta.loaded = true;
        meta.enabled = true;
        meta.error = undefined;

        this.emit(EVENTS.PLUGIN_LOADED, { id, plugin });
      } catch (error) {
        meta.error = error instanceof Error ? error.message : String(error);
        this.emit(EVENTS.PLUGIN_ERROR, { id, error });
        throw error;
      } finally {
        this.loadingPromises.delete(id);
      }
    })();

    this.loadingPromises.set(id, loadPromise);
    return loadPromise;
  }

  /**
   * Unload a plugin
   */
  async unload(id: string): Promise<void> {
    const plugin = this.plugins.get(id);
    const meta = this.metadata.get(id);

    if (!plugin || !meta) {
      throw new Error(`Plugin "${id}" not found`);
    }

    if (!meta.loaded) {
      return; // Already unloaded
    }

    try {
      // Call destroy if available
      if (plugin.destroy) {
        await plugin.destroy();
      }

      // Update metadata
      meta.loaded = false;
      meta.enabled = false;

      this.emit(EVENTS.PLUGIN_UNLOADED, { id, plugin });
    } catch (error) {
      meta.error = error instanceof Error ? error.message : String(error);
      this.emit(EVENTS.PLUGIN_ERROR, { id, error });
      throw error;
    }
  }

  /**
   * Unregister a plugin
   */
  async unregister(id: string): Promise<void> {
    const meta = this.metadata.get(id);

    if (!meta) {
      throw new Error(`Plugin "${id}" not found`);
    }

    // Unload first if loaded
    if (meta.loaded) {
      await this.unload(id);
    }

    // Remove from maps
    this.plugins.delete(id);
    this.metadata.delete(id);

    this.emit(EVENTS.PLUGIN_UNREGISTERED, { id });
  }

  /**
   * Get a plugin by ID
   */
  get(id: string): Plugin | undefined {
    return this.plugins.get(id);
  }

  /**
   * Get all registered plugins
   */
  getAll(): Plugin[] {
    return Array.from(this.plugins.values());
  }

  /**
   * Get plugin metadata
   */
  getMetadata(id: string): PluginMetadata | undefined {
    return this.metadata.get(id);
  }

  /**
   * Get all plugin metadata
   */
  getAllMetadata(): PluginMetadata[] {
    return Array.from(this.metadata.values());
  }

  /**
   * Check if plugin is registered
   */
  has(id: string): boolean {
    return this.plugins.has(id);
  }

  /**
   * Check if plugin is loaded
   */
  isLoaded(id: string): boolean {
    return this.metadata.get(id)?.loaded ?? false;
  }

  /**
   * Check if plugin is enabled
   */
  isEnabled(id: string): boolean {
    return this.metadata.get(id)?.enabled ?? false;
  }

  /**
   * Enable a plugin
   */
  async enable(id: string): Promise<void> {
    const meta = this.metadata.get(id);

    if (!meta) {
      throw new Error(`Plugin "${id}" not found`);
    }

    if (meta.enabled) {
      return; // Already enabled
    }

    await this.load(id);
    this.emit(EVENTS.PLUGIN_ENABLED, { id });
  }

  /**
   * Disable a plugin
   */
  async disable(id: string): Promise<void> {
    const meta = this.metadata.get(id);

    if (!meta) {
      throw new Error(`Plugin "${id}" not found`);
    }

    if (!meta.enabled) {
      return; // Already disabled
    }

    await this.unload(id);
    this.emit(EVENTS.PLUGIN_DISABLED, { id });
  }

  /**
   * Destroy plugin manager
   */
  async destroy(): Promise<void> {
    // Unload all plugins
    const unloadPromises = Array.from(this.plugins.keys()).map((id) =>
      this.unload(id).catch(() => {
        // Failed to unload plugin - continue with cleanup
      })
    );

    await Promise.all(unloadPromises);

    // Clear maps
    this.plugins.clear();
    this.metadata.clear();
    this.loadingPromises.clear();

    // Remove all listeners
    this.removeAllListeners();
  }
}
