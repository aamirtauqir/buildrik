# MODULE 6: COLLABORATION

---

## 1. COLLABORATION OVERVIEW

### 1.1 What is Collaboration?

Collaboration allows multiple team members to work on the same project simultaneously with real-time sync, role-based access, and activity tracking.

### 1.2 Collaboration Features

| Feature | Description |
|---------|-------------|
| Real-time editing | See changes instantly |
| Multi-user cursors | See where others are working |
| Role-based access | Control what each member can do |
| Comments | Discuss directly on elements |
| Activity feed | Track who did what |

---

## 2. REAL-TIME EDITING

### 2.1 Real-time Architecture

```
REAL-TIME ARCHITECTURE:
┌─────────────────────────────────────────────────────────────┐
│                                                             │
│  ┌─────────┐    WebSocket    ┌─────────┐                  │
│  │  User   │◄──────────────►│ Server  │                  │
│  │    A    │                 │         │                  │
│  └─────────┘                 └────┬────┘                  │
│                                   │                        │
│                                   │ Sync                   │
│                                   ▼                        │
│  ┌─────────┐                 ┌─────────┐                  │
│  │  User   │◄──────────────►│ Server  │                  │
│  │    B    │                 │         │                  │
│  └─────────┘                 └─────────┘                  │
│                                                             │
│  - Changes sync in <100ms                                   │
│  - Conflict resolution: Last-write-wins                   │
│  - Offline support with sync on reconnect                  │
└─────────────────────────────────────────────────────────────┘
```

### 2.2 Presence Indicators

```
EDITOR WITH MULTI-USER:
┌─────────────────────────────────────────────────────────────┐
│  👥 3 editors online                                       │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│  ┌──────────────────────────────────────┐                  │
│  │                                     │ 👤 Sarah          │
│  │         Canvas Area                 │                   │
│  │                                     │                   │
│  │         ┌──────────┐                │                   │
│  │         │ Element  │◄─────────── Cursor: Sarah         │
│  │         └──────────┘                        🔴          │
│  │                              👤 Mike                    │
│  │                        ┌──────────┐                     │
│  │                        │ Element  │◄── Cursor: Mike    │
│  │                        └──────────┘    🔵              │
│  └──────────────────────────────────────┘                  │
│                                                             │
│  Team Panel: [Sarah 👤] [Mike 👤] [You ✓]                 │
└─────────────────────────────────────────────────────────────┘
```

### 2.3 Cursor Colors

| User | Cursor Color |
|------|---------------|
| User 1 | 🔴 Red |
| User 2 | 🔵 Blue |
| User 3 | 🟢 Green |
| User 4 | 🟡 Yellow |
| User 5 | 🟣 Purple |
| User 6 | 🟠 Orange |

### 2.4 Locking

```
ELEMENT LOCKING:
┌─────────────────────────────────────────────────────────────┐
│  When User A edits an element:                              │
│                                                             │
│  ┌─────────────────────────────────────┐                  │
│  │ ┌───────────────────────────────┐   │                  │
│  │ │ 🔒 Product Title              │   │                  │
│  │ │    Locked by Sarah            │   │                  │
│  │ │                               │   │                  │
│  │ │   [Request Access] [Wait]    │   │                  │
│  │ └───────────────────────────────┘   │                  │
│  └─────────────────────────────────────┘                  │
│                                                             │
│  Auto-release: 30 seconds of inactivity                    │
└─────────────────────────────────────────────────────────────┘
```

---

## 3. ROLES & PERMISSIONS

### 3.1 Role Types

| Role | Description | Use Case |
|------|-------------|----------|
| **Owner** | Full control, billing, delete | Project founder |
| **Admin** | Manage members, settings, publish | Team lead |
| **Editor** | Edit content, publish | Content creator |
| **Viewer** | View only, comment | Stakeholder, client |

### 3.2 Permissions Matrix

| Action | Owner | Admin | Editor | Viewer |
|--------|-------|-------|--------|--------|
| **Project** |||||
| Edit project settings | ✓ | ✓ | - | - |
| Delete project | ✓ | - | - | - |
| Transfer ownership | ✓ | - | - | - |
| **Publishing** |||||
| Publish site | ✓ | ✓ | ✓ | - |
| Connect domain | ✓ | ✓ | - | - |
| View analytics | ✓ | ✓ | ✓ | ✓ |
| **Content** |||||
| Add/edit elements | ✓ | ✓ | ✓ | - |
| Delete elements | ✓ | ✓ | ✓ | - |
| Upload media | ✓ | ✓ | ✓ | - |
| **CMS** |||||
| Create collections | ✓ | ✓ | - | - |
| Edit collections | ✓ | ✓ | ✓ | - |
| Delete collections | ✓ | - | - | - |
| **Team** |||||
| Invite members | ✓ | ✓ | - | - |
| Remove members | ✓ | ✓ | - | - |
| Change roles | ✓ | - | - | - |
| **Comments** |||||
| Add comments | ✓ | ✓ | ✓ | ✓ |
| Resolve comments | ✓ | ✓ | ✓ | - |
| Delete comments | ✓ | ✓ | - | - |

