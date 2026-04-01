# Appendix D: Database Schema

> Source: `prisma/schema.prisma`
> Database: PostgreSQL via Prisma 5

---

## Identity & Auth Domain

### User (`users`)

| Field              | Type       | Constraints                        | Description                              |
|--------------------|------------|------------------------------------|------------------------------------------|
| `id`               | String     | `@id @default(cuid())`            | Primary key                              |
| `email`            | String     | `@unique`                          | User's email address                     |
| `fullName`         | String     |                                    | Display name                             |
| `displayName`      | String?    |                                    | Optional preferred display name          |
| `passwordHash`     | String?    |                                    | Bcrypt hash (null for social-only users) |
| `avatar`           | String?    |                                    | Avatar image URL                         |
| `bio`              | String?    |                                    | User biography                           |
| `language`          | String     | `@default("en")`                  | Preferred language code                  |
| `timezone`         | String     | `@default("UTC")`                 | Preferred timezone                       |
| `emailVerified`    | DateTime?  |                                    | When email was verified (null = unverified) |
| `twoFactorEnabled` | Boolean    | `@default(false)`                 | Whether 2FA is active                    |
| `twoFactorSecret`  | String?    |                                    | TOTP secret key (encrypted)              |
| `backupCodes`      | String[]   |                                    | Hashed backup recovery codes             |
| `provider`         | String     | `@default("email")`              | Primary auth provider                    |
| `lockedUntil`      | DateTime?  |                                    | Account lock expiry (failed login attempts) |
| `failedAttempts`   | Int        | `@default(0)`                     | Consecutive failed login count           |
| `lastLoginAt`      | DateTime?  |                                    | Last successful login timestamp          |
| `emailBounceCount` | Int        | `@default(0)`                     | Number of email delivery bounces         |
| `deletedAt`        | DateTime?  |                                    | Soft-delete timestamp                    |
| `createdAt`        | DateTime   | `@default(now())`                 | Account creation timestamp               |
| `updatedAt`        | DateTime   | `@updatedAt`                      | Last update timestamp                    |

**Relations:** `accounts[]`, `sessions[]`, `workspaceMembers[]`

---

### Account (`accounts`)

> OAuth provider accounts linked to a User (NextAuth adapter model).

| Field              | Type    | Constraints                               | Description                    |
|--------------------|---------|-------------------------------------------|--------------------------------|
| `id`               | String  | `@id @default(cuid())`                   | Primary key                    |
| `userId`           | String  |                                           | FK to User                     |
| `type`             | String  |                                           | Account type (oauth, etc.)     |
| `provider`         | String  |                                           | Provider name (google, github) |
| `providerAccountId`| String  |                                           | Provider-side user ID          |
| `refresh_token`    | String? |                                           | OAuth refresh token            |
| `access_token`     | String? |                                           | OAuth access token             |
| `expires_at`       | Int?    |                                           | Token expiration (epoch secs)  |
| `token_type`       | String? |                                           | Token type (Bearer, etc.)      |
| `scope`            | String? |                                           | OAuth scopes granted           |
| `id_token`         | String? |                                           | OIDC ID token                  |

**Unique:** `[provider, providerAccountId]`
**Relations:** `user -> User (onDelete: Cascade)`

---

### Session (`sessions`)

| Field          | Type     | Constraints                 | Description                          |
|----------------|----------|-----------------------------|--------------------------------------|
| `id`           | String   | `@id @default(cuid())`     | Primary key                          |
| `userId`       | String   |                             | FK to User                           |
| `device`       | String?  |                             | User-Agent string                    |
| `ip`           | String?  |                             | IP address at login                  |
| `location`     | String?  |                             | Geo-resolved location                |
| `current`      | Boolean  | `@default(false)`          | Whether this is the active session   |
| `sessionToken` | String   | `@unique`                  | SHA-256 hash of the JWT              |
| `expires`      | DateTime |                             | Session expiration time              |
| `createdAt`    | DateTime | `@default(now())`          | Session creation time                |

**Relations:** `user -> User (onDelete: Cascade)`

---

### VerificationToken (`verification_tokens`)

| Field       | Type     | Constraints                       | Description                           |
|-------------|----------|-----------------------------------|---------------------------------------|
| `id`        | String   | `@id @default(cuid())`           | Primary key                           |
| `identifier`| String   |                                   | Email or user identifier              |
| `token`     | String   | `@unique`                         | The token value                       |
| `type`      | String   |                                   | Token type (EMAIL_VERIFY, PASSWORD_RESET, MAGIC_LINK, EMAIL_CHANGE) |
| `expires`   | DateTime |                                   | Token expiration time                 |
| `used`      | Boolean  | `@default(false)`                | Whether token has been consumed       |
| `createdAt` | DateTime | `@default(now())`                | Creation time                         |

**Unique:** `[identifier, token]`
**Indexes:** `[token, type, used]`, `[expires]`

---

### LoginAttempt (`login_attempts`)

| Field      | Type     | Constraints                | Description                    |
|------------|----------|----------------------------|--------------------------------|
| `id`       | String   | `@id @default(cuid())`    | Primary key                    |
| `userId`   | String?  |                            | FK to User (null if unknown)   |
| `email`    | String   |                            | Email attempted                |
| `ipAddress`| String?  |                            | IP address of attempt          |
| `userAgent`| String?  |                            | Browser user-agent             |
| `result`   | String   |                            | Outcome (success, failure, locked, etc.) |
| `createdAt`| DateTime | `@default(now())`         | Attempt timestamp              |

