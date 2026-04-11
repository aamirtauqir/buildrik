/**
 * Sections Mode catalog — 9 families × 6 cards = 54 total
 * Each card has production-ready HTML content that inserts into the page root
 * via composer.elements.insertHTMLToElement (see useSectionInsert).
 * @license BSD-3-Clause
 */

export interface SectionFamily {
  id: string;
  label: string;
}

export interface SectionCard {
  id: string;
  familyId: string;
  name: string;
  sub: string;
  /** Production HTML inserted into the current page root on click/drop */
  html: string;
}

export const SECTION_FAMILIES: SectionFamily[] = [
  { id: "hero", label: "Hero" },
  { id: "about", label: "About" },
  { id: "features", label: "Features" },
  { id: "testimonials", label: "Testimonials" },
  { id: "pricing", label: "Pricing" },
  { id: "faq", label: "FAQ" },
  { id: "cta", label: "CTA" },
  { id: "contact", label: "Contact" },
  { id: "footers", label: "Footers" },
];

// ─── Shared style tokens (inline — Buildrik inspector can replace with variables later) ──
const BG_WHITE = "#ffffff";
const BG_LIGHT = "#f8fafc";
const BG_DARK = "#0f172a";
const TEXT_PRIMARY = "#0f172a";
const TEXT_MUTED = "#64748b";
const ACCENT = "#1d4ed8";
const BORDER = "#e2e8f0";

const PAD = "80px 24px";
const INNER = "max-width:1200px;margin:0 auto;";

// ─── HERO ───────────────────────────────────────────────────────────────────

const heroSplit = `
<section data-aqb-section="hero-split" style="padding:${PAD};background:${BG_WHITE};">
  <div style="${INNER}display:grid;grid-template-columns:1fr 1fr;gap:48px;align-items:center;">
    <div>
      <h1 style="font-size:48px;font-weight:700;color:${TEXT_PRIMARY};line-height:1.1;margin:0 0 20px;">Build faster. Ship smarter.</h1>
      <p style="font-size:18px;color:${TEXT_MUTED};line-height:1.6;margin:0 0 32px;">A clear value proposition that tells visitors exactly what you do and why it matters to them.</p>
      <div style="display:flex;gap:12px;">
        <a href="#" style="display:inline-block;padding:14px 28px;background:${ACCENT};color:#fff;font-weight:600;border-radius:8px;text-decoration:none;">Get started</a>
        <a href="#" style="display:inline-block;padding:14px 28px;background:transparent;color:${TEXT_PRIMARY};font-weight:600;border:1px solid ${BORDER};border-radius:8px;text-decoration:none;">Learn more</a>
      </div>
    </div>
    <div style="aspect-ratio:4/3;background:${BG_LIGHT};border-radius:12px;"></div>
  </div>
</section>`;

const heroCentered = `
<section data-aqb-section="hero-centered" style="padding:${PAD};background:${BG_WHITE};text-align:center;">
  <div style="${INNER}max-width:720px;">
    <h1 style="font-size:56px;font-weight:700;color:${TEXT_PRIMARY};line-height:1.1;margin:0 0 20px;">The headline that wins hearts</h1>
    <p style="font-size:20px;color:${TEXT_MUTED};line-height:1.6;margin:0 0 32px;">One sentence that expands on the headline and makes the value undeniable to your target user.</p>
    <div style="display:flex;gap:12px;justify-content:center;">
      <a href="#" style="display:inline-block;padding:16px 32px;background:${ACCENT};color:#fff;font-weight:600;border-radius:8px;text-decoration:none;">Start free</a>
      <a href="#" style="display:inline-block;padding:16px 32px;background:transparent;color:${TEXT_PRIMARY};font-weight:600;border:1px solid ${BORDER};border-radius:8px;text-decoration:none;">See demo</a>
    </div>
  </div>
</section>`;

const heroMedia = `
<section data-aqb-section="hero-media" style="padding:120px 24px;background:${BG_DARK};position:relative;text-align:center;min-height:500px;display:flex;align-items:center;justify-content:center;">
  <div style="position:relative;z-index:1;${INNER}max-width:800px;">
    <h1 style="font-size:56px;font-weight:700;color:#fff;line-height:1.1;margin:0 0 20px;">Visual impact that stops scroll</h1>
    <p style="font-size:20px;color:rgba(255,255,255,0.85);line-height:1.6;margin:0 0 32px;">Full-bleed media hero with overlay copy — ideal for brand, product launch, or editorial.</p>
    <a href="#" style="display:inline-block;padding:16px 32px;background:#fff;color:${TEXT_PRIMARY};font-weight:600;border-radius:8px;text-decoration:none;">Watch the film</a>
  </div>
</section>`;

const heroMinimal = `
<section data-aqb-section="hero-minimal" style="padding:140px 24px 100px;background:${BG_WHITE};">
  <div style="${INNER}max-width:760px;">
    <p style="font-size:14px;font-weight:600;color:${ACCENT};letter-spacing:0.08em;text-transform:uppercase;margin:0 0 16px;">Introducing v2</p>
    <h1 style="font-size:64px;font-weight:700;color:${TEXT_PRIMARY};line-height:1.05;letter-spacing:-0.02em;margin:0 0 24px;">Typography is the product.</h1>
    <p style="font-size:18px;color:${TEXT_MUTED};line-height:1.6;margin:0;">Text-only hero with tight vertical rhythm. Replace with your headline.</p>
  </div>
</section>`;

const heroGradient = `
<section data-aqb-section="hero-gradient" style="padding:140px 24px;background:linear-gradient(135deg,${ACCENT} 0%,#7c3aed 100%);text-align:center;">
  <div style="${INNER}max-width:760px;">
    <h1 style="font-size:60px;font-weight:700;color:#fff;line-height:1.1;margin:0 0 20px;letter-spacing:-0.01em;">Build something people love</h1>
    <p style="font-size:20px;color:rgba(255,255,255,0.9);line-height:1.6;margin:0 0 32px;">A full-bleed gradient hero that commands attention without a single image.</p>
    <div style="display:flex;gap:12px;justify-content:center;">
      <a href="#" style="display:inline-block;padding:16px 32px;background:#fff;color:${ACCENT};font-weight:600;border-radius:8px;text-decoration:none;">Start free</a>
      <a href="#" style="display:inline-block;padding:16px 32px;background:transparent;color:#fff;font-weight:600;border:1px solid rgba(255,255,255,0.4);border-radius:8px;text-decoration:none;">Book a demo</a>
    </div>
  </div>
</section>`;

const heroVideoBg = `
<section data-aqb-section="hero-video-bg" style="padding:0;background:${BG_DARK};position:relative;min-height:560px;display:flex;align-items:center;justify-content:center;overflow:hidden;">
  <div style="position:absolute;inset:0;background:linear-gradient(180deg,rgba(15,23,42,0.3) 0%,rgba(15,23,42,0.85) 100%);display:flex;align-items:center;justify-content:center;">
    <div style="width:80px;height:80px;border-radius:50%;background:rgba(255,255,255,0.15);border:2px solid rgba(255,255,255,0.6);display:flex;align-items:center;justify-content:center;color:#fff;font-size:28px;">▶</div>
  </div>
  <div style="position:relative;z-index:1;${INNER}max-width:800px;text-align:center;padding:80px 24px;">
    <p style="font-size:13px;font-weight:600;color:rgba(255,255,255,0.7);letter-spacing:0.12em;text-transform:uppercase;margin:0 0 16px;">Watch the story</p>
    <h1 style="font-size:56px;font-weight:700;color:#fff;line-height:1.1;margin:0 0 20px;">The future, in motion</h1>
    <p style="font-size:18px;color:rgba(255,255,255,0.85);line-height:1.6;margin:0 0 32px;">Video-backed hero placeholder. Drop in any video element behind the overlay.</p>
    <a href="#" style="display:inline-block;padding:16px 32px;background:#fff;color:${TEXT_PRIMARY};font-weight:600;border-radius:8px;text-decoration:none;">Get started</a>
  </div>
</section>`;

// ─── ABOUT ──────────────────────────────────────────────────────────────────

const aboutIntro = `
<section data-aqb-section="about-intro" style="padding:${PAD};background:${BG_WHITE};">
  <div style="${INNER}max-width:720px;">
    <p style="font-size:14px;font-weight:600;color:${ACCENT};letter-spacing:0.08em;text-transform:uppercase;margin:0 0 16px;">About us</p>
    <h2 style="font-size:40px;font-weight:700;color:${TEXT_PRIMARY};line-height:1.15;margin:0 0 24px;">We started with a simple question</h2>
    <p style="font-size:17px;color:${TEXT_PRIMARY};line-height:1.7;margin:0 0 16px;">Why does shipping a beautiful website still feel so hard? Every tool promised speed, but none delivered. In 2021, a small team of engineers and designers decided to rebuild the web builder from scratch — around one idea: the canvas should be the source of truth.</p>
    <p style="font-size:17px;color:${TEXT_MUTED};line-height:1.7;margin:0 0 16px;">Five years later, we power sites for thousands of teams who want the craft of hand-code without writing a single line of HTML. Our work is guided by a single belief: great tools disappear into the work.</p>
    <p style="font-size:17px;color:${TEXT_MUTED};line-height:1.7;margin:0 0 32px;">This is just the beginning. Thanks for being part of the story.</p>
    <div style="display:flex;gap:16px;align-items:center;">
      <div style="width:64px;height:64px;border-radius:50%;background:${BG_LIGHT};border:1px solid ${BORDER};"></div>
      <div>
        <strong style="color:${TEXT_PRIMARY};display:block;">Alex Rivera</strong>
        <span style="color:${TEXT_MUTED};font-size:14px;">Founder & CEO</span>
      </div>
    </div>
  </div>
</section>`;

const aboutMission = `
<section data-aqb-section="about-mission" style="padding:${PAD};background:${BG_LIGHT};text-align:center;">
  <div style="${INNER}max-width:680px;">
    <p style="font-size:14px;font-weight:600;color:${ACCENT};letter-spacing:0.08em;text-transform:uppercase;margin:0 0 24px;">Our mission</p>
    <h2 style="font-size:48px;font-weight:600;color:${TEXT_PRIMARY};line-height:1.2;letter-spacing:-0.01em;margin:0 0 24px;">To make building on the web feel effortless for everyone who has something to say.</h2>
    <p style="font-size:18px;color:${TEXT_MUTED};line-height:1.6;margin:0;">We believe the next billion creators deserve tools as thoughtful as the sites they dream of building.</p>
  </div>
</section>`;

const aboutTeamGrid = `
<section data-aqb-section="about-team-grid" style="padding:${PAD};background:${BG_WHITE};">
  <div style="${INNER}">
    <div style="text-align:center;margin-bottom:48px;">
      <h2 style="font-size:36px;font-weight:700;color:${TEXT_PRIMARY};margin:0 0 12px;">Our team</h2>
      <p style="font-size:18px;color:${TEXT_MUTED};margin:0;">The people behind the product.</p>
    </div>
    <div style="display:grid;grid-template-columns:repeat(3,1fr);gap:40px 32px;">
      <div style="text-align:center;"><div style="width:120px;height:120px;border-radius:50%;background:${BG_LIGHT};border:1px solid ${BORDER};margin:0 auto 16px;"></div><div style="font-size:16px;font-weight:600;color:${TEXT_PRIMARY};">Alex Rivera</div><div style="font-size:14px;color:${TEXT_MUTED};margin-top:4px;">Founder & CEO</div></div>
      <div style="text-align:center;"><div style="width:120px;height:120px;border-radius:50%;background:${BG_LIGHT};border:1px solid ${BORDER};margin:0 auto 16px;"></div><div style="font-size:16px;font-weight:600;color:${TEXT_PRIMARY};">Priya Shah</div><div style="font-size:14px;color:${TEXT_MUTED};margin-top:4px;">Head of Design</div></div>
      <div style="text-align:center;"><div style="width:120px;height:120px;border-radius:50%;background:${BG_LIGHT};border:1px solid ${BORDER};margin:0 auto 16px;"></div><div style="font-size:16px;font-weight:600;color:${TEXT_PRIMARY};">Marcus Chen</div><div style="font-size:14px;color:${TEXT_MUTED};margin-top:4px;">Engineering Lead</div></div>
      <div style="text-align:center;"><div style="width:120px;height:120px;border-radius:50%;background:${BG_LIGHT};border:1px solid ${BORDER};margin:0 auto 16px;"></div><div style="font-size:16px;font-weight:600;color:${TEXT_PRIMARY};">Sofia Lind</div><div style="font-size:14px;color:${TEXT_MUTED};margin-top:4px;">Product Manager</div></div>
      <div style="text-align:center;"><div style="width:120px;height:120px;border-radius:50%;background:${BG_LIGHT};border:1px solid ${BORDER};margin:0 auto 16px;"></div><div style="font-size:16px;font-weight:600;color:${TEXT_PRIMARY};">Daniel Park</div><div style="font-size:14px;color:${TEXT_MUTED};margin-top:4px;">Staff Engineer</div></div>
      <div style="text-align:center;"><div style="width:120px;height:120px;border-radius:50%;background:${BG_LIGHT};border:1px solid ${BORDER};margin:0 auto 16px;"></div><div style="font-size:16px;font-weight:600;color:${TEXT_PRIMARY};">Nina Okafor</div><div style="font-size:14px;color:${TEXT_MUTED};margin-top:4px;">Customer Success</div></div>
    </div>
  </div>
</section>`;