### 3.3 Team Management

```
TEAM PANEL:
┌─────────────────────────────────────────────────────────────┐
│  Team                           [+ Invite Member]            │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│  👤 John (Owner)                            [Settings]      │
│  john@example.com                                           │
│                                                             │
│  ┌─────────────────────────────────────────────────────┐  │
│  │ 👤 Sarah (Admin)                        [⋮] [✉️]   │  │
│  │ sarah@example.com                     Last: 2h ago  │  │
│  ├─────────────────────────────────────────────────────┤  │
│  │ 👤 Mike (Editor)                         [⋮] [✉️]   │  │
│  │ mike@example.com                      Last: 5m ago  │  │
│  ├─────────────────────────────────────────────────────┤  │
│  │ 👤 Client (Viewer)                       [⋮] [✉️]   │  │
│  │ client@example.com                     Last: 1d ago  │  │
│  └─────────────────────────────────────────────────────┘  │
│                                                             │
└─────────────────────────────────────────────────────────────┘
```

### 3.4 Invite Modal

```
INVITE MODAL:
┌─────────────────────────────────────────────────────────────┐
│  Invite Team Member                                          │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│  Email:                                                     │
│  ┌─────────────────────────────────────────────────────┐   │
│  │ colleague@company.com                                 │   │
│  └─────────────────────────────────────────────────────┘   │
│                                                             │
│  Role:                                                      │
│  ┌─────────────────────────────────────────────────────┐   │
│  │ ○ Admin - Full access except billing                │   │
│  │ ○ Editor - Can edit and publish                     │   │
│  │ ○ Viewer - View only with comments                  │   │
│  └─────────────────────────────────────────────────────┘   │
│                                                             │
│  Message (optional):                                        │
│  ┌─────────────────────────────────────────────────────┐   │
│  │ Hi! I've invited you to collaborate on my project.  │   │
│  └─────────────────────────────────────────────────────┘   │
│                                                             │
│  [Cancel]  [Send Invitation]                               │
│                                                             │
└─────────────────────────────────────────────────────────────┘
```

---

## 4. COMMENTS

### 4.1 Comment Workflow

```
COMMENT ON ELEMENT:
┌─────────────────────────────────────────────────────────────┐
│  Step 1: Right-click element → "Add Comment"               │
│                                                             │
│  ┌─────────────────────────────────────┐                  │
│  │ [Image Element]                     │                  │
│  │                                     │                  │
│  │ 💬 Click to add comment             │                  │
│  └─────────────────────────────────────┘                  │
│                                                             │
│  Step 2: Write comment                                      │
│                                                             │
│  ┌─────────────────────────────────────┐                  │
│  │ 💬 Add Comment                      │                  │
│  │ ┌─────────────────────────────────┐ │                  │
│  │ │ Please use a higher resolution  │ │                  │
│  │ │ image for retina displays.     │ │                  │
│  │ └─────────────────────────────────┘ │                  │
│  │                                     │                  │
│  │           [Cancel] [Post]           │                  │
│  └─────────────────────────────────────┘                  │
└─────────────────────────────────────────────────────────────┘
```

### 4.2 Comments Panel

```
COMMENTS PANEL:
┌─────────────────────────────────────────────────────────────┐
│  Comments (3 unresolved)                                    │
├─────────────────────────────────────────────────────────────┤
│  Filter: [All ▼] [Resolved ☐]                              │
│                                                             │
│  ┌─────────────────────────────────────────────────────┐  │
│  │ 🟠 unresolved                                           │  │
│  │ ──────────────────────────────────────────────────   │  │
│  │ 📷 Hero Image                                          │  │
│  │ "Please use a higher resolution..."                  │  │
│  │                                                        │  │
│  │ Sarah • 2h ago                          [Resolve]    │  │
│  └─────────────────────────────────────────────────────┘  │
│                                                             │
│  ┌─────────────────────────────────────────────────────┐  │
│  │ 🟢 resolved                                            │  │
│  │ ──────────────────────────────────────────────────   │  │
│  │ 📝 Contact Form                                        │  │
│  │ "This looks good!"                                   │  │
│  │                                                        │  │
│  │ Mike • 1d ago                          [Reopen]     │  │
│  └─────────────────────────────────────────────────────┘  │
│                                                             │
└─────────────────────────────────────────────────────────────┘
```

