/**
 * Call to Action Block
 * @license BSD-3-Clause
 */

import type { BlockData, ElementType } from "@/shared/types";

export interface CTABlockConfig extends BlockData {
  elementType: ElementType;
}

export const ctaBlockConfig: CTABlockConfig = {
  id: "cta",
  label: "CTA",
  description: "A bold call to action: headline, one line and a button. Uses your Brand primary colour.",
  category: "Sections",
  elementType: "cta",
  content:
    '<section data-buildrick-type="cta" style="background:var(--buildrick-design-color-primary);padding:60px var(--buildrick-design-space-5);text-align:center;color:var(--buildrick-design-color-on-primary)"><h2 style="margin:0 0 var(--buildrick-design-space-4);font-size:var(--buildrick-design-font-size-4xl)">Ready to get started?</h2><p style="margin:0 0 var(--buildrick-design-space-6);font-size:var(--buildrick-design-font-size-lg);opacity:0.9">Join thousands of happy customers today.</p><button style="padding:var(--buildrick-design-space-4) var(--buildrick-design-space-8);background:var(--buildrick-design-color-surface-raised);color:var(--buildrick-design-color-primary);border:none;border-radius:var(--buildrick-design-radius-md);font-size:var(--buildrick-design-font-size-base);cursor:pointer;font-weight:bold">Start Free Trial</button></section>',
};