**Indexes:** `[email, createdAt]`

---

### AuditLog (`audit_logs`)

| Field      | Type     | Constraints                | Description                              |
|------------|----------|----------------------------|------------------------------------------|
| `id`       | String   | `@id @default(cuid())`    | Primary key                              |
| `userId`   | String?  |                            | FK to User (null for system events)      |
| `email`    | String?  |                            | Email for context                        |
| `action`   | String   |                            | Action name (LOGIN, LOGOUT, etc.)        |
| `status`   | String   |                            | Outcome (success, failure)               |
| `ip`       | String?  |                            | IP address                               |
| `userAgent`| String?  |                            | Browser user-agent                       |
| `metadata` | String?  |                            | JSON-encoded additional data             |
| `createdAt`| DateTime | `@default(now())`         | Event timestamp                          |

**Indexes:** `[userId]`, `[action]`, `[createdAt]`

---

### ConnectedAccount (`connected_accounts`)

| Field           | Type    | Constraints               | Description                         |
|-----------------|---------|---------------------------|-------------------------------------|
| `id`            | String  | `@id @default(cuid())`   | Primary key                         |
| `userId`        | String  |                           | FK to User                          |
| `provider`      | String  |                           | Provider name                       |
| `providerUserId`| String  |                           | Provider-side user ID               |
| `tokens`        | Json?   |                           | Stored tokens (encrypted)           |

---

## Workspace & Team Domain

### Workspace (`workspaces`)

| Field                 | Type     | Constraints                  | Description                              |
|-----------------------|----------|------------------------------|------------------------------------------|
| `id`                  | String   | `@id @default(cuid())`      | Primary key                              |
| `name`                | String   |                              | Workspace display name                   |
| `slug`                | String   | `@unique`                    | URL-safe identifier                      |
| `ownerId`             | String   |                              | User ID of workspace owner               |
| `plan`                | String   | `@default("FREE")`          | Current subscription plan                |
| `defaultLanguage`     | String   | `@default("en")`            | Default content language                 |
| `timezone`            | String   | `@default("UTC")`           | Default timezone                         |
| `stripeCustomerId`    | String?  | `@unique`                    | Stripe customer ID                       |
| `deletionScheduledAt` | DateTime?|                              | When workspace is scheduled for deletion |
| `deletedAt`           | DateTime?|                              | Soft-delete timestamp                    |
| `iconUrl`             | String?  |                              | Workspace icon/logo URL                  |
| `accentColor`         | String?  |                              | Brand accent color hex                   |
| `createdAt`           | DateTime | `@default(now())`           | Creation timestamp                       |
| `updatedAt`           | DateTime | `@updatedAt`                | Last update timestamp                    |

**Relations:** `members[]`, `sites[]`, `invites[]`, `subscription?`, `integrations[]`, `sharingSettings?`, `folders[]`, `activityLogs[]`

---

### WorkspaceMember (`workspace_members`)

| Field         | Type     | Constraints                      | Description                         |
|---------------|----------|----------------------------------|-------------------------------------|
| `id`          | String   | `@id @default(cuid())`          | Primary key                         |
| `userId`      | String   |                                  | FK to User                          |
| `workspaceId` | String   |                                  | FK to Workspace                     |
| `role`        | String   | `@default("EDITOR")`            | Member role (OWNER/ADMIN/EDITOR/VIEWER) |
| `status`      | String   | `@default("ACTIVE")`            | ACTIVE or SUSPENDED                 |
| `invitedBy`   | String?  |                                  | User ID who sent the invite         |
| `lastActiveAt`| DateTime?|                                  | Last activity timestamp             |
| `suspendedAt` | DateTime?|                                  | When member was suspended           |
| `joinedAt`    | DateTime | `@default(now())`               | When member joined                  |

**Unique:** `[userId, workspaceId]`
**Relations:** `user -> User`, `workspace -> Workspace`, `sitePermissions[]`

---

### Invite (`invites`)

| Field        | Type     | Constraints                | Description                            |
|--------------|----------|----------------------------|----------------------------------------|
| `id`         | String   | `@id @default(cuid())`    | Primary key                            |
| `workspaceId`| String   |                            | FK to Workspace                        |
| `email`      | String   |                            | Invitee email address                  |
| `role`       | String   | `@default("EDITOR")`      | Role to assign on acceptance           |
| `message`    | String?  |                            | Optional personal message              |
| `token`      | String   | `@unique`                  | Unique invite token                    |
| `status`     | String   | `@default("PENDING")`     | PENDING/ACCEPTED/DECLINED/EXPIRED      |
| `invitedBy`  | String   |                            | User ID of inviter                     |
| `siteIds`    | String[] |                            | Sites to grant access to               |
| `resendCount`| Int      | `@default(0)`             | Number of times invite was resent      |
| `expiresAt`  | DateTime |                            | Invite expiration time                 |
| `createdAt`  | DateTime | `@default(now())`         | Creation timestamp                     |

