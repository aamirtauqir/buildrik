# MODULE 5: PUBLISHING

---

## 1. PUBLISHING OVERVIEW

### 1.1 What is Publishing?

Publishing makes your project live on the web. It includes hosting, domain management, export, and preview capabilities.

### 1.2 Publishing Options

| Option | Description |
|--------|-------------|
| **Aquibra Hosting** | Free hosted subdomain (projectname.aquibra.studio) |
| **Custom Domain** | Connect your own domain |
| **Export Only** | Download code, host anywhere |
| **Embed** | Embed in existing site |

---

## 2. HOSTING

### 2.1 Aquibra Hosting

```
HOSTING DASHBOARD:
┌─────────────────────────────────────────────────────────────┐
│  Publishing                                              [⚙️]│
├─────────────────────────────────────────────────────────────┤
│                                                             │
│  🌐 Your Site                                               │
│  ┌─────────────────────────────────────────────────────┐   │
│  │  Status: 🟢 Live                                      │   │
│  │  URL: https://my-project.aquibra.studio             │   │
│  │  Last published: 2 hours ago                        │   │
│  │                                                      │   │
│  │  [👁 Preview]  [🔄 Republish]  [🚀 Custom Domain]  │   │
│  └─────────────────────────────────────────────────────┘   │
│                                                             │
│  📊 Statistics                                             │
│  ┌─────────────────────────────────────────────────────┐   │
│  │  This Month: 1,234 visits  |  56 unique visitors     │   │
│  └─────────────────────────────────────────────────────┘   │
│                                                             │
└─────────────────────────────────────────────────────────────┘
```

### 2.2 Hosting Features

| Feature | Free | Pro |
|---------|------|-----|
| Custom subdomain | ✓ | ✓ |
| SSL/HTTPS | ✓ | ✓ |
| Custom domain | - | ✓ |
| Bandwidth | 1GB/mo | Unlimited |
| Storage | 500MB | 5GB |
| Remove Aquibra branding | - | ✓ |

### 2.3 Publishing Status

| Status | Meaning |
|--------|---------|
| 🟢 Live | Site is published and accessible |
| 🟡 Building | Currently building for publish |
| 🔴 Error | Last publish failed |
| ⚪ Not Published | Never published |

---

## 3. CUSTOM DOMAINS

### 3.1 Domain Connection

```
CUSTOM DOMAIN MODAL:
┌─────────────────────────────────────────────────────────────┐
│  Connect Custom Domain                                       │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│  Domain:                                                    │
│  ┌─────────────────────────────────────────────────────┐   │
│  │ www.example.com                                      │   │
│  └─────────────────────────────────────────────────────┘   │
│                                                             │
│  SSL Certificate:                                           │
│  ┌─────────────────────────────────────────────────────┐   │
│  │ ☑ Automatic HTTPS (Recommended)                      │   │
│  └─────────────────────────────────────────────────────┘   │
│                                                             │
│  DNS Configuration:                                         │
│  ┌─────────────────────────────────────────────────────┐   │
│  │ Add these records to your DNS provider:            │   │
│  │                                                      │   │
│  │ Type    Name          Value                         │   │
│  │ CNAME   www           cname.aquibra.studio          │   │
│  │ TXT     @             aquibra-verification=abc123   │   │
│  └─────────────────────────────────────────────────────┘   │
│                                                             │
│  [Verify Connection]  [Cancel]                              │
│                                                             │
└─────────────────────────────────────────────────────────────┘
```

### 3.2 Domain Management

```
DOMAINS PANEL:
┌─────────────────────────────────────────────────────────────┐
│  Domains                                                    │
├─────────────────────────────────────────────────────────────┤
│  [+ Add Domain]                                             │
│                                                             │
│  ┌─────────────────────────────────────────────────────┐   │
│  │ 🟢 www.example.com              [Manage] [🗑️]     │   │
│  │    SSL: Valid (expires in 89 days)                 │   │
│  │    Redirect: → https://www.example.com             │   │
│  ├─────────────────────────────────────────────────────┤   │
│  │ 🟠 shop.example.com              [Manage] [🗑️]     │   │
│  │    SSL: Pending verification                        │   │
│  └─────────────────────────────────────────────────────┘   │
│                                                             │
└─────────────────────────────────────────────────────────────┘
```

### 3.3 DNS Configuration Types

