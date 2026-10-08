# Buildrik Features

Auth & Sessions
- Email + password sign-in
- Email + password sign-up
- Magic-link sign-in via SMTP
- Two-factor authentication with TOTP
- Two-factor backup codes
- Google OAuth sign-in
- GitHub OAuth sign-in
- Sign out
- Reset password via email
- Forgot password email
- Verify email on sign-up
- Session version bump on password reset
- Session version bump on password change
- Session version bump on revoke-all-other-sessions
- Session version bump on workspace member removal
- List active sessions
- Revoke one session
- Revoke all other sessions
- AUTH_TRUST_HOST behind reverse proxy

Sites
- Create site
- Edit site
- Delete site with grace period
- Soft-delete site with cron hard-delete
- Restore soft-deleted site within window
- Duplicate site
- Rename site
- Set site thumbnail
- Open site in unified editor
- Open site in legacy standalone editor
- Publish site to Vercel
- Schedule publish for future time
- Cancel scheduled publish
- Rollback publish to prior version
- Rerun last failed publish
- Publish log retention per site
- Publish simulation for dev
- Publish pre-flight checks
- Site folder tree
- Site component library
- Site version snapshots
- Site SEO meta fallback
- Site favicon upload
- Site OG image upload
- Site CSP policy
- Site HSTS max-age
- Site X-Frame-Options
- Site Referrer-Policy
- Site Permissions-Policy
- Site default locale
- Site enabled locales
- Site first-visit locale auto-redirect
- Site storage quota
- Site publish domain custom

Pages
- Create page
- Edit page in editor
- Delete page
- Duplicate page
- Rename page
- Reorder pages
- Move page to folder
- Move folder
- Page slug edit
- Page folder tree
- Page folder create
- Page folder rename
- Page folder delete
- Page SEO title override
- Page SEO description override
- Page translations
- Page per-locale publish
- Page draft vs published state

Forms
- Form block on canvas
- Form block notify email
- Form block webhook URL
- Form submit capture
- Form submission list
- Form submission export
- Form submission purge on cron
- Form submission spam filter
- Form submission rate limit

Media
- Upload image to library
- Upload video to library
- Upload SVG to library
- Create media folder
- Rename media folder
- Move media between folders
- Delete media asset
- Media asset version history
- Media asset restore prior version
- Media search by filename
- Media search by tag
- Pexels stock photo search
- Unsplash stock photo search
- Drag-drop upload
- Clipboard paste upload
- Multi-file upload
- Upload progress per file
- Replace asset in place
- Blurhash placeholder
- Image dimensions extract
- Video duration extract
- Server-side image resize
- Server-side format conversion
- Vercel Blob presigned client

AI
- AI site generation from prompt
- AI content section generation
- AI page layout generation
- AI element rewrite
- AI bulk edit commands
- AI page edit commands
- AI summarize
- AI plan
- AI schema suggest
- AI streaming responses via SSE
- AI quota reservation per workspace
- AI quota release on cancel
- AI action confirmation for privileged ops
- AI anti-slop instructions baked into prompt
- AI landing section schemas
- AI portfolio section schemas
- AI product section schemas
- AI completion model fallback

Editor chrome
- Canvas with drag-drop
- Multi-select
- Snap-to-grid
- Snap-to-element
- Element resize handles
- Element rotation
- Element align to parent
- Element align to siblings
- Element group / ungroup
- Element z-order reorder
- Element duplicate with offset
- Element copy-paste
- Element undo / redo
- Element history panel
- Element keyboard shortcuts
- Canvas zoom in / out
- Canvas zoom to fit
- Canvas zoom to selection
- Canvas pan with space-drag
- Canvas rulers
- Canvas guides
- Canvas outline mode
- Canvas responsive preview mobile
- Canvas responsive preview tablet
- Canvas responsive preview desktop
- Canvas device frame
- Layers panel
- Layers tree view
- Layers visibility toggle
- Layers lock toggle
- Layers rename inline
- Layers reorder by drag
- Inspector sections
- Inspector style panel
- Inspector layout panel
- Inspector spacing panel
- Inspector typography panel
- Inspector color panel
- Inspector border panel
- Inspector shadow panel
- Inspector effects panel
- Inspector animation panel
- Inspector link panel
- Inspector SEO panel
- Inspector a11y panel
- Topbar undo-redo
- Topbar publish dropdown
- Topbar preview toggle
- Topbar responsive switcher
- Topbar save indicator
- Topbar workspace switcher
- Topbar user menu
- Right-dock floating action

Blocks & templates
- Pre-built block library
- Block search
- Block filter by category
- Block preview on hover
- Block insert at cursor
- Block drag from panel
- Block favorite
- Block custom save
- Page templates
- Site templates
- Template clone to site
- Template marketplace browse
- Template marketplace install
- Template marketplace rate
- User-saved templates

