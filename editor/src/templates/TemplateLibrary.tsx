/**
 * Aquibra Template Library
 * Pre-built templates for quick start
 * @license BSD-3-Clause
 */

import * as React from "react";
import { useTemplateManager } from "../editor/shell/hooks";
import type { Composer } from "../engine";
import { STORAGE_KEYS } from "../shared/constants/config";
import { InputField } from "../shared/forms";
import { Modal, Spinner, Tabs } from "../shared/ui";
import { MyTemplates } from "./MyTemplates";
import { SectionTemplates, type SectionTemplate } from "./SectionTemplates";
import { TemplatePreview } from "./TemplatePreview";

// Validate thumbnail URLs to prevent XSS via javascript: or data: URIs
const isValidThumbnailUrl = (url: string): boolean => {
  if (!url || url.length <= 4) return false; // Emoji or empty
  try {
    const parsed = new URL(url, window.location.origin);
    return parsed.protocol === "http:" || parsed.protocol === "https:";
  } catch {
    return false;
  }
};

export interface Template {
  id: string;
  name: string;
  category: string;
  thumbnail: string;
  html: string;
  css?: string;
  description?: string;
  tags?: string[];
}

export interface TemplateLibraryProps {
  isOpen: boolean;
  onClose: () => void;
  onSelect: (template: Template) => void;
  templates?: Template[];
  composer?: Composer | null;
}