**Indexes:** `[workspaceId, status]`
**Relations:** `workspace -> Workspace`

---

### SitePermission (`site_permissions`)

| Field          | Type     | Constraints                | Description                          |
|----------------|----------|----------------------------|--------------------------------------|
| `id`           | String   | `@id @default(cuid())`    | Primary key                          |
| `memberId`     | String   |                            | FK to WorkspaceMember                |
| `siteId`       | String   |                            | FK to Site                           |
| `roleOverride` | String   |                            | Role override for this specific site |
| `grantedBy`    | String   |                            | User ID who granted permission       |
| `grantedByName`| String?  |                            | Name of granter (denormalized)       |
| `createdAt`    | DateTime | `@default(now())`         | Grant timestamp                      |

**Unique:** `[memberId, siteId]`
**Relations:** `member -> WorkspaceMember`, `site -> Site`

---

### WSSharingSettings (`ws_sharing_settings`)

| Field              | Type    | Constraints                  | Description                             |
|--------------------|---------|------------------------------|-----------------------------------------|
| `id`               | String  | `@id @default(cuid())`      | Primary key                             |
| `workspaceId`      | String  | `@unique`                    | FK to Workspace                         |
| `defaultExpiration`| String? |                              | Default expiry for share links          |
| `requirePw`        | Boolean | `@default(false)`           | Require passwords on share links        |
| `allowEditors`     | Boolean | `@default(true)`            | Allow editors to create share links     |
| `notify`           | Boolean | `@default(true)`            | Notify when share links are viewed      |

**Relations:** `workspace -> Workspace`

---

### WorkspaceTransfer (`workspace_transfers`)

| Field        | Type     | Constraints               | Description                         |
|--------------|----------|---------------------------|-------------------------------------|
| `id`         | String   | `@id @default(cuid())`   | Primary key                         |
| `workspaceId`| String   |                           | FK to Workspace                     |
| `fromUserId` | String   |                           | Current owner user ID               |
| `toUserId`   | String?  |                           | New owner user ID (null until accepted) |
| `toEmail`    | String   |                           | Recipient email                     |
| `token`      | String   | `@unique`                 | Transfer verification token         |
| `status`     | String   | `@default("PENDING")`    | Transfer status                     |
| `expiresAt`  | DateTime |                           | Transfer expiration                 |
| `createdAt`  | DateTime | `@default(now())`        | Creation timestamp                  |

---

### ActivityLog (`activity_logs`)

| Field        | Type     | Constraints                | Description                         |
|--------------|----------|----------------------------|-------------------------------------|
| `id`         | String   | `@id @default(cuid())`    | Primary key                         |
| `workspaceId`| String   |                            | FK to Workspace                     |
| `siteId`     | String?  |                            | FK to Site (if site-related)        |
| `actorId`    | String?  |                            | User who performed the action       |
| `action`     | String   |                            | ActivityAction enum value           |
| `targetType` | String?  |                            | Type of target (site, member, etc.) |
| `targetId`   | String?  |                            | ID of the target entity             |
| `description`| String?  |                            | Human-readable description          |
| `metadata`   | Json?    |                            | Additional structured data          |
| `createdAt`  | DateTime | `@default(now())`         | Event timestamp                     |

**Indexes:** `[workspaceId, createdAt]`
**Relations:** `workspace -> Workspace`

---

## Sites & Content Domain

### Site (`sites`)

| Field              | Type     | Constraints                  | Description                              |
|--------------------|----------|------------------------------|------------------------------------------|
| `id`               | String   | `@id @default(cuid())`      | Primary key                              |
| `workspaceId`      | String   |                              | FK to Workspace                          |
| `name`             | String   |                              | Site display name                        |
| `slug`             | String   | `@unique`                    | URL-safe slug (subdomain)                |
| `status`           | String   | `@default("DRAFT")`         | DRAFT/PUBLISHED/ARCHIVED                 |
| `template`         | String?  |                              | Template slug used (if created from template) |
| `creationMethod`   | String   | `@default("BLANK")`         | BLANK/TEMPLATE/AI                        |
| `thumbnail`        | String?  |                              | Auto-generated thumbnail URL             |
| `pages`            | Int      | `@default(0)`               | Page count (denormalized)                |
| `aiJobId`          | String?  |                              | FK to AIGenerationJob (if AI-created)    |
| `lastEditedAt`     | DateTime | `@default(now())`           | Last content edit timestamp              |
| `lastPublishedAt`  | DateTime?|                              | Last successful publish timestamp        |
| `lastPublishError` | String?  |                              | Last publish error message               |
| `publishedUrl`     | String?  |                              | Live URL after publish                   |
| `createdBy`        | String   |                              | User ID of creator                       |
| `headCode`         | String?  |                              | Custom code injected into `<head>`       |
| `bodyCode`         | String?  |                              | Custom code injected before `</body>`    |
| `socialLinks`      | Json?    |                              | Social media link configuration          |
| `publishedPassword`| String?  |                              | Password hash for published site access  |
| `metaTitleTemplate`| String?  |                              | Template for page meta titles            |
| `touchIcon`        | String?  |                              | Favicon/touch icon URL                   |
| `folderId`         | String?  |                              | FK to Folder (null = root)               |
| `lastPublishedBy`  | String?  |                              | User ID who last published               |
| `deletedAt`        | DateTime?|                              | Soft-delete timestamp                    |
| `createdAt`        | DateTime | `@default(now())`           | Creation timestamp                       |
| `updatedAt`        | DateTime | `@updatedAt`                | Last update timestamp                    |

