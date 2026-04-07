# Buildrik — Product Requirements Document (Generated from Codebase)

> **Generated:** 2026-03-25
> **Source:** Reverse-engineered from `/Users/shahg/Desktop/pencil/buildrik` codebase
> **Method:** Automated analysis of all routes, components, services, routers, and Prisma schema
> **Purpose:** Compare against PRD v5.6 CLEAN to identify implementation gaps

## System Overview

Buildrik is a website builder SaaS for freelancers, small teams, and agencies. Users create, edit, publish, and manage websites through a visual editor with AI-assisted generation, template gallery, team collaboration, custom domains, and client sharing.

**Tech Stack:** Next.js 16 (App Router) | React 19 | Tailwind CSS 4 | tRPC 11 | NextAuth 5 | Prisma 5 | PostgreSQL | nodemailer | Zod

## Module Overview

| Module | Pages | Core Functionality | PRD Doc |
|--------|-------|--------------------|---------|
| Authentication | 30 (19 primary + 11 error) | Login, signup, 2FA, magic link, OAuth, password reset, invite accept | [auth-module.md](./pages/auth-module.md) |
| Dashboard | 1 page + layout | Stats, recent sites, activity feed, quick actions, workspace health, onboarding | [dashboard-module.md](./pages/dashboard-module.md) |
| Sites & Site Detail | 10 pages | CRUD, folders, bulk ops, 6 detail tabs, publishing | [sites-module.md](./pages/sites-module.md) |
| Team | 1 page | Members, invites, roles, activity | [team-billing-settings-module.md](./pages/team-billing-settings-module.md) |
| Billing | 1 page | Plans, usage, invoices, upgrade/cancel | [team-billing-settings-module.md](./pages/team-billing-settings-module.md) |
| Settings | 8 tabs | Profile, account, security, notifications, workspace, integrations, AI, danger zone | [team-billing-settings-module.md](./pages/team-billing-settings-module.md) |
| Notifications | 1 page + dropdown | Grouped notifications, mark read, filter | [team-billing-settings-module.md](./pages/team-billing-settings-module.md) |
| Help | 2 pages + dropdown | Search, articles, tickets, contextual help | [team-billing-settings-module.md](./pages/team-billing-settings-module.md) |
| Onboarding | 3 pages + checklist | Role select, project setup, dashboard checklist | [team-billing-settings-module.md](./pages/team-billing-settings-module.md) |
| Share | 1 page | Password-protected share link gate | [team-billing-settings-module.md](./pages/team-billing-settings-module.md) |

## Appendix

| Document | Contents |
|----------|----------|
| [Enum Dictionary](./appendix/enum-dictionary.md) | 22 enums with all values + plan limits table |
| [API Inventory](./appendix/api-inventory.md) | 140 tRPC procedures + 7 REST routes across 14 domains |
| [Page Relationships](./appendix/page-relationships.md) | 57-page navigation graph, middleware rules, 6 flow diagrams |
| [Database Schema](./appendix/database-schema.md) | 33 Prisma models with all fields, types, constraints, relations |

## Key Numbers

| Metric | Count |
|--------|-------|
| Total pages/routes | 57 |
| tRPC procedures | 140 |
| REST API routes | 7 |
| Database models | 33 (schema has 41, 8 are P2/unused) |
| Enums | 22 |
| Email templates | 19 |
| Components | 100+ |
| Unit tests | 343 passing |

## How to Use This PRD

1. **Gap analysis:** Compare each module doc against `Buildrik_PRD_v5.6_CLEAN.md` to find missing requirements
2. **Implementation verification:** Check that every field, interaction, and business rule described here matches the PRD spec
3. **Onboarding:** Give this to new engineers to understand the full system without reading code
4. **AI agent context:** Feed module docs to AI agents as context for implementation tasks
