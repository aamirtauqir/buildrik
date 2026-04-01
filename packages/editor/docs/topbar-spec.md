# Feature Spec: Topbar Redesign
**Type:** Requirements Only
**Design:** Designer ke discretion par
**Date:** 2026-03-31

---

## Core Principle

Topbar **do zones** mein divide hai:

1. **LEFT** — Project navigation + editor controls (canvas ka kaam)
2. **RIGHT** — Meta/global actions (user ka kaam — account, team, billing)

Sidebar (left bar) sirf canvas-related cheezein rakhega. Topbar mein koi editor feature nahi aega.

---

## Layout

```
┌─────────────────────────────────────────────────────────────────────┐
│  LEFT                    CENTER              RIGHT                   │
│  [← Dashboard] [↩↪] [📱💻🖥] [px▾]  [●status]  [👥] [Share] [Preview] [Publish] [⚙▾] │
└─────────────────────────────────────────────────────────────────────┘
```

---

## LEFT Section

### 1. Back to Dashboard Link
- Text: `← Back to Dashboard`
- Click karne par user dashboard pe chala jae
- **"My Portfolio" / project name NAHI hoga** — yeh hata diya gaya hai
- Simple text link ya ghost button style

### 2. Undo / Redo
- Undo — shortcut `⌘Z`
- Redo — shortcut `⌘⇧Z`
- Disabled jab history na ho

### 3. Device Switcher
- 4 options: Mobile / Tablet / Desktop / Wide
- Active device highlight ho

### 4. Viewport Dropdown
- Current width px mein dikhao
- Click se dropdown: preset sizes + custom input

---

## CENTER Section

### 5. Status Indicators (existing — no change)
- Save status: idle / saving / unsaved / error / offline
- Sync dot: connected / syncing / offline
- Issues badge: error+warning count, click se issues panel

---

## RIGHT Section

### 6. Collaboration Avatars
- Active team members ke avatars
- Max 3 dikhao, baaki `+N`
- Hover se naam + kya edit kar raha hai

### 7. Share Button
- Click se Share panel khule
- View-only link copy karna
- Collaborator invite (email + role)
- Team members list

### 8. Preview Button
- New tab mein preview khule
- Shortcut: `⌘P`

### 9. Publish Button
- Primary CTA
- Loading state: "Publishing..."

### 10. Account Button `⚙` (NEW — MAIN ADDITION)
- Icon ya avatar + chevron
- Click se Account Dropdown khule

---

## Account Dropdown — Detailed Structure

Yeh topbar ka sabse important naya feature hai. Sari meta cheezein yahan hain.

```
┌──────────────────────────────────────┐
│  [Avatar]  User Name                 │
│            user@email.com            │
├──────────────────────────────────────┤
│  👤  Account Settings                │  ← Profile, email, password
│  🔒  Access & Permissions           │  ← Who can do what
│  🔗  Integrations                   │  ← Third-party connections
├──────────────────────────────────────┤
│  👥  Collaboration                  │
│      └── Team Management            │  ← Add/remove members, roles
├──────────────────────────────────────┤
│  📋  Plans                          │  ← Current plan details + upgrade
│  💳  Billing                        │  ← Payment, invoices
├──────────────────────────────────────┤
│  🚪  Sign Out                       │
└──────────────────────────────────────┘
```

### 10a. Account Settings screen
- Profile: naam, avatar/photo
- Email change
- Password change
- Language / timezone preference

### 10b. Access & Permissions screen
- Define karo kaun kya kar sakta hai
- Roles: Owner / Admin / Editor / Viewer
- Per-project permissions

### 10c. Integrations screen
- Connected third-party services
- Add new integration
- Examples: Analytics, Google Fonts, Zapier, etc.

### 10d. Collaboration → Team Management screen
- Team members list
- Invite new member (email + role)
- Remove member
- Pending invites
- Transfer ownership

### 10e. Plans screen
- Current plan details dikhao (Free / Pro / Agency)
- Features comparison
- Upgrade CTA
- Next billing date

### 10f. Billing screen
- Current payment method
- Invoice history (download)
- Update card
- Cancel plan option

---

## RIGHT Section — Final Order

```
[Avatars]  →  [Share]  →  [Preview]  →  [Publish]  →  [⚙ Account]
```

---

## LEFT BAR (Sidebar) — Kya Hoga

Sidebar sirf **canvas ka kaam** karega. Account/meta kuch bhi sidebar mein nahi aega.

| Tab | Content |
|---|---|
| ➕ Add | Elements drag karo — text, layout, forms, media, sections |
| 🗂 Layers | Element hierarchy, visibility, lock |
| 📄 Pages | Page list, add, delete, SEO per page |
| 🖼 Media | Image/video upload, icon picker |
| 🎨 Design | Color/spacing/typography tokens |
| 🕐 History | Version history, revert |

**Sidebar mein NAHI aega:**
- Account settings → topbar ⚙ mein
- Billing → topbar ⚙ mein
- Team management → topbar ⚙ mein
- Publish tab → topbar Publish button mein
- Integrations → topbar ⚙ mein

---

## Summary — Kya Kahan Hai

| Feature | Location | Reason |
|---|---|---|
| Back to Dashboard | Topbar LEFT | Navigation, editor se bahar |
| Undo / Redo | Topbar LEFT | Canvas action |
| Device switcher | Topbar LEFT | Canvas action |
| Save / sync status | Topbar CENTER | Global status |
| Collaboration avatars | Topbar RIGHT | Meta — who's online |
| Share link | Topbar RIGHT | Meta — client sharing |
| Preview | Topbar RIGHT | Output action |
| Publish | Topbar RIGHT | Primary output action |
| Account Settings | Topbar ⚙ dropdown | User identity |
| Access & Permissions | Topbar ⚙ dropdown | User identity |
| Integrations | Topbar ⚙ dropdown | User identity |
| Team Management | Topbar ⚙ dropdown | User identity |
| Plans | Topbar ⚙ dropdown | Business layer |
| Billing | Topbar ⚙ dropdown | Business layer |
| Add elements | Sidebar | Canvas work |
| Layers | Sidebar | Canvas work |
| Pages | Sidebar | Canvas work |
| Media | Sidebar | Canvas work |
| Design tokens | Sidebar | Canvas work |
| History | Sidebar | Canvas work |

---

## Requirements

| # | Requirement |
|---|---|
| R1 | "My Portfolio" / project name topbar se hata do |
| R2 | "← Back to Dashboard" link topbar LEFT mein hoga |
| R3 | ⚙ Account button topbar RIGHT mein hoga (last item) |
| R4 | Account dropdown mein 6 sections: Account Settings, Access & Permissions, Integrations, Team Management, Plans, Billing |
| R5 | Har section click karne par apni screen/modal khulegi |
| R6 | Publish, History, Integrations, Billing tabs sidebar se hataao |
| R7 | Sidebar sirf canvas-related tabs rakhega: Add, Layers, Pages, Media, Design, History |
| R8 | RIGHT order: Avatars → Share → Preview → Publish → ⚙ Account |
