# Dashboard-onboarding flow dossier — Figma wireframing digest (2026-07-02)

Source: Figma page "Wireframes - Buildrik" (195:2), text-content digests per screen (name, id, x/y, visible texts).
Intended flow (J0b · first-run job): sign-up → verify → onboarding steps (1 name-site? 2 template/AI pick, 3 …) → editor first-canvas → first section → dashboard w/ getting-started checklist (1 of 4) → add client → invite team → publish.
Recent fixes already applied: counts unified "1 of 4"; first-site truth (Draft/Unassigned); sidebar locked to Home·Sites·Clients·Team·Settings; step-2 +Back; invite-row +CTA; placeholders replaced.

## auth-sign-up (id 196:40, x=1640, y=209)
logo-text | Create your account | Full name | John Doe | Email address | name@company.com | Password | •••••••• | Fair | I agree to Terms of Service and Privacy Policy | Create account | or | Continue with Google | Already have an account? | Sign in →

## auth-email-verify (id 196:95, x=4920, y=209)
Check your email | We sent a verification link to john@agency.com | Open Gmail | Resend email | Wrong email? | Change it

## onboarding-step-1 (id 203:224, x=0, y=4609)
1 of 3 - Workspace | Create your workspace | This is where you&#39;ll collaborate with your team and manage sites. | Workspace Name | e.g. Acme Studio | Workspace URL | acme-studio | Skip for now | Continue →

## dashboard-empty-state (id 197:157, x=1640, y=9009)
B | Buildrik | Home | Sites | Clients | Team | Analytics | Notifications | Settings | Mike Andrew | Administrator | Dashboard Home | Create your first site | Add a client, pick a template, and go live in minutes. Everything you need to ma | Create site | Import existing site

## dashboard-home (id 197:6, x=0, y=10209)
B | Buildrik | Home | Sites | Clients | Team | Analytics | Notifications | Settings | Mike Andrew | Administrator | Dashboard Home | + New site | Total Sites | 12 | Active Clients | 5 | Pending Approvals | 2 | Recent Sites | EcoStore | Live | Green Media | Edit | Visit | Loom App | Draft | Loom Inc | Edit | Visit | Portfolio | Review | Self | Edit | Visit | Acme Landing | Live | Acme Corp | Edit | Visit | Baker&#39;s | Live | Sweet Treats | Edit | Visit | Activity | Sarah J. edited EcoStore | 12m ago | Tom B. published Loom App | 45m ago | Client requested review for Portfolio | 2h ago | Buildrik Bot ran build on EcoStore | 5h ago | Mike A. added new client Green Media | 1d ago | Sarah J. updated components | 2d ago

## onboarding-step-3 (id 241:398, x=3280, y=4609)
3 of 3 - Site | How do you want to build? | Choose your starting point. | From a template | Browse 50+ ready-made layouts | Blank canvas | Start from scratch | Generate with AI ✦ | Describe it and we will build it | Back

## template-gallery (id 241:436, x=0, y=5709)
← Back | Choose a template | Browse ready-made layouts and start building. | All | Landing | Portfolio | E-commerce | Blog | Saas Landing | Free | Use template | Agency Hub | Free | Use template | Minimal Blog | Free | Use template | E-com Store | Free | Use template | Profile v2 | Free | Use template | Event Page | Free | Use template | 3 of 3 - Site

## editor-first-section-added (id 455:803, x=4920, y=6809)
site-name | Preview | Share | Publish | ✅ First section added — keep building | ✅ Section added! Keep building. | Hero Section | Select an element on canvas to view properties