const aboutTeamBios = `
<section data-aqb-section="about-team-bios" style="padding:${PAD};background:${BG_WHITE};">
  <div style="${INNER}">
    <div style="text-align:center;margin-bottom:56px;">
      <h2 style="font-size:36px;font-weight:700;color:${TEXT_PRIMARY};margin:0 0 12px;">Meet the founders</h2>
      <p style="font-size:18px;color:${TEXT_MUTED};margin:0;">A small team with deep experience.</p>
    </div>
    <div style="display:flex;flex-direction:column;gap:48px;">
      <div style="display:grid;grid-template-columns:160px 1fr;gap:32px;align-items:center;"><div style="width:160px;height:160px;background:${BG_LIGHT};border:1px solid ${BORDER};border-radius:16px;"></div><div><strong style="color:${TEXT_PRIMARY};font-size:20px;display:block;">Alex Rivera</strong><span style="color:${ACCENT};font-size:14px;font-weight:600;">Founder & CEO</span><p style="color:${TEXT_MUTED};line-height:1.6;margin:12px 0 0;">Previously led product at two YC-backed companies. Obsessed with tools that disappear into the work. Writes about craft and focus.</p></div></div>
      <div style="display:grid;grid-template-columns:1fr 160px;gap:32px;align-items:center;"><div style="text-align:right;"><strong style="color:${TEXT_PRIMARY};font-size:20px;display:block;">Priya Shah</strong><span style="color:${ACCENT};font-size:14px;font-weight:600;">Head of Design</span><p style="color:${TEXT_MUTED};line-height:1.6;margin:12px 0 0;">10+ years designing tools for makers. Former design lead at a well-known creative suite. Believes defaults are a love letter to users.</p></div><div style="width:160px;height:160px;background:${BG_LIGHT};border:1px solid ${BORDER};border-radius:16px;"></div></div>
      <div style="display:grid;grid-template-columns:160px 1fr;gap:32px;align-items:center;"><div style="width:160px;height:160px;background:${BG_LIGHT};border:1px solid ${BORDER};border-radius:16px;"></div><div><strong style="color:${TEXT_PRIMARY};font-size:20px;display:block;">Marcus Chen</strong><span style="color:${ACCENT};font-size:14px;font-weight:600;">Engineering Lead</span><p style="color:${TEXT_MUTED};line-height:1.6;margin:12px 0 0;">Systems engineer who has shipped products used by millions. Champions boring technology and the kind of reliability that compounds.</p></div></div>
    </div>
  </div>
</section>`;

const aboutTimeline = `
<section data-aqb-section="about-timeline" style="padding:${PAD};background:${BG_LIGHT};">
  <div style="${INNER}max-width:760px;">
    <div style="text-align:center;margin-bottom:48px;">
      <h2 style="font-size:36px;font-weight:700;color:${TEXT_PRIMARY};margin:0 0 12px;">Our story</h2>
      <p style="font-size:18px;color:${TEXT_MUTED};margin:0;">Milestones from zero to today.</p>
    </div>
    <div style="border-left:2px solid ${BORDER};padding-left:32px;position:relative;display:flex;flex-direction:column;gap:40px;">
      <div style="position:relative;"><div style="position:absolute;left:-41px;top:4px;width:16px;height:16px;border-radius:50%;background:${ACCENT};border:3px solid ${BG_LIGHT};"></div><div style="font-size:24px;font-weight:700;color:${ACCENT};">2021</div><div style="font-size:18px;font-weight:600;color:${TEXT_PRIMARY};margin-top:4px;">A sketch on a napkin</div><p style="color:${TEXT_MUTED};line-height:1.6;margin:8px 0 0;">Two engineers drew the first wireframe of the canvas over coffee.</p></div>
      <div style="position:relative;"><div style="position:absolute;left:-41px;top:4px;width:16px;height:16px;border-radius:50%;background:${ACCENT};border:3px solid ${BG_LIGHT};"></div><div style="font-size:24px;font-weight:700;color:${ACCENT};">2022</div><div style="font-size:18px;font-weight:600;color:${TEXT_PRIMARY};margin-top:4px;">First thousand users</div><p style="color:${TEXT_MUTED};line-height:1.6;margin:8px 0 0;">Private beta launched. Our first users taught us what really matters.</p></div>
      <div style="position:relative;"><div style="position:absolute;left:-41px;top:4px;width:16px;height:16px;border-radius:50%;background:${ACCENT};border:3px solid ${BG_LIGHT};"></div><div style="font-size:24px;font-weight:700;color:${ACCENT};">2024</div><div style="font-size:18px;font-weight:600;color:${TEXT_PRIMARY};margin-top:4px;">Version 2 shipped</div><p style="color:${TEXT_MUTED};line-height:1.6;margin:8px 0 0;">A complete rewrite of the engine brought a 10x speed improvement.</p></div>
      <div style="position:relative;"><div style="position:absolute;left:-41px;top:4px;width:16px;height:16px;border-radius:50%;background:${ACCENT};border:3px solid ${BG_LIGHT};"></div><div style="font-size:24px;font-weight:700;color:${ACCENT};">2026</div><div style="font-size:18px;font-weight:600;color:${TEXT_PRIMARY};margin-top:4px;">Today</div><p style="color:${TEXT_MUTED};line-height:1.6;margin:8px 0 0;">Powering sites for teams in 40+ countries. The journey continues.</p></div>
    </div>
  </div>
</section>`;

const aboutValues = `
<section data-aqb-section="about-values" style="padding:${PAD};background:${BG_WHITE};">
  <div style="${INNER}">
    <div style="text-align:center;margin-bottom:48px;">
      <h2 style="font-size:36px;font-weight:700;color:${TEXT_PRIMARY};margin:0 0 12px;">Our values</h2>
      <p style="font-size:18px;color:${TEXT_MUTED};margin:0;">The principles we build around.</p>
    </div>
    <div style="display:grid;grid-template-columns:repeat(3,1fr);gap:32px;">
      <div style="padding:24px;background:${BG_LIGHT};border-radius:12px;"><div style="width:40px;height:40px;background:${ACCENT};border-radius:10px;margin-bottom:16px;"></div><h3 style="font-size:18px;font-weight:600;color:${TEXT_PRIMARY};margin:0 0 8px;">Craft first</h3><p style="font-size:14px;color:${TEXT_MUTED};line-height:1.6;margin:0;">We care about the details you won't see. That's where quality lives.</p></div>
      <div style="padding:24px;background:${BG_LIGHT};border-radius:12px;"><div style="width:40px;height:40px;background:${ACCENT};border-radius:10px;margin-bottom:16px;"></div><h3 style="font-size:18px;font-weight:600;color:${TEXT_PRIMARY};margin:0 0 8px;">Ship small, ship often</h3><p style="font-size:14px;color:${TEXT_MUTED};line-height:1.6;margin:0;">Progress compounds. Every week should leave users better off.</p></div>
      <div style="padding:24px;background:${BG_LIGHT};border-radius:12px;"><div style="width:40px;height:40px;background:${ACCENT};border-radius:10px;margin-bottom:16px;"></div><h3 style="font-size:18px;font-weight:600;color:${TEXT_PRIMARY};margin:0 0 8px;">Listen deeply</h3><p style="font-size:14px;color:${TEXT_MUTED};line-height:1.6;margin:0;">The best insights come from watching real people do real work.</p></div>
      <div style="padding:24px;background:${BG_LIGHT};border-radius:12px;"><div style="width:40px;height:40px;background:${ACCENT};border-radius:10px;margin-bottom:16px;"></div><h3 style="font-size:18px;font-weight:600;color:${TEXT_PRIMARY};margin:0 0 8px;">Defaults matter</h3><p style="font-size:14px;color:${TEXT_MUTED};line-height:1.6;margin:0;">Sensible defaults are the fastest path from idea to result.</p></div>
      <div style="padding:24px;background:${BG_LIGHT};border-radius:12px;"><div style="width:40px;height:40px;background:${ACCENT};border-radius:10px;margin-bottom:16px;"></div><h3 style="font-size:18px;font-weight:600;color:${TEXT_PRIMARY};margin:0 0 8px;">Respect the work</h3><p style="font-size:14px;color:${TEXT_MUTED};line-height:1.6;margin:0;">Your files are yours. Your data is yours. We're just the tool.</p></div>
      <div style="padding:24px;background:${BG_LIGHT};border-radius:12px;"><div style="width:40px;height:40px;background:${ACCENT};border-radius:10px;margin-bottom:16px;"></div><h3 style="font-size:18px;font-weight:600;color:${TEXT_PRIMARY};margin:0 0 8px;">Fewer, better</h3><p style="font-size:14px;color:${TEXT_MUTED};line-height:1.6;margin:0;">Say no to 100 features so the 10 that matter shine.</p></div>
    </div>
  </div>
</section>`;

// ─── FEATURES ───────────────────────────────────────────────────────────────

const featuresGrid = `
<section data-aqb-section="features-3col" style="padding:${PAD};background:${BG_WHITE};">
  <div style="${INNER}">
    <div style="text-align:center;margin-bottom:48px;">
      <h2 style="font-size:36px;font-weight:700;color:${TEXT_PRIMARY};margin:0 0 12px;">Everything you need</h2>
      <p style="font-size:18px;color:${TEXT_MUTED};margin:0;">Three features that set you apart.</p>
    </div>
    <div style="display:grid;grid-template-columns:repeat(3,1fr);gap:32px;">
      <div style="padding:24px;background:${BG_LIGHT};border-radius:12px;">
        <div style="width:48px;height:48px;background:${ACCENT};border-radius:10px;margin-bottom:16px;"></div>
        <h3 style="font-size:20px;font-weight:600;color:${TEXT_PRIMARY};margin:0 0 8px;">Fast by default</h3>
        <p style="font-size:15px;color:${TEXT_MUTED};line-height:1.6;margin:0;">Describe the benefit in one crisp sentence that connects to the user's goal.</p>
      </div>
      <div style="padding:24px;background:${BG_LIGHT};border-radius:12px;">
        <div style="width:48px;height:48px;background:${ACCENT};border-radius:10px;margin-bottom:16px;"></div>
        <h3 style="font-size:20px;font-weight:600;color:${TEXT_PRIMARY};margin:0 0 8px;">Built for scale</h3>
        <p style="font-size:15px;color:${TEXT_MUTED};line-height:1.6;margin:0;">Each feature earns its place by solving a real job to be done.</p>
      </div>
      <div style="padding:24px;background:${BG_LIGHT};border-radius:12px;">
        <div style="width:48px;height:48px;background:${ACCENT};border-radius:10px;margin-bottom:16px;"></div>
        <h3 style="font-size:20px;font-weight:600;color:${TEXT_PRIMARY};margin:0 0 8px;">Always shipping</h3>
        <p style="font-size:15px;color:${TEXT_MUTED};line-height:1.6;margin:0;">Short, benefit-led copy that rewards skimming.</p>
      </div>
    </div>
  </div>
</section>`;

const featuresIconList = `
<section data-aqb-section="features-icon-list" style="padding:${PAD};background:${BG_WHITE};">
  <div style="${INNER}max-width:720px;">
    <h2 style="font-size:36px;font-weight:700;color:${TEXT_PRIMARY};margin:0 0 32px;">Why teams choose us</h2>
    <ul style="list-style:none;padding:0;margin:0;display:flex;flex-direction:column;gap:20px;">
      <li style="display:flex;gap:16px;align-items:flex-start;"><div style="flex-shrink:0;width:32px;height:32px;background:${ACCENT};border-radius:8px;"></div><div><strong style="color:${TEXT_PRIMARY};font-size:17px;">Ships in minutes</strong><p style="color:${TEXT_MUTED};margin:4px 0 0;line-height:1.6;">From signup to first published page in under 5 minutes.</p></div></li>
      <li style="display:flex;gap:16px;align-items:flex-start;"><div style="flex-shrink:0;width:32px;height:32px;background:${ACCENT};border-radius:8px;"></div><div><strong style="color:${TEXT_PRIMARY};font-size:17px;">No lock-in</strong><p style="color:${TEXT_MUTED};margin:4px 0 0;line-height:1.6;">Export clean code at any time. Host anywhere.</p></div></li>
      <li style="display:flex;gap:16px;align-items:flex-start;"><div style="flex-shrink:0;width:32px;height:32px;background:${ACCENT};border-radius:8px;"></div><div><strong style="color:${TEXT_PRIMARY};font-size:17px;">Real support</strong><p style="color:${TEXT_MUTED};margin:4px 0 0;line-height:1.6;">Humans answer in hours, not days.</p></div></li>
    </ul>
  </div>
</section>`;

