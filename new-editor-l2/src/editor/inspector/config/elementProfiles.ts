/**
 * Element Profiles Configuration
 * Loads and resolves element profiles from JSON specification.
 * Profiles decide UX only (defaultTab, essentials, defaultOpenGroups).
 * They NEVER remove CSS capabilities from the inspector.
 *
 * @license BSD-3-Clause
 */

import type { TabName } from "../hooks/useInspectorState";

// ============================================================================
// TYPES
// ============================================================================

export interface EssentialsConfig {
  design?: string[];
  layout?: string[];
  settings?: string[];
}

export interface DefaultOpenGroups {
  layout?: string[];
  design?: string[];
  settings?: string[];
}

export interface ElementProfile {
  defaultTab: TabName;
  essentials: EssentialsConfig;
  defaultOpenGroups: DefaultOpenGroups;
}

interface RawProfile {
  inherits?: string;
  defaultTab?: TabName;
  essentials?: EssentialsConfig;
  defaultOpenGroups?: DefaultOpenGroups;
}

// ============================================================================
// RAW DATA (from elementProfiles.json)
// ============================================================================

const RAW_PROFILES: Record<string, RawProfile> = {
  text: {
    defaultTab: "design",
    essentials: {
      design: [
        "content.text",
        "typography.fontSize",
        "typography.fontWeight",
        "typography.lineHeight",
        "colors.textColor",
        "typography.textAlign",
      ],
      layout: ["spacing.margin", "spacing.padding", "size.width"],
      settings: ["a11y.ariaLabel"],
    },
    defaultOpenGroups: {
      layout: ["Spacing"],
      design: ["Typography", "Colors"],
      settings: ["Accessibility"],
    },
  },

  heading: { inherits: "text" },
  paragraph: { inherits: "text" },

  container: {
    defaultTab: "layout",
    essentials: {
      layout: ["layout.display", "spacing.padding", "spacing.margin", "size.width", "layout.gap"],
      design: ["background.backgroundColor", "border.radius"],
      settings: ["attributes.id"],
    },
    defaultOpenGroups: {
      layout: ["Display", "Spacing", "Size"],
      design: ["Background", "BorderRadius"],
      settings: ["Attributes"],
    },
  },

  section: { inherits: "container" },
  div: { inherits: "container" },

  button: {
    defaultTab: "settings",
    essentials: {
      settings: ["content.label", "button.variant", "link.href", "icon.buttonIcon"],
      layout: ["spacing.padding", "spacing.margin"],
      design: [
        "colors.backgroundColor",
        "colors.textColor",
        "border.radius",
        "motion.transitionPreset",
      ],
    },
    defaultOpenGroups: {
      settings: ["Content", "Link"],
      layout: ["Spacing"],
      design: ["Colors", "BorderRadius", "Motion"],
    },
  },

  link: {
    defaultTab: "settings",
    essentials: {
      settings: ["content.text", "link.href"],
      design: ["colors.textColor", "typography.textDecoration"],
      layout: ["spacing.margin", "spacing.padding"],
    },
    defaultOpenGroups: {
      settings: ["Link"],
      design: ["Typography", "Colors"],
      layout: ["Spacing"],
    },
  },

  image: {
    defaultTab: "settings",
    essentials: {
      settings: ["media.src", "media.alt", "media.objectFit"],
      layout: ["spacing.margin", "spacing.padding", "size.width", "size.height"],
      design: ["border.radius", "effects.opacity"],
    },
    defaultOpenGroups: {
      settings: ["Media"],
      layout: ["Size", "Spacing"],
      design: ["BorderRadius", "Effects"],
    },
  },

  video: { inherits: "image" },

  icon: {
    defaultTab: "design",
    essentials: {
      design: ["icon.pick", "icon.size", "colors.textColor", "icon.strokeWidth"],
      layout: ["spacing.margin", "spacing.padding"],
      settings: ["a11y.ariaLabel"],
    },
    defaultOpenGroups: {
      design: ["Icon", "Colors"],
      layout: ["Spacing"],
      settings: ["Accessibility"],
    },
  },

  form: {
    defaultTab: "settings",
    essentials: {
      settings: ["form.fields", "form.validationBasics", "form.submitAction", "form.states"],
      layout: ["layout.display", "spacing.gap", "spacing.padding", "spacing.margin"],
      design: ["border.radius", "colors.textColor", "colors.backgroundColor"],
    },
    defaultOpenGroups: {
      settings: ["Form", "Interactions"],
      layout: ["Display", "Spacing"],
      design: ["BorderRadius", "Colors"],
    },
  },

  navbar: {
    defaultTab: "settings",
    essentials: {
      settings: ["navbar.menuItems", "navbar.logo", "navbar.sticky", "navbar.mobileCollapse"],
      layout: ["layout.display", "spacing.padding", "spacing.margin"],
      design: ["background.backgroundColor", "effects.shadowPreset"],
    },
    defaultOpenGroups: {
      settings: ["Navbar"],
      layout: ["Display", "Spacing"],
      design: ["Background", "Shadow"],
    },
  },

  modal: {
    defaultTab: "settings",
    essentials: {
      settings: ["modal.openTrigger", "modal.closeBehavior", "modal.overlay", "modal.scrollLock"],
      layout: ["position.position", "position.inset", "size.width", "size.height"],
      design: [
        "background.backgroundColor",
        "border.radius",
        "effects.shadowPreset",
        "motion.modalAnimationPreset",
      ],
    },
    defaultOpenGroups: {
      settings: ["Modal"],
      layout: ["Position", "Size"],
      design: ["Background", "BorderRadius", "Shadow", "Motion"],
    },
  },

  tabs: {
    defaultTab: "settings",
    essentials: {
      settings: ["tabs.items", "tabs.defaultTab", "tabs.behavior"],
      layout: ["spacing.padding", "spacing.margin"],
      design: ["border.radius", "colors.textColor", "colors.backgroundColor"],
    },
    defaultOpenGroups: {
      settings: ["Tabs"],
      layout: ["Spacing"],
      design: ["BorderRadius", "Colors"],
    },
  },

  accordion: {
    defaultTab: "settings",
    essentials: {
      settings: ["accordion.items", "accordion.defaultOpen", "accordion.behavior"],
      layout: ["spacing.padding", "spacing.margin"],
      design: ["border.radius", "colors.textColor", "colors.backgroundColor"],
    },
    defaultOpenGroups: {
      settings: ["Accordion"],
      layout: ["Spacing"],
      design: ["BorderRadius", "Colors"],
    },
  },

  slider: {
    defaultTab: "settings",
    essentials: {
      settings: ["slider.slides", "slider.autoplay", "slider.navUI", "slider.transitionPreset"],
      layout: ["size.width", "size.height", "spacing.margin", "spacing.padding"],
      design: ["motion.transitionPreset"],
    },
    defaultOpenGroups: {
      settings: ["Slider"],
      layout: ["Size", "Spacing"],
      design: ["Motion"],
    },
  },
};

