/**
 * Development Logger Utility
 * Provides conditional logging that only runs in development mode.
 * Prevents console noise in production while helping debug issues.
 *
 * @license BSD-3-Clause
 */

// Check if we're in development mode
const isDev = typeof import.meta !== "undefined" && import.meta.env?.DEV;

/**
 * Log a warning message in development mode only
 * @param context - The context or module name where the warning occurred
 * @param message - The warning message
 * @param data - Optional additional data to log
 */
export function devWarn(context: string, message: string, data?: unknown): void {
  if (isDev) {
    if (data !== undefined) {
      // eslint-disable-next-line no-console
      console.warn(`[${context}] ${message}`, data);
    } else {
      // eslint-disable-next-line no-console
      console.warn(`[${context}] ${message}`);
    }
  }
}

/**
 * Log an error message in development mode only
 * Use this for caught errors that are handled gracefully
 * @param context - The context or module name where the error occurred
 * @param message - The error message
 * @param error - Optional error object
 */
export function devError(context: string, message: string, error?: unknown): void {
  if (isDev) {
    if (error !== undefined) {
      // eslint-disable-next-line no-console
      console.error(`[${context}] ${message}`, error);
    } else {
      // eslint-disable-next-line no-console
      console.error(`[${context}] ${message}`);
    }
  }
}

/**
 * Log debug information in development mode only
 * @param context - The context or module name
 * @param message - The debug message
 * @param data - Optional additional data to log
 */
export function devLog(context: string, message: string, data?: unknown): void {
  if (isDev) {
    if (data !== undefined) {
      // eslint-disable-next-line no-console
      console.log(`[${context}] ${message}`, data);
    } else {
      // eslint-disable-next-line no-console
      console.log(`[${context}] ${message}`);
    }
  }
}

// =============================================================================
// Domain-Specific Canvas Tracing
// Usage: devLogger.hover('start', { elementId }); devLogger.drag('move', pos);
// Enable per-domain filtering: localStorage.setItem('aqb:trace:hover', 'true')
// =============================================================================

type TraceLevel = "info" | "debug" | "trace";

/** Trace filter - check localStorage for enabled domains */
function isTraceEnabled(domain: string): boolean {
  if (!isDev) return false;
  // Global enable all
  if (typeof localStorage !== "undefined" && localStorage.getItem("aqb:trace:all") === "true") {
    return true;
  }
  // Per-domain enable
  if (
    typeof localStorage !== "undefined" &&
    localStorage.getItem(`aqb:trace:${domain}`) === "true"
  ) {
    return true;
  }
  return false;
}

/** Domain colors for visual distinction in console */
const DOMAIN_COLORS: Record<string, string> = {
  hover: "#6ee7b7", // emerald
  selection: "#60a5fa", // blue
  drag: "#f472b6", // pink
  resize: "#fbbf24", // amber
  keyboard: "#a78bfa", // violet
  guides: "#2dd4bf", // teal
  toolbar: "#fb923c", // orange
  sync: "#94a3b8", // slate
  style: "#c084fc", // purple - inspector style changes
};

/** Create a domain-specific trace function */
function createDomainTrace(domain: string) {
  const color = DOMAIN_COLORS[domain] || "#9ca3af";

  return function trace(
    action: string,
    data?: Record<string, unknown>,
    level: TraceLevel = "debug"
  ): void {
    if (!isTraceEnabled(domain)) return;

    const prefix = `%c[Canvas:${domain}]%c ${action}`;
    const styles = [`color: ${color}; font-weight: bold`, "color: inherit"];

    if (data !== undefined) {
      if (level === "trace") {
        // eslint-disable-next-line no-console
        console.trace(prefix, ...styles, data);
      } else {
        // eslint-disable-next-line no-console
        console.log(prefix, ...styles, data);
      }
    } else {
      if (level === "trace") {
        // eslint-disable-next-line no-console
        console.trace(prefix, ...styles);
      } else {
        // eslint-disable-next-line no-console
        console.log(prefix, ...styles);
      }
    }
  };
}

/**
 * Domain-specific development logger for Canvas operations.
 * Enable per-domain: localStorage.setItem('aqb:trace:hover', 'true')
 * Enable all: localStorage.setItem('aqb:trace:all', 'true')
 *
 * @example
 * devLogger.hover('start', { elementId, position });
 * devLogger.drag('move', { from, to, delta });
 * devLogger.selection('multi-select', { ids, count: ids.length });
 */
export const devLogger = {
  /** Hover state changes */
  hover: createDomainTrace("hover"),
  /** Selection state changes */
  selection: createDomainTrace("selection"),
  /** Drag operations */
  drag: createDomainTrace("drag"),
  /** Resize operations */
  resize: createDomainTrace("resize"),
  /** Keyboard interactions */
  keyboard: createDomainTrace("keyboard"),
  /** Guide/snap operations */
  guides: createDomainTrace("guides"),
  /** Toolbar actions */
  toolbar: createDomainTrace("toolbar"),
  /** Canvas sync/content updates */
  sync: createDomainTrace("sync"),
  /** Inspector style changes */
  style: createDomainTrace("style"),

  /** Enable tracing for a domain */
  enable(domain: string): void {
    if (typeof localStorage !== "undefined") {
      localStorage.setItem(`aqb:trace:${domain}`, "true");
    }
  },

  /** Disable tracing for a domain */
  disable(domain: string): void {
    if (typeof localStorage !== "undefined") {
      localStorage.removeItem(`aqb:trace:${domain}`);
    }
  },

  /** Enable all tracing */
  enableAll(): void {
    if (typeof localStorage !== "undefined") {
      localStorage.setItem("aqb:trace:all", "true");
    }
  },

  /** Disable all tracing */
  disableAll(): void {
    if (typeof localStorage !== "undefined") {
      localStorage.removeItem("aqb:trace:all");
      Object.keys(DOMAIN_COLORS).forEach((domain) => {
        localStorage.removeItem(`aqb:trace:${domain}`);
      });
    }
  },
};