| Type | Use Case | Record |
|------|----------|--------|
| CNAME | Subdomain (www, shop) | CNAME → cname.aquibra.studio |
| A Record | Root domain (@) | A → 76.76.21.21 |
| TXT | Domain verification | TXT → aquibra-verification=xxx |

---

## 4. PUBLISH PROCESS

### 4.1 Publish Flow

```
PUBLISH WORKFLOW:
┌─────────────────────────────────────────────────────────────┐
│                                                             │
│  ┌─────────┐    ┌─────────┐    ┌─────────┐    ┌────────┐ │
│  │  Save   │───▶│ Build   │───▶│ Deploy  │───▶│  Live  │ │
│  │         │    │         │    │         │    │        │ │
│  └─────────┘    └─────────┘    └─────────┘    └────────┘ │
│       │              │              │              │        │
│       ▼              ▼              ▼              ▼        │
│   Auto-save     Validate &     Upload to    Update DNS   │
│   changes       compile         CDN           & SSL       │
│                                                             │
│  Typical time: 30-60 seconds                               │
└─────────────────────────────────────────────────────────────┘
```

### 4.2 Publish Modal

```
PUBLISH MODAL:
┌─────────────────────────────────────────────────────────────┐
│  Publish Project                                            │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│  Publish to:                                                │
│  ┌─────────────────────────────────────────────────────┐   │
│  │ ○ Aquibra Hosting (Free)                            │   │
│  │   my-project.aquibra.studio                         │   │
│  │                                                        │   │
│  │ ○ Custom Domain                                      │   │
│  │   www.example.com                                 ▼  │   │
│  └─────────────────────────────────────────────────────┘   │
│                                                             │
│  Publish Options:                                           │
│  ┌─────────────────────────────────────────────────────┐   │
│  │ ☑ Include in search engines (SEO)                  │   │
│  │ ☑ Enable analytics                                  │   │
│  └─────────────────────────────────────────────────────┘   │
│                                                             │
│  ┌─────────────────────────────────────────────────────┐   │
│  │ ⚠️ This will replace the current live version      │   │
│  └─────────────────────────────────────────────────────┘   │
│                                                             │
│  [Cancel]                        [Publish Now]              │
│                                                             │
└─────────────────────────────────────────────────────────────┘
```

### 4.3 Publish Queue

```
PUBLISH QUEUE:
┌─────────────────────────────────────────────────────────────┐
│  ┌─────────────────────────────────────────────────────┐   │
│  │ 🔄 Publishing...                                    │   │
│  │                                                      │   │
│  │ ████████████████░░░░░░░░  75%                      │   │
│  │                                                      │   │
│  │ Current: Uploading assets...                         │   │
│  └─────────────────────────────────────────────────────┘   │
│                                                             │
│  Recent Publishes:                                          │
│  ┌─────────────────────────────────────────────────────┐   │
│  │ 🟢 Today, 2:30 PM  - Success                        │   │
│  │ 🟢 Today, 11:15 AM - Success                        │   │
│  │ 🔴 Yesterday, 4:00 PM - Failed (build error)       │   │
│  └─────────────────────────────────────────────────────┘   │
│                                                             │
└─────────────────────────────────────────────────────────────┘
```

---

## 5. PREVIEW

### 5.1 Preview Modes

| Mode | Description | URL |
|------|-------------|-----|
| **Editor Preview** | Live preview in editor | Internal |
| **Share Preview** | Temporary link for review | project.aquibra.studio/preview/xxx |
| **Device Preview** | Preview on specific devices | - |
| **Dark Mode Preview** | Preview dark mode | - |

### 5.2 Share Preview

```
SHARE PREVIEW MODAL:
┌─────────────────────────────────────────────────────────────┐
│  Share Preview Link                                          │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│  Preview Link:                                              │
│  ┌─────────────────────────────────────────────────────┐   │
│  │ https://my-project.aquibra.studio/preview/abc123    │   │
│  └─────────────────────────────────────────────────────┘   │
│  [📋 Copy]                                                  │
│                                                             │
│  Options:                                                   │
│  ┌─────────────────────────────────────────────────────┐   │
│  │ Password: [____________] (optional)                  │   │
│  │ Expires:  [7 days ▼]                                │   │
│  │ Limit visits: [∞] or [___]                          │   │
│  └─────────────────────────────────────────────────────┘   │
│                                                             │
│  [Generate New Link]  [Close]                              │
│                                                             │
└─────────────────────────────────────────────────────────────┘
```