**Indexes:** `[workspaceId]`, `[workspaceId, status]`
**Relations:** `workspace -> Workspace`, `folder -> Folder (onDelete: SetNull)`, `sitePages[]`, `domains[]`, `shareLinks[]`, `permissions[]`, `analytics[]`, `formBlocks[]`, `formSubmissions[]`, `redirects[]`, `slugHistory[]`, `publishJobs[]`, `analyticsEvents[]`

---

### Page (`pages`)

| Field           | Type     | Constraints                      | Description                       |
|-----------------|----------|----------------------------------|-----------------------------------|
| `id`            | String   | `@id @default(cuid())`          | Primary key                       |
| `siteId`        | String   |                                  | FK to Site                        |
| `name`          | String   | `@db.VarChar(100)`              | Page name                         |
| `slug`          | String   | `@db.VarChar(100)`              | URL slug within site              |
| `position`      | Int      |                                  | Sort order (0-indexed)            |
| `blocks`        | Json     | `@default("[]")`                | Array of content blocks           |
| `isHomePage`    | Boolean  | `@default(false)`               | Whether this is the site homepage |
| `seoTitle`      | String?  | `@db.VarChar(60)`               | SEO page title                    |
| `seoDescription`| String?  | `@db.VarChar(160)`              | SEO meta description              |
| `createdAt`     | DateTime | `@default(now())`               | Creation timestamp                |
| `updatedAt`     | DateTime | `@updatedAt`                    | Last update timestamp             |

**Unique:** `[siteId, slug]`
**Relations:** `site -> Site (onDelete: Cascade)`

---

### Folder (`folders`)

| Field        | Type     | Constraints                | Description                    |
|--------------|----------|----------------------------|--------------------------------|
| `id`         | String   | `@id @default(cuid())`    | Primary key                    |
| `workspaceId`| String   |                            | FK to Workspace                |
| `name`       | String   |                            | Folder name                    |
| `position`   | Int      | `@default(0)`             | Sort order                     |
| `createdAt`  | DateTime | `@default(now())`         | Creation timestamp             |

**Indexes:** `[workspaceId]`
**Relations:** `workspace -> Workspace`, `sites[]`

---

### SlugHistory (`slug_history`)

| Field      | Type     | Constraints               | Description                      |
|------------|----------|---------------------------|----------------------------------|
| `id`       | String   | `@id @default(cuid())`   | Primary key                      |
| `siteId`   | String   |                           | FK to Site                       |
| `oldSlug`  | String   | `@unique`                 | Previous slug value              |
| `newSlug`  | String   |                           | New slug value                   |
| `createdAt`| DateTime | `@default(now())`        | When slug was changed            |

**Relations:** `site -> Site (onDelete: Cascade)`

---

### Redirect (`redirects`)

| Field      | Type     | Constraints               | Description                      |
|------------|----------|---------------------------|----------------------------------|
| `id`       | String   | `@id @default(cuid())`   | Primary key                      |
| `siteId`   | String   |                           | FK to Site                       |
| `fromPath` | String   |                           | Source path                      |
| `toUrl`    | String   |                           | Destination URL                  |
| `type`     | String   | `@default("301")`        | Redirect type (301 or 302)       |
| `createdAt`| DateTime | `@default(now())`        | Creation timestamp               |

**Indexes:** `[siteId]`
**Relations:** `site -> Site (onDelete: Cascade)`

---

## Domain & Publishing Domain

### Domain (`domains`)

| Field          | Type     | Constraints                | Description                       |
|----------------|----------|----------------------------|-----------------------------------|
| `id`           | String   | `@id @default(cuid())`    | Primary key                       |
| `siteId`       | String   |                            | FK to Site                        |
| `domain`       | String   | `@unique`                  | Domain name (e.g. example.com)    |
| `status`       | String   | `@default("PENDING")`     | PENDING/VERIFIED/FAILED           |
| `sslStatus`    | String   | `@default("PENDING")`     | PENDING/ACTIVE/EXPIRED            |
| `sslExpiresAt` | DateTime?|                            | SSL certificate expiration        |
| `lastCheckedAt`| DateTime?|                            | Last DNS verification check       |
| `autoRenewSsl` | Boolean  | `@default(true)`          | Auto-renew SSL certificate        |
| `isPrimary`    | Boolean  | `@default(false)`         | Whether this is the primary domain |
| `createdAt`    | DateTime | `@default(now())`         | Connection timestamp              |

**Relations:** `site -> Site (onDelete: Cascade)`, `dnsRecords[]`

---

### DnsRecord (`dns_records`)

| Field     | Type    | Constraints               | Description                    |
|-----------|---------|---------------------------|--------------------------------|
| `id`      | String  | `@id @default(cuid())`   | Primary key                    |
| `domainId`| String  |                           | FK to Domain                   |
| `type`    | String  |                           | Record type (A, CNAME, TXT)    |
| `host`    | String  |                           | Record host                    |
| `value`   | String  |                           | Record value                   |
| `verified`| Boolean | `@default(false)`        | Whether record is verified     |

