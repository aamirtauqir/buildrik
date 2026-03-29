/**
 * Section Templates Component
 * Quick-insert section templates (Hero, Features, etc.)
 * @license BSD-3-Clause
 */

import * as React from "react";
import { Badge } from "../shared/ui";

// ============================================================================
// TYPES
// ============================================================================

export interface SectionTemplate {
  id: string;
  name: string;
  type: SectionType;
  icon: string;
  html: string;
  description?: string;
}

export type SectionType =
  | "hero"
  | "features"
  | "pricing"
  | "testimonials"
  | "cta"
  | "footer"
  | "navigation"
  | "content";

export interface SectionTemplatesProps {
  onInsert: (template: SectionTemplate) => void;
  filter?: SectionType;
}

// ============================================================================
// SECTION DATA
// ============================================================================

const sectionTemplates: SectionTemplate[] = [
  // Navigation
  {
    id: "nav-simple",
    name: "Simple Nav",
    type: "navigation",
    icon: "🧭",
    html: `<nav style="display:flex;justify-content:space-between;align-items:center;padding:20px 40px;background:#fff;box-shadow:0 2px 10px rgba(0,0,0,0.08)"><div style="font-weight:bold;font-size:24px;color:#667eea">Brand</div><div style="display:flex;gap:32px"><a href="#" style="text-decoration:none;color:#333;font-weight:500">Home</a><a href="#" style="text-decoration:none;color:#333;font-weight:500">About</a><a href="#" style="text-decoration:none;color:#333;font-weight:500">Contact</a></div><button style="padding:12px 24px;background:#667eea;color:#fff;border:none;border-radius:8px;font-weight:600;cursor:pointer">Get Started</button></nav>`,
    description: "Logo + links + CTA button",
  },
  {
    id: "nav-centered",
    name: "Centered Nav",
    type: "navigation",
    icon: "⬅️➡️",
    html: `<nav style="padding:20px 40px;background:#fff;border-bottom:1px solid #eee"><div style="display:flex;justify-content:center;gap:40px"><a href="#" style="text-decoration:none;color:#333;font-weight:500;padding:8px 0;border-bottom:2px solid #667eea">Home</a><a href="#" style="text-decoration:none;color:#666;font-weight:500;padding:8px 0">Products</a><a href="#" style="text-decoration:none;color:#666;font-weight:500;padding:8px 0">About</a><a href="#" style="text-decoration:none;color:#666;font-weight:500;padding:8px 0">Contact</a></div></nav>`,
    description: "Centered navigation links",
  },

  // Hero Sections
  {
    id: "hero-centered",
    name: "Centered Hero",
    type: "hero",
    icon: "🦸",
    html: `<section style="padding:120px 40px;text-align:center;background:linear-gradient(135deg,#667eea,#764ba2);color:#fff"><h1 style="font-size:56px;margin:0 0 24px;font-weight:800">Your Headline Here</h1><p style="font-size:20px;margin:0 0 40px;opacity:0.9;max-width:600px;margin-left:auto;margin-right:auto">A compelling description that captures attention and drives action.</p><div style="display:flex;gap:16px;justify-content:center"><button style="padding:16px 32px;background:#fff;color:#667eea;border:none;border-radius:8px;font-weight:600;cursor:pointer">Primary CTA</button><button style="padding:16px 32px;background:transparent;color:#fff;border:2px solid #fff;border-radius:8px;font-weight:600;cursor:pointer">Secondary</button></div></section>`,
    description: "Centered text with gradient background",
  },
  {
    id: "hero-split",
    name: "Split Hero",
    type: "hero",
    icon: "↔️",
    html: `<section style="display:flex;min-height:500px"><div style="flex:1;padding:80px 60px;display:flex;flex-direction:column;justify-content:center"><h1 style="font-size:48px;margin:0 0 20px;color:#1a1a2e;font-weight:800">Build Something Great</h1><p style="font-size:18px;color:#64748b;margin:0 0 32px;line-height:1.7">Transform your ideas into reality with our powerful tools.</p><button style="padding:16px 32px;background:#667eea;color:#fff;border:none;border-radius:8px;font-weight:600;cursor:pointer;width:fit-content">Get Started</button></div><div style="flex:1;background:linear-gradient(135deg,#667eea,#764ba2)"></div></section>`,
    description: "Two-column layout with image placeholder",
  },

  // Features
  {
    id: "features-3col",
    name: "3-Column Features",
    type: "features",
    icon: "⊞",
    html: `<section style="padding:80px 40px;background:#f8fafc"><h2 style="text-align:center;font-size:36px;margin:0 0 48px;color:#1a1a2e">Our Features</h2><div style="display:flex;gap:32px;max-width:1000px;margin:0 auto"><div style="flex:1;text-align:center;padding:32px"><div style="font-size:40px;margin-bottom:16px">⚡</div><h3 style="margin:0 0 12px;color:#1a1a2e">Fast</h3><p style="margin:0;color:#64748b">Lightning quick performance</p></div><div style="flex:1;text-align:center;padding:32px"><div style="font-size:40px;margin-bottom:16px">🔒</div><h3 style="margin:0 0 12px;color:#1a1a2e">Secure</h3><p style="margin:0;color:#64748b">Enterprise-grade security</p></div><div style="flex:1;text-align:center;padding:32px"><div style="font-size:40px;margin-bottom:16px">📱</div><h3 style="margin:0 0 12px;color:#1a1a2e">Responsive</h3><p style="margin:0;color:#64748b">Works on all devices</p></div></div></section>`,
    description: "Three feature columns with icons",
  },
  {
    id: "features-cards",
    name: "Feature Cards",
    type: "features",
    icon: "🃏",
    html: `<section style="padding:80px 40px"><h2 style="text-align:center;font-size:36px;margin:0 0 48px;color:#1a1a2e">Why Choose Us</h2><div style="display:grid;grid-template-columns:repeat(2,1fr);gap:24px;max-width:900px;margin:0 auto"><div style="padding:32px;background:#fff;border-radius:12px;box-shadow:0 4px 20px rgba(0,0,0,0.08)"><div style="width:48px;height:48px;background:#667eea;border-radius:10px;display:flex;align-items:center;justify-content:center;font-size:24px;margin-bottom:16px">🎯</div><h3 style="margin:0 0 8px">Feature One</h3><p style="margin:0;color:#64748b;line-height:1.6">Description of feature one goes here</p></div><div style="padding:32px;background:#fff;border-radius:12px;box-shadow:0 4px 20px rgba(0,0,0,0.08)"><div style="width:48px;height:48px;background:#f093fb;border-radius:10px;display:flex;align-items:center;justify-content:center;font-size:24px;margin-bottom:16px">💡</div><h3 style="margin:0 0 8px">Feature Two</h3><p style="margin:0;color:#64748b;line-height:1.6">Description of feature two goes here</p></div></div></section>`,
    description: "Grid of feature cards",
  },

  // Pricing
  {
    id: "pricing-3tier",
    name: "3-Tier Pricing",
    type: "pricing",
    icon: "💰",
    html: `<section style="padding:80px 40px;background:#f8fafc"><h2 style="text-align:center;font-size:36px;margin:0 0 48px">Simple Pricing</h2><div style="display:flex;gap:24px;justify-content:center;max-width:900px;margin:0 auto"><div style="flex:1;background:#fff;padding:32px;border-radius:16px;text-align:center;box-shadow:0 4px 20px rgba(0,0,0,0.06)"><h3 style="margin:0 0 8px">Basic</h3><div style="font-size:40px;font-weight:bold;margin:16px 0">$9<span style="font-size:14px;color:#666">/mo</span></div><ul style="list-style:none;padding:0;margin:0 0 24px;text-align:left"><li style="padding:8px 0">✓ 5 Projects</li><li style="padding:8px 0">✓ Basic Support</li></ul><button style="width:100%;padding:12px;background:#e2e8f0;color:#333;border:none;border-radius:8px;font-weight:600;cursor:pointer">Start Free</button></div><div style="flex:1;background:#667eea;padding:32px;border-radius:16px;text-align:center;color:#fff;transform:scale(1.05)"><h3 style="margin:0 0 8px">Pro</h3><div style="font-size:40px;font-weight:bold;margin:16px 0">$29<span style="font-size:14px;opacity:0.8">/mo</span></div><ul style="list-style:none;padding:0;margin:0 0 24px;text-align:left"><li style="padding:8px 0">✓ Unlimited Projects</li><li style="padding:8px 0">✓ Priority Support</li></ul><button style="width:100%;padding:12px;background:#fff;color:#667eea;border:none;border-radius:8px;font-weight:600;cursor:pointer">Get Started</button></div><div style="flex:1;background:#fff;padding:32px;border-radius:16px;text-align:center;box-shadow:0 4px 20px rgba(0,0,0,0.06)"><h3 style="margin:0 0 8px">Enterprise</h3><div style="font-size:40px;font-weight:bold;margin:16px 0">$99<span style="font-size:14px;color:#666">/mo</span></div><ul style="list-style:none;padding:0;margin:0 0 24px;text-align:left"><li style="padding:8px 0">✓ Everything in Pro</li><li style="padding:8px 0">✓ Dedicated Support</li></ul><button style="width:100%;padding:12px;background:#e2e8f0;color:#333;border:none;border-radius:8px;font-weight:600;cursor:pointer">Contact Us</button></div></div></section>`,
    description: "Three pricing tiers with popular highlight",
  },

  // Testimonials
  {
    id: "testimonials-cards",
    name: "Testimonial Cards",
    type: "testimonials",
    icon: "💬",
    html: `<section style="padding:80px 40px;background:#fff"><h2 style="text-align:center;font-size:36px;margin:0 0 48px;color:#1a1a2e">What Customers Say</h2><div style="display:flex;gap:24px;max-width:1000px;margin:0 auto"><div style="flex:1;background:#f8fafc;padding:32px;border-radius:16px"><div style="font-size:32px;color:#667eea;margin-bottom:12px">"</div><p style="color:#475569;line-height:1.7;margin:0 0 20px">Amazing product! It has transformed how we work.</p><div style="display:flex;align-items:center;gap:12px"><div style="width:40px;height:40px;border-radius:50%;background:#667eea"></div><div><div style="font-weight:600">Sarah J.</div><div style="font-size:12px;color:#64748b">CEO, TechCorp</div></div></div></div><div style="flex:1;background:#f8fafc;padding:32px;border-radius:16px"><div style="font-size:32px;color:#667eea;margin-bottom:12px">"</div><p style="color:#475569;line-height:1.7;margin:0 0 20px">Best decision we ever made. Highly recommend!</p><div style="display:flex;align-items:center;gap:12px"><div style="width:40px;height:40px;border-radius:50%;background:#f093fb"></div><div><div style="font-weight:600">Mike C.</div><div style="font-size:12px;color:#64748b">Designer</div></div></div></div></div></section>`,
    description: "Two testimonial cards",
  },

  // CTA
  {
    id: "cta-gradient",
    name: "Gradient CTA",
    type: "cta",
    icon: "📢",
    html: `<section style="padding:80px 40px;background:linear-gradient(135deg,#667eea,#764ba2);text-align:center"><h2 style="font-size:40px;margin:0 0 16px;color:#fff;font-weight:800">Ready to Get Started?</h2><p style="font-size:18px;color:rgba(255,255,255,0.9);margin:0 0 32px">Join thousands of happy customers today.</p><button style="padding:16px 40px;background:#fff;color:#667eea;border:none;border-radius:50px;font-size:16px;font-weight:700;cursor:pointer">Start Free Trial</button></section>`,
    description: "Bold gradient background CTA",
  },
  {
    id: "cta-simple",
    name: "Simple CTA",
    type: "cta",
    icon: "👆",
    html: `<section style="padding:60px 40px;background:#1a1a2e;text-align:center"><h2 style="font-size:32px;margin:0 0 12px;color:#fff">Ready to start?</h2><p style="color:#94a3b8;margin:0 0 24px">Sign up for free and get started in minutes.</p><div style="display:flex;gap:12px;justify-content:center"><input placeholder="Enter your email" style="padding:14px 20px;border:none;border-radius:8px;width:280px;font-size:14px"/><button style="padding:14px 28px;background:#667eea;color:#fff;border:none;border-radius:8px;font-weight:600;cursor:pointer">Subscribe</button></div></section>`,
    description: "Email signup CTA",
  },

  // Footer
  {
    id: "footer-4col",
    name: "4-Column Footer",
    type: "footer",
    icon: "🦶",
    html: `<footer style="padding:60px 40px 30px;background:#1a1a2e;color:#fff"><div style="display:flex;gap:40px;max-width:1000px;margin:0 auto 40px"><div style="flex:2"><div style="font-size:24px;font-weight:bold;margin-bottom:16px">Brand</div><p style="color:#94a3b8;line-height:1.6;max-width:250px">Building the future, one pixel at a time.</p></div><div style="flex:1"><h4 style="margin:0 0 16px">Product</h4><div style="display:flex;flex-direction:column;gap:8px"><a href="#" style="color:#94a3b8;text-decoration:none">Features</a><a href="#" style="color:#94a3b8;text-decoration:none">Pricing</a></div></div><div style="flex:1"><h4 style="margin:0 0 16px">Company</h4><div style="display:flex;flex-direction:column;gap:8px"><a href="#" style="color:#94a3b8;text-decoration:none">About</a><a href="#" style="color:#94a3b8;text-decoration:none">Contact</a></div></div><div style="flex:1"><h4 style="margin:0 0 16px">Legal</h4><div style="display:flex;flex-direction:column;gap:8px"><a href="#" style="color:#94a3b8;text-decoration:none">Privacy</a><a href="#" style="color:#94a3b8;text-decoration:none">Terms</a></div></div></div><div style="border-top:1px solid #334155;padding-top:20px;text-align:center;color:#64748b;font-size:13px">© 2024 Brand. All rights reserved.</div></footer>`,
    description: "Multi-column footer with links",
  },
];