const featuresComparison = `
<section data-aqb-section="features-comparison" style="padding:${PAD};background:${BG_LIGHT};">
  <div style="${INNER}">
    <h2 style="font-size:36px;font-weight:700;color:${TEXT_PRIMARY};text-align:center;margin:0 0 40px;">Compare plans</h2>
    <table style="width:100%;border-collapse:collapse;background:${BG_WHITE};border-radius:12px;overflow:hidden;">
      <thead><tr style="background:${BG_LIGHT};"><th style="padding:16px;text-align:left;color:${TEXT_PRIMARY};">Feature</th><th style="padding:16px;color:${TEXT_PRIMARY};">Free</th><th style="padding:16px;color:${TEXT_PRIMARY};">Pro</th></tr></thead>
      <tbody>
        <tr style="border-top:1px solid ${BORDER};"><td style="padding:16px;color:${TEXT_PRIMARY};">Pages</td><td style="padding:16px;text-align:center;color:${TEXT_MUTED};">3</td><td style="padding:16px;text-align:center;color:${ACCENT};font-weight:600;">Unlimited</td></tr>
        <tr style="border-top:1px solid ${BORDER};"><td style="padding:16px;color:${TEXT_PRIMARY};">Custom domain</td><td style="padding:16px;text-align:center;color:${TEXT_MUTED};">—</td><td style="padding:16px;text-align:center;color:${ACCENT};">✓</td></tr>
        <tr style="border-top:1px solid ${BORDER};"><td style="padding:16px;color:${TEXT_PRIMARY};">Priority support</td><td style="padding:16px;text-align:center;color:${TEXT_MUTED};">—</td><td style="padding:16px;text-align:center;color:${ACCENT};">✓</td></tr>
      </tbody>
    </table>
  </div>
</section>`;

const featuresAlternating = `
<section data-aqb-section="features-alternating" style="padding:${PAD};background:${BG_WHITE};">
  <div style="${INNER}display:flex;flex-direction:column;gap:80px;">
    <div style="display:grid;grid-template-columns:1fr 1fr;gap:48px;align-items:center;">
      <div><h2 style="font-size:32px;font-weight:700;color:${TEXT_PRIMARY};margin:0 0 16px;">Feature one</h2><p style="color:${TEXT_MUTED};line-height:1.7;margin:0;">Describe the first key capability. Focus on the benefit to the user, not the implementation detail.</p></div>
      <div style="aspect-ratio:4/3;background:${BG_LIGHT};border-radius:12px;"></div>
    </div>
    <div style="display:grid;grid-template-columns:1fr 1fr;gap:48px;align-items:center;">
      <div style="aspect-ratio:4/3;background:${BG_LIGHT};border-radius:12px;order:0;"></div>
      <div><h2 style="font-size:32px;font-weight:700;color:${TEXT_PRIMARY};margin:0 0 16px;">Feature two</h2><p style="color:${TEXT_MUTED};line-height:1.7;margin:0;">Describe the second capability. Keep the rhythm tight so each section earns attention.</p></div>
    </div>
  </div>
</section>`;

const featuresBento = `
<section data-aqb-section="features-bento" style="padding:${PAD};background:${BG_WHITE};">
  <div style="${INNER}">
    <div style="text-align:center;margin-bottom:48px;">
      <h2 style="font-size:36px;font-weight:700;color:${TEXT_PRIMARY};margin:0 0 12px;">Everything, in one place</h2>
      <p style="font-size:18px;color:${TEXT_MUTED};margin:0;">An asymmetric grid highlights what matters most.</p>
    </div>
    <div style="display:grid;grid-template-columns:repeat(3,1fr);grid-template-rows:repeat(2,220px);gap:16px;">
      <div style="grid-column:span 2;grid-row:span 2;padding:32px;background:${BG_LIGHT};border-radius:16px;display:flex;flex-direction:column;justify-content:space-between;"><div style="width:56px;height:56px;background:${ACCENT};border-radius:12px;"></div><div><h3 style="font-size:24px;font-weight:600;color:${TEXT_PRIMARY};margin:0 0 8px;">The centerpiece</h3><p style="font-size:15px;color:${TEXT_MUTED};line-height:1.6;margin:0;">The headline capability that defines the product. Gets the biggest tile and the most oxygen.</p></div></div>
      <div style="padding:24px;background:${BG_LIGHT};border-radius:16px;"><div style="width:40px;height:40px;background:${ACCENT};border-radius:10px;margin-bottom:12px;"></div><h3 style="font-size:17px;font-weight:600;color:${TEXT_PRIMARY};margin:0 0 4px;">Fast</h3><p style="font-size:13px;color:${TEXT_MUTED};line-height:1.5;margin:0;">Under 50ms response.</p></div>
      <div style="padding:24px;background:${BG_LIGHT};border-radius:16px;"><div style="width:40px;height:40px;background:${ACCENT};border-radius:10px;margin-bottom:12px;"></div><h3 style="font-size:17px;font-weight:600;color:${TEXT_PRIMARY};margin:0 0 4px;">Secure</h3><p style="font-size:13px;color:${TEXT_MUTED};line-height:1.5;margin:0;">SOC2 compliant.</p></div>
      <div style="padding:24px;background:${BG_LIGHT};border-radius:16px;"><div style="width:40px;height:40px;background:${ACCENT};border-radius:10px;margin-bottom:12px;"></div><h3 style="font-size:17px;font-weight:600;color:${TEXT_PRIMARY};margin:0 0 4px;">Open</h3><p style="font-size:13px;color:${TEXT_MUTED};line-height:1.5;margin:0;">Export anytime.</p></div>
      <div style="padding:24px;background:${BG_LIGHT};border-radius:16px;"><div style="width:40px;height:40px;background:${ACCENT};border-radius:10px;margin-bottom:12px;"></div><h3 style="font-size:17px;font-weight:600;color:${TEXT_PRIMARY};margin:0 0 4px;">Global</h3><p style="font-size:13px;color:${TEXT_MUTED};line-height:1.5;margin:0;">40+ regions.</p></div>
    </div>
  </div>
</section>`;

const featuresAccordion = `
<section data-aqb-section="features-accordion" style="padding:${PAD};background:${BG_LIGHT};">
  <div style="${INNER}max-width:760px;">
    <div style="text-align:center;margin-bottom:40px;">
      <h2 style="font-size:36px;font-weight:700;color:${TEXT_PRIMARY};margin:0 0 12px;">Dig in</h2>
      <p style="font-size:18px;color:${TEXT_MUTED};margin:0;">Tap any feature to learn more.</p>
    </div>
    <div style="display:flex;flex-direction:column;gap:12px;">
      <details open style="padding:24px;background:${BG_WHITE};border-radius:12px;border:1px solid ${BORDER};"><summary style="font-weight:600;color:${TEXT_PRIMARY};cursor:pointer;font-size:17px;display:flex;align-items:center;gap:12px;"><span style="display:inline-block;width:32px;height:32px;background:${ACCENT};border-radius:8px;"></span>Visual editing</summary><p style="color:${TEXT_MUTED};line-height:1.7;margin:16px 0 0 44px;">Drag, drop, and reshape any element on the canvas. No code required, no compromises on fidelity.</p></details>
      <details style="padding:24px;background:${BG_WHITE};border-radius:12px;border:1px solid ${BORDER};"><summary style="font-weight:600;color:${TEXT_PRIMARY};cursor:pointer;font-size:17px;display:flex;align-items:center;gap:12px;"><span style="display:inline-block;width:32px;height:32px;background:${ACCENT};border-radius:8px;"></span>Component library</summary><p style="color:${TEXT_MUTED};line-height:1.7;margin:16px 0 0 44px;">Reusable blocks you build once and drop anywhere. Edit the source, every instance updates.</p></details>
      <details style="padding:24px;background:${BG_WHITE};border-radius:12px;border:1px solid ${BORDER};"><summary style="font-weight:600;color:${TEXT_PRIMARY};cursor:pointer;font-size:17px;display:flex;align-items:center;gap:12px;"><span style="display:inline-block;width:32px;height:32px;background:${ACCENT};border-radius:8px;"></span>One-click publish</summary><p style="color:${TEXT_MUTED};line-height:1.7;margin:16px 0 0 44px;">Ship changes to your live site in seconds. Rollback is equally instant.</p></details>
      <details style="padding:24px;background:${BG_WHITE};border-radius:12px;border:1px solid ${BORDER};"><summary style="font-weight:600;color:${TEXT_PRIMARY};cursor:pointer;font-size:17px;display:flex;align-items:center;gap:12px;"><span style="display:inline-block;width:32px;height:32px;background:${ACCENT};border-radius:8px;"></span>Team collaboration</summary><p style="color:${TEXT_MUTED};line-height:1.7;margin:16px 0 0 44px;">Cursors, comments, and roles — so the whole team can build together.</p></details>
    </div>
  </div>
</section>`;

// ─── TESTIMONIALS ───────────────────────────────────────────────────────────

const socialTestimonialSingle = `
<section data-aqb-section="social-testimonial-single" style="padding:${PAD};background:${BG_LIGHT};text-align:center;">
  <div style="${INNER}max-width:720px;">
    <p style="font-size:28px;font-weight:500;color:${TEXT_PRIMARY};line-height:1.4;margin:0 0 32px;font-style:italic;">"This is the testimonial quote that captures the customer's transformation in their own words."</p>
    <div style="display:flex;gap:16px;align-items:center;justify-content:center;">
      <div style="width:56px;height:56px;background:${BORDER};border-radius:50%;"></div>
      <div style="text-align:left;"><strong style="color:${TEXT_PRIMARY};display:block;">Customer Name</strong><span style="color:${TEXT_MUTED};font-size:14px;">Title, Company</span></div>
    </div>
  </div>
</section>`;

const socialTestimonialGrid = `
<section data-aqb-section="social-testimonial-grid" style="padding:${PAD};background:${BG_WHITE};">
  <div style="${INNER}">
    <h2 style="font-size:36px;font-weight:700;color:${TEXT_PRIMARY};text-align:center;margin:0 0 48px;">Loved by teams everywhere</h2>
    <div style="display:grid;grid-template-columns:repeat(3,1fr);gap:24px;">
      <div style="padding:24px;background:${BG_LIGHT};border-radius:12px;"><p style="color:${TEXT_PRIMARY};line-height:1.6;margin:0 0 16px;">"Short, punchy quote that highlights a specific benefit."</p><div style="display:flex;gap:12px;align-items:center;"><div style="width:36px;height:36px;background:${BORDER};border-radius:50%;"></div><div><strong style="color:${TEXT_PRIMARY};font-size:14px;display:block;">Name</strong><span style="color:${TEXT_MUTED};font-size:12px;">Company</span></div></div></div>
      <div style="padding:24px;background:${BG_LIGHT};border-radius:12px;"><p style="color:${TEXT_PRIMARY};line-height:1.6;margin:0 0 16px;">"Second testimonial with a different angle on the value."</p><div style="display:flex;gap:12px;align-items:center;"><div style="width:36px;height:36px;background:${BORDER};border-radius:50%;"></div><div><strong style="color:${TEXT_PRIMARY};font-size:14px;display:block;">Name</strong><span style="color:${TEXT_MUTED};font-size:12px;">Company</span></div></div></div>
      <div style="padding:24px;background:${BG_LIGHT};border-radius:12px;"><p style="color:${TEXT_PRIMARY};line-height:1.6;margin:0 0 16px;">"Third quote covering a third jobs-to-be-done."</p><div style="display:flex;gap:12px;align-items:center;"><div style="width:36px;height:36px;background:${BORDER};border-radius:50%;"></div><div><strong style="color:${TEXT_PRIMARY};font-size:14px;display:block;">Name</strong><span style="color:${TEXT_MUTED};font-size:12px;">Company</span></div></div></div>
    </div>
  </div>
</section>`;