**Relations:** `domain -> Domain (onDelete: Cascade)`

---

### ShareLink (`share_links`)

| Field         | Type     | Constraints                | Description                          |
|---------------|----------|----------------------------|--------------------------------------|
| `id`          | String   | `@id @default(cuid())`    | Primary key                          |
| `siteId`      | String   |                            | FK to Site                           |
| `name`        | String   |                            | Descriptive name for the link        |
| `token`       | String   | `@unique`                  | Unique share token                   |
| `passwordHash`| String?  |                            | Bcrypt hash of password (if set)     |
| `expiresAt`   | DateTime?|                            | Optional expiration                  |
| `viewCount`   | Int      | `@default(0)`             | Number of times viewed               |
| `isActive`    | Boolean  | `@default(true)`          | Whether link is active               |
| `createdAt`   | DateTime | `@default(now())`         | Creation timestamp                   |

**Indexes:** `[siteId, isActive]`
**Relations:** `site -> Site (onDelete: Cascade)`

---

### PublishBuildJob (`publish_build_jobs`)

| Field         | Type     | Constraints                | Description                        |
|---------------|----------|----------------------------|------------------------------------|
| `id`          | String   | `@id @default(cuid())`    | Primary key                        |
| `siteId`      | String   |                            | FK to Site                         |
| `workspaceId` | String   |                            | FK to Workspace                    |
| `status`      | String   | `@default("QUEUED")`      | QUEUED, BUILDING, DEPLOYING, COMPLETED, FAILED, CANCELLED |
| `progress`    | Int      | `@default(0)`             | Progress percentage (0-100)        |
| `steps`       | Json?    |                            | Build step details                 |
| `log`         | Json?    |                            | Build log entries                  |
| `deploymentId`| String?  |                            | External deployment ID             |
| `error`       | String?  |                            | Error message if failed            |
| `startedAt`   | DateTime?|                            | When build started                 |
| `completedAt` | DateTime?|                            | When build completed               |
| `createdAt`   | DateTime | `@default(now())`         | Job creation timestamp             |

**Relations:** `site -> Site (onDelete: Cascade)`

---

## Analytics Domain

### SiteAnalytics (`site_analytics`)

| Field           | Type     | Constraints                  | Description                       |
|-----------------|----------|------------------------------|-----------------------------------|
| `id`            | String   | `@id @default(cuid())`      | Primary key                       |
| `siteId`        | String   |                              | FK to Site                        |
| `date`          | DateTime | `@db.Date`                  | Calendar date                     |
| `visitors`      | Int      | `@default(0)`               | Total visitors                    |
| `uniqueVisitors`| Int      | `@default(0)`               | Unique visitors                   |
| `pageViews`     | Int      | `@default(0)`               | Total page views                  |
| `avgSession`    | Float    | `@default(0)`               | Average session duration (seconds)|
| `bounceRate`    | Float    | `@default(0)`               | Bounce rate (0-1)                 |
| `topPages`      | Json?    |                              | Top pages by views                |

**Unique:** `[siteId, date]`
**Indexes:** `[siteId, date]`
**Relations:** `site -> Site (onDelete: Cascade)`

---

### AnalyticsEvent (`analytics_events`)

| Field          | Type     | Constraints                | Description                      |
|----------------|----------|----------------------------|----------------------------------|
| `id`           | String   | `@id @default(cuid())`    | Primary key                      |
| `siteId`       | String   |                            | FK to Site                       |
| `path`         | String   |                            | Page path visited                |
| `referrer`     | String?  |                            | Referrer URL                     |
| `sessionId`    | String?  |                            | Visitor session identifier       |
| `userAgent`    | String?  |                            | Browser user-agent               |
| `country`      | String?  |                            | Geo-resolved country code        |
| `viewportWidth`| Int?     |                            | Viewport width in pixels         |
| `createdAt`    | DateTime | `@default(now())`         | Event timestamp                  |

**Indexes:** `[siteId, createdAt]`
**Relations:** `site -> Site (onDelete: Cascade)`

---

## Forms Domain

### FormBlock (`form_blocks`)

| Field             | Type     | Constraints                | Description                         |
|-------------------|----------|----------------------------|-------------------------------------|
| `id`              | String   | `@id @default(cuid())`    | Primary key                         |
| `siteId`          | String   |                            | FK to Site                          |
| `pageId`          | String?  |                            | FK to Page (if page-level)          |
| `blockId`         | String   |                            | Block ID within the page JSON       |
| `name`            | String   |                            | Form display name                   |
| `fields`          | Json     |                            | Form field definitions              |
| `submitButtonText`| String   | `@default("Submit")`      | Submit button label                 |
| `successMessage`  | String?  |                            | Message shown after submission      |
| `notifyEmail`     | String?  |                            | Email to notify on submission       |
| `webhookUrl`      | String?  |                            | Webhook URL to POST submissions to  |
| `isActive`        | Boolean  | `@default(true)`          | Whether form accepts submissions    |
| `createdAt`       | DateTime | `@default(now())`         | Creation timestamp                  |
| `updatedAt`       | DateTime | `@updatedAt`              | Last update timestamp               |