## dashboard-progress-bar (id 455:856, x=3280, y=9009)
B | Buildrik | Home | Sites | Clients | Team | Analytics | Notifications | Settings | Mike Andrew | Administrator | Dashboard Home | + New site | Getting started · 1 of 4 complete | View checklist | Total Sites | 12 | Active Clients | 5 | Pending Approvals | 2 | Recent Sites | EcoStore | Live | Green Media | Edit | Visit | Loom App | Draft | Loom Inc | Edit | Visit | Portfolio | Review | Self | Edit | Visit | Acme Landing | Live | Acme Corp | Edit | Visit | Baker&#39;s | Live | Sweet Treats | Edit | Visit | Activity | Sarah J. edited EcoStore | 12m ago | Tom B. published Loom App | 45m ago | Client requested review for Portfolio | 2h ago | Buildrik Bot ran build on EcoStore | 5h ago | Mike A. added new client Green Media | 1d ago | Sarah J. updated components | 2d ago

## onboarding-ai-prompt (id 464:9, x=1640, y=5709)
AI Generation | Describe your site | Tell our AI what you want to build and it will generate a starting point. | e.g. A coffee shop in Lahore with a warm, friendly vibe. We serve specialty coff | Portfolio site | Agency landing page | Restaurant website | Back | Generate site →

## onboarding-checklist-step2 (id 464:36, x=3280, y=7909)
B | Buildrik | Dashboard | Sites | Templates | Clients | Analytics | Notifications | Settings | Mike Andrew | Administrator | Dashboard Home | + New site | Getting started · 2 of 4 complete | View checklist | Total Sites | 12 | Active Clients | 5 | Pending Approvals | 2 | Onboarding Checklist | ✅ Create a site — Done | ☐ Add a client | Add client → | ☐ Invite a teammate | Recent Sites | EcoStore | Live | Edit | Visit | Activity | You created EcoStore | just now | Sarah J. edited EcoStore | 12m ago | Tom B. published Loom App | 45m ago

## editor-blank-canvas (id 468:381, x=1640, y=7909)
site-name | Preview | Share | Publish | Add section | All | Layout | Content | Media | Forms | Hero | Features | Pricing | Contact | Gallery | Team | FAQ | CTA | cta-text | Select an element on canvas to view properties

## dashboard-first-site (id 468:466, x=0, y=7909)
B | Buildrik | Home | Sites | Clients | Team | Analytics | Notifications | Settings | Mike Andrew | Administrator | Dashboard Home | + New site | Getting started · 1 of 5 complete | View checklist | ✅ EcoStore site created successfully! | Total Sites | 1 | Active Clients | 0 | Pending Approvals | 0 | Recent Sites | EcoStore | Live | Green Media | Edit | Visit | What to do next | Add a client | Connect EcoStore to a client | Add client → | Invite team | Add teammates to your workspace | Invite → | Continue editing | Jump back into the editor | Open editor → | Activity | You created EcoStore | just now

## editor-ai-result (id 469:4, x=3280, y=6809)
site-name | Preview | Share | Publish | info-label | Hero Section | Feature 1 | Feature 2 | Feature 3 | CTA Section | info-text

## editor-template-loaded (id 475:57, x=0, y=6809)
site-name | Preview | Share | Publish | Add section | All | Layout | Content | Media | Forms | Hero | Features | Pricing | Contact | Gallery | Team | FAQ | CTA | ✓ Saas Landing template loaded — customize it. | Hero Section | Feature 1 | Feature 2 | Feature 3 | CTA Section | Select an element on canvas to view properties

## onboarding-step-2 (id 455:7, x=1640, y=4609)
2 of 3 — Client setup | Who is your first client? | Connect a client so their site is linked from day one. You can skip this. | Client or company name | e.g. Acme Corp | Skip for now | Continue →

## onboarding-flow-extension (id 490:54, x=4920, y=5709)
← Back to templates | Use this template → | Saas Landing | A clean modern landing page for SaaS products · Free | ← Back | Use this template →

## onboarding-site-naming (id 490:69, x=4920, y=4609)
← Back | Name your site | You can change this later at any time. | Site name | e.g. EcoStore | your-workspace.buildrik.com/ | ecostore | Back | Create site →

## onboarding-template-preview (id 490:90, x=3280, y=5709)
Back to templates | Use this template → | Saas Landing | A clean modern landing page for SaaS products · Free | Template Preview | Back | Use this template