Settings
- Account profile
- Account avatar upload
- Account email change
- Account password change
- Account 2FA enable
- Account 2FA disable
- Account 2FA regenerate backup codes
- Account session list
- Account active session indicator
- Account danger zone
- Account download my data
- Account delete account request
- Account cancel delete request
- AI settings preferences
- AI default tone
- AI default model
- API token create
- API token revoke
- API token last-used indicator
- API token scope selector
- Billing plan view
- Billing upgrade
- Billing downgrade
- Billing cancel subscription
- Billing customer portal link
- Billing invoice list
- Billing dunning email
- Billing payment method update
- Billing promo code apply
- Danger zone
- Domain add custom
- Domain verify DNS
- Domain remove custom
- Integration connect Vercel
- Integration disconnect Vercel
- Integration Vercel project list
- Notification preferences per channel
- Notification preferences per event
- Plan switcher
- Profile public display name
- Security audit log
- Team invite by email
- Team invite role selector
- Team member list
- Team member role change
- Team member remove
- Team invite revoke
- Workspace name edit
- Workspace slug edit
- Workspace logo upload
- Workspace default theme
- Workspace transfer initiate
- Workspace transfer accept
- Workspace transfer cancel
- Workspace transfer expiry
- Usage meter
- Usage overage warning
- Usage reset cycle

Onboarding
- Welcome step
- Goal picker
- Style picker
- AI path entry
- AI preview step
- AI regenerate
- AI skip
- Palette picker
- Template picker
- Name workspace
- Generating progress
- Done step
- Skip-onboarding
- Resume onboarding
- Onboarding resume from last step
- Onboarding analytics tracking

Agency
- Agency clients list
- Agency client create
- Agency client archive
- Agency reviews list
- Agency review request from client
- Agency review status pipeline
- Agency review approve
- Agency review request changes
- Agency theme gallery per client
- Agency handover send
- Agency handover accept
- Agency handover checklist
- Agency library shared blocks
- Agency library shared templates
- Agency partner program dashboard
- Agency partner referral link

Client review
- External reviewer token link
- External reviewer page snapshot view
- External reviewer comment pin on element
- External reviewer comment thread
- External reviewer approve
- External reviewer request changes
- External reviewer status indicator
- External reviewer expiry
- Snapshot frozen at submit
- Reviewer email notification

Comments
- Pinned comment on canvas
- Comment x/y pin
- Comment target element selector
- Comment thread replies
- Comment resolve
- Comment reopen
- Comment reviewer pin
- Comment author indicator
- Comment timestamp
- Comment unread indicator

Webhooks
- Workspace webhook create
- Workspace webhook URL
- Workspace webhook secret rotate
- Workspace webhook event filter
- Workspace webhook disable
- Workspace webhook enable
- Workspace webhook delete
- Webhook delivery log
- Webhook delivery retry manual
- Webhook delivery status indicator
- Webhook delivery response body
- Webhook delivery request id
- Webhook delivery attempt count
- Webhook signature verify

CMS
- CMS collection create
- CMS collection rename
- CMS collection delete
- CMS collection field schema
- CMS collection field type text
- CMS collection field type rich text
- CMS collection field type number
- CMS collection field type boolean
- CMS collection field type date
- CMS collection field type image
- CMS collection field type reference
- CMS collection field type select
- CMS collection field type multi-select
- CMS collection field type URL
- CMS collection field type email
- CMS collection field required toggle
- CMS collection unique-per-site enforce
- CMS entry create
- CMS entry edit
- CMS entry delete
- CMS entry list with filter
- CMS entry list with sort
- CMS entry list with search
- CMS entry bulk delete
- CMS entry bulk export
- CMS entry slug
- CMS entry status draft / published
- CMS rich text DOMPurify sanitize on write
- CMS rich text scheme check on render
- CMS collection pageSlugPattern
- CMS collection pageTemplatePath
- CMS dynamic page generation
- CMS stale template binding detect
- CMS entry export CSV
- CMS entry import CSV

Notifications
- In-app notification list
- Notification unread badge
- Notification mark read
- Notification mark all read
- Notification per-event channel toggle
- Notification SSE stream
- Notification bell component

Activity
- Activity feed per workspace
- Activity filter all / mine / team
- Activity event types
- Activity deep-link to source
- Activity export

Help & Learn
- Help center index
- Help article search
- Help article category
- Learn tracks
- Learn lesson progress
- Learn lesson complete
- Learn track resume

Cron
- session-cleanup
- publish-job-cleanup
- soft-delete-purge
- form-submission-purge
- billing-dunning
- ip-anonymization
- ai-job-cleanup
- scheduled-publish
- workspace-transfer-expiry
- account-deletion
- media-cleanup
- publish-worker

