# Build-prompt — full SaaS agency home page (modeled on ranklur.com)

> This is a complete, copy-paste build brief for ONE home page. It follows the
> vibcoder build-prompt shape (CONTEXT/check-first · WHAT · WHERE · DON'T-BREAK ·
> DONE · VERIFY) but scaled to a whole page: every section is specified so the AI
> can't guess. Swap the brand tokens + copy where marked `‹swap›`.

---

## ▶ PASTE THIS TO THE BUILD AGENT

**CONTEXT.** Build a complete, single-scroll marketing home page for a premium SaaS SEO agency ("Ranklur"). Section structure is fixed (below). **Check first:** read the existing stack, components, and brand tokens before writing anything — reuse what's there, don't reinvent a design system. If none exists, scaffold Next.js (App Router) + Tailwind + Framer Motion.

**STACK & RULES.**
- Next.js App Router + TypeScript + Tailwind + Framer Motion (motion) + `next/image` + `next/font`.
- Fully responsive (mobile-first; test 375 / 768 / 1280). Semantic HTML + ARIA. Lighthouse a11y ≥ 95.
- One component per section in `components/home/`, composed in `app/page.tsx`. No 1000-line files.
- **No placeholder lorem in the visible copy** — use the real copy below.

**AESTHETIC (design system — define as tokens, use everywhere).**
- **Color:** dark premium base `#0B0F17` (near-black navy) · surface `#141A24` · text `#E8ECF2` / muted `#8A94A6` · **one accent** `‹swap: #2D6DFF cobalt›` (use ONLY for CTAs, links, metric highlights, focus rings). No second accent. No purple/violet.
- **Type:** display = a tight modern grotesk (`‹swap: General Sans / Geist›`), body/UI = `Inter`. Big bold headlines (clamp 40–72px), generous line-height on body (1.6). Mono (`Geist Mono`) for metrics/numbers only.
- **Space:** 8px base scale. Sections breathe — `py-24` desktop / `py-16` mobile. Max content width `1200px`, centered. Cards airy, never cramped.
- **Surface:** radius 16px on cards, 10px on buttons. Soft shadow only on hover. 1px hairline borders `rgba(255,255,255,0.08)`.
- **Tone:** trust-first, results-over-theatre. Premium, calm, NOT loud.

**GLOBAL ANIMATION SYSTEM (build these as reusable hooks/variants — every section uses them).**
1. **Scroll-reveal** (`useInViewReveal`): on enter viewport (15% visible, `once: true`) → fade-up: opacity 0→1, y 24px→0, 0.6s `easeOut`. Children stagger 80ms.
2. **Hero entrance** (on load): headline animates in word-by-word (stagger 60ms, y 20px→0). Subtle animated grain/gradient sheen behind hero. A "Scroll ↓" indicator gently bounces (2s loop).
3. **Sticky nav**: transparent over hero → solid `#0B0F17` + slight shrink (py 20→12) + bottom hairline once scrolled past hero. Smooth 0.3s.
4. **Metric count-up**: case-study/footer numbers count from 0 to target when first in view (1.2s, `easeOut`). e.g. "39 → 72", "+480%".
5. **Card hover**: lift `translateY(-4px)` + shadow + accent border, 0.2s. Service/case/testimonial cards.
6. **Logo marquee** ("as featured in"): seamless infinite horizontal scroll, pauses on hover.
- **ANTI-SLOP GUARDRAILS (do NOT violate):** respect `prefers-reduced-motion` (disable all motion → instant, no shift). No autoplay-with-sound. No parallax overload, no spinning/bouncing decals, no element animating more than once on scroll, no entrance delay > 0.8s. Motion serves hierarchy, it is not decoration.

---

### SECTIONS — in order, top to bottom