const socialLogoStrip = `
<section data-aqb-section="social-logo-strip" style="padding:60px 24px;background:${BG_LIGHT};">
  <div style="${INNER}text-align:center;">
    <p style="color:${TEXT_MUTED};font-size:14px;text-transform:uppercase;letter-spacing:0.08em;margin:0 0 24px;">Trusted by teams at</p>
    <div style="display:flex;gap:48px;justify-content:center;align-items:center;flex-wrap:wrap;opacity:0.6;">
      <div style="width:120px;height:32px;background:${TEXT_MUTED};border-radius:4px;"></div>
      <div style="width:120px;height:32px;background:${TEXT_MUTED};border-radius:4px;"></div>
      <div style="width:120px;height:32px;background:${TEXT_MUTED};border-radius:4px;"></div>
      <div style="width:120px;height:32px;background:${TEXT_MUTED};border-radius:4px;"></div>
      <div style="width:120px;height:32px;background:${TEXT_MUTED};border-radius:4px;"></div>
    </div>
  </div>
</section>`;

const socialStats = `
<section data-aqb-section="social-stats" style="padding:${PAD};background:${BG_DARK};color:#fff;">
  <div style="${INNER}display:grid;grid-template-columns:repeat(4,1fr);gap:32px;text-align:center;">
    <div><div style="font-size:48px;font-weight:700;color:#fff;">10k+</div><div style="color:rgba(255,255,255,0.7);font-size:14px;margin-top:8px;">Active users</div></div>
    <div><div style="font-size:48px;font-weight:700;color:#fff;">99.9%</div><div style="color:rgba(255,255,255,0.7);font-size:14px;margin-top:8px;">Uptime</div></div>
    <div><div style="font-size:48px;font-weight:700;color:#fff;">50M</div><div style="color:rgba(255,255,255,0.7);font-size:14px;margin-top:8px;">Pages served</div></div>
    <div><div style="font-size:48px;font-weight:700;color:#fff;">4.9★</div><div style="color:rgba(255,255,255,0.7);font-size:14px;margin-top:8px;">Average rating</div></div>
  </div>
</section>`;

const testimonialsVideo = `
<section data-aqb-section="testimonials-video" style="padding:${PAD};background:${BG_WHITE};">
  <div style="${INNER}display:grid;grid-template-columns:1fr 1fr;gap:48px;align-items:center;">
    <div>
      <p style="font-size:14px;font-weight:600;color:${ACCENT};letter-spacing:0.08em;text-transform:uppercase;margin:0 0 16px;">Customer story</p>
      <p style="font-size:28px;font-weight:500;color:${TEXT_PRIMARY};line-height:1.4;margin:0 0 24px;">"We cut our time-to-launch from weeks to an afternoon. The whole team finally ships on the same canvas."</p>
      <div style="display:flex;gap:16px;align-items:center;">
        <div style="width:56px;height:56px;background:${BG_LIGHT};border:1px solid ${BORDER};border-radius:50%;"></div>
        <div><strong style="color:${TEXT_PRIMARY};display:block;">Jordan Lee</strong><span style="color:${TEXT_MUTED};font-size:14px;">Head of Marketing, Northwind</span></div>
      </div>
    </div>
    <div style="aspect-ratio:16/9;background:${BG_DARK};border-radius:12px;position:relative;display:flex;align-items:center;justify-content:center;">
      <div style="width:72px;height:72px;border-radius:50%;background:rgba(255,255,255,0.15);border:2px solid rgba(255,255,255,0.8);display:flex;align-items:center;justify-content:center;color:#fff;font-size:24px;">▶</div>
    </div>
  </div>
</section>`;

const testimonialsCarousel = `
<section data-aqb-section="testimonials-carousel" style="padding:${PAD};background:${BG_LIGHT};">
  <div style="${INNER}">
    <div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:40px;">
      <h2 style="font-size:36px;font-weight:700;color:${TEXT_PRIMARY};margin:0;">What customers say</h2>
      <div style="display:flex;gap:8px;"><button style="width:40px;height:40px;border-radius:50%;background:${BG_WHITE};border:1px solid ${BORDER};color:${TEXT_PRIMARY};cursor:pointer;">‹</button><button style="width:40px;height:40px;border-radius:50%;background:${BG_WHITE};border:1px solid ${BORDER};color:${TEXT_PRIMARY};cursor:pointer;">›</button></div>
    </div>
    <div style="display:grid;grid-template-columns:repeat(3,1fr);gap:24px;">
      <div style="padding:28px;background:${BG_WHITE};border:1px solid ${BORDER};border-radius:16px;"><div style="color:${ACCENT};font-size:14px;margin-bottom:12px;">★★★★★</div><p style="color:${TEXT_PRIMARY};line-height:1.6;margin:0 0 20px;">"The best web builder I've used. Everything just works, and the defaults are beautiful."</p><div style="display:flex;gap:12px;align-items:center;"><div style="width:40px;height:40px;background:${BG_LIGHT};border-radius:50%;"></div><div><strong style="color:${TEXT_PRIMARY};font-size:14px;display:block;">Sam Patel</strong><span style="color:${TEXT_MUTED};font-size:12px;">Designer, Acme</span></div></div></div>
      <div style="padding:28px;background:${BG_WHITE};border:1px solid ${BORDER};border-radius:16px;"><div style="color:${ACCENT};font-size:14px;margin-bottom:12px;">★★★★★</div><p style="color:${TEXT_PRIMARY};line-height:1.6;margin:0 0 20px;">"Our marketing team now ships pages without waiting on engineering. Game changer."</p><div style="display:flex;gap:12px;align-items:center;"><div style="width:40px;height:40px;background:${BG_LIGHT};border-radius:50%;"></div><div><strong style="color:${TEXT_PRIMARY};font-size:14px;display:block;">Rachel Kim</strong><span style="color:${TEXT_MUTED};font-size:12px;">VP Growth, Flux</span></div></div></div>
      <div style="padding:28px;background:${BG_WHITE};border:1px solid ${BORDER};border-radius:16px;"><div style="color:${ACCENT};font-size:14px;margin-bottom:12px;">★★★★★</div><p style="color:${TEXT_PRIMARY};line-height:1.6;margin:0 0 20px;">"We migrated from a legacy CMS in one week. Support was responsive the whole way."</p><div style="display:flex;gap:12px;align-items:center;"><div style="width:40px;height:40px;background:${BG_LIGHT};border-radius:50%;"></div><div><strong style="color:${TEXT_PRIMARY};font-size:14px;display:block;">Luis Ortiz</strong><span style="color:${TEXT_MUTED};font-size:12px;">CTO, Harbor</span></div></div></div>
    </div>
    <div style="display:flex;gap:8px;justify-content:center;margin-top:32px;">
      <span style="width:24px;height:6px;background:${ACCENT};border-radius:3px;"></span>
      <span style="width:6px;height:6px;background:${BORDER};border-radius:3px;"></span>
      <span style="width:6px;height:6px;background:${BORDER};border-radius:3px;"></span>
    </div>
  </div>
</section>`;

// ─── PRICING ────────────────────────────────────────────────────────────────

const pricingSingle = `
<section data-aqb-section="pricing-single" style="padding:${PAD};background:${BG_WHITE};">
  <div style="${INNER}max-width:480px;text-align:center;">
    <h2 style="font-size:32px;font-weight:700;color:${TEXT_PRIMARY};margin:0 0 16px;">One simple plan</h2>
    <p style="color:${TEXT_MUTED};margin:0 0 32px;">Everything you need, nothing you don't.</p>
    <div style="padding:40px;background:${BG_LIGHT};border-radius:16px;border:1px solid ${BORDER};">
      <div style="font-size:56px;font-weight:700;color:${TEXT_PRIMARY};">$29<span style="font-size:18px;color:${TEXT_MUTED};font-weight:400;">/mo</span></div>
      <ul style="list-style:none;padding:0;margin:24px 0;text-align:left;display:flex;flex-direction:column;gap:12px;">
        <li style="color:${TEXT_PRIMARY};">✓ Unlimited pages</li>
        <li style="color:${TEXT_PRIMARY};">✓ Custom domain</li>
        <li style="color:${TEXT_PRIMARY};">✓ Priority support</li>
        <li style="color:${TEXT_PRIMARY};">✓ Team collaboration</li>
      </ul>
      <a href="#" style="display:block;padding:14px;background:${ACCENT};color:#fff;font-weight:600;border-radius:8px;text-decoration:none;">Start free trial</a>
    </div>
  </div>
</section>`;

const pricing2col = `
<section data-aqb-section="pricing-2col" style="padding:${PAD};background:${BG_WHITE};">
  <div style="${INNER}">
    <h2 style="font-size:36px;font-weight:700;color:${TEXT_PRIMARY};text-align:center;margin:0 0 48px;">Choose your plan</h2>
    <div style="display:grid;grid-template-columns:1fr 1fr;gap:24px;max-width:760px;margin:0 auto;">
      <div style="padding:32px;background:${BG_LIGHT};border:1px solid ${BORDER};border-radius:16px;">
        <h3 style="color:${TEXT_PRIMARY};margin:0 0 8px;">Starter</h3>
        <div style="font-size:40px;font-weight:700;color:${TEXT_PRIMARY};margin-bottom:16px;">$0</div>
        <a href="#" style="display:block;padding:12px;text-align:center;background:#fff;color:${TEXT_PRIMARY};border:1px solid ${BORDER};border-radius:8px;text-decoration:none;font-weight:600;">Get started</a>
      </div>
      <div style="padding:32px;background:${ACCENT};color:#fff;border-radius:16px;">
        <h3 style="color:#fff;margin:0 0 8px;">Pro</h3>
        <div style="font-size:40px;font-weight:700;color:#fff;margin-bottom:16px;">$29</div>
        <a href="#" style="display:block;padding:12px;text-align:center;background:#fff;color:${ACCENT};border-radius:8px;text-decoration:none;font-weight:600;">Upgrade</a>
      </div>
    </div>
  </div>
</section>`;

const pricing3col = `
<section data-aqb-section="pricing-3col" style="padding:${PAD};background:${BG_WHITE};">
  <div style="${INNER}">
    <h2 style="font-size:36px;font-weight:700;color:${TEXT_PRIMARY};text-align:center;margin:0 0 48px;">Pricing that scales</h2>
    <div style="display:grid;grid-template-columns:repeat(3,1fr);gap:24px;">
      <div style="padding:32px;background:${BG_LIGHT};border:1px solid ${BORDER};border-radius:16px;"><h3 style="color:${TEXT_PRIMARY};margin:0 0 8px;">Free</h3><div style="font-size:40px;font-weight:700;color:${TEXT_PRIMARY};">$0</div><a href="#" style="display:block;margin-top:24px;padding:12px;text-align:center;background:#fff;border:1px solid ${BORDER};border-radius:8px;text-decoration:none;color:${TEXT_PRIMARY};font-weight:600;">Start</a></div>
      <div style="padding:32px;background:${ACCENT};color:#fff;border-radius:16px;transform:scale(1.05);box-shadow:0 12px 24px rgba(0,0,0,0.1);"><div style="font-size:11px;text-transform:uppercase;letter-spacing:0.08em;opacity:0.9;">Most popular</div><h3 style="color:#fff;margin:8px 0;">Pro</h3><div style="font-size:40px;font-weight:700;color:#fff;">$29</div><a href="#" style="display:block;margin-top:24px;padding:12px;text-align:center;background:#fff;color:${ACCENT};border-radius:8px;text-decoration:none;font-weight:600;">Upgrade</a></div>
      <div style="padding:32px;background:${BG_LIGHT};border:1px solid ${BORDER};border-radius:16px;"><h3 style="color:${TEXT_PRIMARY};margin:0 0 8px;">Team</h3><div style="font-size:40px;font-weight:700;color:${TEXT_PRIMARY};">$99</div><a href="#" style="display:block;margin-top:24px;padding:12px;text-align:center;background:#fff;border:1px solid ${BORDER};border-radius:8px;text-decoration:none;color:${TEXT_PRIMARY};font-weight:600;">Contact us</a></div>
    </div>
  </div>
</section>`;