Real-time
- Collab presence avatars
- Collab remote cursor
- Collab connection pill
- Collab ops stream
- Collab merge last-write-wins
- Collab server flag-gated
- Notifications SSE

Search
- Workspace-wide command palette
- Site switcher search
- Page search within site
- Block search within library
- Template search
- Media search
- Settings search

Theme
- Workspace default theme
- Theme tokens per workspace
- Theme tokens per site
- Theme preset list
- Theme preset apply
- Theme override primary
- Theme override neutral
- Theme override secondary
- Theme override tertiary

Marketplace
- App browse
- App detail view
- App install
- App uninstall
- App config editor
- App config validation per appId
- App published-page injection

Storage & ingest
- Vercel Blob token
- Presigned upload client
- Direct put for favicon / og
- Server-side upload cleanup
- Pending upload expiry

Identity & access
- Role OWNER
- Role ADMIN
- Role MEMBER
- Role VIEWER
- Role AGENCY_OWNER
- Role AGENCY_MEMBER
- Role CLIENT_OWNER
- Role CLIENT_VIEWER
- requireAgencyLayer guard
- requireWorkspaceRole guard
- assertSiteAccess guard
- NextAuth session callback
- NextAuth JWT callback
- Workspace switch
- Active workspace resolution

Billing
- Stripe Checkout session create
- Stripe Customer Portal link
- Stripe webhook signature verify
- Stripe webhook 5-min replay window
- Subscription ACTIVE
- Subscription TRIALING
- Subscription PAST_DUE
- Subscription CANCELED
- Subscription INCOMPLETE
- Subscription UNPAID
- checkout.session.completed handler
- customer.subscription.updated handler
- customer.subscription.deleted handler
- invoice.paid handler
- invoice.payment_failed handler
- Stripe customer resolve by workspace
- Stripe customer create on demand
- Plan limits per plan
- Site count limit per plan
- Member count limit per plan
- Storage limit per plan
- AI unit quota per plan
- AI unit reservation
- AI unit release on cancel
- dunning email on past_due
- invoice field drift safe-read

API tokens
- Token create
- Token revoke
- Token scope per workspace
- Token last-used timestamp
- Token prefix display
- Token bearer auth middleware

Integrations
- Vercel OAuth connect
- Vercel OAuth callback
- Vercel OAuth disconnect
- Vercel project list
- Vercel project create
- Vercel deployment create
- Vercel deployment poll
- Vercel deployment status
- Vercel deployment URL

Editor engine
- Composer orchestrator
- Element manager
- Style manager
- History manager
- Selection manager
- Hover manager
- Drag manager
- Resize manager
- Project manager
- Asset manager
- Page manager
- Snap manager
- Clipboard manager
- Undo redo manager
- Event bus
- Sanitize boundary

Telemetry
- Sentry server init
- Sentry client init
- Sentry edge init
- Sentry source map upload
- Sentry release tag
- Cron metric rows-affected
- Cron consecutive-miss alert

Design system
- Inter font everywhere
- Single accent #1A56DB
- Accent hover #1E429F
- Geist Mono for data
- Tabular nums on data
- 4px base spacing
- Compact density
- No purple / violet / indigo
- No system font fallbacks
- No system-ui fallback
- No Roboto fallback
- No Helvetica fallback
- No Arial fallback
- No Segoe UI fallback
- chrome-ui single surface
- chrome-ui TextInput wrapper
- chrome-ui Select wrapper
- --bk-* tokens generated
- Tailwind tw: prefix only
- Generated class-list from flowbite-react

Gates
- gate:env-check-prod
- gate:baked-flags
- gate:chrome-ui-surface
- gate:vibcoder-ratchet
- gate:editor-ui-gone
- gate:tokens-generated
- gate:ds-ssot
- gate:figma
- gate:buildrick-baseline
- gate:rules-audit
- pre-push hook verify:ds
- pre-push hook BLOCK_ON_FAIL

Email
- Lazy SMTP transport
- Magic link email
- Verify email
- Reset password email
- Invitation email
- Reviewer request email
- Reviewer expiry email
- 2FA backup codes email
- Workspace transfer email
- Dunning email
- Test-mode send guard

Verification commands
- pnpm run verify:ds
- pnpm run env:check:prod
- pnpm run audit:rules
- pnpm run gate:baked-flags
- pnpm run gate:ds-ssot
- pnpm run gate:figma
- pnpm run gate:chrome-ui-surface
- pnpm run gate:vibcoder-ratchet
- pnpm run gate:editor-ui-gone
- pnpm run gate:tokens-generated
- pnpm run gate:buildrick-baseline
- pnpm run flowbite:classlist
- node scripts/tokens/generate.mjs
- npx vitest
- pnpm run test:db

Total features inventoried: 500+
