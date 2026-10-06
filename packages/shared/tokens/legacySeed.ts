// packages/shared/tokens/legacySeed.ts
/**
 * The v5 seed's var names and light values, frozen 2026-10-05. emitTokenCss
 * emits any of these that no current token defines, so an element bound to a
 * seed var whose token was deleted still resolves (siteTokensCSS did the same
 * by appending all 78 DEFAULT_TOKENS). Do not edit: it is a compatibility
 * record, not the seed.
 */
export const LEGACY_SEED: ReadonlyArray<{ cssVar: string; value: string }> = [
  {
    "cssVar": "--buildrick-design-color-primary",
    "value": "#1A56DB"
  },
  {
    "cssVar": "--buildrick-design-color-secondary",
    "value": "#64748B"
  },
  {
    "cssVar": "--buildrick-design-color-accent",
    "value": "#15803D"
  },
  {
    "cssVar": "--buildrick-design-color-background",
    "value": "#F8FAFC"
  },
  {
    "cssVar": "--buildrick-design-color-page-background",
    "value": "transparent"
  },
  {
    "cssVar": "--buildrick-design-color-text",
    "value": "#334155"
  },
  {
    "cssVar": "--buildrick-design-color-muted",
    "value": "#71717A"
  },
  {
    "cssVar": "--buildrick-design-color-border",
    "value": "#27272A"
  },
  {
    "cssVar": "--buildrick-design-color-success",
    "value": "#15803D"
  },
  {
    "cssVar": "--buildrick-design-color-warning",
    "value": "#8E4B10"
  },
  {
    "cssVar": "--buildrick-design-color-error",
    "value": "#EF4444"
  },
  {
    "cssVar": "--buildrick-design-color-brand-500",
    "value": "#1A56DB"
  },
  {
    "cssVar": "--buildrick-design-color-slate-50",
    "value": "#F8FAFC"
  },
  {
    "cssVar": "--buildrick-design-color-slate-700",
    "value": "#334155"
  },
  {
    "cssVar": "--buildrick-design-color-red-500",
    "value": "#EF4444"
  },
  {
    "cssVar": "--buildrick-design-color-action",
    "value": "#1A56DB"
  },
  {
    "cssVar": "--buildrick-design-color-surface",
    "value": "#F8FAFC"
  },
  {
    "cssVar": "--buildrick-design-color-text-primary",
    "value": "#334155"
  },
  {
    "cssVar": "--buildrick-design-color-feedback-error",
    "value": "#EF4444"
  },
  {
    "cssVar": "--buildrick-design-font-heading",
    "value": "Inter"
  },
  {
    "cssVar": "--buildrick-design-font-body",
    "value": "Inter"
  },
  {
    "cssVar": "--buildrick-design-font-mono",
    "value": "Geist Mono"
  },
  {
    "cssVar": "--buildrick-design-font-size-xs",
    "value": "12px"
  },
  {
    "cssVar": "--buildrick-design-font-size-sm",
    "value": "14px"
  },
  {
    "cssVar": "--buildrick-design-font-size-base",
    "value": "16px"
  },
  {
    "cssVar": "--buildrick-design-font-size-lg",
    "value": "18px"
  },
  {
    "cssVar": "--buildrick-design-font-size-xl",
    "value": "20px"
  },
  {
    "cssVar": "--buildrick-design-font-size-2xl",
    "value": "24px"
  },
  {
    "cssVar": "--buildrick-design-font-size-3xl",
    "value": "30px"
  },
  {
    "cssVar": "--buildrick-design-font-size-4xl",
    "value": "36px"
  },
  {
    "cssVar": "--buildrick-design-space-1",
    "value": "4px"
  },
  {
    "cssVar": "--buildrick-design-space-2",
    "value": "8px"
  },
  {
    "cssVar": "--buildrick-design-space-3",
    "value": "12px"
  },
  {
    "cssVar": "--buildrick-design-space-4",
    "value": "16px"
  },
  {
    "cssVar": "--buildrick-design-space-5",
    "value": "20px"
  },
  {
    "cssVar": "--buildrick-design-space-6",
    "value": "24px"
  },
  {
    "cssVar": "--buildrick-design-space-8",
    "value": "32px"
  },
  {
    "cssVar": "--buildrick-design-space-10",
    "value": "40px"
  },
  {
    "cssVar": "--buildrick-design-space-12",
    "value": "48px"
  },
  {
    "cssVar": "--buildrick-design-radius-none",
    "value": "0"
  },
  {
    "cssVar": "--buildrick-design-radius-sm",
    "value": "4px"
  },
  {
    "cssVar": "--buildrick-design-radius-md",
    "value": "8px"
  },
  {
    "cssVar": "--buildrick-design-radius-lg",
    "value": "12px"
  },
  {
    "cssVar": "--buildrick-design-radius-xl",
    "value": "16px"
  },
  {
    "cssVar": "--buildrick-design-radius-full",
    "value": "9999px"
  },
  {
    "cssVar": "--buildrick-design-shadow-sm",
    "value": "0 1px 2px rgba(0,0,0,0.05)"
  },
  {
    "cssVar": "--buildrick-design-shadow-md",
    "value": "0 4px 6px rgba(0,0,0,0.1)"
  },
  {
    "cssVar": "--buildrick-design-shadow-lg",
    "value": "0 10px 15px rgba(0,0,0,0.15)"
  },
  {
    "cssVar": "--buildrick-design-shadow-xl",
    "value": "0 20px 25px rgba(0,0,0,0.25)"
  },
  {
    "cssVar": "--buildrick-design-layout-max-width",
    "value": "1280px"
  },
  {
    "cssVar": "--buildrick-design-layout-padding-x",
    "value": "24px"
  },
  {
    "cssVar": "--buildrick-design-layout-columns",
    "value": "12"
  },
  {
    "cssVar": "--buildrick-design-layout-gutter",
    "value": "24px"
  },
  {
    "cssVar": "--buildrick-design-section-padding-y",
    "value": "80px"
  },
  {
    "cssVar": "--buildrick-design-content-max-width",
    "value": "720px"
  },
  {
    "cssVar": "--buildrick-design-base-unit",
    "value": "4px"
  },
  {
    "cssVar": "--buildrick-design-breakpoint-mobile",
    "value": "768px"
  },
  {
    "cssVar": "--buildrick-design-icon-style",
    "value": "outline"
  },
  {
    "cssVar": "--buildrick-design-icon-stroke",
    "value": "1.5"
  },
  {
    "cssVar": "--buildrick-design-icon-sm",
    "value": "16px"
  },
  {
    "cssVar": "--buildrick-design-icon-md",
    "value": "20px"
  },
  {
    "cssVar": "--buildrick-design-icon-lg",
    "value": "24px"
  },
  {
    "cssVar": "--buildrick-design-btn-height-sm",
    "value": "32px"
  },
  {
    "cssVar": "--buildrick-design-btn-height-md",
    "value": "40px"
  },
  {
    "cssVar": "--buildrick-design-btn-height-lg",
    "value": "48px"
  },
  {
    "cssVar": "--buildrick-design-btn-padding-x",
    "value": "16px"
  },
  {
    "cssVar": "--buildrick-design-btn-font-weight",
    "value": "600"
  },
  {
    "cssVar": "--buildrick-design-btn-font-size",
    "value": "14px"
  },
  {
    "cssVar": "--buildrick-design-btn-radius",
    "value": "8px"
  },
  {
    "cssVar": "--buildrick-design-cta-radius",
    "value": "9999px"
  },
  {
    "cssVar": "--buildrick-design-input-height",
    "value": "40px"
  },
  {
    "cssVar": "--buildrick-design-input-radius",
    "value": "8px"
  },
  {
    "cssVar": "--buildrick-design-input-border",
    "value": "#27272A"
  },
  {
    "cssVar": "--buildrick-design-input-focus",
    "value": "#3B82F6"
  },
  {
    "cssVar": "--buildrick-design-input-padding-x",
    "value": "12px"
  },
  {
    "cssVar": "--buildrick-design-label-font-size",
    "value": "13px"
  },
  {
    "cssVar": "--buildrick-design-label-weight",
    "value": "500"
  },
  {
    "cssVar": "--buildrick-design-placeholder-color",
    "value": "#71717A"
  },
  {
    "cssVar": "--bd-radius-sm",
    "value": "4px"
  },
  {
    "cssVar": "--bd-radius-md",
    "value": "8px"
  },
  {
    "cssVar": "--bd-shadow-sm",
    "value": "0 1px 2px rgba(15,23,42,0.04)"
  },
  {
    "cssVar": "--bd-shadow-md",
    "value": "0 4px 12px rgba(15,23,42,0.08)"
  },
  {
    "cssVar": "--bd-motion-fast",
    "value": "150ms ease-out"
  },
  {
    "cssVar": "--bd-motion-slow",
    "value": "300ms ease-in-out"
  },
  {
    "cssVar": "--bd-border-default",
    "value": "1px solid"
  },
  {
    "cssVar": "--bd-opacity-50",
    "value": "0.5"
  },
  {
    "cssVar": "--bd-opacity-80",
    "value": "0.8"
  },
  {
    "cssVar": "--bd-zindex-dropdown",
    "value": "1000"
  },
  {
    "cssVar": "--bd-zindex-modal",
    "value": "1050"
  },
  {
    "cssVar": "--bd-breakpoint-md",
    "value": "768px"
  },
  {
    "cssVar": "--bd-breakpoint-lg",
    "value": "1024px"
  },
  {
    "cssVar": "--bd-grid-12",
    "value": "12"
  },
  {
    "cssVar": "--bd-sizing-container",
    "value": "1200px"
  },
  {
    "cssVar": "--bd-sizing-prose",
    "value": "65ch"
  },
  {
    "cssVar": "--bd-icon-default",
    "value": "16px"
  },
  {
    "cssVar": "--bd-imagery-placeholder",
    "value": "https://placehold.co/600x400"
  }
];