// ============================================================================
// SECTION TYPE TABS
// ============================================================================

const sectionTypes: { type: SectionType | "all"; icon: string; label: string }[] = [
  { type: "all", icon: "🎯", label: "All" },
  { type: "navigation", icon: "🧭", label: "Nav" },
  { type: "hero", icon: "🦸", label: "Hero" },
  { type: "features", icon: "⊞", label: "Features" },
  { type: "pricing", icon: "💰", label: "Pricing" },
  { type: "testimonials", icon: "💬", label: "Quotes" },
  { type: "cta", icon: "📢", label: "CTA" },
  { type: "footer", icon: "🦶", label: "Footer" },
];

// ============================================================================
// MAIN COMPONENT
// ============================================================================

export const SectionTemplates: React.FC<SectionTemplatesProps> = ({ onInsert, filter }) => {
  const [activeType, setActiveType] = React.useState<SectionType | "all">(filter || "all");

  const filteredSections =
    activeType === "all" ? sectionTemplates : sectionTemplates.filter((s) => s.type === activeType);

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
      {/* Type Tabs */}
      <div
        style={{
          display: "flex",
          gap: 6,
          flexWrap: "wrap",
          paddingBottom: 12,
          borderBottom: "1px solid var(--aqb-border)",
        }}
      >
        {sectionTypes.map((st) => (
          <button
            key={st.type}
            onClick={() => setActiveType(st.type)}
            style={{
              padding: "6px 12px",
              background:
                activeType === st.type ? "var(--aqb-primary)" : "var(--aqb-bg-panel-secondary)",
              border: "none",
              borderRadius: 6,
              cursor: "pointer",
              fontSize: 12,
              color: activeType === st.type ? "#fff" : "var(--aqb-text)",
              display: "flex",
              alignItems: "center",
              gap: 4,
            }}
          >
            <span>{st.icon}</span>
            <span>{st.label}</span>
          </button>
        ))}
      </div>

      {/* Sections Grid */}
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(2, 1fr)",
          gap: 12,
        }}
      >
        {filteredSections.map((section) => (
          <div
            key={section.id}
            onClick={() => onInsert(section)}
            style={{
              padding: 16,
              background: "var(--aqb-bg-panel-secondary)",
              borderRadius: 10,
              cursor: "pointer",
              transition: "all 0.2s",
              border: "1px solid transparent",
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.borderColor = "var(--aqb-primary)";
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.borderColor = "transparent";
            }}
          >
            <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
              <span style={{ fontSize: 24 }}>{section.icon}</span>
              <div>
                <div style={{ fontWeight: 500, fontSize: 13 }}>{section.name}</div>
                <div style={{ fontSize: 11, color: "var(--aqb-text-muted)" }}>
                  {section.description}
                </div>
              </div>
            </div>
            <div style={{ marginTop: 8 }}>
              <Badge variant="default" size="sm">
                {section.type}
              </Badge>
            </div>
          </div>
        ))}
      </div>

      {filteredSections.length === 0 && (
        <div
          style={{
            padding: 40,
            textAlign: "center",
            color: "var(--aqb-text-muted)",
          }}
        >
          No sections found for this category
        </div>
      )}
    </div>
  );
};

export default SectionTemplates;