### 5.3 Device Preview

```
DEVICE PREVIEW:
┌─────────────────────────────────────────────────────────────┐
│  [📱 Mobile] [�板 Tablet] [💻 Desktop] [🌐 All]             │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│              ┌───────────────────────┐                     │
│              │                       │                     │
│              │   📱 Mobile          │                     │
│              │   375 × 667          │                     │
│              │                       │                     │
│              └───────────────────────┘                     │
│                                                             │
│              ┌─────────────────────────────┐               │
│              │                             │               │
│              │   �板 Tablet               │               │
│              │   768 × 1024               │               │
│              │                             │               │
│              └─────────────────────────────┘               │
│                                                             │
└─────────────────────────────────────────────────────────────┘
```

---

## 6. EXPORT

### 6.1 Export Options

```
EXPORT MODAL:
┌─────────────────────────────────────────────────────────────┐
│  Export Project                                             │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│  Export Format:                                             │
│  ┌─────────────────────────────────────────────────────┐   │
│  │ ○ HTML + CSS (Static)                               │   │
│  │   Plain HTML with inline CSS, no dependencies       │   │
│  │                                                        │   │
│  │ ○ React + Next.js                                    │   │
│  │   Full Next.js project with components               │   │
│  │                                                        │   │
│  │ ○ Vue + Nuxt.js                                      │   │
│  │   Full Nuxt.js project with components              │   │
│  └─────────────────────────────────────────────────────┘   │
│                                                             │
│  Options:                                                   │
│  ┌─────────────────────────────────────────────────────┐   │
│  │ ☑ Minify output                                     │   │
│  │ ☑ Include images                                    │   │
│  │ ☑ Generate sitemap.xml                              │   │
│  │ ☐ Include CMS data as JSON                          │   │
│  └─────────────────────────────────────────────────────┘   │
│                                                             │
│  [Cancel]                           [Export ZIP]            │
│                                                             │
└─────────────────────────────────────────────────────────────┘
```

### 6.2 Export Contents

| Format | Contents |
|--------|----------|
| **HTML** | index.html, styles.css, /images folder, assets/ |
| **React** | /pages, /components, /styles, /public, package.json |
| **Vue** | /pages, /components, /assets, /public, package.json |

### 6.3 HTML Export Structure

```
EXPORTED HTML STRUCTURE:
┌─────────────────────────────────────────────────────────────┐
│  project-export/                                            │
│  ├── index.html                                             │
│  ├── about.html                                             │
│  ├── contact.html                                           │
│  ├── css/                                                   │
│  │   └── styles.css                                         │
│  ├── js/                                                    │
│  │   └── main.js                                            │
│  ├── images/                                                │
│  │   ├── hero.jpg                                           │
│  │   └── logo.png                                           │
│  └── sitemap.xml                                            │
└─────────────────────────────────────────────────────────────┘
```

### 6.4 React Export Structure

```
EXPORTED REACT STRUCTURE:
┌─────────────────────────────────────────────────────────────┐
│  project-export/                                            │
│  ├── src/                                                   │
│  │   ├── pages/                                             │
│  │   │   ├── index.jsx                                      │
│  │   │   ├── about.jsx                                      │
│  │   │   └── contact.jsx                                    │
│  │   ├── components/                                        │
│  │   │   ├── Header.jsx                                     │
│  │   │   ├── Footer.jsx                                     │
│  │   │   ├── ProductCard.jsx                               │
│  │   │   └── ...                                            │
│  │   ├── styles/                                            │
│  │   │   └── theme.js                                        │
│  │   └── App.jsx                                            │
│  ├── public/                                                │
│  │   └── images/                                             │
│  ├── package.json                                           │
│  └── next.config.js                                         │
└─────────────────────────────────────────────────────────────┘
```

---

## 7. SEO

### 7.1 SEO Settings (Per Page)

