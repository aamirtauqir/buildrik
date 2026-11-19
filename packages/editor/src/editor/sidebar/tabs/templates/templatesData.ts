/**
 * Templates Data - Types, interfaces, and template definitions.
 * Extracted from TemplatesTab.tsx for maintainability.
 *
 * @lint-hex-policy: user-content
 *   Template HTML strings are USER SITE CONTENT (deployed to user's website
 *   when they pick a template). Editor chrome rules do not apply.
 *
 *   L4-024 (owner 2026-10-10): the SITE_TEMPLATES are authored on the
 *   semantic Brand tokens — `var(--buildrick-design-color-*)` — never a
 *   literal colour, so a template-started site follows its Brand: background,
 *   surface-muted, text / text-subtle / muted, primary / accent (+ their
 *   color-mix tints), on-primary on a primary fill, border. Re-authored by
 *   role from the old sample palettes (dark templates now take the site's
 *   own background and text). Content already applied to a page is the
 *   customer's and is not rewritten (templates.semanticTokens.test).
 *
 * @license BSD-3-Clause
 */

import { STORAGE_KEYS } from "@/shared/constants/storageKeys";

// ============================================================================
// TYPES & INTERFACES
// ============================================================================

export interface RecentTemplate {
  id: string;
  name: string;
  icon: string;
  usedAt: number;
  /** @deprecated html is no longer stored — look up via getTemplateById(id).html */
}

export interface TemplateItem {
  id: string;
  name: string;
  type: string;
  icon: string;
  html: string;
  description?: string;
  status?: "free" | "premium";
  category?: string;
  /** Industry vertical tag — for analytics + secondary filters. Not part of top-level IA. */
  industry?: TemplateIndustry;
  /** CSS gradient for card preview thumbnail */
  gradient?: string;
  /**
   * P9: semver tag for the template definition. When a page applies a
   * template, the version is captured into PageMeta.appliedTemplates;
   * future bumps surface "Update available" against the captured version.
   * Defaults to "1.0.0" via DEFAULT_TEMPLATE_VERSION when omitted.
   */
  version?: string;
}

/** P9: shared default until per-template versioning rolls out. */
export const DEFAULT_TEMPLATE_VERSION = "1.0.0";

/**
 * How many sections a template puts on the page — the number boards 641:2487
 * and 642:2556 print beside its name ("6 sections").
 *
 * Read from the template's own markup so it cannot drift from it, and counting
 * the landmark elements a person would count, not just `<section>`: a template
 * whose parts are a nav, a header and a footer has three sections to anyone
 * looking at it. Lives here rather than in a view because two surfaces print
 * it and they must not disagree.
 */
export function getSectionCount(html: string): number {
  const matches = html.match(/<(section|nav|header|footer|main|article)/gi);
  return matches ? matches.length : 1;
}

// ============================================================================
// HELPER FUNCTIONS
// ============================================================================

const RECENT_STORAGE_KEY = "buildrick-recent-templates";
const MY_TEMPLATES_KEY = STORAGE_KEYS.MY_TEMPLATES;
const MAX_RECENT = 3;

/**
 * User-saved templates (written by "Save as Template" → handleSaveTemplate).
 * The "My Templates" filter returned [] before, so saved templates were
 * invisible. Reads the localStorage store and maps to TemplateItem.
 */
export function getMyTemplates(): TemplateItem[] {
  try {
    const stored = localStorage.getItem(MY_TEMPLATES_KEY);
    if (!stored) return [];
    const rows = JSON.parse(stored) as Array<{
      id?: string;
      name?: string;
      description?: string;
      html?: string;
    }>;
    return rows
      .filter((r) => r && r.id && r.html)
      .map((r) => ({
        id: r.id as string,
        name: r.name || "Untitled template",
        type: "page",
        icon: "📄",
        html: r.html as string,
        description: r.description,
        category: "my-templates",
      }));
  } catch {
    return [];
  }
}

/** Get recent templates from localStorage */
export function getRecentTemplates(): RecentTemplate[] {
  try {
    const stored = localStorage.getItem(RECENT_STORAGE_KEY);
    if (!stored) return [];
    return JSON.parse(stored);
  } catch {
    return [];
  }
}

/** Add template to recent list */
export function addRecentTemplate(template: { id: string; name: string; icon: string }): void {
  const recent = getRecentTemplates();
  const newRecent: RecentTemplate = {
    id: template.id,
    name: template.name,
    icon: template.icon,
    usedAt: Date.now(),
  };
  const filtered = recent.filter((t) => t.id !== template.id);
  filtered.unshift(newRecent);
  const trimmed = filtered.slice(0, MAX_RECENT);
  try {
    localStorage.setItem(RECENT_STORAGE_KEY, JSON.stringify(trimmed));
  } catch {
    // Ignore storage errors
  }
}

// ============================================================================
// SITE TEMPLATES — full-site templates shown in card grid (Templates tab v2)
// ============================================================================

