/**
 * usePanelNavigation - Hook for managing drill-in navigation state
 * Handles navigation stack, persistence, and keyboard shortcuts
 * @license BSD-3-Clause
 */

import * as React from "react";

/** Navigation screen definition */
export interface NavigationScreen {
  id: string;
  title: string;
  parentId?: string;
}

/** Hook configuration */
export interface UsePanelNavigationOptions {
  /** Unique key for localStorage persistence */
  storageKey: string;
  /** Available screens */
  screens: NavigationScreen[];
  /** Default screen ID */
  defaultScreen?: string;
  /** Callback when navigation changes */
  onNavigate?: (screenId: string) => void;
}

/** Hook return value */
export interface PanelNavigationState {
  /** Current active screen ID */
  currentScreen: string;
  /** Navigate to a specific screen */
  navigateTo: (screenId: string) => void;
  /** Go back to parent screen */
  goBack: () => void;
  /** Go to home (root) screen */
  goHome: () => void;
  /** Check if we can go back */
  canGoBack: boolean;
  /** Get the current screen config */
  currentScreenConfig: NavigationScreen | undefined;
  /** Get the parent screen config */
  parentScreenConfig: NavigationScreen | undefined;
  /** Get breadcrumb path */
  breadcrumb: string[];
}

/**
 * Hook for managing panel drill-in navigation
 *
 * @example
 * ```tsx
 * const { currentScreen, navigateTo, goBack, canGoBack } = usePanelNavigation({
 *   storageKey: 'build-panel',
 *   screens: [
 *     { id: 'home', title: 'Build' },
 *     { id: 'elements', title: 'Elements', parentId: 'home' },
 *     { id: 'templates', title: 'Templates', parentId: 'home' },
 *   ],
 *   defaultScreen: 'home',
 * });
 * ```
 */
export function usePanelNavigation({
  storageKey,
  screens,
  defaultScreen,
  onNavigate,
}: UsePanelNavigationOptions): PanelNavigationState {
  // Find home screen (one without parent)
  const homeScreen = screens.find((s) => !s.parentId) || screens[0];
  const initialScreen = defaultScreen || homeScreen?.id || "home";

  // Load persisted state
  const [currentScreen, setCurrentScreen] = React.useState<string>(() => {
    if (typeof window === "undefined") return initialScreen;
    try {
      const stored = localStorage.getItem(`aqb-nav-${storageKey}`);
      if (stored) {
        const parsed = JSON.parse(stored);
        // Validate that the stored screen exists
        if (screens.some((s) => s.id === parsed.currentScreen)) {
          return parsed.currentScreen;
        }
      }
    } catch {
      // Ignore parse errors
    }
    return initialScreen;
  });

  // Persist state changes
  React.useEffect(() => {
    if (typeof window === "undefined") return;
    try {
      localStorage.setItem(`aqb-nav-${storageKey}`, JSON.stringify({ currentScreen }));
    } catch {
      // Ignore storage errors
    }
  }, [storageKey, currentScreen]);

  // Get screen configs
  const currentScreenConfig = React.useMemo(
    () => screens.find((s) => s.id === currentScreen),
    [screens, currentScreen]
  );

  const parentScreenConfig = React.useMemo(() => {
    if (!currentScreenConfig?.parentId) return undefined;
    return screens.find((s) => s.id === currentScreenConfig.parentId);
  }, [screens, currentScreenConfig]);

  // Build breadcrumb path
  const breadcrumb = React.useMemo(() => {
    const path: string[] = [];
    let screen = currentScreenConfig;

    while (screen) {
      path.unshift(screen.title);
      if (screen.parentId) {
        screen = screens.find((s) => s.id === screen!.parentId);
      } else {
        break;
      }
    }

    return path;
  }, [screens, currentScreenConfig]);

  // Navigation functions
  const navigateTo = React.useCallback(
    (screenId: string) => {
      const screen = screens.find((s) => s.id === screenId);
      if (screen) {
        setCurrentScreen(screenId);
        onNavigate?.(screenId);
      }
    },
    [screens, onNavigate]
  );

  const goBack = React.useCallback(() => {
    if (currentScreenConfig?.parentId) {
      setCurrentScreen(currentScreenConfig.parentId);
      onNavigate?.(currentScreenConfig.parentId);
    }
  }, [currentScreenConfig, onNavigate]);

  const goHome = React.useCallback(() => {
    if (homeScreen) {
      setCurrentScreen(homeScreen.id);
      onNavigate?.(homeScreen.id);
    }
  }, [homeScreen, onNavigate]);

  const canGoBack = Boolean(currentScreenConfig?.parentId);

  return {
    currentScreen,
    navigateTo,
    goBack,
    goHome,
    canGoBack,
    currentScreenConfig,
    parentScreenConfig,
    breadcrumb,
  };
}

export default usePanelNavigation;