```
SEO PANEL:
┌─────────────────────────────────────────────────────────────┐
│  SEO Settings                      [👁 Preview]             │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│  Page Title:                                                │
│  ┌─────────────────────────────────────────────────────┐   │
│  │ Best Products - My Store                            │   │
│  └─────────────────────────────────────────────────────┘   │
│  Characters: 32/60                                          │
│                                                             │
│  Meta Description:                                           │
│  ┌─────────────────────────────────────────────────────┐   │
│  │ Shop the best products online with fast shipping   │   │
│  └─────────────────────────────────────────────────────┘   │
│  Characters: 58/160                                          │
│                                                             │
│  URL Slug:                                                  │
│  ┌─────────────────────────────────────────────────────┐   │
│  │ /products                                           │   │
│  └─────────────────────────────────────────────────────┘   │
│                                                             │
│  Social Preview:                                             │
│  ┌─────────────────────────────────────────────────────┐   │
│  │ 🖼️ [Image Preview]                                  │   │
│  │ My Store - Best Products Online                    │   │
│  │ Shop the best products...                           │   │
│  └─────────────────────────────────────────────────────┘   │
│                                                             │
│  Advanced:                                                  │
│  ┌─────────────────────────────────────────────────────┐   │
│  │ Index: ☑ Allow search engines                       │   │
│  │ Follow: ☑ Allow links to be followed                │   │
│  │ Canonical URL: [____________]                        │   │
│  └─────────────────────────────────────────────────────┘   │
│                                                             │
└─────────────────────────────────────────────────────────────┘
```

### 7.2 SEO Features

| Feature | Description |
|--------|-------------|
| Page Title | Custom title per page |
| Meta Description | Search result description |
| Open Graph | Social media preview |
| Twitter Cards | Twitter share preview |
| Sitemap | Auto-generated XML |
| Canonical URLs | Prevent duplicates |
| Robots.txt | Search engine directives |

---

## 8. SETTINGS

### 8.1 Publishing Settings

```
PUBLISHING SETTINGS:
┌─────────────────────────────────────────────────────────────┐
│  Publishing Settings                                        │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│  Default Publishing:                                        │
│  ┌─────────────────────────────────────────────────────┐   │
│  │ Publish automatically: [Toggle OFF]                  │   │
│  │ When: [On save] or [Manually]                     │   │
│  └─────────────────────────────────────────────────────┘   │
│                                                             │
│  SEO:                                                       │
│  ┌─────────────────────────────────────────────────────┐   │
│  │ Generate sitemap.xml: [Toggle ON]                    │   │
│  │ Auto-generate meta: [Toggle ON]                      │   │
│  └─────────────────────────────────────────────────────┘   │
│                                                             │
│  Analytics:                                                 │
│  ┌─────────────────────────────────────────────────────┐   │
│  │ Enable analytics: [Toggle ON]                        │   │
│  │ Include in Aquibra analytics: [Toggle ON]            │   │
│  └─────────────────────────────────────────────────────┘   │
│                                                             │
│  Redirects:                                                │
│  ┌─────────────────────────────────────────────────────┐   │
│  │ [+ Add Redirect]                                     │   │
│  │ /old-page → /new-page                               │   │
│  │ /blog/* → /blog/post/*                              │   │
│  └─────────────────────────────────────────────────────┘   │
│                                                             │
└─────────────────────────────────────────────────────────────┘
```

### 8.2 Redirects

```
REDIRECT MANAGER:
┌─────────────────────────────────────────────────────────────┐
│  Redirects                                        [+ Add] │
├─────────────────────────────────────────────────────────────┤
│  ┌─────────────────────────────────────────────────────┐   │
│  │ /about-us      →  /about           [Edit] [🗑️]    │   │
│  ├─────────────────────────────────────────────────────┤   │
│  │ /products/*    →  /shop/*          [Edit] [🗑️]    │   │
│  ├─────────────────────────────────────────────────────┤   │
│  │ /old-blog/*   →  /blog/post/*     [Edit] [🗑️]    │   │
│  └─────────────────────────────────────────────────────┘   │
│                                                             │
│  Pattern Support: * (wildcard), () capture groups         │
└─────────────────────────────────────────────────────────────┘
```

---

## 9. PHASE DELIVERY

### Phase 1 (Launch)

- Aquibra hosting (free subdomain)
- Manual publish flow
- Basic preview (share link)
- HTML + React export
- Basic SEO (title, description)

### Phase 2 (Post-Launch)

- Custom domains with SSL
- Auto-publish on save
- Device preview
- Open Graph / Social preview
- Sitemap.xml auto-generation

### Phase 3 (Future)

- Vue/Nuxt export
- Multiple custom domains
- Advanced redirects
- A/B testing
- Edge functions