### 4.3 Comment Thread

```
COMMENT THREAD:
┌─────────────────────────────────────────────────────────────┐
│  💬 on: Hero Image                                          │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│  Sarah started a conversation:                              │
│  ┌─────────────────────────────────────────────────────┐  │
│  │ 👤 Sarah                                               │  │
│  │ Please use a higher resolution image for retina     │  │
│  │ displays. Current one looks blurry.                  │  │
│  │                                                        │  │
│  │ 2 hours ago                              [Resolve]  │  │
│  └─────────────────────────────────────────────────────┘  │
│                                                             │
│  ┌─────────────────────────────────────────────────────┐  │
│  │ 👤 You                                                 │  │
│  │ Got it! I've uploaded a 2x version.                  │  │
│  │                                                        │  │
│  │ 1 hour ago                                            │  │
│  └─────────────────────────────────────────────────────┘  │
│                                                             │
│  ┌─────────────────────────────────────────────────────┐  │
│  │ 👤 Sarah                                               │  │
│  │ Perfect, thanks!                                     │  │
│  │                                                        │  │
│  │ 30 minutes ago                                        │  │
│  └─────────────────────────────────────────────────────┘  │
│                                                             │
│  ┌─────────────────────────────────────────────────────┐  │
│  │ [Type a reply...]                                     │  │
│  │                                     [Post] [Resolve] │  │
│  └─────────────────────────────────────────────────────┘  │
│                                                             │
└─────────────────────────────────────────────────────────────┘
```

### 4.4 Comment Actions

| Action | Description |
|--------|-------------|
| Add | Create new comment on element |
| Reply | Respond to existing thread |
| Resolve | Mark as done |
| Reopen | Reopen resolved comment |
| Delete | Remove comment |
| Edit | Edit your comment |

---

## 5. ACTIVITY FEED

### 5.1 Activity Log

```
ACTIVITY FEED:
┌─────────────────────────────────────────────────────────────┐
│  Activity                              [Filter ▼]            │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│  Today                                                       │
│  ─────────────────────────────────────────────────────────  │
│  • Sarah published the site                    2h ago      │
│  • Mike added 3 elements to Home                  3h ago    │
│  • Sarah commented on Hero Image                 4h ago    │
│  • John invited mike@example.com                  5h ago    │
│                                                             │
│  Yesterday                                                  │
│  ─────────────────────────────────────────────────────────  │
│  • Mike uploaded 5 images to Media Library        1d ago    │
│  • Sarah created "Products" collection             1d ago    │
│                                                             │
└─────────────────────────────────────────────────────────────┘
```

### 5.2 Activity Types

| Activity | Icon | Description |
|----------|------|-------------|
| Element created | ➕ | Added new element |
| Element edited | ✏️ | Modified element |
| Element deleted | 🗑️ | Removed element |
| Published | 🚀 | Published site |
| Media uploaded | 📤 | Added media file |
| Comment added | 💬 | New comment |
| Comment resolved | ✅ | Comment resolved |
| Member invited | 👤 | New team member |
| Member removed | 👋 | Team member removed |
| Settings changed | ⚙️ | Project settings |

---

## 6. NOTIFICATIONS

### 6.1 Notification Types

| Notification | When | Channel |
|--------------|------|---------|
| Invitation | Someone invites you | Email + In-app |
| Mention | Someone mentions you in comment | Email + In-app |
| Comment reply | Someone replies to your thread | Email + In-app |
| Published | Site is published | In-app |
| Permission change | Your role changed | Email + In-app |
| Element lock | Element you're editing is locked | In-app |

### 6.2 Notification Panel

```
NOTIFICATIONS PANEL:
┌─────────────────────────────────────────────────────────────┐
│  Notifications                    [Mark all read] [⚙️]     │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│  🔴 3 new                                                   │
│  ─────────────────────────────────────────────────────────  │
│  👤 Sarah mentioned you in "Hero Image"         2h ago    │
│  ─────────────────────────────────────────────────────────  │
│  🚀 Site published by Sarah                    3h ago    │
│  ─────────────────────────────────────────────────────────  │
│  👤 You were added to "Marketing Site"          5h ago     │
│                                                             │
│  ✓ 2 earlier                                               │
│  ─────────────────────────────────────────────────────────  │
│  💬 Sarah replied to your comment               1d ago    │
│                                                             │
└─────────────────────────────────────────────────────────────┘
```