const defaultTemplates: Template[] = [
  {
    id: "blank",
    name: "Blank Page",
    category: "Basic",
    thumbnail: "",
    html: "",
    description: "Start from scratch",
  },
  {
    id: "landing-1",
    name: "Modern Landing",
    category: "Landing Pages",
    thumbnail: "🚀",
    html: `<div data-aqb-id="t1-nav" data-aqb-type="navbar"><nav style="display:flex;justify-content:space-between;align-items:center;padding:20px 40px;background:#fff;box-shadow:0 2px 10px rgba(0,0,0,0.1)"><div style="font-weight:bold;font-size:24px;color:#667eea">Aquibra</div><div style="display:flex;gap:30px"><a href="#" style="text-decoration:none;color:#333;font-weight:500">Home</a><a href="#" style="text-decoration:none;color:#333;font-weight:500">Features</a><a href="#" style="text-decoration:none;color:#333;font-weight:500">Pricing</a><a href="#" style="text-decoration:none;color:#333;font-weight:500">Contact</a></div><button style="padding:12px 24px;background:linear-gradient(135deg,#667eea,#764ba2);color:#fff;border:none;border-radius:8px;cursor:pointer;font-weight:600">Get Started</button></nav></div>
<div data-aqb-id="t1-hero" data-aqb-type="hero"><section style="padding:100px 40px;text-align:center;background:linear-gradient(135deg,#667eea 0%,#764ba2 100%);color:#fff"><h1 style="font-size:56px;margin:0 0 20px;font-weight:800">Build Beautiful Websites</h1><p style="font-size:20px;margin:0 0 40px;opacity:0.9;max-width:600px;margin-left:auto;margin-right:auto">Create stunning websites visually with our drag-and-drop builder. No coding required.</p><div style="display:flex;gap:16px;justify-content:center"><button style="padding:16px 32px;background:#fff;color:#667eea;border:none;border-radius:8px;font-size:16px;font-weight:600;cursor:pointer">Start Free Trial</button><button style="padding:16px 32px;background:transparent;color:#fff;border:2px solid #fff;border-radius:8px;font-size:16px;font-weight:600;cursor:pointer">Watch Demo</button></div></section></div>
<div data-aqb-id="t1-features" data-aqb-type="features"><section style="padding:80px 40px;background:#f8f9fa"><h2 style="text-align:center;font-size:36px;margin:0 0 60px;color:#333">Why Choose Us</h2><div style="display:flex;gap:30px;max-width:1200px;margin:0 auto"><div style="flex:1;background:#fff;padding:40px;border-radius:16px;text-align:center;box-shadow:0 4px 20px rgba(0,0,0,0.08)"><div style="font-size:48px;margin-bottom:20px">⚡</div><h3 style="margin:0 0 12px;color:#333">Lightning Fast</h3><p style="color:#666;margin:0">Build websites in minutes, not hours</p></div><div style="flex:1;background:#fff;padding:40px;border-radius:16px;text-align:center;box-shadow:0 4px 20px rgba(0,0,0,0.08)"><div style="font-size:48px;margin-bottom:20px">🎨</div><h3 style="margin:0 0 12px;color:#333">Beautiful Design</h3><p style="color:#666;margin:0">Professional templates ready to use</p></div><div style="flex:1;background:#fff;padding:40px;border-radius:16px;text-align:center;box-shadow:0 4px 20px rgba(0,0,0,0.08)"><div style="font-size:48px;margin-bottom:20px">📱</div><h3 style="margin:0 0 12px;color:#333">Fully Responsive</h3><p style="color:#666;margin:0">Looks great on all devices</p></div></div></section></div>`,
    description: "Modern landing page with hero section",
  },
  {
    id: "portfolio-1",
    name: "Portfolio",
    category: "Portfolio",
    thumbnail: "🎨",
    html: `<div data-aqb-id="t2-header" data-aqb-type="section"><header style="padding:40px;text-align:center;background:#1a1a2e;color:#fff"><h1 style="font-size:48px;margin:0 0 10px;font-weight:300">John Doe</h1><p style="font-size:18px;margin:0;opacity:0.8">Creative Designer & Developer</p></header></div>
<div data-aqb-id="t2-about" data-aqb-type="section"><section style="padding:60px 40px;max-width:800px;margin:0 auto;text-align:center"><h2 style="font-size:32px;margin:0 0 20px;color:#333">About Me</h2><p style="font-size:16px;line-height:1.8;color:#666">I'm a passionate designer with 10+ years of experience creating beautiful digital experiences. I specialize in UI/UX design, branding, and web development.</p></section></div>
<div data-aqb-id="t2-work" data-aqb-type="section"><section style="padding:60px 40px;background:#f5f5f5"><h2 style="text-align:center;font-size:32px;margin:0 0 40px;color:#333">My Work</h2><div style="display:grid;grid-template-columns:repeat(3,1fr);gap:20px;max-width:1200px;margin:0 auto"><div style="background:#fff;border-radius:12px;overflow:hidden;box-shadow:0 4px 12px rgba(0,0,0,0.1)"><div style="height:200px;background:linear-gradient(135deg,#667eea,#764ba2)"></div><div style="padding:20px"><h3 style="margin:0 0 8px;color:#333">Project One</h3><p style="margin:0;color:#666;font-size:14px">Web Design</p></div></div><div style="background:#fff;border-radius:12px;overflow:hidden;box-shadow:0 4px 12px rgba(0,0,0,0.1)"><div style="height:200px;background:linear-gradient(135deg,#f093fb,#f5576c)"></div><div style="padding:20px"><h3 style="margin:0 0 8px;color:#333">Project Two</h3><p style="margin:0;color:#666;font-size:14px">Branding</p></div></div><div style="background:#fff;border-radius:12px;overflow:hidden;box-shadow:0 4px 12px rgba(0,0,0,0.1)"><div style="height:200px;background:linear-gradient(135deg,#4facfe,#00f2fe)"></div><div style="padding:20px"><h3 style="margin:0 0 8px;color:#333">Project Three</h3><p style="margin:0;color:#666;font-size:14px">Mobile App</p></div></div></div></section></div>`,
    description: "Creative portfolio template",
  },
  {
    id: "business-1",
    name: "Business Pro",
    category: "Business",
    thumbnail: "💼",
    html: `<div data-aqb-id="t3-nav" data-aqb-type="navbar"><nav style="display:flex;justify-content:space-between;align-items:center;padding:20px 60px;background:#fff"><div style="font-weight:bold;font-size:22px;color:#2d3748">BizPro</div><div style="display:flex;gap:40px"><a href="#" style="text-decoration:none;color:#4a5568">Services</a><a href="#" style="text-decoration:none;color:#4a5568">About</a><a href="#" style="text-decoration:none;color:#4a5568">Team</a><a href="#" style="text-decoration:none;color:#4a5568">Contact</a></div><button style="padding:12px 28px;background:#3182ce;color:#fff;border:none;border-radius:6px;font-weight:600;cursor:pointer">Get Quote</button></nav></div>
<div data-aqb-id="t3-hero" data-aqb-type="hero"><section style="padding:100px 60px;display:flex;align-items:center;gap:60px;max-width:1400px;margin:0 auto"><div style="flex:1"><h1 style="font-size:52px;margin:0 0 24px;color:#1a202c;line-height:1.2">Grow Your Business With Us</h1><p style="font-size:18px;color:#718096;margin:0 0 32px;line-height:1.7">We help businesses scale with innovative solutions and expert consulting services.</p><button style="padding:16px 36px;background:#3182ce;color:#fff;border:none;border-radius:6px;font-size:16px;font-weight:600;cursor:pointer">Schedule a Call</button></div><div style="flex:1;background:linear-gradient(135deg,#667eea,#764ba2);height:400px;border-radius:20px"></div></section></div>
<div data-aqb-id="t3-stats" data-aqb-type="section"><section style="padding:60px;background:#f7fafc"><div style="display:flex;justify-content:center;gap:80px;text-align:center"><div><div style="font-size:48px;font-weight:bold;color:#3182ce">500+</div><div style="color:#718096">Clients</div></div><div><div style="font-size:48px;font-weight:bold;color:#3182ce">98%</div><div style="color:#718096">Satisfaction</div></div><div><div style="font-size:48px;font-weight:bold;color:#3182ce">10+</div><div style="color:#718096">Years</div></div><div><div style="font-size:48px;font-weight:bold;color:#3182ce">50+</div><div style="color:#718096">Awards</div></div></div></section></div>`,
    description: "Professional business template",
  },
  {
    id: "pricing-1",
    name: "Pricing Page",
    category: "Landing Pages",
    thumbnail: "💰",
    html: `<div data-aqb-id="t4-header" data-aqb-type="section"><section style="padding:80px 40px;text-align:center;background:linear-gradient(135deg,#1a1a2e,#16213e)"><h1 style="font-size:48px;margin:0 0 16px;color:#fff">Simple Pricing</h1><p style="font-size:18px;color:#a0aec0;margin:0">Choose the plan that works for you</p></section></div>
<div data-aqb-id="t4-plans" data-aqb-type="section"><section style="padding:80px 40px;background:#f8f9fa"><div style="display:flex;gap:30px;justify-content:center;max-width:1000px;margin:0 auto"><div style="flex:1;background:#fff;padding:40px;border-radius:16px;text-align:center;box-shadow:0 4px 20px rgba(0,0,0,0.08)"><h3 style="margin:0 0 8px;color:#333">Starter</h3><div style="font-size:48px;font-weight:bold;margin:20px 0">$9<span style="font-size:16px;color:#666">/mo</span></div><ul style="list-style:none;padding:0;margin:0 0 30px;text-align:left"><li style="padding:12px 0;border-bottom:1px solid #eee">✓ 5 Projects</li><li style="padding:12px 0;border-bottom:1px solid #eee">✓ Basic Support</li><li style="padding:12px 0">✓ 1GB Storage</li></ul><button style="width:100%;padding:14px;background:#e2e8f0;color:#333;border:none;border-radius:8px;font-weight:600;cursor:pointer">Get Started</button></div><div style="flex:1;background:linear-gradient(135deg,#667eea,#764ba2);padding:40px;border-radius:16px;text-align:center;color:#fff;transform:scale(1.05)"><div style="background:rgba(255,255,255,0.2);display:inline-block;padding:4px 12px;border-radius:20px;font-size:12px;margin-bottom:10px">POPULAR</div><h3 style="margin:0 0 8px">Pro</h3><div style="font-size:48px;font-weight:bold;margin:20px 0">$29<span style="font-size:16px;opacity:0.8">/mo</span></div><ul style="list-style:none;padding:0;margin:0 0 30px;text-align:left"><li style="padding:12px 0;border-bottom:1px solid rgba(255,255,255,0.2)">✓ Unlimited Projects</li><li style="padding:12px 0;border-bottom:1px solid rgba(255,255,255,0.2)">✓ Priority Support</li><li style="padding:12px 0">✓ 100GB Storage</li></ul><button style="width:100%;padding:14px;background:#fff;color:#667eea;border:none;border-radius:8px;font-weight:600;cursor:pointer">Get Started</button></div><div style="flex:1;background:#fff;padding:40px;border-radius:16px;text-align:center;box-shadow:0 4px 20px rgba(0,0,0,0.08)"><h3 style="margin:0 0 8px;color:#333">Enterprise</h3><div style="font-size:48px;font-weight:bold;margin:20px 0">$99<span style="font-size:16px;color:#666">/mo</span></div><ul style="list-style:none;padding:0;margin:0 0 30px;text-align:left"><li style="padding:12px 0;border-bottom:1px solid #eee">✓ Everything in Pro</li><li style="padding:12px 0;border-bottom:1px solid #eee">✓ Dedicated Support</li><li style="padding:12px 0">✓ Unlimited Storage</li></ul><button style="width:100%;padding:14px;background:#e2e8f0;color:#333;border:none;border-radius:8px;font-weight:600;cursor:pointer">Contact Sales</button></div></div></section></div>`,
    description: "Pricing page with 3 plans",
  },
  {
    id: "contact-1",
    name: "Contact Page",
    category: "Basic",
    thumbnail: "📧",
    html: `<div data-aqb-id="t5-header" data-aqb-type="section"><section style="padding:80px 40px;text-align:center;background:#f8f9fa"><h1 style="font-size:48px;margin:0 0 16px;color:#333">Get In Touch</h1><p style="font-size:18px;color:#666;margin:0">We'd love to hear from you</p></section></div>
<div data-aqb-id="t5-form" data-aqb-type="form"><section style="padding:60px 40px;max-width:600px;margin:0 auto"><form style="display:flex;flex-direction:column;gap:20px"><div style="display:flex;gap:20px"><input type="text" placeholder="First Name" style="flex:1;padding:16px;border:1px solid #e2e8f0;border-radius:8px;font-size:16px"/><input type="text" placeholder="Last Name" style="flex:1;padding:16px;border:1px solid #e2e8f0;border-radius:8px;font-size:16px"/></div><input type="email" placeholder="Email Address" style="padding:16px;border:1px solid #e2e8f0;border-radius:8px;font-size:16px"/><input type="text" placeholder="Subject" style="padding:16px;border:1px solid #e2e8f0;border-radius:8px;font-size:16px"/><textarea placeholder="Your Message" rows="6" style="padding:16px;border:1px solid #e2e8f0;border-radius:8px;font-size:16px;resize:vertical"></textarea><button type="submit" style="padding:16px;background:linear-gradient(135deg,#667eea,#764ba2);color:#fff;border:none;border-radius:8px;font-size:16px;font-weight:600;cursor:pointer">Send Message</button></form></section></div>`,
    description: "Contact form page",
  },
  // Section Templates (individual blocks)
  {
    id: "hero-gradient",
    name: "Gradient Hero",
    category: "Sections",
    thumbnail: "🦸",
    html: `<div data-aqb-id="hero-grad" data-aqb-type="hero"><section style="padding:120px 40px;text-align:center;background:linear-gradient(135deg,#667eea 0%,#764ba2 50%,#f093fb 100%);color:#fff"><h1 style="font-size:64px;margin:0 0 24px;font-weight:800;text-shadow:0 4px 20px rgba(0,0,0,0.2)">Your Amazing Headline Here</h1><p style="font-size:22px;margin:0 0 40px;opacity:0.95;max-width:700px;margin-left:auto;margin-right:auto;line-height:1.6">Write a compelling description that captures your audience's attention and drives them to action.</p><div style="display:flex;gap:16px;justify-content:center"><button style="padding:18px 40px;background:#fff;color:#667eea;border:none;border-radius:50px;font-size:16px;font-weight:700;cursor:pointer;box-shadow:0 8px 30px rgba(0,0,0,0.15)">Get Started Free</button><button style="padding:18px 40px;background:transparent;color:#fff;border:2px solid rgba(255,255,255,0.8);border-radius:50px;font-size:16px;font-weight:600;cursor:pointer">Learn More</button></div></section></div>`,
    description: "Bold gradient hero section",
  },
  {
    id: "hero-split",
    name: "Split Hero",
    category: "Sections",
    thumbnail: "↔️",
    html: `<div data-aqb-id="hero-split" data-aqb-type="hero"><section style="display:flex;min-height:600px"><div style="flex:1;padding:80px 60px;display:flex;flex-direction:column;justify-content:center;background:#fff"><span style="color:#667eea;font-weight:600;font-size:14px;text-transform:uppercase;letter-spacing:2px">Welcome to our site</span><h1 style="font-size:52px;margin:16px 0 24px;color:#1a1a2e;line-height:1.2;font-weight:800">Build Something Amazing Today</h1><p style="font-size:18px;color:#64748b;line-height:1.8;margin:0 0 32px">Transform your ideas into reality with our powerful platform. Start building without limits.</p><button style="padding:16px 36px;background:#667eea;color:#fff;border:none;border-radius:8px;font-size:16px;font-weight:600;cursor:pointer;width:fit-content">Start Building</button></div><div style="flex:1;background:linear-gradient(135deg,#667eea 0%,#764ba2 100%);display:flex;align-items:center;justify-content:center"><div style="color:#fff;font-size:120px;opacity:0.3">🚀</div></div></section></div>`,
    description: "Two-column hero layout",
  },
  {
    id: "features-grid",
    name: "Features Grid",
    category: "Sections",
    thumbnail: "⊞",
    html: `<div data-aqb-id="feat-grid" data-aqb-type="section"><section style="padding:100px 40px;background:#fff"><h2 style="text-align:center;font-size:42px;margin:0 0 16px;color:#1a1a2e;font-weight:800">Powerful Features</h2><p style="text-align:center;color:#64748b;font-size:18px;margin:0 0 60px;max-width:600px;margin-left:auto;margin-right:auto">Everything you need to succeed</p><div style="display:grid;grid-template-columns:repeat(3,1fr);gap:32px;max-width:1200px;margin:0 auto"><div style="padding:40px;border:1px solid #e2e8f0;border-radius:16px;transition:all 0.3s"><div style="width:60px;height:60px;background:linear-gradient(135deg,#667eea,#764ba2);border-radius:12px;display:flex;align-items:center;justify-content:center;font-size:28px;margin-bottom:24px">⚡</div><h3 style="margin:0 0 12px;color:#1a1a2e;font-size:20px;font-weight:700">Lightning Fast</h3><p style="margin:0;color:#64748b;line-height:1.7">Experience blazing fast performance that keeps your users engaged.</p></div><div style="padding:40px;border:1px solid #e2e8f0;border-radius:16px"><div style="width:60px;height:60px;background:linear-gradient(135deg,#f093fb,#f5576c);border-radius:12px;display:flex;align-items:center;justify-content:center;font-size:28px;margin-bottom:24px">🔒</div><h3 style="margin:0 0 12px;color:#1a1a2e;font-size:20px;font-weight:700">Secure by Default</h3><p style="margin:0;color:#64748b;line-height:1.7">Enterprise-grade security to protect your data and your users.</p></div><div style="padding:40px;border:1px solid #e2e8f0;border-radius:16px"><div style="width:60px;height:60px;background:linear-gradient(135deg,#4facfe,#00f2fe);border-radius:12px;display:flex;align-items:center;justify-content:center;font-size:28px;margin-bottom:24px">📱</div><h3 style="margin:0 0 12px;color:#1a1a2e;font-size:20px;font-weight:700">Fully Responsive</h3><p style="margin:0;color:#64748b;line-height:1.7">Beautiful on every device, from mobile to desktop.</p></div><div style="padding:40px;border:1px solid #e2e8f0;border-radius:16px"><div style="width:60px;height:60px;background:linear-gradient(135deg,#a8edea,#fed6e3);border-radius:12px;display:flex;align-items:center;justify-content:center;font-size:28px;margin-bottom:24px">🎨</div><h3 style="margin:0 0 12px;color:#1a1a2e;font-size:20px;font-weight:700">Customizable</h3><p style="margin:0;color:#64748b;line-height:1.7">Make it yours with endless customization options.</p></div><div style="padding:40px;border:1px solid #e2e8f0;border-radius:16px"><div style="width:60px;height:60px;background:linear-gradient(135deg,#ff9a9e,#fecfef);border-radius:12px;display:flex;align-items:center;justify-content:center;font-size:28px;margin-bottom:24px">🤝</div><h3 style="margin:0 0 12px;color:#1a1a2e;font-size:20px;font-weight:700">Great Support</h3><p style="margin:0;color:#64748b;line-height:1.7">Our team is here to help you succeed, 24/7.</p></div><div style="padding:40px;border:1px solid #e2e8f0;border-radius:16px"><div style="width:60px;height:60px;background:linear-gradient(135deg,#a1c4fd,#c2e9fb);border-radius:12px;display:flex;align-items:center;justify-content:center;font-size:28px;margin-bottom:24px">📈</div><h3 style="margin:0 0 12px;color:#1a1a2e;font-size:20px;font-weight:700">Analytics</h3><p style="margin:0;color:#64748b;line-height:1.7">Deep insights to understand and grow your audience.</p></div></div></section></div>`,
    description: "6-item features grid",
  },
  {
    id: "testimonials",
    name: "Testimonials",
    category: "Sections",
    thumbnail: "💬",
    html: `<div data-aqb-id="testimonials" data-aqb-type="section"><section style="padding:100px 40px;background:#f8fafc"><h2 style="text-align:center;font-size:42px;margin:0 0 16px;color:#1a1a2e;font-weight:800">What Our Customers Say</h2><p style="text-align:center;color:#64748b;font-size:18px;margin:0 0 60px">Don't just take our word for it</p><div style="display:flex;gap:32px;max-width:1200px;margin:0 auto"><div style="flex:1;background:#fff;padding:40px;border-radius:16px;box-shadow:0 4px 20px rgba(0,0,0,0.06)"><div style="font-size:48px;color:#667eea;margin-bottom:16px">"</div><p style="color:#475569;line-height:1.8;margin:0 0 24px;font-size:16px">This product has completely transformed how we work. The efficiency gains are incredible and our team loves using it every day.</p><div style="display:flex;align-items:center;gap:16px"><div style="width:48px;height:48px;border-radius:50%;background:linear-gradient(135deg,#667eea,#764ba2)"></div><div><div style="font-weight:600;color:#1a1a2e">Sarah Johnson</div><div style="font-size:14px;color:#64748b">CEO, TechCorp</div></div></div></div><div style="flex:1;background:#fff;padding:40px;border-radius:16px;box-shadow:0 4px 20px rgba(0,0,0,0.06)"><div style="font-size:48px;color:#667eea;margin-bottom:16px">"</div><p style="color:#475569;line-height:1.8;margin:0 0 24px;font-size:16px">I've tried many similar tools, but nothing comes close. The attention to detail and user experience is unmatched in the industry.</p><div style="display:flex;align-items:center;gap:16px"><div style="width:48px;height:48px;border-radius:50%;background:linear-gradient(135deg,#f093fb,#f5576c)"></div><div><div style="font-weight:600;color:#1a1a2e">Mike Chen</div><div style="font-size:14px;color:#64748b">Designer, Creative Co</div></div></div></div><div style="flex:1;background:#fff;padding:40px;border-radius:16px;box-shadow:0 4px 20px rgba(0,0,0,0.06)"><div style="font-size:48px;color:#667eea;margin-bottom:16px">"</div><p style="color:#475569;line-height:1.8;margin:0 0 24px;font-size:16px">Outstanding support and a product that actually delivers on its promises. We've seen a 3x increase in productivity since switching.</p><div style="display:flex;align-items:center;gap:16px"><div style="width:48px;height:48px;border-radius:50%;background:linear-gradient(135deg,#4facfe,#00f2fe)"></div><div><div style="font-weight:600;color:#1a1a2e">Emily Davis</div><div style="font-size:14px;color:#64748b">Manager, StartupX</div></div></div></div></div></section></div>`,
    description: "Customer testimonials section",
  },
  {
    id: "cta-section",
    name: "Call to Action",
    category: "Sections",
    thumbnail: "📢",
    html: `<div data-aqb-id="cta-section" data-aqb-type="section"><section style="padding:100px 40px;background:linear-gradient(135deg,#667eea 0%,#764ba2 100%);text-align:center"><h2 style="font-size:48px;margin:0 0 20px;color:#fff;font-weight:800">Ready to Get Started?</h2><p style="font-size:20px;color:rgba(255,255,255,0.9);margin:0 0 40px;max-width:600px;margin-left:auto;margin-right:auto;line-height:1.6">Join thousands of satisfied customers and take your business to the next level today.</p><div style="display:flex;gap:16px;justify-content:center"><button style="padding:18px 48px;background:#fff;color:#667eea;border:none;border-radius:50px;font-size:18px;font-weight:700;cursor:pointer;box-shadow:0 8px 30px rgba(0,0,0,0.2)">Start Free Trial</button><button style="padding:18px 48px;background:transparent;color:#fff;border:2px solid #fff;border-radius:50px;font-size:18px;font-weight:600;cursor:pointer">Contact Sales</button></div></section></div>`,
    description: "Bold CTA section with buttons",
  },
  {
    id: "footer-modern",
    name: "Modern Footer",
    category: "Sections",
    thumbnail: "🦶",
    html: `<div data-aqb-id="footer-modern" data-aqb-type="footer"><footer style="padding:80px 40px 40px;background:#1a1a2e;color:#fff"><div style="display:flex;gap:60px;max-width:1200px;margin:0 auto 60px"><div style="flex:2"><div style="font-size:28px;font-weight:bold;margin-bottom:20px;background:linear-gradient(135deg,#667eea,#764ba2);-webkit-background-clip:text;-webkit-text-fill-color:transparent">YourBrand</div><p style="color:#94a3b8;line-height:1.8;max-width:300px">Building the future of web development, one pixel at a time.</p></div><div style="flex:1"><h4 style="margin:0 0 20px;font-weight:600">Product</h4><div style="display:flex;flex-direction:column;gap:12px"><a href="#" style="color:#94a3b8;text-decoration:none">Features</a><a href="#" style="color:#94a3b8;text-decoration:none">Pricing</a><a href="#" style="color:#94a3b8;text-decoration:none">Documentation</a><a href="#" style="color:#94a3b8;text-decoration:none">Changelog</a></div></div><div style="flex:1"><h4 style="margin:0 0 20px;font-weight:600">Company</h4><div style="display:flex;flex-direction:column;gap:12px"><a href="#" style="color:#94a3b8;text-decoration:none">About</a><a href="#" style="color:#94a3b8;text-decoration:none">Blog</a><a href="#" style="color:#94a3b8;text-decoration:none">Careers</a><a href="#" style="color:#94a3b8;text-decoration:none">Contact</a></div></div><div style="flex:1"><h4 style="margin:0 0 20px;font-weight:600">Legal</h4><div style="display:flex;flex-direction:column;gap:12px"><a href="#" style="color:#94a3b8;text-decoration:none">Privacy</a><a href="#" style="color:#94a3b8;text-decoration:none">Terms</a><a href="#" style="color:#94a3b8;text-decoration:none">Cookies</a></div></div></div><div style="border-top:1px solid #334155;padding-top:40px;text-align:center;color:#64748b;font-size:14px">© 2024 YourBrand. All rights reserved.</div></footer></div>`,
    description: "Professional footer with links",
  },
  {
    id: "newsletter",
    name: "Newsletter Signup",
    category: "Sections",
    thumbnail: "📬",
    html: `<div data-aqb-id="newsletter" data-aqb-type="section"><section style="padding:80px 40px;background:#f8fafc"><div style="max-width:600px;margin:0 auto;text-align:center"><div style="font-size:48px;margin-bottom:20px">📬</div><h2 style="font-size:36px;margin:0 0 16px;color:#1a1a2e;font-weight:800">Stay in the Loop</h2><p style="color:#64748b;font-size:18px;margin:0 0 32px;line-height:1.6">Get the latest news, updates, and tips delivered straight to your inbox.</p><form style="display:flex;gap:12px;max-width:500px;margin:0 auto"><input type="email" placeholder="Enter your email" style="flex:1;padding:16px 24px;border:2px solid #e2e8f0;border-radius:50px;font-size:16px;outline:none"/><button type="submit" style="padding:16px 32px;background:linear-gradient(135deg,#667eea,#764ba2);color:#fff;border:none;border-radius:50px;font-size:16px;font-weight:600;cursor:pointer;white-space:nowrap">Subscribe</button></form><p style="color:#94a3b8;font-size:14px;margin-top:16px">No spam, unsubscribe anytime.</p></div></section></div>`,
    description: "Email newsletter signup form",
  },
  {
    id: "team-section",
    name: "Team Members",
    category: "Sections",
    thumbnail: "👥",
    html: `<div data-aqb-id="team-section" data-aqb-type="section"><section style="padding:100px 40px;background:#fff"><h2 style="text-align:center;font-size:42px;margin:0 0 16px;color:#1a1a2e;font-weight:800">Meet Our Team</h2><p style="text-align:center;color:#64748b;font-size:18px;margin:0 0 60px">The people behind the magic</p><div style="display:flex;gap:32px;justify-content:center;max-width:1000px;margin:0 auto"><div style="text-align:center"><div style="width:180px;height:180px;border-radius:50%;background:linear-gradient(135deg,#667eea,#764ba2);margin:0 auto 20px;display:flex;align-items:center;justify-content:center;font-size:64px">👩</div><h3 style="margin:0 0 8px;color:#1a1a2e;font-size:20px;font-weight:700">Jane Smith</h3><p style="color:#667eea;margin:0 0 12px;font-weight:500">CEO & Founder</p><p style="color:#64748b;font-size:14px;line-height:1.6;margin:0">Visionary leader with 15+ years of experience.</p></div><div style="text-align:center"><div style="width:180px;height:180px;border-radius:50%;background:linear-gradient(135deg,#f093fb,#f5576c);margin:0 auto 20px;display:flex;align-items:center;justify-content:center;font-size:64px">👨</div><h3 style="margin:0 0 8px;color:#1a1a2e;font-size:20px;font-weight:700">John Doe</h3><p style="color:#667eea;margin:0 0 12px;font-weight:500">CTO</p><p style="color:#64748b;font-size:14px;line-height:1.6;margin:0">Tech wizard who makes the impossible possible.</p></div><div style="text-align:center"><div style="width:180px;height:180px;border-radius:50%;background:linear-gradient(135deg,#4facfe,#00f2fe);margin:0 auto 20px;display:flex;align-items:center;justify-content:center;font-size:64px">👩</div><h3 style="margin:0 0 8px;color:#1a1a2e;font-size:20px;font-weight:700">Emily Chen</h3><p style="color:#667eea;margin:0 0 12px;font-weight:500">Head of Design</p><p style="color:#64748b;font-size:14px;line-height:1.6;margin:0">Creating beautiful experiences since day one.</p></div></div></section></div>`,
    description: "Team member showcase",
  },
  {
    id: "faq-section",
    name: "FAQ Section",
    category: "Sections",
    thumbnail: "❓",
    html: `<div data-aqb-id="faq-section" data-aqb-type="section"><section style="padding:100px 40px;background:#f8fafc"><h2 style="text-align:center;font-size:42px;margin:0 0 16px;color:#1a1a2e;font-weight:800">Frequently Asked Questions</h2><p style="text-align:center;color:#64748b;font-size:18px;margin:0 0 60px">Everything you need to know</p><div style="max-width:800px;margin:0 auto;display:flex;flex-direction:column;gap:16px"><div style="background:#fff;padding:24px 32px;border-radius:12px;box-shadow:0 2px 10px rgba(0,0,0,0.05)"><h3 style="margin:0 0 12px;color:#1a1a2e;font-size:18px;font-weight:600">How do I get started?</h3><p style="margin:0;color:#64748b;line-height:1.7">Simply sign up for a free account and you can start building right away. No credit card required.</p></div><div style="background:#fff;padding:24px 32px;border-radius:12px;box-shadow:0 2px 10px rgba(0,0,0,0.05)"><h3 style="margin:0 0 12px;color:#1a1a2e;font-size:18px;font-weight:600">Is there a free plan available?</h3><p style="margin:0;color:#64748b;line-height:1.7">Yes! We offer a generous free plan that includes all the essential features to get you started.</p></div><div style="background:#fff;padding:24px 32px;border-radius:12px;box-shadow:0 2px 10px rgba(0,0,0,0.05)"><h3 style="margin:0 0 12px;color:#1a1a2e;font-size:18px;font-weight:600">Can I cancel my subscription anytime?</h3><p style="margin:0;color:#64748b;line-height:1.7">Absolutely. You can cancel your subscription at any time with no questions asked.</p></div><div style="background:#fff;padding:24px 32px;border-radius:12px;box-shadow:0 2px 10px rgba(0,0,0,0.05)"><h3 style="margin:0 0 12px;color:#1a1a2e;font-size:18px;font-weight:600">Do you offer customer support?</h3><p style="margin:0;color:#64748b;line-height:1.7">We provide 24/7 customer support via email and chat. Our team is always here to help.</p></div></div></section></div>`,
    description: "FAQ accordion section",
  },
];