**1. Nav (sticky).** Left: `Ranklur®` wordmark. Center: Home · Services · Solutions · Case Studies · Pricing · Blog · About · Contact. Right: filled accent button **"Book Strategy Call"**. Mobile: hamburger → full-screen slide-in menu. *Animation: sticky-shrink (#3).*

**2. Hero.** Eyebrow: "SaaS SEO Agency". Headline (huge): **"The SaaS SEO Agency That Earns Rankings."** Sub: "DR 50+ backlinks, AI visibility, and full-stack SEO for SaaS founders tired of pretty reports and zero gains." CTA: **"Book Strategy Call"** (accent) + ghost **"Watch how it works"** (opens the video, #4). A row of 5 small overlapping team avatars + "Trusted by 200+ SaaS brands". Award badge chip: "SaaS SEO of the Year 2026". Bottom: "Scroll ↓" indicator. *Animation: hero entrance (#2).*

**3. Product / explainer VIDEO section.** Headline: "See the system in 90 seconds." A 16:9 video player, rounded 16px, accent play-button overlay on a poster image. **Use a SAMPLE video** (placeholder — swap later): `https://storage.googleapis.com/gtv-videos-bucket/sample/BigBuckBunny.mp4`, poster = a dark gradient placeholder. Click-to-play, muted by default, NO autoplay-sound. Add a `‹TODO: replace with real product demo video›` comment. *Animation: scroll-reveal (#1) + soft scale-in on the player.*

**4. Live ticker.** Small pill "● LIVE NOW" (accent dot, gentle pulse). Headline: "What's Happening at Ranklur Right Now." A horizontal auto-scrolling strip of recent wins ("Placed DR 71 link for ‹client›", "AI-cited in ChatGPT for ‹category›" …). *Animation: marquee (#6), pulse on the dot.*

**5. Guarantee (risk reversal).** Headline: **"We Take the Risk. You Take the Rankings."** Body: "Ranklur protects your investment with verifiable promises, not pretty reports. Month-to-month engagements, link replacement guarantees, and an honest fit check before we ever take your money. The risk lives on our side of the table." Then **3 cards**:
  - **12-Month Link Replacement** — "Month-to-month. No annual lock-ins. Links replaced free for 12 months if they drop. DR 50+ minimums written into every deal."
  - **Month-to-Month, Always** — "If a link we placed goes offline in the first year, we find a new one on a DR 50+ site — free, fast, no questions."
  - **Honest Fit Check** — "We say no when we're not the fit. Saying no protects results."
  *Animation: staggered scroll-reveal + card hover.*

**6. Services (9-card grid).** Eyebrow "Our Services". Headline: "Nine integrated layers of SaaS SEO under one accountable team." Sub: "Pick one, pick the stack." **3×3 grid**, each card = icon + name + 1-line desc + "Explore →":
  SaaS Link Building · Niche Guest Posts · Brand Mentions · AI SEO · SEO Content Writing · Technical SEO · SEO Audit · Full SEO · SaaS Product Development. *(Use the ranklur descriptions.)* *Animation: stagger-in, hover lift, accent "Explore →" slides on hover.*

**7. Case studies (4, metric-led).** Headline: "Results, not theatre." 4 cards, each = client · category/year · **big count-up metric**:
  SuperAnnotate (AI SaaS) — "DR 39 → 72 in 14 months" · E-Commerce Brand — "+480% organic revenue" · B2B Services — "+210% qualified leads" · RFP SaaS — "+400% organic traffic". *Animation: metric count-up (#4) when in view.*

**8. As featured in.** Small heading "As Featured In". A grayscale logo **marquee** (#6) — use 6–8 placeholder publication logos `‹swap›`, grayscale → full-color on hover.

**9. Testimonials (4).** Headline: "What our clients are saying." 4 quote cards (quote · avatar · name · title) — use the 4 ranklur quotes (Ina A. / Mark G. / B2B Founder / Sarah M.). CTA link "View latest projects →". *Animation: scroll-reveal, optional subtle auto-advance carousel on mobile.*

**10. Awards.** Headline: "Award-winning partnerships." Body: "We partner with brands that measure results, not theatre. Their wins drive ours." CTA: "See our awards →". A row of award badges `‹swap›`.

**11. About.** Headline: "A SaaS SEO Company Built Different." Body: "One team in Northampton, MA does it all. Month-to-month. Series A founders choose us when they want real work instead of PowerPoints." A loose collage / grid of 6–8 team photos `‹swap placeholders›`. *Animation: photos fade-up in stagger.*

**12. Contact (CTA + form).** Headline: "Get in touch." Sub: "Start the conversation by sharing your vision. We respond within 1–2 business days." Left: form (Name, Email, Company, Message) + **"Send Message"** (accent) + "By submitting, you agree to our Terms and Privacy Policy." Right: office `137 Damon Rd, Suite B, Northampton, MA 01060` · `+1 (413) 555-0100` · `hello@ranklur.com`. Form is client-side validated; on submit show a success state (no backend needed — `‹TODO: wire endpoint›`). *Animation: scroll-reveal; input focus = accent ring.*

**13. Footer.** Top: trust-badge row "✓ Massachusetts, USA · ✓ 200+ SaaS brands scaled · ✓ 30,000+ backlinks placed · ✓ 96% retention · ✓ DR 50+ standard · ✓ Month-to-month". Then 4 link columns (Company / Solutions / Services / Connect) + wordmark + "Ranklur © 2026". *No animation beyond a quiet fade-in.*

---

**ASSETS.** Team avatars + publication/award logos = use neutral placeholders (e.g. `https://i.pravatar.cc/120?img=N` for avatars, solid-color logo blocks). The ONE video = the sample mp4 above. Mark every placeholder with a `‹TODO: replace›` so they're easy to find.

**DON'T-BREAK.** One accent only. Respect `prefers-reduced-motion`. No layout shift from animations (reserve space). Keep each section a self-contained component. Mobile must not horizontally scroll. No AI-slop motion (see guardrails). Lighthouse: a11y ≥ 95, no CLS from media.

**DONE (acceptance checklist).**
- [ ] All 13 sections present, in order, with the exact copy above.
- [ ] One video (sample), click-to-play, muted, swap-marked.
- [ ] Global animation system built once + reused; scroll-reveal, count-up, sticky-nav, hover-lift, marquee all working.
- [ ] `prefers-reduced-motion` kills all motion cleanly.
- [ ] Fully responsive at 375 / 768 / 1280, no horizontal scroll.
- [ ] One accent color only; dark premium aesthetic; type hierarchy as specified.
- [ ] Every placeholder asset marked `‹TODO: replace›`.

**VERIFY.** Run it. Walk top to bottom at all 3 widths. Toggle reduced-motion (OS setting) and confirm motion stops. Run Lighthouse (perf + a11y). Click the video, submit the form (success state). Don't claim done until you've walked it.

---

*Built 2026-06-22. Reference studied: https://ranklur.com/. This is the L11 build-prompt skill at full-page scale — every section specified, a reusable animation system, explicit anti-slop guardrails, and sample assets so it runs on first build. Swap `‹swap›` / `‹TODO›` for the real brand + content.*