// ============================================================================
// DEFAULT PROFILE
// ============================================================================

const DEFAULT_PROFILE: ElementProfile = {
  defaultTab: "layout",
  essentials: {
    layout: ["layout.display", "spacing.margin", "spacing.padding", "size.width"],
    design: ["colors.backgroundColor", "border.radius"],
    settings: ["attributes.id"],
  },
  defaultOpenGroups: {
    layout: ["Display", "Spacing"],
    design: ["Colors"],
    settings: ["Attributes"],
  },
};

// ============================================================================
// RESOLUTION CACHE
// ============================================================================

const resolvedCache = new Map<string, ElementProfile>();

/**
 * Resolve a profile by following inheritance chain
 */
function resolveProfile(profileId: string, visited = new Set<string>()): ElementProfile {
  // Check cache
  if (resolvedCache.has(profileId)) {
    return resolvedCache.get(profileId)!;
  }

  // Prevent infinite loops
  if (visited.has(profileId)) {
    return DEFAULT_PROFILE;
  }
  visited.add(profileId);

  const raw = RAW_PROFILES[profileId];
  if (!raw) {
    return DEFAULT_PROFILE;
  }

  // If inherits, resolve parent first
  if (raw.inherits) {
    const parent = resolveProfile(raw.inherits, visited);
    const merged: ElementProfile = {
      defaultTab: raw.defaultTab ?? parent.defaultTab,
      essentials: {
        design: raw.essentials?.design ?? parent.essentials.design,
        layout: raw.essentials?.layout ?? parent.essentials.layout,
        settings: raw.essentials?.settings ?? parent.essentials.settings,
      },
      defaultOpenGroups: {
        layout: raw.defaultOpenGroups?.layout ?? parent.defaultOpenGroups.layout,
        design: raw.defaultOpenGroups?.design ?? parent.defaultOpenGroups.design,
        settings: raw.defaultOpenGroups?.settings ?? parent.defaultOpenGroups.settings,
      },
    };
    resolvedCache.set(profileId, merged);
    return merged;
  }

  // No inheritance - use raw values with defaults
  const resolved: ElementProfile = {
    defaultTab: raw.defaultTab ?? DEFAULT_PROFILE.defaultTab,
    essentials: {
      design: raw.essentials?.design ?? DEFAULT_PROFILE.essentials.design,
      layout: raw.essentials?.layout ?? DEFAULT_PROFILE.essentials.layout,
      settings: raw.essentials?.settings ?? DEFAULT_PROFILE.essentials.settings,
    },
    defaultOpenGroups: {
      layout: raw.defaultOpenGroups?.layout ?? DEFAULT_PROFILE.defaultOpenGroups.layout,
      design: raw.defaultOpenGroups?.design ?? DEFAULT_PROFILE.defaultOpenGroups.design,
      settings: raw.defaultOpenGroups?.settings ?? DEFAULT_PROFILE.defaultOpenGroups.settings,
    },
  };
  resolvedCache.set(profileId, resolved);
  return resolved;
}

// ============================================================================
// PUBLIC API
// ============================================================================

/**
 * Get the element profile for a given element type.
 * Profiles determine UX preferences (defaultTab, essentials, defaultOpenGroups).
 * They do NOT limit which CSS properties are available.
 */
export function getElementProfile(elementType: string): ElementProfile {
  return resolveProfile(elementType.toLowerCase());
}

/**
 * Get the default tab for an element type
 */
export function getDefaultTab(elementType: string): TabName {
  return getElementProfile(elementType).defaultTab;
}

/**
 * Get the essentials properties for a tab and element type
 */
export function getEssentialsForTab(elementType: string, tab: TabName): string[] {
  const profile = getElementProfile(elementType);
  return profile.essentials[tab as keyof EssentialsConfig] ?? [];
}

/**
 * Get the default open groups for a tab and element type
 */
export function getDefaultOpenGroups(elementType: string, tab: TabName): string[] {
  const profile = getElementProfile(elementType);
  return profile.defaultOpenGroups[tab as keyof DefaultOpenGroups] ?? [];
}

/**
 * Check if a property is in the essentials list for an element/tab combo
 */
export function isEssentialProperty(
  elementType: string,
  tab: TabName,
  propertyId: string
): boolean {
  const essentials = getEssentialsForTab(elementType, tab);
  return essentials.includes(propertyId);
}
