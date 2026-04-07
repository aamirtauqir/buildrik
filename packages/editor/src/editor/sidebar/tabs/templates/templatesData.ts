/**
 * Templates Data - Types, interfaces, and template definitions
 * Extracted from TemplatesTab.tsx for maintainability
 * @license BSD-3-Clause
 */

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
  /** CSS gradient for card preview thumbnail */
  gradient?: string;
  /** Number of pages in this template */
  pageCount?: number;
}

export type TopLevelGroup = "sections" | "pages" | "mySaves";

// ============================================================================
// HELPER FUNCTIONS
// ============================================================================

const RECENT_STORAGE_KEY = "aqb-recent-templates";
const MAX_RECENT = 3;

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

export type SiteCategory = "all" | "landing" | "portfolio" | "saas" | "blog" | "ecommerce";

export const SITE_CATEGORY_PILLS: { id: SiteCategory; label: string }[] = [
  { id: "all", label: "All" },
  { id: "landing", label: "Landing" },
  { id: "portfolio", label: "Portfolio" },
  { id: "saas", label: "SaaS" },
  { id: "blog", label: "Blog" },
  { id: "ecommerce", label: "E-comm" },
];

export const SITE_TEMPLATES: TemplateItem[] = [
  {
    id: "site-saas-landing",
    name: "SaaS Landing",
    type: "hero",
    icon: "🚀",
    html: `<nav style="display:flex;justify-content:space-between;align-items:center;padding:18px 40px;background:#0a081e;border-bottom:1px solid rgba(124,109,250,.15)"><div style="font-size:20px;font-weight:700;color:#a5b4fc">Acme SaaS</div><div style="display:flex;gap:28px"><a href="#" style="text-decoration:none;color:rgba(255,255,255,.5);font-size:14px">Product</a><a href="#" style="text-decoration:none;color:rgba(255,255,255,.5);font-size:14px">Pricing</a><a href="#" style="text-decoration:none;color:rgba(255,255,255,.5);font-size:14px">Docs</a></div><button style="padding:10px 22px;background:#7c6dfa;color:#fff;border:none;border-radius:8px;font-size:13px;font-weight:600;cursor:pointer">Get Started</button></nav><section style="padding:100px 40px;text-align:center;background:linear-gradient(135deg,#0a081e 0%,#180f3a 100%)"><h1 style="font-size:52px;font-weight:800;color:#fff;margin:0 0 20px;letter-spacing:-.03em">Ship faster with<br><span style="color:#a5b4fc">less complexity</span></h1><p style="font-size:18px;color:rgba(255,255,255,.5);max-width:520px;margin:0 auto 40px;line-height:1.7">The platform that lets your team move at the speed of thought. Built for modern engineering teams.</p><div style="display:flex;gap:14px;justify-content:center"><button style="padding:14px 32px;background:#7c6dfa;color:#fff;border:none;border-radius:10px;font-size:15px;font-weight:600;cursor:pointer">Start free trial</button><button style="padding:14px 32px;background:rgba(255,255,255,.06);color:rgba(255,255,255,.7);border:1px solid rgba(255,255,255,.12);border-radius:10px;font-size:15px;cursor:pointer">Watch demo</button></div></section><section style="padding:80px 40px;background:#0d0b1f"><div style="display:grid;grid-template-columns:repeat(3,1fr);gap:24px;max-width:960px;margin:0 auto"><div style="padding:32px;background:rgba(255,255,255,.03);border:1px solid rgba(255,255,255,.07);border-radius:12px"><div style="font-size:28px;margin-bottom:14px">⚡</div><h3 style="font-size:16px;color:#fff;margin:0 0 10px">Blazing Fast</h3><p style="font-size:13px;color:rgba(255,255,255,.4);line-height:1.6">Deploy in seconds, not hours. Our infrastructure scales automatically.</p></div><div style="padding:32px;background:rgba(255,255,255,.03);border:1px solid rgba(255,255,255,.07);border-radius:12px"><div style="font-size:28px;margin-bottom:14px">🔒</div><h3 style="font-size:16px;color:#fff;margin:0 0 10px">Enterprise Security</h3><p style="font-size:13px;color:rgba(255,255,255,.4);line-height:1.6">SOC2 certified. Your data is encrypted at rest and in transit.</p></div><div style="padding:32px;background:rgba(255,255,255,.03);border:1px solid rgba(255,255,255,.07);border-radius:12px"><div style="font-size:28px;margin-bottom:14px">📊</div><h3 style="font-size:16px;color:#fff;margin:0 0 10px">Deep Analytics</h3><p style="font-size:13px;color:rgba(255,255,255,.4);line-height:1.6">Real-time insights into every part of your business.</p></div></div></section>`,
    status: "free",
    category: "landing",
    gradient: "linear-gradient(145deg, #0a081e, #180f3a)",
    pageCount: 4,
  },
  {
    id: "site-portfolio",
    name: "Portfolio",
    type: "hero",
    icon: "🎨",
    html: `<nav style="display:flex;justify-content:space-between;align-items:center;padding:20px 48px;background:#0e1220"><div style="font-size:18px;font-weight:700;color:#fff;letter-spacing:-.01em">Alex Chen</div><div style="display:flex;gap:32px"><a href="#" style="text-decoration:none;color:rgba(255,255,255,.4);font-size:13px">Work</a><a href="#" style="text-decoration:none;color:rgba(255,255,255,.4);font-size:13px">About</a><a href="#" style="text-decoration:none;color:rgba(255,255,255,.4);font-size:13px">Contact</a></div></nav><section style="padding:120px 48px 80px;background:#0e1220"><h1 style="font-size:60px;font-weight:800;color:#fff;margin:0 0 16px;letter-spacing:-.04em;line-height:1.05">Product<br>Designer</h1><p style="font-size:16px;color:rgba(255,255,255,.4);margin:0 0 48px;line-height:1.7;max-width:440px">Crafting digital experiences that people love. 6 years at top-tier companies.</p><div style="display:flex;gap:12px"><button style="padding:12px 28px;background:#fff;color:#0e1220;border:none;border-radius:8px;font-size:13px;font-weight:600;cursor:pointer">View Work</button><button style="padding:12px 28px;background:transparent;color:rgba(255,255,255,.5);border:1px solid rgba(255,255,255,.12);border-radius:8px;font-size:13px;cursor:pointer">Download CV</button></div></section><section style="padding:60px 48px;background:#0e1220;border-top:1px solid rgba(255,255,255,.06)"><div style="display:grid;grid-template-columns:repeat(2,1fr);gap:20px;max-width:840px"><div style="aspect-ratio:16/10;background:linear-gradient(135deg,#667eea,#764ba2);border-radius:12px;display:flex;align-items:center;justify-content:center;font-size:28px">🎨</div><div style="aspect-ratio:16/10;background:linear-gradient(135deg,#f093fb,#f5576c);border-radius:12px;display:flex;align-items:center;justify-content:center;font-size:28px">✏️</div></div></section>`,
    status: "free",
    category: "portfolio",
    gradient: "linear-gradient(145deg, #0e1220, #061624)",
    pageCount: 3,
  },
  {
    id: "site-agency",
    name: "Agency",
    type: "hero",
    icon: "💼",
    html: `<nav style="display:flex;justify-content:space-between;align-items:center;padding:20px 48px;background:#fff;border-bottom:1px solid #f0f0f0"><div style="font-size:20px;font-weight:800;color:#1a1a2e;letter-spacing:-.02em">Studio<span style="color:#667eea">.</span></div><div style="display:flex;gap:32px"><a href="#" style="text-decoration:none;color:#666;font-size:14px">Services</a><a href="#" style="text-decoration:none;color:#666;font-size:14px">Work</a><a href="#" style="text-decoration:none;color:#666;font-size:14px">About</a></div><button style="padding:11px 24px;background:#1a1a2e;color:#fff;border:none;border-radius:8px;font-size:13px;font-weight:600;cursor:pointer">Get in touch</button></nav><section style="padding:120px 48px;background:linear-gradient(135deg,#667eea 0%,#764ba2 100%)"><h1 style="font-size:58px;font-weight:900;color:#fff;margin:0 0 20px;letter-spacing:-.04em;line-height:1.05">We build<br>brands that<br>matter.</h1><p style="font-size:18px;color:rgba(255,255,255,.75);max-width:480px;line-height:1.7;margin:0 0 48px">Full-service creative agency. Strategy, design, and technology for ambitious brands.</p><button style="padding:16px 36px;background:#fff;color:#667eea;border:none;border-radius:10px;font-size:15px;font-weight:700;cursor:pointer">See our work →</button></section><section style="padding:80px 48px;background:#fafafa"><div style="display:flex;gap:60px;justify-content:center;text-align:center"><div><div style="font-size:36px;font-weight:800;color:#1a1a2e">150+</div><div style="font-size:13px;color:#999;margin-top:4px">Projects delivered</div></div><div><div style="font-size:36px;font-weight:800;color:#1a1a2e">8yr</div><div style="font-size:13px;color:#999;margin-top:4px">In business</div></div><div><div style="font-size:36px;font-weight:800;color:#1a1a2e">98%</div><div style="font-size:13px;color:#999;margin-top:4px">Client retention</div></div></div></section>`,
    status: "free",
    category: "landing",
    gradient: "linear-gradient(145deg, #0d1a12, #061a0a)",
    pageCount: 5,
  },
  {
    id: "site-ecommerce",
    name: "E-Commerce",
    type: "hero",
    icon: "🛒",
    html: `<nav style="display:flex;justify-content:space-between;align-items:center;padding:16px 40px;background:#fff;border-bottom:1px solid #eee"><div style="font-size:20px;font-weight:800;color:#1a1a2e">ShopCo</div><div style="display:flex;gap:28px"><a href="#" style="text-decoration:none;color:#444;font-size:14px">Men</a><a href="#" style="text-decoration:none;color:#444;font-size:14px">Women</a><a href="#" style="text-decoration:none;color:#444;font-size:14px">Sale</a></div><div style="display:flex;gap:16px;align-items:center"><span style="font-size:20px;cursor:pointer">🔍</span><span style="font-size:20px;cursor:pointer">🛒</span></div></nav><section style="padding:60px 40px;background:linear-gradient(135deg,#f59e0b 0%,#ef4444 100%);display:flex;align-items:center;gap:60px"><div style="flex:1"><p style="font-size:12px;font-weight:700;color:rgba(255,255,255,.7);text-transform:uppercase;letter-spacing:.1em;margin:0 0 12px">Summer Collection 2024</p><h1 style="font-size:52px;font-weight:900;color:#fff;margin:0 0 20px;letter-spacing:-.04em;line-height:1.05">Style that<br>speaks for<br>itself.</h1><div style="display:flex;gap:12px"><button style="padding:14px 32px;background:#fff;color:#ef4444;border:none;border-radius:8px;font-size:14px;font-weight:700;cursor:pointer">Shop Now</button><button style="padding:14px 32px;background:transparent;color:#fff;border:2px solid rgba(255,255,255,.5);border-radius:8px;font-size:14px;cursor:pointer">View Sale</button></div></div><div style="flex:1;height:260px;background:rgba(255,255,255,.15);border-radius:16px;display:flex;align-items:center;justify-content:center;font-size:48px">👗</div></section><section style="padding:60px 40px;background:#fff"><div style="display:grid;grid-template-columns:repeat(4,1fr);gap:20px;max-width:960px;margin:0 auto"><div style="background:#f8f9fa;border-radius:12px;overflow:hidden"><div style="height:180px;background:linear-gradient(135deg,#667eea,#764ba2);display:flex;align-items:center;justify-content:center;font-size:36px">👟</div><div style="padding:16px"><div style="font-size:13px;font-weight:600;color:#1a1a2e">Classic Sneaker</div><div style="font-size:13px;color:#667eea;font-weight:700;margin-top:4px">$89</div></div></div><div style="background:#f8f9fa;border-radius:12px;overflow:hidden"><div style="height:180px;background:linear-gradient(135deg,#f093fb,#f5576c);display:flex;align-items:center;justify-content:center;font-size:36px">👜</div><div style="padding:16px"><div style="font-size:13px;font-weight:600;color:#1a1a2e">Leather Bag</div><div style="font-size:13px;color:#667eea;font-weight:700;margin-top:4px">$149</div></div></div><div style="background:#f8f9fa;border-radius:12px;overflow:hidden"><div style="height:180px;background:linear-gradient(135deg,#4facfe,#00f2fe);display:flex;align-items:center;justify-content:center;font-size:36px">🧢</div><div style="padding:16px"><div style="font-size:13px;font-weight:600;color:#1a1a2e">Cap & Hat</div><div style="font-size:13px;color:#667eea;font-weight:700;margin-top:4px">$39</div></div></div><div style="background:#f8f9fa;border-radius:12px;overflow:hidden"><div style="height:180px;background:linear-gradient(135deg,#43e97b,#38f9d7);display:flex;align-items:center;justify-content:center;font-size:36px">⌚</div><div style="padding:16px"><div style="font-size:13px;font-weight:600;color:#1a1a2e">Watch</div><div style="font-size:13px;color:#667eea;font-weight:700;margin-top:4px">$199</div></div></div></div></section>`,
    status: "premium",
    category: "ecommerce",
    gradient: "linear-gradient(145deg, #1a0a00, #2d1200)",
    pageCount: 6,
  },
  {
    id: "site-blog",
    name: "Blog",
    type: "hero",
    icon: "📝",
    html: `<nav style="display:flex;justify-content:space-between;align-items:center;padding:18px 48px;background:#fff;border-bottom:1px solid #f0f0f0"><div style="font-size:18px;font-weight:700;color:#1a1a2e">The Dispatch</div><div style="display:flex;gap:28px"><a href="#" style="text-decoration:none;color:#666;font-size:13px">Articles</a><a href="#" style="text-decoration:none;color:#666;font-size:13px">Topics</a><a href="#" style="text-decoration:none;color:#666;font-size:13px">Newsletter</a></div><button style="padding:9px 20px;background:#1a1a2e;color:#fff;border:none;border-radius:6px;font-size:13px;cursor:pointer">Subscribe</button></nav><section style="padding:80px 48px;background:#fff;border-bottom:1px solid #f0f0f0"><div style="max-width:680px"><p style="font-size:11px;font-weight:700;color:#667eea;text-transform:uppercase;letter-spacing:.1em;margin:0 0 16px">Featured Article</p><h1 style="font-size:44px;font-weight:800;color:#1a1a2e;margin:0 0 20px;letter-spacing:-.03em;line-height:1.15">The Future of Product Design in the Age of AI</h1><p style="font-size:16px;color:#666;line-height:1.7;margin:0 0 28px">An exploration of how artificial intelligence is reshaping the tools, workflows, and creative process of modern designers.</p><div style="display:flex;align-items:center;gap:16px"><div style="width:36px;height:36px;background:linear-gradient(135deg,#667eea,#764ba2);border-radius:50%;display:flex;align-items:center;justify-content:center;color:#fff;font-weight:600;font-size:13px">AK</div><div><div style="font-size:13px;font-weight:600;color:#1a1a2e">Arjun Kumar</div><div style="font-size:11px;color:#999">Jan 15 · 8 min read</div></div></div></div></section><section style="padding:60px 48px;background:#fafafa"><div style="display:grid;grid-template-columns:repeat(3,1fr);gap:28px;max-width:960px;margin:0 auto"><div style="background:#fff;border-radius:10px;border:1px solid #f0f0f0;overflow:hidden"><div style="height:140px;background:linear-gradient(135deg,#a18cd1,#fbc2eb);"></div><div style="padding:20px"><p style="font-size:10px;color:#667eea;font-weight:700;text-transform:uppercase;letter-spacing:.08em;margin:0 0 8px">Design</p><h3 style="font-size:15px;font-weight:700;color:#1a1a2e;margin:0 0 8px;line-height:1.3">Building better onboarding experiences</h3><p style="font-size:12px;color:#999;margin:0">6 min read</p></div></div><div style="background:#fff;border-radius:10px;border:1px solid #f0f0f0;overflow:hidden"><div style="height:140px;background:linear-gradient(135deg,#fda085,#f6d365);"></div><div style="padding:20px"><p style="font-size:10px;color:#667eea;font-weight:700;text-transform:uppercase;letter-spacing:.08em;margin:0 0 8px">Engineering</p><h3 style="font-size:15px;font-weight:700;color:#1a1a2e;margin:0 0 8px;line-height:1.3">When to reach for React vs plain HTML</h3><p style="font-size:12px;color:#999;margin:0">4 min read</p></div></div><div style="background:#fff;border-radius:10px;border:1px solid #f0f0f0;overflow:hidden"><div style="height:140px;background:linear-gradient(135deg,#84fab0,#8fd3f4);"></div><div style="padding:20px"><p style="font-size:10px;color:#667eea;font-weight:700;text-transform:uppercase;letter-spacing:.08em;margin:0 0 8px">Product</p><h3 style="font-size:15px;font-weight:700;color:#1a1a2e;margin:0 0 8px;line-height:1.3">The compounding returns of writing clearly</h3><p style="font-size:12px;color:#999;margin:0">5 min read</p></div></div></div></section>`,
    status: "free",
    category: "blog",
    gradient: "linear-gradient(145deg, #0a0e1a, #0a1428)",
    pageCount: 3,
  },
  {
    id: "site-startup",
    name: "Startup",
    type: "hero",
    icon: "⚡",
    html: `<nav style="display:flex;justify-content:space-between;align-items:center;padding:18px 40px;background:#100820;border-bottom:1px solid rgba(124,109,250,.12)"><div style="font-size:20px;font-weight:800;color:#fff;letter-spacing:-.02em">Launch<span style="color:#7c6dfa">Kit</span></div><div style="display:flex;gap:28px"><a href="#" style="text-decoration:none;color:rgba(255,255,255,.4);font-size:13px">Product</a><a href="#" style="text-decoration:none;color:rgba(255,255,255,.4);font-size:13px">Pricing</a></div><button style="padding:10px 24px;background:linear-gradient(135deg,#7c6dfa,#a78bfa);color:#fff;border:none;border-radius:8px;font-size:13px;font-weight:600;cursor:pointer">Join beta</button></nav><section style="padding:100px 40px;text-align:center;background:radial-gradient(ellipse at top,rgba(124,109,250,.15) 0%,#100820 60%)"><p style="font-size:11px;font-weight:700;color:#7c6dfa;text-transform:uppercase;letter-spacing:.12em;margin:0 0 20px">Launching Q1 2025</p><h1 style="font-size:60px;font-weight:900;color:#fff;margin:0 0 24px;letter-spacing:-.04em;line-height:1">From idea to<br><span style="background:linear-gradient(135deg,#7c6dfa,#a78bfa);-webkit-background-clip:text;-webkit-text-fill-color:transparent">launch</span><br>in 24 hours.</h1><p style="font-size:18px;color:rgba(255,255,255,.4);max-width:500px;margin:0 auto 48px;line-height:1.65">Stop wasting time on infrastructure. We handle everything so you can focus on your product.</p><div style="display:flex;gap:14px;justify-content:center"><input type="email" placeholder="you@email.com" style="padding:14px 20px;background:rgba(255,255,255,.06);border:1px solid rgba(255,255,255,.1);border-radius:10px;color:#fff;font-size:14px;width:280px;outline:none"><button style="padding:14px 28px;background:#7c6dfa;color:#fff;border:none;border-radius:10px;font-size:14px;font-weight:600;cursor:pointer;white-space:nowrap">Get early access</button></div></section>`,
    status: "free",
    category: "saas",
    gradient: "linear-gradient(145deg, #180a2e, #240a3e)",
    pageCount: 4,
  },
  {
    id: "site-restaurant",
    name: "Restaurant",
    type: "hero",
    icon: "🍽️",
    html: `<nav style="display:flex;justify-content:space-between;align-items:center;padding:20px 48px;background:rgba(20,8,4,.95);backdrop-filter:blur(8px)"><div style="font-size:22px;font-weight:800;color:#f59e0b;letter-spacing:-.02em">Ember</div><div style="display:flex;gap:32px"><a href="#" style="text-decoration:none;color:rgba(255,255,255,.55);font-size:13px">Menu</a><a href="#" style="text-decoration:none;color:rgba(255,255,255,.55);font-size:13px">About</a><a href="#" style="text-decoration:none;color:rgba(255,255,255,.55);font-size:13px">Contact</a></div><button style="padding:11px 24px;background:#f59e0b;color:#1a0800;border:none;border-radius:7px;font-size:13px;font-weight:700;cursor:pointer">Reserve</button></nav><section style="padding:120px 48px;background:linear-gradient(to bottom,#1a0800,#2d1200);text-align:center"><p style="font-size:11px;color:#f59e0b;font-weight:600;letter-spacing:.15em;text-transform:uppercase;margin:0 0 20px">Fine Dining · Downtown</p><h1 style="font-size:60px;font-weight:900;color:#fff;margin:0 0 24px;letter-spacing:-.04em;line-height:1.05">Where every<br>meal is an<br>experience.</h1><p style="font-size:16px;color:rgba(255,255,255,.4);max-width:480px;margin:0 auto 48px;line-height:1.7">Crafted with local ingredients, inspired by global flavors. Open Tuesday–Sunday for dinner.</p><button style="padding:16px 40px;background:#f59e0b;color:#1a0800;border:none;border-radius:10px;font-size:15px;font-weight:700;cursor:pointer">Reserve a table →</button></section><section style="padding:80px 48px;background:#140800"><div style="display:grid;grid-template-columns:repeat(3,1fr);gap:3px;max-width:900px;margin:0 auto"><div style="aspect-ratio:1;background:linear-gradient(135deg,#f59e0b,#d97706);display:flex;align-items:center;justify-content:center;font-size:48px;border-radius:4px">🥩</div><div style="aspect-ratio:1;background:linear-gradient(135deg,#ef4444,#b91c1c);display:flex;align-items:center;justify-content:center;font-size:48px;border-radius:4px">🦞</div><div style="aspect-ratio:1;background:linear-gradient(135deg,#10b981,#065f46);display:flex;align-items:center;justify-content:center;font-size:48px;border-radius:4px">🥗</div></div></section>`,
    status: "premium",
    category: "landing",
    gradient: "linear-gradient(145deg, #1a0a06, #2d0a00)",
    pageCount: 4,
  },
  {
    id: "site-minimal",
    name: "Minimal",
    type: "hero",
    icon: "◻",
    html: `<nav style="display:flex;justify-content:space-between;align-items:center;padding:24px 56px;background:#fff"><div style="font-size:14px;font-weight:600;color:#1a1a2e;letter-spacing:.05em">MJ</div><div style="display:flex;gap:32px"><a href="#" style="text-decoration:none;color:#999;font-size:13px">Work</a><a href="#" style="text-decoration:none;color:#999;font-size:13px">About</a></div></nav><section style="padding:140px 56px 100px;background:#fff"><h1 style="font-size:72px;font-weight:900;color:#1a1a2e;margin:0 0 32px;letter-spacing:-.05em;line-height:.95">Designer<br>& Maker</h1><p style="font-size:16px;color:#999;max-width:420px;line-height:1.7;margin:0 0 48px">I design things that are simple, useful, and occasionally beautiful.</p><a href="#work" style="display:inline-block;font-size:13px;color:#1a1a2e;text-decoration:none;border-bottom:1px solid #1a1a2e;padding-bottom:2px">View work ↓</a></section><section style="padding:60px 56px;background:#f8f8f8"><div style="display:grid;grid-template-columns:repeat(2,1fr);gap:3px"><div style="aspect-ratio:4/3;background:#e5e7eb;border-radius:4px;display:flex;align-items:center;justify-content:center;font-size:32px">◻</div><div style="aspect-ratio:4/3;background:#d1d5db;border-radius:4px;display:flex;align-items:center;justify-content:center;font-size:32px">◼</div></div></section>`,
    status: "free",
    category: "portfolio",
    gradient: "linear-gradient(145deg, #0d0d14, #181820)",
    pageCount: 2,
  },
  {
    id: "site-saas-pro",
    name: "SaaS Pro",
    type: "hero",
    icon: "🔷",
    html: `<nav style="display:flex;justify-content:space-between;align-items:center;padding:18px 48px;background:#06101e;border-bottom:1px solid rgba(96,165,250,.1)"><div style="font-size:18px;font-weight:800;color:#60a5fa;letter-spacing:-.02em">Prism</div><div style="display:flex;gap:28px"><a href="#" style="text-decoration:none;color:rgba(255,255,255,.4);font-size:13px">Platform</a><a href="#" style="text-decoration:none;color:rgba(255,255,255,.4);font-size:13px">Pricing</a><a href="#" style="text-decoration:none;color:rgba(255,255,255,.4);font-size:13px">Docs</a></div><div style="display:flex;gap:10px"><button style="padding:9px 20px;background:transparent;color:rgba(255,255,255,.5);border:1px solid rgba(255,255,255,.12);border-radius:7px;font-size:13px;cursor:pointer">Sign in</button><button style="padding:9px 20px;background:#60a5fa;color:#06101e;border:none;border-radius:7px;font-size:13px;font-weight:700;cursor:pointer">Start free</button></div></nav><section style="padding:120px 48px;background:linear-gradient(180deg,#06101e 0%,#0a1a30 100%)"><div style="display:flex;align-items:center;gap:80px"><div style="flex:1"><p style="font-size:11px;color:#60a5fa;font-weight:700;letter-spacing:.1em;text-transform:uppercase;margin:0 0 20px">Trusted by 5,000+ teams</p><h1 style="font-size:54px;font-weight:900;color:#fff;margin:0 0 24px;letter-spacing:-.04em;line-height:1.05">The analytics<br>platform for<br>serious teams.</h1><p style="font-size:16px;color:rgba(255,255,255,.4);line-height:1.7;margin:0 0 40px;max-width:440px">Real-time data, actionable insights, and beautiful dashboards — all in one place.</p><div style="display:flex;gap:12px"><button style="padding:14px 32px;background:#60a5fa;color:#06101e;border:none;border-radius:10px;font-size:14px;font-weight:700;cursor:pointer">Start for free</button><button style="padding:14px 32px;background:rgba(255,255,255,.06);color:rgba(255,255,255,.6);border:1px solid rgba(255,255,255,.1);border-radius:10px;font-size:14px;cursor:pointer">Book demo</button></div></div><div style="flex:1;background:rgba(96,165,250,.06);border:1px solid rgba(96,165,250,.12);border-radius:16px;padding:24px;height:280px;display:flex;align-items:center;justify-content:center;font-size:48px">📊</div></div></section>`,
    status: "premium",
    category: "saas",
    gradient: "linear-gradient(145deg, #0a1028, #061830)",
    pageCount: 7,
  },
  {
    id: "site-coming-soon",
    name: "Coming Soon",
    type: "hero",
    icon: "⏳",
    html: `<section style="min-height:100vh;display:flex;flex-direction:column;align-items:center;justify-content:center;background:linear-gradient(135deg,#0a0a1e 0%,#14082e 100%);text-align:center;padding:40px"><div style="font-size:40px;margin-bottom:24px">⏳</div><h1 style="font-size:52px;font-weight:900;color:#fff;margin:0 0 16px;letter-spacing:-.04em">Something<br>awesome is<br>coming.</h1><p style="font-size:16px;color:rgba(255,255,255,.4);max-width:400px;line-height:1.7;margin:0 auto 48px">We're putting the finishing touches on something you'll love. Be the first to know.</p><div style="display:flex;gap:10px;justify-content:center"><input type="email" placeholder="Enter your email" style="padding:14px 20px;background:rgba(255,255,255,.07);border:1px solid rgba(255,255,255,.12);border-radius:10px;color:#fff;font-size:14px;width:260px;outline:none"><button style="padding:14px 24px;background:#7c6dfa;color:#fff;border:none;border-radius:10px;font-size:14px;font-weight:600;cursor:pointer;white-space:nowrap">Notify me</button></div><div style="display:flex;gap:32px;margin-top:60px;text-align:center"><div><div style="font-size:32px;font-weight:800;color:#a5b4fc;line-height:1" id="days">--</div><div style="font-size:10px;color:rgba(255,255,255,.3);margin-top:4px;letter-spacing:.08em;text-transform:uppercase">Days</div></div><div><div style="font-size:32px;font-weight:800;color:#a5b4fc;line-height:1">--</div><div style="font-size:10px;color:rgba(255,255,255,.3);margin-top:4px;letter-spacing:.08em;text-transform:uppercase">Hours</div></div><div><div style="font-size:32px;font-weight:800;color:#a5b4fc;line-height:1">--</div><div style="font-size:10px;color:rgba(255,255,255,.3);margin-top:4px;letter-spacing:.08em;text-transform:uppercase">Minutes</div></div></div></section>`,
    status: "free",
    category: "landing",
    gradient: "linear-gradient(145deg, #0a0a1e, #14082e)",
    pageCount: 1,
  },
];

/** Get template by ID */
export const getTemplateById = (id: string): TemplateItem | undefined =>
  SITE_TEMPLATES.find((t) => t.id === id);