### 6.3 Notification Settings

```
NOTIFICATION SETTINGS:
┌─────────────────────────────────────────────────────────────┐
│  Notification Preferences                                    │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│  Email Notifications:                                        │
│  ┌─────────────────────────────────────────────────────┐   │
│  │ ☑ Invitations to projects                           │   │
│  │ ☑ Comments and mentions                             │   │
│  │ ☑ When my site is published                         │   │
│  │ ☐ Weekly activity digest                            │   │
│  │ ☐ Product updates and news                          │   │
│  └─────────────────────────────────────────────────────┘   │
│                                                             │
│  In-App Notifications:                                       │
│  ┌─────────────────────────────────────────────────────┐   │
│  │ ☑ All notifications                                 │   │
│  │ ☑ Sound effects                                    │   │
│  └─────────────────────────────────────────────────────┘   │
│                                                             │
└─────────────────────────────────────────────────────────────┘
```

---

## 7. VERSION HISTORY

### 7.1 Version Snapshots

```
VERSION HISTORY:
┌─────────────────────────────────────────────────────────────┐
│  Version History                      [Restore] [Compare]  │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│  Now                                                        │
│  ┌─────────────────────────────────────────────────────┐  │
│  │ ● Current - Sarah • Just now                        │  │
│  └─────────────────────────────────────────────────────┘  │
│                                                             │
│  Earlier                                                    │
│  ┌─────────────────────────────────────────────────────┐  │
│  │ ○ Version 12 - Mike • 2 hours ago                   │  │
│  │   "Added product grid section"                      │  │
│  ├─────────────────────────────────────────────────────┤  │
│  │ ○ Version 11 - Sarah • Yesterday                   │  │
│  │   "Updated hero image"                              │  │
│  ├─────────────────────────────────────────────────────┤  │
│  │ ○ Version 10 - Mike • 2 days ago                    │  │
│  │   "New contact form"                                │  │
│  └─────────────────────────────────────────────────────┘  │
│                                                             │
│  Auto-save: Every 10 changes                                │
│  Manual snapshots: Unlimited                                │
└─────────────────────────────────────────────────────────────┘
```

### 7.2 Restore Version

```
RESTORE VERSION:
┌─────────────────────────────────────────────────────────────┐
│  Restore Version 11?                                         │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│  This will create a new version with the content from      │
│  Version 11 (Yesterday by Sarah).                          │
│                                                             │
│  Current version will be saved as Version 12.             │
│                                                             │
│  [Cancel]  [Restore Version]                                │
│                                                             │
└─────────────────────────────────────────────────────────────┘
```

---

## 8. API REFERENCE

### 8.1 Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | /api/projects/:id/members | List team members |
| POST | /api/projects/:id/members | Invite member |
| DELETE | /api/projects/:id/members/:userId | Remove member |
| PUT | /api/projects/:id/members/:userId | Update role |
| GET | /api/projects/:id/comments | List comments |
| POST | /api/projects/:id/comments | Add comment |
| PUT | /api/projects/:id/comments/:id | Update comment |
| DELETE | /api/projects/:id/comments/:id | Delete comment |
| GET | /api/projects/:id/activity | Activity feed |
| GET | /api/projects/:id/versions | List versions |

### 8.2 Data Types

```typescript
interface TeamMember {
  id: string;
  userId: string;
  email: string;
  name: string;
  role: 'owner' | 'admin' | 'editor' | 'viewer';
  avatar?: string;
  joinedAt: string;
  lastActiveAt: string;
}

interface Comment {
  id: string;
  elementId: string;
  userId: string;
  content: string;
  resolved: boolean;
  parentId?: string;
  createdAt: string;
  updatedAt: string;
}

interface Activity {
  id: string;
  type: ActivityType;
  userId: string;
  description: string;
  metadata?: Record<string, any>;
  createdAt: string;
}
```

---

## 9. PHASE DELIVERY

### Phase 1 (Launch)

- Real-time editing (WebSocket sync)
- Multi-user presence/cursors
- Role-based permissions (4 roles)
- Basic comments on elements
- Activity feed

### Phase 2 (Post-Launch)

- Element locking
- Comment threads with mentions
- Notifications center
- Version history snapshots
- Bulk invite

### Phase 3 (Future)

- Real-time chat
- Collaborative design mode
- Approval workflow
- Time tracking
- Advanced analytics