const pricingToggle = `
<section data-aqb-section="pricing-toggle" style="padding:${PAD};background:${BG_WHITE};text-align:center;">
  <div style="${INNER}">
    <h2 style="font-size:36px;font-weight:700;color:${TEXT_PRIMARY};margin:0 0 16px;">Save 20% with annual</h2>
    <div style="display:inline-flex;background:${BG_LIGHT};padding:4px;border-radius:999px;margin-bottom:40px;"><button style="padding:8px 20px;background:#fff;border:0;border-radius:999px;color:${TEXT_PRIMARY};font-weight:600;cursor:pointer;">Monthly</button><button style="padding:8px 20px;background:transparent;border:0;border-radius:999px;color:${TEXT_MUTED};font-weight:600;cursor:pointer;">Annual</button></div>
    <div style="display:grid;grid-template-columns:repeat(2,1fr);gap:24px;max-width:760px;margin:0 auto;">
      <div style="padding:32px;background:${BG_LIGHT};border-radius:16px;border:1px solid ${BORDER};"><h3 style="color:${TEXT_PRIMARY};margin:0 0 8px;">Starter</h3><div style="font-size:40px;font-weight:700;color:${TEXT_PRIMARY};">$9<span style="font-size:16px;color:${TEXT_MUTED};font-weight:400;">/mo</span></div></div>
      <div style="padding:32px;background:${BG_LIGHT};border-radius:16px;border:1px solid ${BORDER};"><h3 style="color:${TEXT_PRIMARY};margin:0 0 8px;">Pro</h3><div style="font-size:40px;font-weight:700;color:${TEXT_PRIMARY};">$29<span style="font-size:16px;color:${TEXT_MUTED};font-weight:400;">/mo</span></div></div>
    </div>
  </div>
</section>`;

const pricingComparison = `
<section data-aqb-section="pricing-comparison" style="padding:${PAD};background:${BG_LIGHT};">
  <div style="${INNER}">
    <h2 style="font-size:36px;font-weight:700;color:${TEXT_PRIMARY};text-align:center;margin:0 0 40px;">Compare every feature</h2>
    <div style="background:${BG_WHITE};border:1px solid ${BORDER};border-radius:16px;overflow:hidden;">
      <table style="width:100%;border-collapse:collapse;">
        <thead><tr style="background:${BG_LIGHT};"><th style="padding:20px;text-align:left;color:${TEXT_PRIMARY};font-size:14px;text-transform:uppercase;letter-spacing:0.06em;">Feature</th><th style="padding:20px;text-align:center;color:${TEXT_PRIMARY};">Free</th><th style="padding:20px;text-align:center;color:${ACCENT};">Pro</th><th style="padding:20px;text-align:center;color:${TEXT_PRIMARY};">Team</th></tr></thead>
        <tbody>
          <tr style="border-top:1px solid ${BORDER};"><td style="padding:16px 20px;color:${TEXT_PRIMARY};">Projects</td><td style="padding:16px 20px;text-align:center;color:${TEXT_MUTED};">3</td><td style="padding:16px 20px;text-align:center;color:${TEXT_PRIMARY};">Unlimited</td><td style="padding:16px 20px;text-align:center;color:${TEXT_PRIMARY};">Unlimited</td></tr>
          <tr style="border-top:1px solid ${BORDER};background:${BG_LIGHT};"><td style="padding:16px 20px;color:${TEXT_PRIMARY};">Custom domain</td><td style="padding:16px 20px;text-align:center;color:${TEXT_MUTED};">—</td><td style="padding:16px 20px;text-align:center;color:${ACCENT};">✓</td><td style="padding:16px 20px;text-align:center;color:${ACCENT};">✓</td></tr>
          <tr style="border-top:1px solid ${BORDER};"><td style="padding:16px 20px;color:${TEXT_PRIMARY};">Team members</td><td style="padding:16px 20px;text-align:center;color:${TEXT_MUTED};">1</td><td style="padding:16px 20px;text-align:center;color:${TEXT_PRIMARY};">3</td><td style="padding:16px 20px;text-align:center;color:${TEXT_PRIMARY};">Unlimited</td></tr>
          <tr style="border-top:1px solid ${BORDER};background:${BG_LIGHT};"><td style="padding:16px 20px;color:${TEXT_PRIMARY};">Version history</td><td style="padding:16px 20px;text-align:center;color:${TEXT_MUTED};">7 days</td><td style="padding:16px 20px;text-align:center;color:${TEXT_PRIMARY};">30 days</td><td style="padding:16px 20px;text-align:center;color:${TEXT_PRIMARY};">Unlimited</td></tr>
          <tr style="border-top:1px solid ${BORDER};"><td style="padding:16px 20px;color:${TEXT_PRIMARY};">Priority support</td><td style="padding:16px 20px;text-align:center;color:${TEXT_MUTED};">—</td><td style="padding:16px 20px;text-align:center;color:${ACCENT};">✓</td><td style="padding:16px 20px;text-align:center;color:${ACCENT};">✓</td></tr>
          <tr style="border-top:1px solid ${BORDER};background:${BG_LIGHT};"><td style="padding:16px 20px;color:${TEXT_PRIMARY};">SSO & SCIM</td><td style="padding:16px 20px;text-align:center;color:${TEXT_MUTED};">—</td><td style="padding:16px 20px;text-align:center;color:${TEXT_MUTED};">—</td><td style="padding:16px 20px;text-align:center;color:${ACCENT};">✓</td></tr>
        </tbody>
      </table>
    </div>
  </div>
</section>`;

const pricingEnterprise = `
<section data-aqb-section="pricing-enterprise" style="padding:${PAD};background:${BG_WHITE};">
  <div style="${INNER}max-width:820px;">
    <div style="padding:56px;background:${BG_DARK};border-radius:20px;color:#fff;display:grid;grid-template-columns:2fr 1fr;gap:40px;align-items:center;">
      <div>
        <p style="font-size:13px;font-weight:600;color:rgba(255,255,255,0.7);letter-spacing:0.1em;text-transform:uppercase;margin:0 0 12px;">Enterprise</p>
        <h2 style="font-size:40px;font-weight:700;color:#fff;line-height:1.2;margin:0 0 16px;">Built for teams at scale</h2>
        <p style="font-size:16px;color:rgba(255,255,255,0.8);line-height:1.6;margin:0 0 24px;">Custom contracts, dedicated support, advanced security, and a solution engineer who knows your stack.</p>
        <ul style="list-style:none;padding:0;margin:0;display:grid;grid-template-columns:1fr 1fr;gap:8px;color:rgba(255,255,255,0.85);font-size:14px;">
          <li>✓ SSO & SCIM</li><li>✓ SOC2 Type II</li>
          <li>✓ Dedicated support</li><li>✓ Custom SLAs</li>
          <li>✓ Audit logs</li><li>✓ On-prem option</li>
        </ul>
      </div>
      <div style="text-align:center;">
        <a href="#" style="display:inline-block;padding:16px 32px;background:#fff;color:${TEXT_PRIMARY};font-weight:600;border-radius:8px;text-decoration:none;">Contact sales</a>
        <div style="margin-top:12px;font-size:13px;color:rgba(255,255,255,0.6);">Response in 24 hours</div>
      </div>
    </div>
  </div>
</section>`;

// ─── FAQ ────────────────────────────────────────────────────────────────────

const faqAccordion = `
<section data-aqb-section="faq-accordion" style="padding:${PAD};background:${BG_WHITE};">
  <div style="${INNER}max-width:720px;">
    <h2 style="font-size:36px;font-weight:700;color:${TEXT_PRIMARY};text-align:center;margin:0 0 40px;">Frequently asked questions</h2>
    <div style="display:flex;flex-direction:column;gap:12px;">
      <details style="padding:20px;background:${BG_LIGHT};border-radius:12px;border:1px solid ${BORDER};"><summary style="font-weight:600;color:${TEXT_PRIMARY};cursor:pointer;">What's included in the free plan?</summary><p style="color:${TEXT_MUTED};line-height:1.6;margin:12px 0 0;">The answer to this common question, clearly and concisely.</p></details>
      <details style="padding:20px;background:${BG_LIGHT};border-radius:12px;border:1px solid ${BORDER};"><summary style="font-weight:600;color:${TEXT_PRIMARY};cursor:pointer;">Can I cancel anytime?</summary><p style="color:${TEXT_MUTED};line-height:1.6;margin:12px 0 0;">Yes, no questions asked. Explain the cancellation policy here.</p></details>
      <details style="padding:20px;background:${BG_LIGHT};border-radius:12px;border:1px solid ${BORDER};"><summary style="font-weight:600;color:${TEXT_PRIMARY};cursor:pointer;">Do you offer refunds?</summary><p style="color:${TEXT_MUTED};line-height:1.6;margin:12px 0 0;">Describe the refund policy in plain language.</p></details>
    </div>
  </div>
</section>`;

const faq2col = `
<section data-aqb-section="faq-2col" style="padding:${PAD};background:${BG_WHITE};">
  <div style="${INNER}">
    <h2 style="font-size:36px;font-weight:700;color:${TEXT_PRIMARY};text-align:center;margin:0 0 40px;">Common questions</h2>
    <div style="display:grid;grid-template-columns:1fr 1fr;gap:32px;">
      <div><h3 style="color:${TEXT_PRIMARY};margin:0 0 8px;">Is there a free trial?</h3><p style="color:${TEXT_MUTED};line-height:1.6;margin:0;">Yes, 14 days, no credit card required.</p></div>
      <div><h3 style="color:${TEXT_PRIMARY};margin:0 0 8px;">Do you support teams?</h3><p style="color:${TEXT_MUTED};line-height:1.6;margin:0;">Yes, collaborative editing and role management built in.</p></div>
      <div><h3 style="color:${TEXT_PRIMARY};margin:0 0 8px;">Can I export my data?</h3><p style="color:${TEXT_MUTED};line-height:1.6;margin:0;">Anytime. Clean HTML, CSS, and JSON exports.</p></div>
      <div><h3 style="color:${TEXT_PRIMARY};margin:0 0 8px;">Where is data stored?</h3><p style="color:${TEXT_MUTED};line-height:1.6;margin:0;">On encrypted US and EU servers of your choice.</p></div>
    </div>
  </div>
</section>`;

const faqWithCta = `
<section data-aqb-section="faq-with-cta" style="padding:${PAD};background:${BG_WHITE};">
  <div style="${INNER}max-width:720px;">
    <h2 style="font-size:36px;font-weight:700;color:${TEXT_PRIMARY};text-align:center;margin:0 0 32px;">Questions?</h2>
    <div style="display:flex;flex-direction:column;gap:12px;margin-bottom:40px;">
      <details style="padding:20px;background:${BG_LIGHT};border-radius:12px;"><summary style="font-weight:600;color:${TEXT_PRIMARY};cursor:pointer;">Q1</summary><p style="color:${TEXT_MUTED};margin:12px 0 0;">A1</p></details>
      <details style="padding:20px;background:${BG_LIGHT};border-radius:12px;"><summary style="font-weight:600;color:${TEXT_PRIMARY};cursor:pointer;">Q2</summary><p style="color:${TEXT_MUTED};margin:12px 0 0;">A2</p></details>
    </div>
    <div style="text-align:center;padding:32px;background:${BG_LIGHT};border-radius:12px;"><p style="color:${TEXT_PRIMARY};margin:0 0 16px;">Still have questions?</p><a href="#" style="display:inline-block;padding:12px 24px;background:${ACCENT};color:#fff;border-radius:8px;text-decoration:none;font-weight:600;">Contact support</a></div>
  </div>
</section>`;

const faqCategories = `
<section data-aqb-section="faq-categories" style="padding:${PAD};background:${BG_WHITE};">
  <div style="${INNER}max-width:800px;">
    <h2 style="font-size:36px;font-weight:700;color:${TEXT_PRIMARY};text-align:center;margin:0 0 40px;">Help center</h2>
    <div style="margin-bottom:32px;"><h3 style="color:${ACCENT};font-size:14px;text-transform:uppercase;letter-spacing:0.06em;margin:0 0 16px;">Getting started</h3><details style="padding:16px;background:${BG_LIGHT};border-radius:8px;margin-bottom:8px;"><summary style="font-weight:600;color:${TEXT_PRIMARY};cursor:pointer;">How do I create my first page?</summary></details><details style="padding:16px;background:${BG_LIGHT};border-radius:8px;"><summary style="font-weight:600;color:${TEXT_PRIMARY};cursor:pointer;">What's included in my plan?</summary></details></div>
    <div><h3 style="color:${ACCENT};font-size:14px;text-transform:uppercase;letter-spacing:0.06em;margin:0 0 16px;">Billing</h3><details style="padding:16px;background:${BG_LIGHT};border-radius:8px;margin-bottom:8px;"><summary style="font-weight:600;color:${TEXT_PRIMARY};cursor:pointer;">How do refunds work?</summary></details></div>
  </div>
</section>`;

