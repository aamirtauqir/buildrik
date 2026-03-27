# Sub-Project 4: Site Detail (6 Tabs) Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development or superpowers:executing-plans.

**Goal:** Build the Site Detail page with 6 tabs: Overview (stat cards, form submissions, site health, activity), Settings (name, slug, favicon, custom code, social links), SEO (meta, og:image, redirects), Domains (connect, verify, SSL), Access (permissions, sharing), Analytics (charts, metrics, traffic).

**Architecture:** Backend: `site-detail.service.ts` for overview data, `site-settings.service.ts` for settings/SEO CRUD, `redirect.service.ts` for URL redirects, `domain.service.ts` for domains, `share-link.service.ts` for sharing, `analytics.service.ts` for site analytics. tRPC router at `server/trpc/routers/site-detail.ts`. Frontend: tab layout at `app/dashboard/sites/[id]/` with sub-pages per tab. Components in `components/site-detail/`.

**Tech Stack:** tRPC 11, Prisma 5, React 19, Tailwind CSS 4, Lucide React, Zod, Vitest