**Relations:** `site -> Site (onDelete: Cascade)`, `submissions[]`

---

### FormSubmission (`form_submissions`)

| Field        | Type     | Constraints                | Description                       |
|--------------|----------|----------------------------|-----------------------------------|
| `id`         | String   | `@id @default(cuid())`    | Primary key                       |
| `formBlockId`| String   |                            | FK to FormBlock                   |
| `siteId`     | String   |                            | FK to Site                        |
| `data`       | Json     |                            | Submitted form data               |
| `sourceUrl`  | String?  |                            | URL where form was submitted      |
| `deviceInfo` | String?  |                            | Device information                |
| `ip`         | String?  |                            | Submitter IP address              |
| `isRead`     | Boolean  | `@default(false)`         | Whether submission has been read  |
| `isSpam`     | Boolean  | `@default(false)`         | Whether flagged as spam           |
| `isArchived` | Boolean  | `@default(false)`         | Whether archived                  |
| `createdAt`  | DateTime | `@default(now())`         | Submission timestamp              |

**Indexes:** `[siteId, createdAt]`, `[siteId, formBlockId]`
**Relations:** `formBlock -> FormBlock (onDelete: Cascade)`, `site -> Site (onDelete: Cascade)`

---

## Billing Domain

### Subscription (`subscriptions`)

| Field                        | Type     | Constraints                  | Description                              |
|------------------------------|----------|------------------------------|------------------------------------------|
| `id`                         | String   | `@id @default(cuid())`      | Primary key                              |
| `workspaceId`                | String   | `@unique`                    | FK to Workspace (1:1)                    |
| `stripeSubscriptionId`       | String   | `@unique`                    | Stripe subscription ID                   |
| `stripeCurrentPeriodStart`   | DateTime |                              | Current billing period start             |
| `stripeCurrentPeriodEnd`     | DateTime |                              | Current billing period end               |
| `stripePriceId`              | String   |                              | Stripe price ID                          |
| `plan`                       | String   | `@default("FREE")`          | FREE/PRO/BUSINESS                        |
| `status`                     | String   | `@default("ACTIVE")`        | ACTIVE/PAST_DUE/CANCELLED/INCOMPLETE     |
| `interval`                   | String   | `@default("MONTHLY")`       | MONTHLY/YEARLY                           |
| `price`                      | Int      |                              | Price in cents                           |
| `currency`                   | String   | `@default("usd")`           | ISO currency code                        |
| `cancelAtPeriodEnd`          | Boolean  | `@default(false)`           | Whether cancellation is pending          |
| `isGrandfathered`            | Boolean  | `@default(false)`           | Locked into legacy pricing               |
| `createdAt`                  | DateTime | `@default(now())`           | Subscription creation timestamp          |
| `updatedAt`                  | DateTime | `@updatedAt`                | Last update timestamp                    |

**Relations:** `workspace -> Workspace (onDelete: Cascade)`, `paymentMethod?`

---

### PaymentMethod (`payment_methods`)

| Field                   | Type    | Constraints                | Description                    |
|-------------------------|---------|----------------------------|--------------------------------|
| `id`                    | String  | `@id @default(cuid())`    | Primary key                    |
| `subscriptionId`        | String  | `@unique`                  | FK to Subscription (1:1)       |
| `stripePaymentMethodId` | String  |                            | Stripe payment method ID       |
| `type`                  | String  |                            | Card type (card, etc.)         |
| `brand`                 | String  |                            | Card brand (visa, mastercard)  |
| `last4`                 | String  |                            | Last 4 digits of card          |
| `expMonth`              | Int     |                            | Expiration month               |
| `expYear`               | Int     |                            | Expiration year                |

**Relations:** `subscription -> Subscription (onDelete: Cascade)`

---

### Invoice (`invoices`)

| Field            | Type     | Constraints                | Description                    |
|------------------|----------|----------------------------|--------------------------------|
| `id`             | String   | `@id @default(cuid())`    | Primary key                    |
| `workspaceId`    | String   |                            | FK to Workspace                |
| `stripeInvoiceId`| String   | `@unique`                  | Stripe invoice ID              |
| `amount`         | Int      |                            | Amount in cents                |
| `currency`       | String   | `@default("usd")`         | ISO currency code              |
| `status`         | String   | `@default("PENDING")`     | PAID/FAILED/PENDING/REFUNDED   |
| `pdfUrl`         | String?  |                            | Invoice PDF download URL       |
| `periodStart`    | DateTime |                            | Billing period start           |
| `periodEnd`      | DateTime |                            | Billing period end             |
| `paidAt`         | DateTime?|                            | When payment was received      |
| `createdAt`      | DateTime | `@default(now())`         | Creation timestamp             |

**Indexes:** `[workspaceId]`

---

## Notifications Domain

### Notification (`notifications`)

| Field      | Type     | Constraints                | Description                         |
|------------|----------|----------------------------|-------------------------------------|
| `id`       | String   | `@id @default(cuid())`    | Primary key                         |
| `userId`   | String   |                            | FK to User (recipient)              |
| `type`     | String   |                            | NotificationType enum value         |
| `actorId`  | String?  |                            | User ID who triggered the event     |
| `actorName`| String?  |                            | Actor display name (denormalized)   |
| `message`  | String   |                            | Human-readable notification text    |
| `actionUrl`| String?  |                            | Deep link URL                       |
| `read`     | Boolean  | `@default(false)`         | Whether notification has been read  |
| `emailSent`| Boolean  | `@default(false)`         | Whether email notification was sent |
| `priority` | String   | `@default("medium")`      | low/medium/high priority            |
| `createdAt`| DateTime | `@default(now())`         | Creation timestamp                  |