const faqNumbered = `
<section data-aqb-section="faq-numbered" style="padding:${PAD};background:${BG_LIGHT};">
  <div style="${INNER}max-width:720px;">
    <h2 style="font-size:36px;font-weight:700;color:${TEXT_PRIMARY};text-align:center;margin:0 0 40px;">Top questions</h2>
    <ol style="list-style:none;padding:0;margin:0;display:flex;flex-direction:column;gap:24px;counter-reset:faq;">
      <li style="display:grid;grid-template-columns:48px 1fr;gap:20px;counter-increment:faq;"><div style="width:40px;height:40px;border-radius:50%;background:${ACCENT};color:#fff;display:flex;align-items:center;justify-content:center;font-weight:700;">1</div><div><h3 style="font-size:18px;font-weight:600;color:${TEXT_PRIMARY};margin:0 0 8px;">How long does onboarding take?</h3><p style="color:${TEXT_MUTED};line-height:1.6;margin:0;">Most teams are up and running within an hour. Complex migrations take a day at most.</p></div></li>
      <li style="display:grid;grid-template-columns:48px 1fr;gap:20px;counter-increment:faq;"><div style="width:40px;height:40px;border-radius:50%;background:${ACCENT};color:#fff;display:flex;align-items:center;justify-content:center;font-weight:700;">2</div><div><h3 style="font-size:18px;font-weight:600;color:${TEXT_PRIMARY};margin:0 0 8px;">What if I need a custom feature?</h3><p style="color:${TEXT_MUTED};line-height:1.6;margin:0;">Enterprise plans include custom development. Talk to our team about your requirements.</p></div></li>
      <li style="display:grid;grid-template-columns:48px 1fr;gap:20px;counter-increment:faq;"><div style="width:40px;height:40px;border-radius:50%;background:${ACCENT};color:#fff;display:flex;align-items:center;justify-content:center;font-weight:700;">3</div><div><h3 style="font-size:18px;font-weight:600;color:${TEXT_PRIMARY};margin:0 0 8px;">Do you offer a free trial?</h3><p style="color:${TEXT_MUTED};line-height:1.6;margin:0;">Yes — 14 days, full access, no credit card required.</p></div></li>
      <li style="display:grid;grid-template-columns:48px 1fr;gap:20px;counter-increment:faq;"><div style="width:40px;height:40px;border-radius:50%;background:${ACCENT};color:#fff;display:flex;align-items:center;justify-content:center;font-weight:700;">4</div><div><h3 style="font-size:18px;font-weight:600;color:${TEXT_PRIMARY};margin:0 0 8px;">Is my data secure?</h3><p style="color:${TEXT_MUTED};line-height:1.6;margin:0;">SOC2 Type II certified. Data is encrypted at rest and in transit.</p></div></li>
    </ol>
  </div>
</section>`;

const faqSidenav = `
<section data-aqb-section="faq-sidenav" style="padding:${PAD};background:${BG_WHITE};">
  <div style="${INNER}">
    <h2 style="font-size:36px;font-weight:700;color:${TEXT_PRIMARY};text-align:center;margin:0 0 40px;">Help center</h2>
    <div style="display:grid;grid-template-columns:220px 1fr;gap:48px;">
      <aside style="border-right:1px solid ${BORDER};padding-right:24px;">
        <div style="display:flex;flex-direction:column;gap:4px;">
          <a href="#" style="padding:10px 12px;border-radius:8px;background:${BG_LIGHT};color:${ACCENT};text-decoration:none;font-weight:600;font-size:14px;">Getting started</a>
          <a href="#" style="padding:10px 12px;border-radius:8px;color:${TEXT_MUTED};text-decoration:none;font-size:14px;">Account & billing</a>
          <a href="#" style="padding:10px 12px;border-radius:8px;color:${TEXT_MUTED};text-decoration:none;font-size:14px;">Publishing</a>
          <a href="#" style="padding:10px 12px;border-radius:8px;color:${TEXT_MUTED};text-decoration:none;font-size:14px;">Integrations</a>
          <a href="#" style="padding:10px 12px;border-radius:8px;color:${TEXT_MUTED};text-decoration:none;font-size:14px;">Security</a>
        </div>
      </aside>
      <div style="display:flex;flex-direction:column;gap:16px;">
        <div><h3 style="font-size:18px;font-weight:600;color:${TEXT_PRIMARY};margin:0 0 6px;">How do I create my first page?</h3><p style="color:${TEXT_MUTED};line-height:1.6;margin:0;">Head to Pages in the left rail and click New. Pick a template, or start from a blank canvas.</p></div>
        <div><h3 style="font-size:18px;font-weight:600;color:${TEXT_PRIMARY};margin:0 0 6px;">How do I invite my team?</h3><p style="color:${TEXT_MUTED};line-height:1.6;margin:0;">Open Settings → Team and send email invites. Roles can be set per-member.</p></div>
        <div><h3 style="font-size:18px;font-weight:600;color:${TEXT_PRIMARY};margin:0 0 6px;">How do I connect a custom domain?</h3><p style="color:${TEXT_MUTED};line-height:1.6;margin:0;">Project Settings → Domains → Add. Point your DNS to our CNAME and SSL provisions automatically.</p></div>
      </div>
    </div>
  </div>
</section>`;

// ─── CTA ────────────────────────────────────────────────────────────────────

const ctaCentered = `
<section data-aqb-section="cta-centered" style="padding:${PAD};background:${BG_LIGHT};text-align:center;">
  <div style="${INNER}max-width:680px;">
    <h2 style="font-size:40px;font-weight:700;color:${TEXT_PRIMARY};margin:0 0 16px;">Ready to get started?</h2>
    <p style="font-size:18px;color:${TEXT_MUTED};margin:0 0 32px;">Join thousands of teams shipping faster.</p>
    <a href="#" style="display:inline-block;padding:16px 40px;background:${ACCENT};color:#fff;font-size:16px;font-weight:600;border-radius:8px;text-decoration:none;">Start your free trial</a>
  </div>
</section>`;

const ctaSplit = `
<section data-aqb-section="cta-split" style="padding:${PAD};background:${BG_DARK};">
  <div style="${INNER}display:grid;grid-template-columns:2fr 1fr;gap:32px;align-items:center;">
    <div><h2 style="font-size:36px;font-weight:700;color:#fff;margin:0 0 12px;">Ship your first page in 5 minutes</h2><p style="color:rgba(255,255,255,0.8);font-size:18px;margin:0;">No credit card. No commitment. Just building.</p></div>
    <div style="text-align:right;"><a href="#" style="display:inline-block;padding:16px 32px;background:#fff;color:${TEXT_PRIMARY};font-weight:600;border-radius:8px;text-decoration:none;">Get started →</a></div>
  </div>
</section>`;

const ctaBanner = `
<section data-aqb-section="cta-banner" style="padding:20px 24px;background:${ACCENT};color:#fff;">
  <div style="${INNER}display:flex;align-items:center;justify-content:space-between;gap:16px;flex-wrap:wrap;">
    <p style="margin:0;font-weight:500;">🚀 New: v2 is live with 10x faster build times</p>
    <a href="#" style="color:#fff;text-decoration:underline;font-weight:600;">Read the changelog →</a>
  </div>
</section>`;

const ctaEmail = `
<section data-aqb-section="cta-email" style="padding:${PAD};background:${BG_WHITE};text-align:center;">
  <div style="${INNER}max-width:560px;">
    <h2 style="font-size:32px;font-weight:700;color:${TEXT_PRIMARY};margin:0 0 12px;">Get the newsletter</h2>
    <p style="color:${TEXT_MUTED};margin:0 0 24px;">One email a week. No spam. Unsubscribe anytime.</p>
    <form style="display:flex;gap:8px;max-width:420px;margin:0 auto;"><input type="email" placeholder="you@example.com" style="flex:1;padding:14px 16px;border:1px solid ${BORDER};border-radius:8px;font-size:15px;"/><button type="submit" style="padding:14px 24px;background:${ACCENT};color:#fff;border:0;border-radius:8px;font-weight:600;cursor:pointer;">Subscribe</button></form>
  </div>
</section>`;

const ctaDual = `
<section data-aqb-section="cta-dual" style="padding:${PAD};background:${BG_LIGHT};text-align:center;">
  <div style="${INNER}max-width:720px;">
    <h2 style="font-size:40px;font-weight:700;color:${TEXT_PRIMARY};margin:0 0 16px;">Two paths to get started</h2>
    <p style="font-size:18px;color:${TEXT_MUTED};margin:0 0 40px;">Try it yourself, or let us show you around.</p>
    <div style="display:grid;grid-template-columns:1fr 1fr;gap:20px;max-width:560px;margin:0 auto;">
      <a href="#" style="display:block;padding:24px;background:${ACCENT};color:#fff;border-radius:12px;text-decoration:none;">
        <div style="font-size:18px;font-weight:700;margin-bottom:4px;">Start free</div>
        <div style="font-size:13px;opacity:0.9;">No credit card required</div>
      </a>
      <a href="#" style="display:block;padding:24px;background:${BG_WHITE};color:${TEXT_PRIMARY};border:1px solid ${BORDER};border-radius:12px;text-decoration:none;">
        <div style="font-size:18px;font-weight:700;margin-bottom:4px;">Book a demo</div>
        <div style="font-size:13px;color:${TEXT_MUTED};">See it live in 20 minutes</div>
      </a>
    </div>
  </div>
</section>`;

const ctaGradient = `
<section data-aqb-section="cta-gradient" style="padding:120px 24px;background:linear-gradient(135deg,${ACCENT} 0%,#7c3aed 100%);text-align:center;">
  <div style="${INNER}max-width:720px;">
    <h2 style="font-size:48px;font-weight:700;color:#fff;line-height:1.15;margin:0 0 16px;">Start building today</h2>
    <p style="font-size:20px;color:rgba(255,255,255,0.9);line-height:1.5;margin:0 0 32px;">Your next website is five minutes away.</p>
    <a href="#" style="display:inline-block;padding:18px 40px;background:#fff;color:${ACCENT};font-size:16px;font-weight:700;border-radius:10px;text-decoration:none;">Get started free</a>
  </div>
</section>`;

// ─── CONTACT ────────────────────────────────────────────────────────────────

const contactForm = `
<section data-aqb-section="contact-form" style="padding:${PAD};background:${BG_WHITE};">
  <div style="${INNER}max-width:560px;">
    <div style="text-align:center;margin-bottom:40px;">
      <h2 style="font-size:36px;font-weight:700;color:${TEXT_PRIMARY};margin:0 0 12px;">Get in touch</h2>
      <p style="font-size:18px;color:${TEXT_MUTED};margin:0;">We'd love to hear from you. Reply within 24 hours.</p>
    </div>
    <form style="display:flex;flex-direction:column;gap:16px;">
      <div><label style="display:block;font-size:14px;font-weight:600;color:${TEXT_PRIMARY};margin-bottom:6px;">Name</label><input type="text" placeholder="Your name" style="width:100%;padding:12px 14px;border:1px solid ${BORDER};border-radius:8px;font-size:15px;box-sizing:border-box;"/></div>
      <div><label style="display:block;font-size:14px;font-weight:600;color:${TEXT_PRIMARY};margin-bottom:6px;">Email</label><input type="email" placeholder="you@example.com" style="width:100%;padding:12px 14px;border:1px solid ${BORDER};border-radius:8px;font-size:15px;box-sizing:border-box;"/></div>
      <div><label style="display:block;font-size:14px;font-weight:600;color:${TEXT_PRIMARY};margin-bottom:6px;">Message</label><textarea rows="5" placeholder="How can we help?" style="width:100%;padding:12px 14px;border:1px solid ${BORDER};border-radius:8px;font-size:15px;box-sizing:border-box;resize:vertical;font-family:inherit;"></textarea></div>
      <button type="submit" style="padding:14px 24px;background:${ACCENT};color:#fff;border:0;border-radius:8px;font-size:15px;font-weight:600;cursor:pointer;margin-top:8px;">Send message</button>
    </form>
  </div>
</section>`;

const contactFormMap = `
<section data-aqb-section="contact-form-map" style="padding:${PAD};background:${BG_LIGHT};">
  <div style="${INNER}">
    <div style="text-align:center;margin-bottom:40px;">
      <h2 style="font-size:36px;font-weight:700;color:${TEXT_PRIMARY};margin:0 0 12px;">Say hello</h2>
      <p style="font-size:18px;color:${TEXT_MUTED};margin:0;">Send a note, or drop by the studio.</p>
    </div>
    <div style="display:grid;grid-template-columns:1fr 1fr;gap:32px;align-items:stretch;">
      <form style="display:flex;flex-direction:column;gap:14px;padding:32px;background:${BG_WHITE};border-radius:16px;border:1px solid ${BORDER};">
        <input type="text" placeholder="Name" style="padding:12px 14px;border:1px solid ${BORDER};border-radius:8px;font-size:15px;"/>
        <input type="email" placeholder="Email" style="padding:12px 14px;border:1px solid ${BORDER};border-radius:8px;font-size:15px;"/>
        <textarea rows="5" placeholder="Message" style="padding:12px 14px;border:1px solid ${BORDER};border-radius:8px;font-size:15px;resize:vertical;font-family:inherit;"></textarea>
        <button type="submit" style="padding:14px 24px;background:${ACCENT};color:#fff;border:0;border-radius:8px;font-weight:600;cursor:pointer;">Send</button>
      </form>
      <div style="background:${BG_WHITE};border:1px solid ${BORDER};border-radius:16px;min-height:400px;display:flex;align-items:center;justify-content:center;color:${TEXT_MUTED};font-size:14px;background-image:repeating-linear-gradient(45deg,${BG_WHITE},${BG_WHITE} 10px,${BG_LIGHT} 10px,${BG_LIGHT} 20px);">Map placeholder</div>
    </div>
  </div>
</section>`;