/** Optional industry tag — kept on TemplateItem for analytics + secondary filters,
 * not part of the top-level IA. */
export type TemplateIndustry = "landing" | "portfolio" | "saas" | "blog" | "ecommerce";

export const SITE_TEMPLATES: TemplateItem[] = [
  {
    id: "site-saas-landing",
    name: "SaaS Landing",
    type: "page",
    icon: "🚀",
    html: `<nav style="display:flex;justify-content:space-between;align-items:center;padding:18px 40px;background:var(--buildrick-design-color-background);border-bottom:1px solid color-mix(in srgb, var(--buildrick-design-color-primary) 20%, transparent)"><div style="font-size:20px;font-weight:700;color:var(--buildrick-design-color-primary)">Acme SaaS</div><div style="display:flex;gap:28px"><a href="#" style="text-decoration:none;color:var(--buildrick-design-color-muted);font-size:14px">Product</a><a href="#" style="text-decoration:none;color:var(--buildrick-design-color-muted);font-size:14px">Pricing</a><a href="#" style="text-decoration:none;color:var(--buildrick-design-color-muted);font-size:14px">Docs</a></div><button style="padding:10px 22px;background:var(--buildrick-design-color-primary);color:var(--buildrick-design-color-on-primary);border:none;border-radius:8px;font-size:13px;font-weight:600;cursor:pointer">Get Started</button></nav><section style="padding:100px 40px;text-align:center;background:linear-gradient(135deg,var(--buildrick-design-color-background) 0%,var(--buildrick-design-color-surface-muted) 100%)"><h1 style="font-size:52px;font-weight:800;color:var(--buildrick-design-color-text);margin:0 0 20px;letter-spacing:-.03em">Ship faster with<br><span style="color:var(--buildrick-design-color-primary)">less complexity</span></h1><p style="font-size:18px;color:var(--buildrick-design-color-muted);max-width:520px;margin:0 auto 40px;line-height:1.7">The platform that lets your team move at the speed of thought. Built for modern engineering teams.</p><div style="display:flex;gap:14px;justify-content:center"><button style="padding:14px 32px;background:var(--buildrick-design-color-primary);color:var(--buildrick-design-color-on-primary);border:none;border-radius:10px;font-size:15px;font-weight:600;cursor:pointer">Start free trial</button><button style="padding:14px 32px;background:var(--buildrick-design-color-surface-muted);color:var(--buildrick-design-color-text);border:1px solid var(--buildrick-design-color-border);border-radius:10px;font-size:15px;cursor:pointer">Watch demo</button></div></section><section style="padding:80px 40px;background:var(--buildrick-design-color-surface-muted)"><div style="display:grid;grid-template-columns:repeat(3,1fr);gap:24px;max-width:960px;margin:0 auto"><div style="padding:32px;background:var(--buildrick-design-color-surface-muted);border:1px solid var(--buildrick-design-color-border);border-radius:12px"><div style="font-size:28px;margin-bottom:14px">⚡</div><h3 style="font-size:16px;color:var(--buildrick-design-color-text);margin:0 0 10px">Blazing Fast</h3><p style="font-size:13px;color:var(--buildrick-design-color-muted);line-height:1.6">Deploy in seconds, not hours. Our infrastructure scales automatically.</p></div><div style="padding:32px;background:var(--buildrick-design-color-surface-muted);border:1px solid var(--buildrick-design-color-border);border-radius:12px"><div style="font-size:28px;margin-bottom:14px">🔒</div><h3 style="font-size:16px;color:var(--buildrick-design-color-text);margin:0 0 10px">Enterprise Security</h3><p style="font-size:13px;color:var(--buildrick-design-color-muted);line-height:1.6">SOC2 certified. Your data is encrypted at rest and in transit.</p></div><div style="padding:32px;background:var(--buildrick-design-color-surface-muted);border:1px solid var(--buildrick-design-color-border);border-radius:12px"><div style="font-size:28px;margin-bottom:14px">📊</div><h3 style="font-size:16px;color:var(--buildrick-design-color-text);margin:0 0 10px">Deep Analytics</h3><p style="font-size:13px;color:var(--buildrick-design-color-muted);line-height:1.6">Real-time insights into every part of your business.</p></div></div></section>`,
    status: "free",
    category: "site-pages",
    industry: "landing",
    gradient: "linear-gradient(145deg, #0a081e, #180f3a)", // SaaS landing: has feature sections
  },
  {
    id: "site-portfolio",
    name: "Portfolio",
    type: "page",
    icon: "🎨",
    html: `<nav style="display:flex;justify-content:space-between;align-items:center;padding:20px 48px;background:var(--buildrick-design-color-background)"><div style="font-size:18px;font-weight:700;color:var(--buildrick-design-color-text);letter-spacing:-.01em">Alex Chen</div><div style="display:flex;gap:32px"><a href="#" style="text-decoration:none;color:var(--buildrick-design-color-muted);font-size:13px">Work</a><a href="#" style="text-decoration:none;color:var(--buildrick-design-color-muted);font-size:13px">About</a><a href="#" style="text-decoration:none;color:var(--buildrick-design-color-muted);font-size:13px">Contact</a></div></nav><section style="padding:120px 48px 80px;background:var(--buildrick-design-color-background)"><h1 style="font-size:60px;font-weight:800;color:var(--buildrick-design-color-text);margin:0 0 16px;letter-spacing:-.04em;line-height:1.05">Product<br>Designer</h1><p style="font-size:16px;color:var(--buildrick-design-color-muted);margin:0 0 48px;line-height:1.7;max-width:440px">Crafting digital experiences that people love. 6 years at top-tier companies.</p><div style="display:flex;gap:12px"><button style="padding:12px 28px;background:var(--buildrick-design-color-surface-muted);color:var(--buildrick-design-color-text);border:none;border-radius:8px;font-size:13px;font-weight:600;cursor:pointer">View Work</button><button style="padding:12px 28px;background:transparent;color:var(--buildrick-design-color-muted);border:1px solid var(--buildrick-design-color-border);border-radius:8px;font-size:13px;cursor:pointer">Download CV</button></div></section><section style="padding:60px 48px;background:var(--buildrick-design-color-background);border-top:1px solid var(--buildrick-design-color-border)"><div style="display:grid;grid-template-columns:repeat(2,1fr);gap:20px;max-width:840px"><div style="aspect-ratio:16/10;background:linear-gradient(135deg,var(--buildrick-design-color-primary),var(--buildrick-design-color-accent));border-radius:12px;display:flex;align-items:center;justify-content:center;font-size:28px">🎨</div><div style="aspect-ratio:16/10;background:linear-gradient(135deg,var(--buildrick-design-color-primary),var(--buildrick-design-color-accent));border-radius:12px;display:flex;align-items:center;justify-content:center;font-size:28px">✏️</div></div></section>`,
    status: "free",
    category: "site-pages",
    industry: "portfolio",
    gradient: "linear-gradient(145deg, #0e1220, #061624)", // Portfolio: hero-focused layout
  },
  {
    id: "site-agency",
    name: "Agency",
    type: "page",
    icon: "💼",
    html: `<nav style="display:flex;justify-content:space-between;align-items:center;padding:20px 48px;background:var(--buildrick-design-color-background);border-bottom:1px solid var(--buildrick-design-color-border)"><div style="font-size:20px;font-weight:800;color:var(--buildrick-design-color-text);letter-spacing:-.02em">Studio<span style="color:var(--buildrick-design-color-primary)">.</span></div><div style="display:flex;gap:32px"><a href="#" style="text-decoration:none;color:var(--buildrick-design-color-muted);font-size:14px">Services</a><a href="#" style="text-decoration:none;color:var(--buildrick-design-color-muted);font-size:14px">Work</a><a href="#" style="text-decoration:none;color:var(--buildrick-design-color-muted);font-size:14px">About</a></div><button style="padding:11px 24px;background:var(--buildrick-design-color-surface-muted);color:var(--buildrick-design-color-text);border:none;border-radius:8px;font-size:13px;font-weight:600;cursor:pointer">Get in touch</button></nav><section style="padding:120px 48px;background:linear-gradient(135deg,var(--buildrick-design-color-primary) 0%,var(--buildrick-design-color-accent) 100%)"><h1 style="font-size:58px;font-weight:900;color:var(--buildrick-design-color-on-primary);margin:0 0 20px;letter-spacing:-.04em;line-height:1.05">We build<br>brands that<br>matter.</h1><p style="font-size:18px;color:var(--buildrick-design-color-on-primary);max-width:480px;line-height:1.7;margin:0 0 48px">Full-service creative agency. Strategy, design, and technology for ambitious brands.</p><button style="padding:16px 36px;background:var(--buildrick-design-color-background);color:var(--buildrick-design-color-primary);border:none;border-radius:10px;font-size:15px;font-weight:700;cursor:pointer">See our work →</button></section><section style="padding:80px 48px;background:var(--buildrick-design-color-surface-muted)"><div style="display:flex;gap:60px;justify-content:center;text-align:center"><div><div style="font-size:36px;font-weight:800;color:var(--buildrick-design-color-text)">150+</div><div style="font-size:13px;color:var(--buildrick-design-color-text);margin-top:4px">Projects delivered</div></div><div><div style="font-size:36px;font-weight:800;color:var(--buildrick-design-color-text)">8yr</div><div style="font-size:13px;color:var(--buildrick-design-color-text);margin-top:4px">In business</div></div><div><div style="font-size:36px;font-weight:800;color:var(--buildrick-design-color-text)">98%</div><div style="font-size:13px;color:var(--buildrick-design-color-text);margin-top:4px">Client retention</div></div></div></section>`,
    status: "free",
    category: "site-pages",
    industry: "landing",
    gradient: "linear-gradient(145deg, #0d1a12, #061a0a)", // Agency: CTA-focused hero with strong call-to-action
  },
  {
    id: "site-ecommerce",
    name: "E-Commerce",
    type: "page",
    icon: "🛒",
    html: `<nav style="display:flex;justify-content:space-between;align-items:center;padding:16px 40px;background:var(--buildrick-design-color-surface-muted);border-bottom:1px solid var(--buildrick-design-color-border)"><div style="font-size:20px;font-weight:800;color:var(--buildrick-design-color-text)">ShopCo</div><div style="display:flex;gap:28px"><a href="#" style="text-decoration:none;color:var(--buildrick-design-color-text-subtle);font-size:14px">Men</a><a href="#" style="text-decoration:none;color:var(--buildrick-design-color-text-subtle);font-size:14px">Women</a><a href="#" style="text-decoration:none;color:var(--buildrick-design-color-text-subtle);font-size:14px">Sale</a></div><div style="display:flex;gap:16px;align-items:center"><span style="font-size:20px;cursor:pointer">🔍</span><span style="font-size:20px;cursor:pointer">🛒</span></div></nav><section style="padding:60px 40px;background:linear-gradient(135deg,var(--buildrick-design-color-primary) 0%,var(--buildrick-design-color-accent) 100%);display:flex;align-items:center;gap:60px"><div style="flex:1"><p style="font-size:12px;font-weight:700;color:var(--buildrick-design-color-on-primary);text-transform:uppercase;letter-spacing:.1em;margin:0 0 12px">Summer Collection 2024</p><h1 style="font-size:52px;font-weight:900;color:var(--buildrick-design-color-on-primary);margin:0 0 20px;letter-spacing:-.04em;line-height:1.05">Style that<br>speaks for<br>itself.</h1><div style="display:flex;gap:12px"><button style="padding:14px 32px;background:var(--buildrick-design-color-surface-muted);color:var(--buildrick-design-color-primary);border:none;border-radius:8px;font-size:14px;font-weight:700;cursor:pointer">Shop Now</button><button style="padding:14px 32px;background:transparent;color:var(--buildrick-design-color-on-primary);border:2px solid var(--buildrick-design-color-border);border-radius:8px;font-size:14px;cursor:pointer">View Sale</button></div></div><div style="flex:1;height:260px;background:var(--buildrick-design-color-surface-muted);border-radius:16px;display:flex;align-items:center;justify-content:center;font-size:48px">👗</div></section><section style="padding:60px 40px;background:var(--buildrick-design-color-surface-muted)"><div style="display:grid;grid-template-columns:repeat(4,1fr);gap:20px;max-width:960px;margin:0 auto"><div style="background:var(--buildrick-design-color-background);border-radius:12px;overflow:hidden"><div style="height:180px;background:linear-gradient(135deg,var(--buildrick-design-color-primary),var(--buildrick-design-color-accent));display:flex;align-items:center;justify-content:center;font-size:36px">👟</div><div style="padding:16px"><div style="font-size:13px;font-weight:600;color:var(--buildrick-design-color-text)">Classic Sneaker</div><div style="font-size:13px;color:var(--buildrick-design-color-primary);font-weight:700;margin-top:4px">$89</div></div></div><div style="background:var(--buildrick-design-color-background);border-radius:12px;overflow:hidden"><div style="height:180px;background:linear-gradient(135deg,var(--buildrick-design-color-primary),var(--buildrick-design-color-accent));display:flex;align-items:center;justify-content:center;font-size:36px">👜</div><div style="padding:16px"><div style="font-size:13px;font-weight:600;color:var(--buildrick-design-color-text)">Leather Bag</div><div style="font-size:13px;color:var(--buildrick-design-color-primary);font-weight:700;margin-top:4px">$149</div></div></div><div style="background:var(--buildrick-design-color-background);border-radius:12px;overflow:hidden"><div style="height:180px;background:linear-gradient(135deg,var(--buildrick-design-color-primary),var(--buildrick-design-color-accent));display:flex;align-items:center;justify-content:center;font-size:36px">🧢</div><div style="padding:16px"><div style="font-size:13px;font-weight:600;color:var(--buildrick-design-color-text)">Cap & Hat</div><div style="font-size:13px;color:var(--buildrick-design-color-primary);font-weight:700;margin-top:4px">$39</div></div></div><div style="background:var(--buildrick-design-color-background);border-radius:12px;overflow:hidden"><div style="height:180px;background:linear-gradient(135deg,var(--buildrick-design-color-primary),var(--buildrick-design-color-accent));display:flex;align-items:center;justify-content:center;font-size:36px">⌚</div><div style="padding:16px"><div style="font-size:13px;font-weight:600;color:var(--buildrick-design-color-text)">Watch</div><div style="font-size:13px;color:var(--buildrick-design-color-primary);font-weight:700;margin-top:4px">$199</div></div></div></div></section>`,
    status: "premium",
    category: "site-pages",
    industry: "ecommerce",
    gradient: "linear-gradient(145deg, #1a0a00, #2d1200)", // E-Commerce: product/pricing grid prominent
  },
  {
    id: "site-blog",
    name: "Blog",
    type: "page",
    icon: "📝",
    html: `<nav style="display:flex;justify-content:space-between;align-items:center;padding:18px 48px;background:var(--buildrick-design-color-background);border-bottom:1px solid var(--buildrick-design-color-border)"><div style="font-size:18px;font-weight:700;color:var(--buildrick-design-color-text)">The Dispatch</div><div style="display:flex;gap:28px"><a href="#" style="text-decoration:none;color:var(--buildrick-design-color-muted);font-size:13px">Articles</a><a href="#" style="text-decoration:none;color:var(--buildrick-design-color-muted);font-size:13px">Topics</a><a href="#" style="text-decoration:none;color:var(--buildrick-design-color-muted);font-size:13px">Newsletter</a></div><button style="padding:9px 20px;background:var(--buildrick-design-color-surface-muted);color:var(--buildrick-design-color-text);border:none;border-radius:6px;font-size:13px;cursor:pointer">Subscribe</button></nav><section style="padding:80px 48px;background:var(--buildrick-design-color-background);border-bottom:1px solid var(--buildrick-design-color-border)"><div style="max-width:680px"><p style="font-size:11px;font-weight:700;color:var(--buildrick-design-color-primary);text-transform:uppercase;letter-spacing:.1em;margin:0 0 16px">Featured Article</p><h1 style="font-size:44px;font-weight:800;color:var(--buildrick-design-color-text);margin:0 0 20px;letter-spacing:-.03em;line-height:1.15">The Future of Product Design in the Age of AI</h1><p style="font-size:16px;color:var(--buildrick-design-color-muted);line-height:1.7;margin:0 0 28px">An exploration of how artificial intelligence is reshaping the tools, workflows, and creative process of modern designers.</p><div style="display:flex;align-items:center;gap:16px"><div style="width:36px;height:36px;background:linear-gradient(135deg,var(--buildrick-design-color-primary),var(--buildrick-design-color-accent));border-radius:50%;display:flex;align-items:center;justify-content:center;color:var(--buildrick-design-color-on-primary);font-weight:600;font-size:13px">AK</div><div><div style="font-size:13px;font-weight:600;color:var(--buildrick-design-color-text)">Arjun Kumar</div><div style="font-size:11px;color:var(--buildrick-design-color-text)">Jan 15 · 8 min read</div></div></div></div></section><section style="padding:60px 48px;background:var(--buildrick-design-color-surface-muted)"><div style="display:grid;grid-template-columns:repeat(3,1fr);gap:28px;max-width:960px;margin:0 auto"><div style="background:var(--buildrick-design-color-background);border-radius:10px;border:1px solid var(--buildrick-design-color-border);overflow:hidden"><div style="height:140px;background:linear-gradient(135deg,var(--buildrick-design-color-primary),var(--buildrick-design-color-surface-muted));"></div><div style="padding:20px"><p style="font-size:10px;color:var(--buildrick-design-color-primary);font-weight:700;text-transform:uppercase;letter-spacing:.08em;margin:0 0 8px">Design</p><h3 style="font-size:15px;font-weight:700;color:var(--buildrick-design-color-text);margin:0 0 8px;line-height:1.3">Building better onboarding experiences</h3><p style="font-size:12px;color:var(--buildrick-design-color-text);margin:0">6 min read</p></div></div><div style="background:var(--buildrick-design-color-background);border-radius:10px;border:1px solid var(--buildrick-design-color-border);overflow:hidden"><div style="height:140px;background:linear-gradient(135deg,var(--buildrick-design-color-primary),var(--buildrick-design-color-accent));"></div><div style="padding:20px"><p style="font-size:10px;color:var(--buildrick-design-color-primary);font-weight:700;text-transform:uppercase;letter-spacing:.08em;margin:0 0 8px">Engineering</p><h3 style="font-size:15px;font-weight:700;color:var(--buildrick-design-color-text);margin:0 0 8px;line-height:1.3">When to reach for React vs plain HTML</h3><p style="font-size:12px;color:var(--buildrick-design-color-text);margin:0">4 min read</p></div></div><div style="background:var(--buildrick-design-color-background);border-radius:10px;border:1px solid var(--buildrick-design-color-border);overflow:hidden"><div style="height:140px;background:linear-gradient(135deg,var(--buildrick-design-color-primary),var(--buildrick-design-color-accent));"></div><div style="padding:20px"><p style="font-size:10px;color:var(--buildrick-design-color-primary);font-weight:700;text-transform:uppercase;letter-spacing:.08em;margin:0 0 8px">Product</p><h3 style="font-size:15px;font-weight:700;color:var(--buildrick-design-color-text);margin:0 0 8px;line-height:1.3">The compounding returns of writing clearly</h3><p style="font-size:12px;color:var(--buildrick-design-color-text);margin:0">5 min read</p></div></div></div></section>`,
    status: "free",
    category: "site-pages",
    industry: "blog",
    gradient: "linear-gradient(145deg, #0a0e1a, #0a1428)",
  },
  {
    id: "site-startup",
    name: "Startup",
    type: "page",
    icon: "⚡",
    html: `<nav style="display:flex;justify-content:space-between;align-items:center;padding:18px 40px;background:var(--buildrick-design-color-background);border-bottom:1px solid color-mix(in srgb, var(--buildrick-design-color-primary) 20%, transparent)"><div style="font-size:20px;font-weight:800;color:var(--buildrick-design-color-text);letter-spacing:-.02em">Launch<span style="color:var(--buildrick-design-color-primary)">Kit</span></div><div style="display:flex;gap:28px"><a href="#" style="text-decoration:none;color:var(--buildrick-design-color-muted);font-size:13px">Product</a><a href="#" style="text-decoration:none;color:var(--buildrick-design-color-muted);font-size:13px">Pricing</a></div><button style="padding:10px 24px;background:linear-gradient(135deg,var(--buildrick-design-color-primary),var(--buildrick-design-color-accent));color:var(--buildrick-design-color-on-primary);border:none;border-radius:8px;font-size:13px;font-weight:600;cursor:pointer">Join beta</button></nav><section style="padding:100px 40px;text-align:center;background:radial-gradient(ellipse at top,color-mix(in srgb, var(--buildrick-design-color-primary) 15%, transparent) 0%,var(--buildrick-design-color-background) 60%)"><p style="font-size:11px;font-weight:700;color:var(--buildrick-design-color-primary);text-transform:uppercase;letter-spacing:.12em;margin:0 0 20px">Launching Q1 2025</p><h1 style="font-size:60px;font-weight:900;color:var(--buildrick-design-color-text);margin:0 0 24px;letter-spacing:-.04em;line-height:1">From idea to<br><span style="background:linear-gradient(135deg,var(--buildrick-design-color-primary),var(--buildrick-design-color-accent));-webkit-background-clip:text;-webkit-text-fill-color:transparent">launch</span><br>in 24 hours.</h1><p style="font-size:18px;color:var(--buildrick-design-color-muted);max-width:500px;margin:0 auto 48px;line-height:1.65">Stop wasting time on infrastructure. We handle everything so you can focus on your product.</p><div style="display:flex;gap:14px;justify-content:center"><input type="email" placeholder="you@email.com" style="padding:14px 20px;background:var(--buildrick-design-color-surface-muted);border:1px solid var(--buildrick-design-color-border);border-radius:10px;color:var(--buildrick-design-color-text);font-size:14px;width:280px;outline:none"><button style="padding:14px 28px;background:var(--buildrick-design-color-primary);color:var(--buildrick-design-color-on-primary);border:none;border-radius:10px;font-size:14px;font-weight:600;cursor:pointer;white-space:nowrap">Get early access</button></div></section>`,
    status: "free",
    category: "site-pages",
    industry: "saas",
    gradient: "linear-gradient(145deg, #180a2e, #240a3e)",
  },
  {
    id: "site-restaurant",
    name: "Restaurant",
    type: "page",
    icon: "🍽️",
    html: `<nav style="display:flex;justify-content:space-between;align-items:center;padding:20px 48px;background:var(--buildrick-design-color-background);backdrop-filter:blur(8px)"><div style="font-size:22px;font-weight:800;color:var(--buildrick-design-color-primary);letter-spacing:-.02em">Ember</div><div style="display:flex;gap:32px"><a href="#" style="text-decoration:none;color:var(--buildrick-design-color-muted);font-size:13px">Menu</a><a href="#" style="text-decoration:none;color:var(--buildrick-design-color-muted);font-size:13px">About</a><a href="#" style="text-decoration:none;color:var(--buildrick-design-color-muted);font-size:13px">Contact</a></div><button style="padding:11px 24px;background:var(--buildrick-design-color-primary);color:var(--buildrick-design-color-on-primary);border:none;border-radius:7px;font-size:13px;font-weight:700;cursor:pointer">Reserve</button></nav><section style="padding:120px 48px;background:linear-gradient(to bottom,var(--buildrick-design-color-surface-muted),var(--buildrick-design-color-surface-muted));text-align:center"><p style="font-size:11px;color:var(--buildrick-design-color-primary);font-weight:600;letter-spacing:.15em;text-transform:uppercase;margin:0 0 20px">Fine Dining · Downtown</p><h1 style="font-size:60px;font-weight:900;color:var(--buildrick-design-color-text);margin:0 0 24px;letter-spacing:-.04em;line-height:1.05">Where every<br>meal is an<br>experience.</h1><p style="font-size:16px;color:var(--buildrick-design-color-muted);max-width:480px;margin:0 auto 48px;line-height:1.7">Crafted with local ingredients, inspired by global flavors. Open Tuesday–Sunday for dinner.</p><button style="padding:16px 40px;background:var(--buildrick-design-color-primary);color:var(--buildrick-design-color-on-primary);border:none;border-radius:10px;font-size:15px;font-weight:700;cursor:pointer">Reserve a table →</button></section><section style="padding:80px 48px;background:var(--buildrick-design-color-surface-muted)"><div style="display:grid;grid-template-columns:repeat(3,1fr);gap:3px;max-width:900px;margin:0 auto"><div style="aspect-ratio:1;background:linear-gradient(135deg,var(--buildrick-design-color-primary),var(--buildrick-design-color-accent));display:flex;align-items:center;justify-content:center;font-size:48px;border-radius:4px">🥩</div><div style="aspect-ratio:1;background:linear-gradient(135deg,var(--buildrick-design-color-primary),var(--buildrick-design-color-accent));display:flex;align-items:center;justify-content:center;font-size:48px;border-radius:4px">🦞</div><div style="aspect-ratio:1;background:linear-gradient(135deg,var(--buildrick-design-color-primary),var(--buildrick-design-color-accent));display:flex;align-items:center;justify-content:center;font-size:48px;border-radius:4px">🥗</div></div></section>`,
    status: "premium",
    category: "site-pages",
    industry: "landing",
    gradient: "linear-gradient(145deg, #1a0a06, #2d0a00)",
  },
  {
    id: "site-minimal",
    name: "Minimal",
    type: "page",
    icon: "◻",
    html: `<nav style="display:flex;justify-content:space-between;align-items:center;padding:24px 56px;background:var(--buildrick-design-color-background)"><div style="font-size:14px;font-weight:600;color:var(--buildrick-design-color-text);letter-spacing:.05em">MJ</div><div style="display:flex;gap:32px"><a href="#" style="text-decoration:none;color:var(--buildrick-design-color-text);font-size:13px">Work</a><a href="#" style="text-decoration:none;color:var(--buildrick-design-color-text);font-size:13px">About</a></div></nav><section style="padding:140px 56px 100px;background:var(--buildrick-design-color-background)"><h1 style="font-size:72px;font-weight:900;color:var(--buildrick-design-color-text);margin:0 0 32px;letter-spacing:-.05em;line-height:.95">Designer<br>& Maker</h1><p style="font-size:16px;color:var(--buildrick-design-color-text);max-width:420px;line-height:1.7;margin:0 0 48px">I design things that are simple, useful, and occasionally beautiful.</p><a href="#work" style="display:inline-block;font-size:13px;color:var(--buildrick-design-color-text);text-decoration:none;border-bottom:1px solid var(--buildrick-design-color-border);padding-bottom:2px">View work ↓</a></section><section style="padding:60px 56px;background:var(--buildrick-design-color-surface-muted)"><div style="display:grid;grid-template-columns:repeat(2,1fr);gap:3px"><div style="aspect-ratio:4/3;background:var(--buildrick-design-color-surface-muted);border-radius:4px;display:flex;align-items:center;justify-content:center;font-size:32px">◻</div><div style="aspect-ratio:4/3;background:var(--buildrick-design-color-surface-muted);border-radius:4px;display:flex;align-items:center;justify-content:center;font-size:32px">◼</div></div></section>`,
    status: "free",
    category: "site-pages",
    industry: "portfolio",
    gradient: "linear-gradient(145deg, #0d0d14, #181820)",
  },
  {
    id: "site-saas-pro",
    name: "SaaS Pro",
    type: "page",
    icon: "🔷",
    html: `<nav style="display:flex;justify-content:space-between;align-items:center;padding:18px 48px;background:var(--buildrick-design-color-background);border-bottom:1px solid color-mix(in srgb, var(--buildrick-design-color-primary) 20%, transparent)"><div style="font-size:18px;font-weight:800;color:var(--buildrick-design-color-primary);letter-spacing:-.02em">Prism</div><div style="display:flex;gap:28px"><a href="#" style="text-decoration:none;color:var(--buildrick-design-color-muted);font-size:13px">Platform</a><a href="#" style="text-decoration:none;color:var(--buildrick-design-color-muted);font-size:13px">Pricing</a><a href="#" style="text-decoration:none;color:var(--buildrick-design-color-muted);font-size:13px">Docs</a></div><div style="display:flex;gap:10px"><button style="padding:9px 20px;background:transparent;color:var(--buildrick-design-color-muted);border:1px solid var(--buildrick-design-color-border);border-radius:7px;font-size:13px;cursor:pointer">Sign in</button><button style="padding:9px 20px;background:var(--buildrick-design-color-primary);color:var(--buildrick-design-color-on-primary);border:none;border-radius:7px;font-size:13px;font-weight:700;cursor:pointer">Start free</button></div></nav><section style="padding:120px 48px;background:linear-gradient(180deg,var(--buildrick-design-color-background) 0%,var(--buildrick-design-color-surface-muted) 100%)"><div style="display:flex;align-items:center;gap:80px"><div style="flex:1"><p style="font-size:11px;color:var(--buildrick-design-color-primary);font-weight:700;letter-spacing:.1em;text-transform:uppercase;margin:0 0 20px">Trusted by 5,000+ teams</p><h1 style="font-size:54px;font-weight:900;color:var(--buildrick-design-color-text);margin:0 0 24px;letter-spacing:-.04em;line-height:1.05">The analytics<br>platform for<br>serious teams.</h1><p style="font-size:16px;color:var(--buildrick-design-color-muted);line-height:1.7;margin:0 0 40px;max-width:440px">Real-time data, actionable insights, and beautiful dashboards — all in one place.</p><div style="display:flex;gap:12px"><button style="padding:14px 32px;background:var(--buildrick-design-color-primary);color:var(--buildrick-design-color-on-primary);border:none;border-radius:10px;font-size:14px;font-weight:700;cursor:pointer">Start for free</button><button style="padding:14px 32px;background:var(--buildrick-design-color-surface-muted);color:var(--buildrick-design-color-muted);border:1px solid var(--buildrick-design-color-border);border-radius:10px;font-size:14px;cursor:pointer">Book demo</button></div></div><div style="flex:1;background:color-mix(in srgb, var(--buildrick-design-color-primary) 6%, transparent);border:1px solid color-mix(in srgb, var(--buildrick-design-color-primary) 20%, transparent);border-radius:16px;padding:24px;height:280px;display:flex;align-items:center;justify-content:center;font-size:48px">📊</div></div></section>`,
    status: "premium",
    category: "site-pages",
    industry: "saas",
    gradient: "linear-gradient(145deg, #0a1028, #061830)",
  },
  {
    id: "site-coming-soon",
    name: "Coming Soon",
    type: "page",
    icon: "⏳",
    html: `<section style="min-height:100vh;display:flex;flex-direction:column;align-items:center;justify-content:center;background:linear-gradient(135deg,var(--buildrick-design-color-surface-muted) 0%,var(--buildrick-design-color-surface-muted) 100%);text-align:center;padding:40px"><div style="font-size:40px;margin-bottom:24px">⏳</div><h1 style="font-size:52px;font-weight:900;color:var(--buildrick-design-color-text);margin:0 0 16px;letter-spacing:-.04em">Something<br>awesome is<br>coming.</h1><p style="font-size:16px;color:var(--buildrick-design-color-muted);max-width:400px;line-height:1.7;margin:0 auto 48px">We're putting the finishing touches on something you'll love. Be the first to know.</p><div style="display:flex;gap:10px;justify-content:center"><input type="email" placeholder="Enter your email" style="padding:14px 20px;background:var(--buildrick-design-color-surface-muted);border:1px solid var(--buildrick-design-color-border);border-radius:10px;color:var(--buildrick-design-color-text);font-size:14px;width:260px;outline:none"><button style="padding:14px 24px;background:var(--buildrick-design-color-primary);color:var(--buildrick-design-color-on-primary);border:none;border-radius:10px;font-size:14px;font-weight:600;cursor:pointer;white-space:nowrap">Notify me</button></div><div style="display:flex;gap:32px;margin-top:60px;text-align:center"><div><div style="font-size:32px;font-weight:800;color:var(--buildrick-design-color-primary);line-height:1" id="days">--</div><div style="font-size:10px;color:var(--buildrick-design-color-muted);margin-top:4px;letter-spacing:.08em;text-transform:uppercase">Days</div></div><div><div style="font-size:32px;font-weight:800;color:var(--buildrick-design-color-primary);line-height:1">--</div><div style="font-size:10px;color:var(--buildrick-design-color-muted);margin-top:4px;letter-spacing:.08em;text-transform:uppercase">Hours</div></div><div><div style="font-size:32px;font-weight:800;color:var(--buildrick-design-color-primary);line-height:1">--</div><div style="font-size:10px;color:var(--buildrick-design-color-muted);margin-top:4px;letter-spacing:.08em;text-transform:uppercase">Minutes</div></div></div></section>`,
    status: "free",
    category: "site-pages",
    industry: "landing",
    gradient: "linear-gradient(145deg, #0a0a1e, #14082e)",
  },
];

/** Get template by ID */
/** The full-canvas catalogue's built-ins (4418:54134 lists page templates only). */
export const PAGE_TEMPLATES = SITE_TEMPLATES.filter((t) => t.type === "page");

export const getTemplateById = (id: string): TemplateItem | undefined =>
  SITE_TEMPLATES.find((t) => t.id === id);
