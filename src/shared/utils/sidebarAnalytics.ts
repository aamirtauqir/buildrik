/**
 * Sidebar Analytics — Lightweight event tracking for left sidebar UX metrics.
 *
 * Currently logs to console in debug mode. Wire to PostHog/Mixpanel via
 * the `setProvider` function when analytics infrastructure is ready.
 *
 * Debug: set `window.__SIDEBAR_ANALYTICS_DEBUG__ = true` in console.
 *
 * @module utils/sidebarAnalytics
 */

type EventProperties = Record<string, string | number | boolean | null>;

interface SidebarAnalyticsProvider {
  track: (event: string, properties?: EventProperties) => void;
}

const noopProvider: SidebarAnalyticsProvider = { track: () => {} };

let provider: SidebarAnalyticsProvider = noopProvider;

/**
 * Set a custom analytics provider (for production wiring).
 * Call once at app startup when analytics SDK is ready.
 */
export function setSidebarAnalyticsProvider(p: SidebarAnalyticsProvider): void {
  provider = p;
}

/**
 * Track a sidebar-scoped event.
 * In debug mode (window.__SIDEBAR_ANALYTICS_DEBUG__), logs to console.
 * In production, dispatches through the configured provider.
 */
export function trackSidebar(name: string, properties?: EventProperties): void {
  if (
    typeof window !== "undefined" &&
    (window as unknown as Record<string, unknown>).__SIDEBAR_ANALYTICS_DEBUG__
  ) {
    // eslint-disable-next-line no-console
    console.log("[sidebar-analytics]", name, properties);
  }
  provider.track(`sidebar.${name}`, properties);
}