const contactInfoCards = `
<section data-aqb-section="contact-info-cards" style="padding:${PAD};background:${BG_WHITE};">
  <div style="${INNER}">
    <div style="text-align:center;margin-bottom:48px;">
      <h2 style="font-size:36px;font-weight:700;color:${TEXT_PRIMARY};margin:0 0 12px;">Contact us</h2>
      <p style="font-size:18px;color:${TEXT_MUTED};margin:0;">Reach out through any channel that works for you.</p>
    </div>
    <div style="display:grid;grid-template-columns:repeat(3,1fr);gap:24px;">
      <div style="padding:32px;background:${BG_LIGHT};border:1px solid ${BORDER};border-radius:16px;text-align:center;"><div style="width:48px;height:48px;background:${ACCENT};border-radius:12px;margin:0 auto 20px;"></div><div style="font-size:13px;font-weight:600;color:${TEXT_MUTED};text-transform:uppercase;letter-spacing:0.08em;margin-bottom:6px;">Email</div><div style="font-size:16px;font-weight:600;color:${TEXT_PRIMARY};">hello@company.com</div></div>
      <div style="padding:32px;background:${BG_LIGHT};border:1px solid ${BORDER};border-radius:16px;text-align:center;"><div style="width:48px;height:48px;background:${ACCENT};border-radius:12px;margin:0 auto 20px;"></div><div style="font-size:13px;font-weight:600;color:${TEXT_MUTED};text-transform:uppercase;letter-spacing:0.08em;margin-bottom:6px;">Phone</div><div style="font-size:16px;font-weight:600;color:${TEXT_PRIMARY};">+1 555 0100</div></div>
      <div style="padding:32px;background:${BG_LIGHT};border:1px solid ${BORDER};border-radius:16px;text-align:center;"><div style="width:48px;height:48px;background:${ACCENT};border-radius:12px;margin:0 auto 20px;"></div><div style="font-size:13px;font-weight:600;color:${TEXT_MUTED};text-transform:uppercase;letter-spacing:0.08em;margin-bottom:6px;">Address</div><div style="font-size:16px;font-weight:600;color:${TEXT_PRIMARY};">123 Main St, SF</div></div>
    </div>
  </div>
</section>`;

const contactHero = `
<section data-aqb-section="contact-hero" style="padding:140px 24px;background:${BG_WHITE};text-align:center;">
  <div style="${INNER}max-width:720px;">
    <p style="font-size:14px;font-weight:600;color:${ACCENT};letter-spacing:0.08em;text-transform:uppercase;margin:0 0 16px;">Contact</p>
    <h1 style="font-size:56px;font-weight:700;color:${TEXT_PRIMARY};line-height:1.1;margin:0 0 20px;">Let's talk</h1>
    <p style="font-size:20px;color:${TEXT_MUTED};line-height:1.6;margin:0 0 32px;">We reply within 24 hours, usually much faster. Real humans, no tickets.</p>
    <a href="mailto:hello@company.com" style="display:inline-block;padding:16px 32px;background:${ACCENT};color:#fff;font-weight:600;border-radius:8px;text-decoration:none;">Email us</a>
  </div>
</section>`;

const contactLocations = `
<section data-aqb-section="contact-locations" style="padding:${PAD};background:${BG_LIGHT};">
  <div style="${INNER}">
    <div style="text-align:center;margin-bottom:48px;">
      <h2 style="font-size:36px;font-weight:700;color:${TEXT_PRIMARY};margin:0 0 12px;">Our offices</h2>
      <p style="font-size:18px;color:${TEXT_MUTED};margin:0;">Find us in person, anywhere in the world.</p>
    </div>
    <div style="display:grid;grid-template-columns:repeat(3,1fr);gap:24px;">
      <div style="padding:24px;background:${BG_WHITE};border:1px solid ${BORDER};border-radius:8px;"><div style="font-size:20px;font-weight:600;color:${TEXT_PRIMARY};margin-bottom:12px;">San Francisco</div><p style="font-size:14px;color:${TEXT_MUTED};line-height:1.6;margin:0 0 8px;">123 Market Street<br>San Francisco, CA 94103</p><p style="font-size:14px;color:${TEXT_MUTED};margin:0;">+1 415 555 0100</p></div>
      <div style="padding:24px;background:${BG_WHITE};border:1px solid ${BORDER};border-radius:8px;"><div style="font-size:20px;font-weight:600;color:${TEXT_PRIMARY};margin-bottom:12px;">London</div><p style="font-size:14px;color:${TEXT_MUTED};line-height:1.6;margin:0 0 8px;">45 Old Street<br>London EC1V 9HX</p><p style="font-size:14px;color:${TEXT_MUTED};margin:0;">+44 20 7946 0200</p></div>
      <div style="padding:24px;background:${BG_WHITE};border:1px solid ${BORDER};border-radius:8px;"><div style="font-size:20px;font-weight:600;color:${TEXT_PRIMARY};margin-bottom:12px;">Tokyo</div><p style="font-size:14px;color:${TEXT_MUTED};line-height:1.6;margin:0 0 8px;">2-1-1 Shibuya<br>Shibuya-ku, Tokyo 150-0002</p><p style="font-size:14px;color:${TEXT_MUTED};margin:0;">+81 3 5778 0300</p></div>
    </div>
  </div>
</section>`;

const contactSupport = `
<section data-aqb-section="contact-support" style="padding:${PAD};background:${BG_WHITE};">
  <div style="${INNER}max-width:560px;">
    <div style="padding:48px;background:${BG_LIGHT};border:1px solid ${BORDER};border-radius:16px;text-align:center;">
      <div style="width:64px;height:64px;background:${ACCENT};border-radius:16px;margin:0 auto 20px;"></div>
      <h3 style="font-size:28px;font-weight:700;color:${TEXT_PRIMARY};margin:0 0 12px;">Need help?</h3>
      <p style="font-size:16px;color:${TEXT_MUTED};line-height:1.6;margin:0 0 28px;">Our support team replies in under 1 hour during business hours. Real engineers, no scripts.</p>
      <div style="display:flex;gap:12px;justify-content:center;flex-wrap:wrap;">
        <a href="#" style="display:inline-block;padding:14px 24px;background:${ACCENT};color:#fff;font-weight:600;border-radius:8px;text-decoration:none;">Email support</a>
        <a href="#" style="display:inline-block;padding:14px 24px;background:${BG_WHITE};color:${TEXT_PRIMARY};font-weight:600;border:1px solid ${BORDER};border-radius:8px;text-decoration:none;">Live chat</a>
      </div>
    </div>
  </div>
</section>`;

// ─── FOOTERS ────────────────────────────────────────────────────────────────

const footerSimple = `
<footer data-aqb-section="footer-simple" style="padding:40px 24px;background:${BG_LIGHT};border-top:1px solid ${BORDER};">
  <div style="${INNER}display:flex;justify-content:space-between;align-items:center;flex-wrap:wrap;gap:16px;">
    <div style="color:${TEXT_MUTED};font-size:14px;">© 2026 Your Company. All rights reserved.</div>
    <div style="display:flex;gap:24px;"><a href="#" style="color:${TEXT_MUTED};text-decoration:none;font-size:14px;">Privacy</a><a href="#" style="color:${TEXT_MUTED};text-decoration:none;font-size:14px;">Terms</a><a href="#" style="color:${TEXT_MUTED};text-decoration:none;font-size:14px;">Contact</a></div>
  </div>
</footer>`;

const footerMultiCol = `
<footer data-aqb-section="footer-multi-col" style="padding:60px 24px 40px;background:${BG_DARK};color:#fff;">
  <div style="${INNER}display:grid;grid-template-columns:2fr 1fr 1fr 1fr;gap:48px;margin-bottom:40px;">
    <div><div style="font-size:20px;font-weight:700;margin-bottom:12px;">Company</div><p style="color:rgba(255,255,255,0.7);font-size:14px;line-height:1.6;margin:0;">One-line company tagline that captures the mission.</p></div>
    <div><div style="font-size:13px;text-transform:uppercase;letter-spacing:0.06em;color:rgba(255,255,255,0.5);margin-bottom:16px;">Product</div><div style="display:flex;flex-direction:column;gap:8px;"><a href="#" style="color:rgba(255,255,255,0.8);text-decoration:none;font-size:14px;">Features</a><a href="#" style="color:rgba(255,255,255,0.8);text-decoration:none;font-size:14px;">Pricing</a><a href="#" style="color:rgba(255,255,255,0.8);text-decoration:none;font-size:14px;">Changelog</a></div></div>
    <div><div style="font-size:13px;text-transform:uppercase;letter-spacing:0.06em;color:rgba(255,255,255,0.5);margin-bottom:16px;">Company</div><div style="display:flex;flex-direction:column;gap:8px;"><a href="#" style="color:rgba(255,255,255,0.8);text-decoration:none;font-size:14px;">About</a><a href="#" style="color:rgba(255,255,255,0.8);text-decoration:none;font-size:14px;">Blog</a><a href="#" style="color:rgba(255,255,255,0.8);text-decoration:none;font-size:14px;">Careers</a></div></div>
    <div><div style="font-size:13px;text-transform:uppercase;letter-spacing:0.06em;color:rgba(255,255,255,0.5);margin-bottom:16px;">Legal</div><div style="display:flex;flex-direction:column;gap:8px;"><a href="#" style="color:rgba(255,255,255,0.8);text-decoration:none;font-size:14px;">Privacy</a><a href="#" style="color:rgba(255,255,255,0.8);text-decoration:none;font-size:14px;">Terms</a></div></div>
  </div>
  <div style="${INNER}padding-top:24px;border-top:1px solid rgba(255,255,255,0.1);color:rgba(255,255,255,0.5);font-size:13px;">© 2026 Your Company</div>
</footer>`;

const footerMinimal = `
<footer data-aqb-section="footer-minimal" style="padding:32px 24px;background:${BG_WHITE};border-top:1px solid ${BORDER};text-align:center;">
  <div style="${INNER}">
    <div style="color:${TEXT_MUTED};font-size:14px;margin-bottom:12px;">© 2026 Your Company</div>
    <div style="display:flex;gap:16px;justify-content:center;"><a href="#" style="color:${TEXT_MUTED};text-decoration:none;">𝕏</a><a href="#" style="color:${TEXT_MUTED};text-decoration:none;">in</a><a href="#" style="color:${TEXT_MUTED};text-decoration:none;">GitHub</a></div>
  </div>
</footer>`;

const footerNewsletter = `
<footer data-aqb-section="footer-newsletter" style="background:${BG_LIGHT};">
  <div style="padding:40px 24px;text-align:center;border-bottom:1px solid ${BORDER};"><div style="${INNER}max-width:520px;"><h3 style="color:${TEXT_PRIMARY};margin:0 0 8px;">Stay in the loop</h3><p style="color:${TEXT_MUTED};margin:0 0 16px;">Monthly product updates.</p><form style="display:flex;gap:8px;"><input type="email" placeholder="Email address" style="flex:1;padding:12px;border:1px solid ${BORDER};border-radius:8px;"/><button type="submit" style="padding:12px 20px;background:${ACCENT};color:#fff;border:0;border-radius:8px;font-weight:600;cursor:pointer;">Subscribe</button></form></div></div>
  <div style="padding:32px 24px;${INNER}display:grid;grid-template-columns:repeat(3,1fr);gap:32px;">
    <div><strong style="color:${TEXT_PRIMARY};display:block;margin-bottom:12px;">Product</strong><div style="display:flex;flex-direction:column;gap:6px;"><a href="#" style="color:${TEXT_MUTED};text-decoration:none;font-size:14px;">Features</a><a href="#" style="color:${TEXT_MUTED};text-decoration:none;font-size:14px;">Pricing</a></div></div>
    <div><strong style="color:${TEXT_PRIMARY};display:block;margin-bottom:12px;">Company</strong><div style="display:flex;flex-direction:column;gap:6px;"><a href="#" style="color:${TEXT_MUTED};text-decoration:none;font-size:14px;">About</a><a href="#" style="color:${TEXT_MUTED};text-decoration:none;font-size:14px;">Blog</a></div></div>
    <div><strong style="color:${TEXT_PRIMARY};display:block;margin-bottom:12px;">Legal</strong><div style="display:flex;flex-direction:column;gap:6px;"><a href="#" style="color:${TEXT_MUTED};text-decoration:none;font-size:14px;">Privacy</a><a href="#" style="color:${TEXT_MUTED};text-decoration:none;font-size:14px;">Terms</a></div></div>
  </div>
  <div style="padding:16px 24px;background:${BG_WHITE};border-top:1px solid ${BORDER};text-align:center;color:${TEXT_MUTED};font-size:13px;">© 2026 Your Company</div>
</footer>`;