**Indexes:** `[userId, read]`

---

### NotificationPref (`notification_prefs`)

| Field     | Type    | Constraints                   | Description                          |
|-----------|---------|-------------------------------|--------------------------------------|
| `id`      | String  | `@id @default(cuid())`       | Primary key                          |
| `userId`  | String  |                               | FK to User                           |
| `category`| String  |                               | Notification category                |
| `inApp`   | Boolean | `@default(true)`             | Whether in-app notifications enabled |
| `email`   | String  | `@default("instant")`        | Email pref: instant/digest/off       |

**Unique:** `[userId, category]`

---

## Templates & AI Domain

### Template (`templates`)

| Field        | Type     | Constraints                | Description                       |
|--------------|----------|----------------------------|-----------------------------------|
| `id`         | String   | `@id @default(cuid())`    | Primary key                       |
| `name`       | String   |                            | Template display name             |
| `slug`       | String   | `@unique`                  | URL-safe identifier               |
| `category`   | String   |                            | TemplateCategory enum value       |
| `description`| String?  |                            | Template description              |
| `thumbnail`  | String?  |                            | Preview thumbnail URL             |
| `previewUrl` | String?  |                            | Live preview URL                  |
| `difficulty` | String   | `@default("BEGINNER")`    | BEGINNER/INTERMEDIATE/ADVANCED    |
| `pages`      | Json     |                            | Template page definitions         |
| `usageCount` | Int      | `@default(0)`             | Number of times used              |
| `isActive`   | Boolean  | `@default(true)`          | Whether available in gallery      |
| `createdAt`  | DateTime | `@default(now())`         | Creation timestamp                |
| `updatedAt`  | DateTime | `@updatedAt`              | Last update timestamp             |

---

### AIGenerationJob (`ai_generation_jobs`)

| Field          | Type     | Constraints                | Description                          |
|----------------|----------|----------------------------|--------------------------------------|
| `id`           | String   | `@id @default(cuid())`    | Primary key                          |
| `workspaceId`  | String   |                            | FK to Workspace                      |
| `siteId`       | String?  |                            | FK to Site (set when site is created)|
| `userId`       | String   |                            | FK to User who initiated             |
| `status`       | String   | `@default("QUEUED")`      | AIJobStatus enum value               |
| `businessType` | String   |                            | Business category for generation     |
| `description`  | String?  |                            | User-provided site description       |
| `selectedPages`| String[] |                            | Page types selected by user          |
| `progress`     | Int      | `@default(0)`             | Progress percentage (0-100)          |
| `steps`        | Json?    |                            | Detailed step-by-step status         |
| `metadata`     | Json?    |                            | Additional generation parameters     |
| `error`        | String?  |                            | Error message if failed              |
| `completedAt`  | DateTime?|                            | Completion timestamp                 |
| `cancelledAt`  | DateTime?|                            | Cancellation timestamp               |
| `createdAt`    | DateTime | `@default(now())`         | Job creation timestamp               |

---

## Integrations Domain

### WorkspaceIntegration (`workspace_integrations`)

| Field        | Type     | Constraints                | Description                     |
|--------------|----------|----------------------------|---------------------------------|
| `id`         | String   | `@id @default(cuid())`    | Primary key                     |
| `workspaceId`| String   |                            | FK to Workspace                 |
| `provider`   | String   |                            | IntegrationProvider enum value  |
| `config`     | Json     |                            | Provider-specific configuration |
| `isActive`   | Boolean  | `@default(true)`          | Whether integration is active   |
| `createdAt`  | DateTime | `@default(now())`         | Connection timestamp            |
| `updatedAt`  | DateTime | `@updatedAt`              | Last update timestamp           |

**Relations:** `workspace -> Workspace (onDelete: Cascade)`

---

## Help & Support Domain

### HelpArticle (`help_articles`)

| Field       | Type     | Constraints                | Description                    |
|-------------|----------|----------------------------|--------------------------------|
| `id`        | String   | `@id @default(cuid())`    | Primary key                    |
| `title`     | String   |                            | Article title                  |
| `slug`      | String   | `@unique`                  | URL-safe identifier            |
| `category`  | String   |                            | Article category               |
| `content`   | String   |                            | Full article content           |
| `excerpt`   | String?  |                            | Short excerpt for previews     |
| `readTime`  | Int      | `@default(5)`             | Estimated read time in minutes |
| `helpfulYes`| Int      | `@default(0)`             | Helpful vote count             |
| `helpfulNo` | Int      | `@default(0)`             | Not helpful vote count         |
| `createdAt` | DateTime | `@default(now())`         | Publication timestamp          |
| `updatedAt` | DateTime | `@updatedAt`              | Last update timestamp          |

---

### SupportTicket (`support_tickets`)

