/**
 * Configuration Types
 * Types for composer initialization, storage, and plugin configuration
 *
 * @module types/config
 * @license BSD-3-Clause
 */

// Forward declaration for Composer to avoid circular imports
// The actual Composer class is in src/engine/Composer.ts
import type { Composer } from "../../engine/Composer";
import type { ProjectData } from "./project";

// ============================================
// Configuration Types
// ============================================

export interface ComposerConfig {
  /** Container element or selector */
  container: HTMLElement | string;
  /** Editor width */
  width?: string | number;
  /** Editor height */
  height?: string | number;
  /** License key */
  licenseKey?: string;
  /** Storage configuration */
  storage?: StorageConfig;
  /** Project configuration */
  project?: ProjectConfig;
  /** Canvas configuration */
  canvas?: CanvasConfig;
  /** Theme configuration */
  theme?: ThemeConfig;
  /** Plugin configuration */
  plugins?: import("./plugins").PluginConfig[];
  /** Internationalization */
  i18n?: I18nConfig;
  /** Callback when editor is ready */
  onReady?: (composer: Composer) => void;
  /** Callback on project update */
  onUpdate?: (data: ProjectData) => void;
}

export interface StorageConfig {
  /** Storage type */
  type: "local" | "session" | "remote" | "indexeddb" | "none";
  /** Auto-save enabled */
  autoSave?: boolean;
  /** Auto-save interval in ms */
  autoSaveInterval?: number;
  /** Storage key prefix */
  keyPrefix?: string;
  /** Remote storage endpoint */
  endpoint?: string;
  /** Custom storage handlers */
  handlers?: {
    load?: (id?: string) => Promise<ProjectData | null>;
    save?: (data: ProjectData) => Promise<void>;
  };
  /** Enable crash recovery prompt on startup (default: true) */
  enableCrashRecovery?: boolean;
  /** Enable storage quota monitoring (default: true) */
  enableQuotaMonitoring?: boolean;
  /** Quota warning threshold 0-1 (default: 0.8 = 80%) */
  quotaWarningThreshold?: number;
  /** Function to get auth token for remote requests */
  getAuthToken?: () => Promise<string | null>;
}

/**
 * Crash recovery data returned when checking for unsaved sessions
 */
export interface CrashRecoveryData {
  /** Whether crash recovery data exists */
  hasCrashData: boolean;
  /** The recovered project data (null if no crash data) */
  data: ProjectData | null;
  /** Timestamp of the crashed session (null if no crash data) */
  crashedAt: number | null;
  /** Reason for the crash detection */
  reason?: "unclean_shutdown" | "browser_crash" | "unknown";
}

export interface ProjectConfig {
  /** Auto-load project on init */
  autoLoad?: boolean;
  /** Default project ID */
  defaultId?: string;
  /** Default project data */
  defaultData?: Partial<ProjectData>;
}

export interface CanvasConfig {
  /** Background color */
  backgroundColor?: string;
  /** Show grid */
  showGrid?: boolean;
  /** Grid size */
  gridSize?: number;
  /** Snap to grid */
  snapToGrid?: boolean;
}

export interface ThemeConfig {
  /** Theme mode */
  mode?: "light" | "dark" | "auto";
  /** Primary color */
  primaryColor?: string;
  /** Accent color */
  accentColor?: string;
  /** Custom CSS variables */
  variables?: Record<string, string>;
}

export interface PluginConfig {
  /** Plugin ID */
  id: string;
  /** Plugin source (URL or function) */
  src?: string | PluginFunction;
  /** Plugin options */
  options?: Record<string, unknown>;
}

export type PluginFunction = (composer: Composer, options?: Record<string, unknown>) => void;

export interface I18nConfig {
  /** Default locale */
  locale?: string;
  /** Available locales */
  locales?: Record<string, Record<string, string>>;
}