const footerSocial = `
<footer data-aqb-section="footer-social" style="padding:40px 24px;background:${BG_LIGHT};border-top:1px solid ${BORDER};">
  <div style="${INNER}display:flex;justify-content:space-between;align-items:center;flex-wrap:wrap;gap:16px;">
    <div style="color:${TEXT_MUTED};font-size:14px;">© 2026 Your Company. All rights reserved.</div>
    <div style="display:flex;gap:12px;">
      <a href="#" style="width:36px;height:36px;border-radius:8px;background:${BG_WHITE};border:1px solid ${BORDER};display:flex;align-items:center;justify-content:center;color:${TEXT_MUTED};text-decoration:none;font-size:14px;">𝕏</a>
      <a href="#" style="width:36px;height:36px;border-radius:8px;background:${BG_WHITE};border:1px solid ${BORDER};display:flex;align-items:center;justify-content:center;color:${TEXT_MUTED};text-decoration:none;font-size:14px;">in</a>
      <a href="#" style="width:36px;height:36px;border-radius:8px;background:${BG_WHITE};border:1px solid ${BORDER};display:flex;align-items:center;justify-content:center;color:${TEXT_MUTED};text-decoration:none;font-size:14px;">gh</a>
      <a href="#" style="width:36px;height:36px;border-radius:8px;background:${BG_WHITE};border:1px solid ${BORDER};display:flex;align-items:center;justify-content:center;color:${TEXT_MUTED};text-decoration:none;font-size:14px;">yt</a>
    </div>
  </div>
</footer>`;

const footerLogoLinks = `
<footer data-aqb-section="footer-logo-links" style="padding:48px 24px 32px;background:${BG_WHITE};border-top:1px solid ${BORDER};">
  <div style="${INNER}display:grid;grid-template-columns:2fr 1fr;gap:48px;margin-bottom:32px;">
    <div>
      <div style="font-size:22px;font-weight:700;color:${TEXT_PRIMARY};margin-bottom:12px;">Company</div>
      <p style="color:${TEXT_MUTED};font-size:14px;line-height:1.6;margin:0;max-width:360px;">Building tools that help teams ship the web faster. Made with care in 40+ countries.</p>
    </div>
    <div>
      <div style="font-size:13px;text-transform:uppercase;letter-spacing:0.06em;color:${TEXT_MUTED};margin-bottom:16px;">Links</div>
      <div style="display:flex;flex-direction:column;gap:8px;">
        <a href="#" style="color:${TEXT_PRIMARY};text-decoration:none;font-size:14px;">Product</a>
        <a href="#" style="color:${TEXT_PRIMARY};text-decoration:none;font-size:14px;">Pricing</a>
        <a href="#" style="color:${TEXT_PRIMARY};text-decoration:none;font-size:14px;">Docs</a>
        <a href="#" style="color:${TEXT_PRIMARY};text-decoration:none;font-size:14px;">Contact</a>
      </div>
    </div>
  </div>
  <div style="${INNER}padding-top:20px;border-top:1px solid ${BORDER};color:${TEXT_MUTED};font-size:13px;">© 2026 Your Company</div>
</footer>`;

export const SECTION_CARDS: SectionCard[] = [
  // ─── Hero ───
  { id: "hero-split", familyId: "hero", name: "Split Hero", sub: "Two-column layout with headline, body, and CTA button", html: heroSplit },
  { id: "hero-centered", familyId: "hero", name: "Centered Hero", sub: "Full-width centered headline, subtext, and dual CTA", html: heroCentered },
  { id: "hero-media", familyId: "hero", name: "Media Hero", sub: "Large background image or video with overlay text", html: heroMedia },
  { id: "hero-minimal", familyId: "hero", name: "Minimal Hero", sub: "Text-only hero with tight typographic hierarchy", html: heroMinimal },
  { id: "hero-gradient", familyId: "hero", name: "Gradient Hero", sub: "Full-bleed gradient background with centered copy", html: heroGradient },
  { id: "hero-video-bg", familyId: "hero", name: "Video Background Hero", sub: "Video placeholder background with overlay headline", html: heroVideoBg },

  // ─── About ───
  { id: "about-intro", familyId: "about", name: "About Intro", sub: "Headline + story + author avatar", html: aboutIntro },
  { id: "about-mission", familyId: "about", name: "Mission Statement", sub: "Centered mission in large type", html: aboutMission },
  { id: "about-team-grid", familyId: "about", name: "Team Grid", sub: "3-column grid of team cards", html: aboutTeamGrid },
  { id: "about-team-bios", familyId: "about", name: "Team with Bios", sub: "2-column alternating photo + bio", html: aboutTeamBios },
  { id: "about-timeline", familyId: "about", name: "Company Timeline", sub: "Vertical timeline with year markers", html: aboutTimeline },
  { id: "about-values", familyId: "about", name: "Values Grid", sub: "3-column grid of company values", html: aboutValues },

  // ─── Features ───
  { id: "features-3col", familyId: "features", name: "3-Column Features", sub: "Three feature cards with icon, title, and description", html: featuresGrid },
  { id: "features-icon-list", familyId: "features", name: "Icon List", sub: "Vertical list of features with inline icons", html: featuresIconList },
  { id: "features-comparison", familyId: "features", name: "Comparison Grid", sub: "Side-by-side feature comparison with checkmarks", html: featuresComparison },
  { id: "features-alternating", familyId: "features", name: "Alternating Rows", sub: "Image and text alternating left/right down the page", html: featuresAlternating },
  { id: "features-bento", familyId: "features", name: "Bento Grid", sub: "Asymmetric tile layout — 1 large + 4 small", html: featuresBento },
  { id: "features-accordion", familyId: "features", name: "Feature Accordion", sub: "Expandable feature rows", html: featuresAccordion },

  // ─── Testimonials (renamed from social-proof) ───
  { id: "social-testimonial-single", familyId: "testimonials", name: "Testimonial — Single", sub: "One large quote with author avatar and attribution", html: socialTestimonialSingle },
  { id: "social-testimonial-grid", familyId: "testimonials", name: "Testimonial Grid", sub: "2–3 column grid of quote cards", html: socialTestimonialGrid },
  { id: "social-logo-strip", familyId: "testimonials", name: "Logo Strip", sub: "Row of client or partner logos in muted style", html: socialLogoStrip },
  { id: "social-stats", familyId: "testimonials", name: "Stats Row", sub: "Three to four key metrics with large numbers", html: socialStats },
  { id: "testimonials-video", familyId: "testimonials", name: "Video Testimonial", sub: "Large quote + video thumbnail placeholder", html: testimonialsVideo },
  { id: "testimonials-carousel", familyId: "testimonials", name: "Carousel Testimonials", sub: "3 visible cards in a horizontal row", html: testimonialsCarousel },

  // ─── Pricing ───
  { id: "pricing-single", familyId: "pricing", name: "Single Plan", sub: "One pricing tier with feature list and CTA", html: pricingSingle },
  { id: "pricing-2col", familyId: "pricing", name: "2-Column Plans", sub: "Two pricing tiers side by side", html: pricing2col },
  { id: "pricing-3col", familyId: "pricing", name: "3-Column Plans", sub: "Three tiers with one highlighted as recommended", html: pricing3col },
  { id: "pricing-toggle", familyId: "pricing", name: "Toggle Pricing", sub: "Monthly/annual toggle with price cards below", html: pricingToggle },
  { id: "pricing-comparison", familyId: "pricing", name: "Feature Comparison", sub: "Plans × features comparison table", html: pricingComparison },
  { id: "pricing-enterprise", familyId: "pricing", name: "Enterprise CTA", sub: "Large contact-sales card", html: pricingEnterprise },

  // ─── FAQ ───
  { id: "faq-accordion", familyId: "faq", name: "Accordion FAQ", sub: "Expandable question/answer rows stacked vertically", html: faqAccordion },
  { id: "faq-2col", familyId: "faq", name: "2-Column FAQ", sub: "Questions split into two columns for dense layouts", html: faq2col },
  { id: "faq-with-cta", familyId: "faq", name: "FAQ + Support CTA", sub: "Accordion FAQ with a contact-support call to action below", html: faqWithCta },
  { id: "faq-categories", familyId: "faq", name: "Categorized FAQ", sub: "FAQ grouped under labeled category headings", html: faqCategories },
  { id: "faq-numbered", familyId: "faq", name: "Numbered FAQ", sub: "1. 2. 3. style numbered list", html: faqNumbered },
  { id: "faq-sidenav", familyId: "faq", name: "Side-nav FAQ", sub: "Categories on left, answers on right", html: faqSidenav },

  // ─── CTA ───
  { id: "cta-centered", familyId: "cta", name: "Centered CTA", sub: "Full-width centered headline and primary button", html: ctaCentered },
  { id: "cta-split", familyId: "cta", name: "Split CTA", sub: "Text on left, action area on right", html: ctaSplit },
  { id: "cta-banner", familyId: "cta", name: "Banner CTA", sub: "Narrow full-width bar with text and button", html: ctaBanner },
  { id: "cta-email", familyId: "cta", name: "Email Capture", sub: "Headline with email input and subscribe button", html: ctaEmail },
  { id: "cta-dual", familyId: "cta", name: "Dual CTA", sub: "Two big buttons side-by-side", html: ctaDual },
  { id: "cta-gradient", familyId: "cta", name: "Gradient CTA", sub: "Full-bleed gradient background", html: ctaGradient },

  // ─── Contact ───
  { id: "contact-form", familyId: "contact", name: "Contact Form", sub: "Simple full-width contact form", html: contactForm },
  { id: "contact-form-map", familyId: "contact", name: "Form + Map", sub: "Contact form + map placeholder", html: contactFormMap },
  { id: "contact-info-cards", familyId: "contact", name: "Contact Info Cards", sub: "Email, Phone, Address cards", html: contactInfoCards },
  { id: "contact-hero", familyId: "contact", name: "Contact Hero", sub: "Big headline + CTA, no form", html: contactHero },
  { id: "contact-locations", familyId: "contact", name: "Office Locations", sub: "2-3 office cards", html: contactLocations },
  { id: "contact-support", familyId: "contact", name: "Support CTA", sub: "Need help? Support CTA card", html: contactSupport },

  // ─── Footers ───
  { id: "footer-simple", familyId: "footers", name: "Simple Footer", sub: "Logo, copyright, and a few nav links in one row", html: footerSimple },
  { id: "footer-multi-col", familyId: "footers", name: "Multi-Column Footer", sub: "Logo column plus 3–4 link group columns", html: footerMultiCol },
  { id: "footer-minimal", familyId: "footers", name: "Minimal Footer", sub: "Copyright line with social icons, no nav columns", html: footerMinimal },
  { id: "footer-newsletter", familyId: "footers", name: "Newsletter Footer", sub: "Email signup above a multi-column footer", html: footerNewsletter },
  { id: "footer-social", familyId: "footers", name: "Minimal + Social", sub: "Copyright + 4 social icon placeholders in one row", html: footerSocial },
  { id: "footer-logo-links", familyId: "footers", name: "Logo + Links", sub: "2 columns — logo + 1 link group", html: footerLogoLinks },
];

/**
 * Pre-grouped section cards by family id — module-level so consumers read
 * `SECTION_CARDS_BY_FAMILY[familyId]` in O(1) instead of re-filtering
 * SECTION_CARDS on every render.
 */
export const SECTION_CARDS_BY_FAMILY: Record<string, SectionCard[]> = SECTION_CARDS.reduce(
  (acc, card) => {
    (acc[card.familyId] ??= []).push(card);
    return acc;
  },
  {} as Record<string, SectionCard[]>
);

/** Returns all cards for a given family id */
export function getSectionCardsByFamily(familyId: string): SectionCard[] {
  return SECTION_CARDS_BY_FAMILY[familyId] ?? [];
}

/** Returns a card by its id (for insert + drop handlers) */
export function getSectionCardById(cardId: string): SectionCard | undefined {
  return SECTION_CARDS.find((c) => c.id === cardId);
}