| Field        | Type     | Constraints                | Description                    |
|--------------|----------|----------------------------|--------------------------------|
| `id`         | String   | `@id @default(cuid())`    | Primary key                    |
| `userId`     | String   |                            | FK to User (submitter)         |
| `subject`    | String   |                            | Ticket subject line            |
| `category`   | String   |                            | TicketCategory enum value      |
| `description`| String   |                            | Detailed description           |
| `status`     | String   | `@default("OPEN")`        | TicketStatus enum value        |
| `attachments`| String[] |                            | Attachment file URLs           |
| `createdAt`  | DateTime | `@default(now())`         | Submission timestamp           |
| `updatedAt`  | DateTime | `@updatedAt`              | Last update timestamp          |

---

## Onboarding Domain

### OnboardingState (`onboarding_states`)

| Field           | Type     | Constraints                | Description                          |
|-----------------|----------|----------------------------|--------------------------------------|
| `id`            | String   | `@id @default(cuid())`    | Primary key                          |
| `userId`        | String   | `@unique`                  | FK to User (1:1)                     |
| `role`          | String?  |                            | Selected OnboardingRole              |
| `step`          | String   | `@default("ROLE_SELECT")` | Current OnboardingStep               |
| `projectName`   | String?  |                            | First project name                   |
| `method`        | String?  |                            | Chosen creation method               |
| `dashboardTasks`| Json?    |                            | Completed dashboard checklist task IDs |
| `editorTasks`   | Json?    |                            | Completed editor tour task IDs       |
| `tourStep`      | Int      | `@default(0)`             | Current editor tour step index       |
| `tourCompleted` | Boolean  | `@default(false)`         | Whether editor tour is complete      |
| `completed`     | Boolean  | `@default(false)`         | Whether all onboarding is complete   |
| `dismissed`     | Boolean  | `@default(false)`         | Whether user dismissed onboarding    |
| `createdAt`     | DateTime | `@default(now())`         | Creation timestamp                   |
| `updatedAt`     | DateTime | `@updatedAt`              | Last update timestamp                |

---

## Account Management Domain

### UserPreference (`user_preferences`)

| Field           | Type    | Constraints                | Description                      |
|-----------------|---------|----------------------------|----------------------------------|
| `id`            | String  | `@id @default(cuid())`    | Primary key                      |
| `userId`        | String  | `@unique`                  | FK to User (1:1)                 |
| `siteViewMode`  | String  | `@default("grid")`        | Sites list view (grid/list)      |
| `siteViewSort`  | String? |                            | Default sort preference          |
| `analyticsRange`| String  | `@default("7d")`          | Default analytics date range     |
| `theme`         | String  | `@default("light")`       | UI theme (light/dark)            |
| `locale`        | String? |                            | Preferred locale override        |

---

### AccountDeletionReq (`account_deletion_requests`)

| Field        | Type     | Constraints                | Description                         |
|--------------|----------|----------------------------|-------------------------------------|
| `id`         | String   | `@id @default(cuid())`    | Primary key                         |
| `userId`     | String   | `@unique`                  | FK to User (1:1)                    |
| `reason`     | String?  |                            | User-provided reason                |
| `scheduledAt`| DateTime |                            | When deletion will execute          |
| `cancelledAt`| DateTime?|                            | When user cancelled the request     |
| `processedAt`| DateTime?|                            | When deletion was actually processed|
| `createdAt`  | DateTime | `@default(now())`         | Request timestamp                   |

---

### ExportJob (`export_jobs`)

| Field        | Type     | Constraints                | Description                      |
|--------------|----------|----------------------------|----------------------------------|
| `id`         | String   | `@id @default(cuid())`    | Primary key                      |
| `userId`     | String   |                            | FK to User                       |
| `status`     | String   | `@default("PENDING")`     | PENDING/PROCESSING/COMPLETED/FAILED |
| `downloadUrl`| String?  |                            | Download URL when ready          |
| `expiresAt`  | DateTime?|                            | Download link expiration         |
| `createdAt`  | DateTime | `@default(now())`         | Request timestamp                |

---

## Model Count Summary

| Domain               | Models |
|----------------------|--------|
| Identity & Auth      | 5 (User, Account, Session, VerificationToken, LoginAttempt) |
| Audit                | 2 (AuditLog, ConnectedAccount) |
| Workspace & Team     | 5 (Workspace, WorkspaceMember, Invite, SitePermission, WSSharingSettings, WorkspaceTransfer) |
| Sites & Content      | 4 (Site, Page, Folder, SlugHistory, Redirect) |
| Domains & Publishing | 3 (Domain, DnsRecord, ShareLink, PublishBuildJob) |
| Analytics            | 2 (SiteAnalytics, AnalyticsEvent) |
| Forms                | 2 (FormBlock, FormSubmission) |
| Billing              | 3 (Subscription, PaymentMethod, Invoice) |
| Notifications        | 2 (Notification, NotificationPref) |
| Templates & AI       | 2 (Template, AIGenerationJob) |
| Integrations         | 1 (WorkspaceIntegration) |
| Help & Support       | 2 (HelpArticle, SupportTicket) |
| Onboarding           | 1 (OnboardingState) |
| Account Management   | 3 (UserPreference, AccountDeletionReq, ExportJob) |
| **Total**            | **33 models** |
