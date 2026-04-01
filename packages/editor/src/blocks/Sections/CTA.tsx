/**
 * Call to Action Block
 * @license BSD-3-Clause
 */

import type { BlockData, ElementType } from "../../shared/types";

export interface CTABlockConfig extends BlockData {
  elementType: ElementType;
}

export const ctaBlockConfig: CTABlockConfig = {
  id: "cta",
  label: "Call to Action",
  category: "Sections",
  elementType: "cta",
  content:
    '<section style="background:linear-gradient(135deg,#667eea,#764ba2);padding:60px 20px;text-align:center;color:#fff"><h2 style="margin:0 0 16px;font-size:36px">Ready to get started?</h2><p style="margin:0 0 24px;font-size:18px;opacity:0.9">Join thousands of happy customers today.</p><button style="padding:16px 32px;background:#fff;color:#667eea;border:none;border-radius:8px;font-size:16px;cursor:pointer;font-weight:bold">Start Free Trial</button></section>',
};