export const TemplateLibrary: React.FC<TemplateLibraryProps> = ({
  isOpen,
  onClose,
  onSelect,
  templates = defaultTemplates,
  composer = null,
}) => {
  const { templates: composerTemplates, deleteTemplate } = useTemplateManager(composer);
  const [searchQuery, setSearchQuery] = React.useState("");
  const [activeCategory, setActiveCategory] = React.useState("all");
  const [loading, setLoading] = React.useState(false);
  const [activeTab, setActiveTab] = React.useState("library");
  const [localTemplates, setLocalTemplates] = React.useState<Template[]>([]);
  const [previewTemplate, setPreviewTemplate] = React.useState<Template | null>(null);

  // Use local templates (composerTemplates have different format - ProjectData vs html/css)
  // The hook is wired for future use when template formats are unified
  const myTemplates = localTemplates;

  // Load local templates from localStorage (fallback for when no composer)
  React.useEffect(() => {
    if (isOpen && !composer) {
      try {
        const saved = localStorage.getItem(STORAGE_KEYS.MY_TEMPLATES);
        if (saved) {
          setLocalTemplates(JSON.parse(saved));
        }
      } catch {
        // Ignore parse errors
      }
    }
  }, [isOpen, composer]);

  // Save local templates to localStorage
  const saveLocalTemplates = (templates: Template[]) => {
    setLocalTemplates(templates);
    try {
      localStorage.setItem(STORAGE_KEYS.MY_TEMPLATES, JSON.stringify(templates));
    } catch {
      // Ignore storage errors
    }
  };

  const handleDeleteMyTemplate = (id: string) => {
    // Try to delete from composer first
    if (composer && composerTemplates.some((t) => t.id === id)) {
      deleteTemplate(id);
    } else {
      // Fall back to local storage
      saveLocalTemplates(localTemplates.filter((t) => t.id !== id));
    }
  };

  const handleRenameMyTemplate = (id: string, newName: string) => {
    // For now, only support renaming local templates
    saveLocalTemplates(localTemplates.map((t) => (t.id === id ? { ...t, name: newName } : t)));
  };

  const handleInsertSection = (section: SectionTemplate) => {
    // Convert SectionTemplate to Template format
    const template: Template = {
      id: section.id,
      name: section.name,
      category: section.type,
      thumbnail: section.icon,
      html: section.html,
      description: section.description,
    };
    onSelect(template);
    onClose();
  };

  const categories = ["all", ...new Set(templates.map((t) => t.category))];

  const filteredTemplates = templates.filter((t) => {
    const matchesSearch =
      t.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      t.description?.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesCategory = activeCategory === "all" || t.category === activeCategory;
    return matchesSearch && matchesCategory;
  });

  const handleSelect = (template: Template) => {
    setLoading(true);
    setTimeout(() => {
      onSelect(template);
      setLoading(false);
      onClose();
    }, 500);
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Template Library" size="lg">
      {/* Tabs */}
      <Tabs
        tabs={[
          { id: "library", label: "📚 Library" },
          { id: "sections", label: "🧱 Sections" },
          { id: "my", label: "📁 My Templates" },
        ]}
        activeTab={activeTab}
        onChange={setActiveTab}
      />

      {/* Tab Content */}
      {activeTab === "library" && (
        <>
          {/* Search */}
          <div style={{ marginTop: 16 }}>
            <InputField
              placeholder="Search templates..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              leftIcon={<span>🔍</span>}
              aria-label="Search templates"
            />
          </div>

          {/* Categories */}
          <div style={{ display: "flex", gap: 8, marginTop: 16, flexWrap: "wrap" }}>
            {categories.map((cat) => (
              <button
                key={cat}
                onClick={() => setActiveCategory(cat)}
                aria-pressed={activeCategory === cat}
                aria-label={`Filter ${cat} templates`}
                style={{
                  padding: "6px 14px",
                  background:
                    activeCategory === cat ? "var(--aqb-primary)" : "var(--aqb-bg-panel-secondary)",
                  border: "none",
                  borderRadius: 20,
                  color: activeCategory === cat ? "#fff" : "var(--aqb-text-secondary)",
                  fontSize: 12,
                  cursor: "pointer",
                  textTransform: "capitalize",
                }}
              >
                {cat}
              </button>
            ))}
          </div>
        </>
      )}

      {activeTab === "library" && (
        <>
          {/* Templates Grid */}
          {loading ? (
            <div style={{ textAlign: "center", padding: 60 }}>
              <Spinner size="lg" />
              <p style={{ marginTop: 16, color: "var(--aqb-text-muted)" }}>Loading template...</p>
            </div>
          ) : filteredTemplates.length === 0 ? (
            <div style={{ textAlign: "center", padding: 60, color: "#6c7086" }}>
              <div style={{ fontSize: 32, marginBottom: 8 }}>📭</div>
              <div>No templates match your search</div>
            </div>
          ) : (
            <div
              role="list"
              aria-label="Template results"
              style={{
                display: "grid",
                gridTemplateColumns: "repeat(auto-fill, minmax(200px, 1fr))",
                gap: 16,
                marginTop: 20,
                maxHeight: 400,
                overflow: "auto",
              }}
            >
              {filteredTemplates.map((template) => (
                <div
                  role="button"
                  tabIndex={0}
                  aria-label={`Use template ${template.name}`}
                  key={template.id}
                  onClick={() => handleSelect(template)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter" || e.key === " ") {
                      e.preventDefault();
                      handleSelect(template);
                    }
                  }}
                  style={{
                    borderRadius: 12,
                    overflow: "hidden",
                    border: "1px solid var(--aqb-border)",
                    cursor: loading ? "wait" : "pointer",
                    transition: "all 0.2s ease",
                    opacity: loading ? 0.6 : 1,
                    outline: "none",
                  }}
                >
                  <div
                    style={{
                      height: 140,
                      background: isValidThumbnailUrl(template.thumbnail)
                        ? `url(${encodeURI(template.thumbnail)}) center/cover`
                        : "var(--aqb-bg-panel-secondary)",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                    }}
                  >
                    {!isValidThumbnailUrl(template.thumbnail) && (
                      <span style={{ fontSize: 40 }}>{template.thumbnail || "📄"}</span>
                    )}
                  </div>
                  <div style={{ padding: 12 }}>
                    <div style={{ fontWeight: 600, fontSize: 14, marginBottom: 4 }}>
                      {template.name}
                    </div>
                    <div style={{ fontSize: 12, color: "var(--aqb-text-muted)" }}>
                      {template.description}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </>
      )}

      {/* Sections Tab */}
      {activeTab === "sections" && (
        <div style={{ marginTop: 16 }}>
          <SectionTemplates onInsert={handleInsertSection} />
        </div>
      )}

      {/* My Templates Tab */}
      {activeTab === "my" && (
        <div style={{ marginTop: 16 }}>
          <MyTemplates
            templates={myTemplates}
            onSelect={handleSelect}
            onDelete={handleDeleteMyTemplate}
            onRename={handleRenameMyTemplate}
            onPreview={setPreviewTemplate}
          />
        </div>
      )}

      {/* Template Preview Modal */}
      {previewTemplate && (
        <TemplatePreview
          template={previewTemplate}
          isOpen={!!previewTemplate}
          onClose={() => setPreviewTemplate(null)}
          onUse={(template) => {
            handleSelect(template);
            setPreviewTemplate(null);
          }}
        />
      )}
    </Modal>
  );
};

export default TemplateLibrary;
