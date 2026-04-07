# Auth Module PRD

Complete product requirements for all authentication pages in the Buildrik application.

---

## Table of Contents

1. [Shared Layout and Components](#1-shared-layout-and-components)
2. [Auth Landing Page](#2-auth-landing-page)
3. [Login Page](#3-login-page)
4. [Signup Page](#4-signup-page)
5. [Verify Email Page](#5-verify-email-page)
6. [Forgot Password Page](#6-forgot-password-page)
7. [Reset Password Page](#7-reset-password-page)
8. [Password Changed Page](#8-password-changed-page)
9. [Magic Link Request Page](#9-magic-link-request-page)
10. [Magic Link Sent Page](#10-magic-link-sent-page)
11. [Callback Page (Magic Link Verification)](#11-callback-page)
12. [Two-Factor Authentication Page](#12-two-factor-authentication-page)
13. [2FA Backup Code Page](#13-2fa-backup-code-page)
14. [OTP Page](#14-otp-page)
15. [Check Inbox Page](#15-check-inbox-page)
16. [Redirect Page](#16-redirect-page)
17. [Invite Page](#17-invite-page)
18. [Workspace Select Page](#18-workspace-select-page)
19. [Success Page](#19-success-page)
20. [Splash Page](#20-splash-page)
21. [Error: Access Denied](#21-error-access-denied)
22. [Error: Captcha](#22-error-captcha)
23. [Error: Expired Link](#23-error-expired-link)
24. [Error: Invite Expired](#24-error-invite-expired)
25. [Error: Session Expired](#25-error-session-expired)
26. [Error: Social Login Error](#26-error-social-login-error)
27. [Error: 2FA Locked](#27-error-2fa-locked)
28. [Error: Account Disabled](#28-error-account-disabled)
29. [Error: Account Locked](#29-error-account-locked)
30. [Error: Rate Limited](#30-error-rate-limited)
31. [Error: Suspicious Login](#31-error-suspicious-login)
32. [API Endpoints Summary](#32-api-endpoints-summary)
33. [Validation Rules Summary](#33-validation-rules-summary)
34. [Rate Limiting Summary](#34-rate-limiting-summary)
35. [Middleware and Routing Rules](#35-middleware-and-routing-rules)
36. [Session Management](#36-session-management)

---

## 1. Shared Layout and Components

### Auth Layout

All pages under `/auth/*` share a common layout: a full-viewport white background with content vertically and horizontally centered. The layout applies `min-h-screen`, white background, and flexbox centering with horizontal padding.

### Auth Card

The primary container for auth page content. Renders as a white card with rounded corners, box shadow, and 32px padding (20px on viewports under 480px). Maximum width is constrained by the design token `max-w-auth-card`. Content inside is stacked vertically and centered.

### Auth Logo

Displays the Buildrik brand mark: a grid icon in the brand CTA color paired with bold "Buildrik" text. Appears at the top of every auth card.

### Auth Icon

A contextual icon displayed below the logo on pages that convey a specific status. Available icons: key, shield, shield-alert, shield-x, mail, lock, check (checkmark), warning (triangle), clock, phone. Each accepts a color variant: blue, red, green, or gray.

### Auth Button (Primary)

Full-width button in the brand CTA color with white text. Supports a loading state (shows spinner, disables interaction) and a disabled state (50% opacity, no pointer events).

### Auth Button (Secondary)

Full-width outlined button with transparent background, border matching input borders, and secondary text color. Used for decline/cancel actions.

### Auth Input

Full-width text input with label above. For password fields, a toggle button (eye icon) appears at the right edge to show/hide the password. Supports an error state that changes the border to red and displays an inline error message below. Accepts all standard HTML input attributes.

### Social Button

Full-width outlined button with provider icon (Google or GitHub) and "Continue with [Provider]" label. Google button shows the official 4-color Google "G" icon. GitHub button shows the GitHub octocat silhouette.

### Form Banner

Full-width notification banner in either success (green background, checkmark icon) or error (red background, X-circle icon) variant. Displays a title and an optional subtitle.

### Inline Error

Small red error text displayed directly beneath a form field when field-level validation fails. Renders nothing when no error message is provided.

### Password Strength Indicator

Displays four password requirements as a checklist:
- At least 8 characters
- One uppercase letter
- One number
- One special character (!@#$...)

Each rule shows a green checkmark when met or a gray circle when not.

### Resend Timer

Countdown component used on pages where the user waits for an email. Starts at a configurable number of seconds (typically 60). While counting down, displays "Code expires in M:SS" in CTA color. When the timer reaches zero, switches to "[label] Resend" as a clickable link. Clicking "Resend" triggers the provided callback and resets the timer.

### Auth Divider

Horizontal line with centered text (defaults to "or continue with"). Used to visually separate credential-based and social login options.

---

## 2. Auth Landing Page

**Route:** `/auth`

### Overview

The initial entry point for unauthenticated users. Presents the two primary authentication paths (sign in and create account) alongside social login shortcuts. Users see this page when navigating to `/auth` directly or when redirected from protected routes.

### Layout

- Auth Card containing:
  - Auth Logo
  - Heading: "Welcome to Buildrik"
  - Subheading: "Build beautiful websites, fast."
  - Primary button: "Sign In"
  - Secondary button: "Create Account"
  - Divider with text "or"
  - Google social button
  - GitHub social button
- Below the card: legal disclaimer with links to Terms of Service and Privacy Policy

### Fields and Controls

| Element | Type | Behavior |
|---------|------|----------|
| Sign In | Primary button | Navigates to `/auth/login` |
| Create Account | Secondary button | Navigates to `/auth/signup` |
| Continue with Google | Social button | Initiates Google OAuth via NextAuth `signIn("google")` with callback to `/auth/redirect` |
| Continue with GitHub | Social button | Initiates GitHub OAuth via NextAuth `signIn("github")` with callback to `/auth/redirect` |
| Terms of Service | Link | Opens `/terms` |
| Privacy Policy | Link | Opens `/privacy` |

### Interactions

| User Action | System Response |
|------------|-----------------|
| Clicks "Sign In" | Client-side navigation to `/auth/login` |
| Clicks "Create Account" | Client-side navigation to `/auth/signup` |
| Clicks Google button | Browser redirected to Google OAuth consent screen; on completion returns to `/auth/redirect` |
| Clicks GitHub button | Browser redirected to GitHub OAuth consent screen; on completion returns to `/auth/redirect` |

### API Dependencies

None. Navigation only.

### Page Relationships

| Direction | Page | Condition |
|-----------|------|-----------|
| Outbound | `/auth/login` | Sign In clicked |
| Outbound | `/auth/signup` | Create Account clicked |
| Outbound | `/auth/redirect` | Social login completed |
| Outbound | `/terms` | Terms link clicked |
| Outbound | `/privacy` | Privacy link clicked |

### Business Rules

- Logged-in users are redirected to `/dashboard` by middleware before this page loads.

---

## 3. Login Page

**Route:** `/auth/login`

### Overview

Credential-based sign-in form. Users arrive here from the landing page, from "Back to sign in" links on other auth pages, or when middleware redirects unauthenticated users.

### Layout

- Auth Card containing:
  - Auth Logo
  - Heading: "Welcome back"
  - Subheading: "Sign in to your account"
  - Error banner (conditional)
  - Email input
  - Password input
  - Row: "Remember me" checkbox + "Forgot?" link
  - Primary button: "Sign In"
  - "Or sign in with a magic link" link
  - Divider
  - Google social button
  - GitHub social button
  - Footer text: "Don't have an account? Sign up"

### Fields and Controls

| Element | Type | Validation | Behavior |
|---------|------|------------|----------|
| Email | Text input (email) | Valid email format, required | Autocomplete: `email` |
| Password | Text input (password) | Minimum 8 characters, required | Autocomplete: `current-password`. Eye toggle to show/hide. |
| Remember me | Checkbox | None | Default: unchecked. When checked, session cookie persists for 30 days instead of browser session. |
| Forgot? | Link | N/A | Navigates to `/auth/forgot-password` |
| Sign In | Primary button | N/A | Submits form. Shows loading spinner during request. |
| Or sign in with a magic link | Link | N/A | Navigates to `/auth/magic-link` |
| Continue with Google | Social button | N/A | Initiates Google OAuth |
| Continue with GitHub | Social button | N/A | Initiates GitHub OAuth |
| Sign up | Link | N/A | Navigates to `/auth/signup` |

### Interactions

| User Action | System Response |
|------------|-----------------|
| Submits form with valid credentials | Calls `trpc.auth.login`. On success without 2FA: creates session via `POST /api/auth/create-session`, then navigates to `/auth/redirect`. |
| Submits form, user has 2FA enabled | Login returns `requiresTwoFactor: true` + `tempToken`. Navigates to `/auth/2fa?token={tempToken}`. |
| Submits form with wrong credentials | Error banner: "Incorrect email or password -- N more attempt(s)" showing remaining attempts. |
| Submits form, account is locked | Navigates to `/auth/error/locked?until={lockedUntil ISO timestamp}`. |
| Submits form, other error | Error banner displays the error message. |
| Clicks social button | Redirects to provider OAuth; callback returns to `/auth/redirect`. |

### API Dependencies

| Method | Endpoint | Trigger | Rate Limit |
|--------|----------|---------|------------|
| tRPC mutation | `auth.login` | Form submit | Strict: 5 attempts per 15 minutes |
| POST | `/api/auth/create-session` | After successful login (no 2FA) | N/A |

### Page Relationships

| Direction | Page | Condition |
|-----------|------|-----------|
| Inbound | `/auth` | Sign In button on landing page |
| Inbound | Any auth page | "Back to sign in" links |
| Inbound | Middleware redirect | Unauthenticated access to `/dashboard` or `/onboarding` |
| Outbound | `/auth/2fa?token=...` | User has 2FA enabled |
| Outbound | `/auth/redirect` | Successful login (no 2FA) or social login |
| Outbound | `/auth/forgot-password` | "Forgot?" link |
| Outbound | `/auth/magic-link` | Magic link option |
| Outbound | `/auth/signup` | "Sign up" link |
| Outbound | `/auth/error/locked?until=...` | Account locked after too many failures |

### Business Rules

- Email and password are validated client-side (non-empty, email format, 8-char minimum for password) and server-side via Zod schema (`loginSchema`).
- Failed attempts decrement a counter. When attempts reach zero, the account is locked and the user is redirected to the locked error page.
- The backend performs bcrypt comparison even when the user is not found (timing-safe) to prevent email enumeration.
- The "Remember me" flag is passed to the session creation endpoint, which sets a 30-day `maxAge` on the cookie when checked.
- Logged-in users are redirected to `/dashboard` by middleware.

---

## 4. Signup Page

**Route:** `/auth/signup`

### Overview

Account registration form. Users arrive from the landing page or the login page's "Sign up" link.

### Layout

- Auth Card containing:
  - Auth Logo
  - Heading: "Create your account"
  - Subheading: "Start building for free"
  - Error banner (conditional)
  - Full Name input
  - Email input
  - Password input
  - Password strength indicator
  - Terms acceptance checkbox
  - Primary button: "Create Account"
  - Divider
  - Google social button
  - GitHub social button
  - Footer: "Already have an account? Sign in"

### Fields and Controls

| Element | Type | Validation | Behavior |
|---------|------|------------|----------|
| Full Name | Text input | 2-100 characters, required | Autocomplete: `name` |
| Email | Text input (email) | Valid email format, required | Autocomplete: `email` |
| Password | Text input (password) | Min 8 chars, 1 uppercase, 1 number, 1 special char | Autocomplete: `new-password`. Eye toggle. |
| Password Strength | Indicator | N/A | Live checklist below password field showing which rules pass. |
| Terms checkbox | Checkbox | Must be checked to submit | Includes inline links to Terms of Service (`/terms`) and Privacy Policy (`/privacy`). |
| Create Account | Primary button | N/A | Disabled when terms unchecked. Shows loading spinner during request. |
| Continue with Google | Social button | N/A | Initiates Google OAuth |
| Continue with GitHub | Social button | N/A | Initiates GitHub OAuth |
| Sign in | Link | N/A | Navigates to `/auth/login` |

### Interactions

| User Action | System Response |
|------------|-----------------|
| Submits form with valid data | Calls `trpc.auth.signup`. On success, navigates to `/auth/verify-email?email={email}`. |
| Email already registered | Error banner: "Email already registered" (HTTP 409). |
| Password fails strength rules | Server-side Zod validation rejects with specific rule failure message. |
| Terms not accepted | Submit button is disabled; cannot submit. Server also enforces `termsAccepted: true`. |
| Other error | Error banner displays the error message. |

### API Dependencies

| Method | Endpoint | Trigger | Rate Limit |
|--------|----------|---------|------------|
| tRPC mutation | `auth.signup` | Form submit | Normal: 10 attempts per 15 minutes |

### Page Relationships

| Direction | Page | Condition |
|-----------|------|-----------|
| Inbound | `/auth` | Create Account button |
| Inbound | `/auth/login` | "Sign up" link |
| Outbound | `/auth/verify-email?email=...` | Successful registration |
| Outbound | `/auth/login` | "Sign in" link |
| Outbound | `/auth/redirect` | Social signup completed |

### Business Rules

- On successful signup, the backend creates the user, hashes the password with bcrypt (cost 10), creates a default workspace named "{fullName}'s Workspace", creates a workspace membership with OWNER role, initializes onboarding state, and sends a verification email.
- The verification email token is valid for 24 hours.
- If the verification email fails to send, the user account is still created; the user can request a resend from the verify-email page.
- Duplicate email check is performed at the database level.
- Password validation rules are defined in a single Zod schema (`signupSchema`) and enforced server-side.
- Logged-in users are redirected to `/dashboard` by middleware.

---

## 5. Verify Email Page

**Route:** `/auth/verify-email`

### Overview

Multi-state page that handles the entire email verification lifecycle. Depending on query parameters and verification status, it displays one of four states: waiting for user to check inbox, verifying in progress, verification successful, or verification failed.

### Query Parameters

| Param | Type | Source |
|-------|------|--------|
| `email` | string (optional) | Passed from signup page. Used to display the email address and enable resend. |
| `token` | string (optional) | UUID from the verification email link. Triggers auto-verification on mount. |

### State 1: Check Your Inbox (no token, has email)

Displayed immediately after signup.

**Layout:**
- Auth Logo
- Mail icon (blue)
- Heading: "Verify your email"
- Body text explaining a verification link was sent
- Email address in a highlighted badge
- Hint: "Don't see it? Check your spam or junk folder."
- Resend timer (60s countdown, then resend option)
- "Use a different email" link (to `/auth/signup`)
- "Back to sign in" link (to `/auth/login`)

**Interactions:**

| User Action | System Response |
|------------|-----------------|
| Resend timer expires, clicks "Resend" | Calls `trpc.auth.resendVerification` with the email. Resets timer. |
| Clicks "Use a different email" | Navigates to `/auth/signup` |
| Clicks "Back to sign in" | Navigates to `/auth/login` |

### State 2: Verifying In Progress (has token, no error, not yet verified)

Displayed while the verification API call is in flight.

**Layout:**
- Auth Logo
- Mail icon (blue)
- Heading: "Verifying your email..."
- Body: "Please wait while we verify your email address."

### State 3: Verification Successful

Displayed after the `trpc.auth.verifyEmail` mutation succeeds.

**Layout:**
- Checkmark icon (green)
- Heading: "Email verified"
- Body: "Your email has been verified. You can now sign in."
- Primary button: "Go to Sign In"
- Countdown text: "Redirecting in Ns..."

**Interactions:**

| User Action | System Response |
|------------|-----------------|
| Automatic | 5-second countdown begins. Auto-redirects to `/auth/login` when it reaches zero. |
| Clicks "Go to Sign In" | Immediately navigates to `/auth/login` |

### State 4: Verification Failed (has token, error occurred)

**Layout:**
- Auth Logo
- Warning icon (red)
- Heading: "Verification failed"
- Error banner with the error message
- Resend option (if email parameter present) or "Try signing up again" link (if no email)
- "Back to sign in" link

### API Dependencies

| Method | Endpoint | Trigger | Rate Limit |
|--------|----------|---------|------------|
| tRPC mutation | `auth.verifyEmail` | Page mount when `token` param present | Normal: 10/15min |
| tRPC mutation | `auth.resendVerification` | Resend button click | Normal: 10/15min |

### Business Rules

- Token is a UUID, validated server-side.
- Token type must be `email_verify`.
- On successful verification, the user's `emailVerified` field is set to the current timestamp.
- Used tokens are invalidated immediately after successful verification.
- Expired tokens result in error message "Verification link expired" (HTTP 410).
- The resend endpoint is silent on non-existent emails (returns success regardless) to prevent enumeration.

---

## 6. Forgot Password Page

**Route:** `/auth/forgot-password`

### Overview

Allows users to request a password reset email. Users arrive here from the "Forgot?" link on the login page.

### Layout

- Auth Card containing:
  - Auth Logo
  - Key icon (blue)
  - Heading: "Forgot your password?"
  - Subheading: "No worries, we'll send you reset instructions"
  - Error banner (conditional)
  - Email input (required)
  - Primary button: "Send Reset Email"
  - "Back to sign in" link

### Fields and Controls

| Element | Type | Validation | Behavior |
|---------|------|------------|----------|
| Email | Text input (email) | Valid email, required (HTML `required` attribute) | N/A |
| Send Reset Email | Primary button | N/A | Shows loading spinner during request |
| Back to sign in | Link | N/A | Navigates to `/auth/login` |

### Interactions

| User Action | System Response |
|------------|-----------------|
| Submits form | Calls `trpc.auth.forgotPassword`. On success, navigates to `/auth/check-inbox?type=reset&email={email}`. |
| Error | Error banner displays the error message. |

### API Dependencies

| Method | Endpoint | Trigger | Rate Limit |
|--------|----------|---------|------------|
| tRPC mutation | `auth.forgotPassword` | Form submit | Normal: 10/15min |

### Page Relationships

| Direction | Page | Condition |
|-----------|------|-----------|
| Inbound | `/auth/login` | "Forgot?" link |
| Outbound | `/auth/check-inbox?type=reset&email=...` | Success |
| Outbound | `/auth/login` | "Back to sign in" link |

### Business Rules

- Always returns success to the client, even if the email is not registered (prevents email enumeration).
- If a valid user exists, generates a password reset token valid for 1 hour and sends a reset email.
- An audit event `PASSWORD_RESET_REQUESTED` is logged.

---

## 7. Reset Password Page

**Route:** `/auth/reset-password`

### Overview

Allows users to set a new password after clicking the reset link in their email. The page reads a `token` query parameter to authenticate the request.

### Query Parameters

| Param | Type | Source |
|-------|------|--------|
| `token` | string (required) | UUID from the password reset email link |

### State 1: Invalid Link (no token)

**Layout:**
- Auth Logo
- Warning icon (red)
- Heading: "Invalid link"
- Body: "This reset link is invalid. Please request a new one."
- Primary button: "Request New Link" (navigates to `/auth/forgot-password`)

### State 2: Reset Form (token present)

**Layout:**
- Auth Card containing:
  - Auth Logo
  - Lock icon (blue)
  - Heading: "Set new password"
  - Subheading: "Must be at least 8 characters"
  - New Password input
  - Confirm New Password input
  - Inline error for password mismatch (conditional)
  - Password strength indicator (tracks New Password field)
  - Primary button: "Reset Password"
  - "Back to sign in" link

### Fields and Controls

| Element | Type | Validation | Behavior |
|---------|------|------------|----------|
| New Password | Text input (password) | Min 8 chars, 1 uppercase, 1 number, 1 special char (required) | Eye toggle |
| Confirm New Password | Text input (password) | Must match New Password (required) | Eye toggle |
| Reset Password | Primary button | N/A | Shows loading spinner during request |
| Back to sign in | Link | N/A | Navigates to `/auth/login` |

### Interactions

| User Action | System Response |
|------------|-----------------|
| Submits with mismatched passwords | Inline error: "Passwords do not match" below confirm field. No API call made. |
| Submits with matching valid passwords | Calls `trpc.auth.resetPassword`. On success, navigates to `/auth/password-changed`. |
| Token is expired | Navigates to `/auth/error/expired-link?type=reset`. |
| Other error | Inline error below confirm field with the error message. |

### API Dependencies

| Method | Endpoint | Trigger | Rate Limit |
|--------|----------|---------|------------|
| tRPC mutation | `auth.resetPassword` | Form submit | Strict: 5/15min |

### Page Relationships

| Direction | Page | Condition |
|-----------|------|-----------|
| Inbound | Email reset link | User clicks link in email |
| Outbound | `/auth/password-changed` | Successful reset |
| Outbound | `/auth/error/expired-link?type=reset` | Token expired |
| Outbound | `/auth/forgot-password` | "Request New Link" (invalid link state) |
| Outbound | `/auth/login` | "Back to sign in" |

### Business Rules

- Client-side validation checks password match before sending to server.
- Server-side Zod schema (`resetPasswordSchema`) enforces password strength rules and match via `.refine()`.
- On successful reset, the token is invalidated, the password hash is updated, and all existing sessions for the user are deleted (forces re-login on all devices).
- An audit event `PASSWORD_RESET_COMPLETED` is logged.

---

## 8. Password Changed Page

**Route:** `/auth/password-changed`

### Overview

Confirmation page shown after a successful password reset. Displays a success message and auto-redirects to login.

### Layout

- Auth Card containing:
  - Auth Logo
  - Checkmark icon (green)
  - Heading: "Password changed"
  - Body: "Your password has been reset. You can now sign in."
  - Primary button: "Go to Sign In"
  - Countdown: "Redirecting to sign in in Ns..."
  - Security notice: "For your security, all active sessions have been signed out." (with shield icon)

### Interactions

| User Action | System Response |
|------------|-----------------|
| Automatic | 5-second countdown. Redirects to `/auth/login` when it reaches zero. |
| Clicks "Go to Sign In" | Immediately navigates to `/auth/login`. |

### API Dependencies

None.

### Page Relationships

| Direction | Page | Condition |
|-----------|------|-----------|
| Inbound | `/auth/reset-password` | Successful password reset |
| Outbound | `/auth/login` | Auto-redirect or button click |

---

## 9. Magic Link Request Page

**Route:** `/auth/magic-link`

### Overview

Allows users to request a passwordless sign-in link via email. Users arrive from the "Or sign in with a magic link" option on the login page.

### Layout

- Auth Card containing:
  - Auth Logo
  - Mail icon (blue)
  - Heading: "Sign in with magic link"
  - Subheading: "We'll email you a link to sign in without a password"
  - Error banner (conditional)
  - Email input (required)
  - Primary button: "Send Magic Link"
  - "Back to sign in" link

### Fields and Controls

| Element | Type | Validation | Behavior |
|---------|------|------------|----------|
| Email | Text input (email) | Valid email, required | N/A |
| Send Magic Link | Primary button | N/A | Shows loading spinner |
| Back to sign in | Link | N/A | Navigates to `/auth/login` |

### Interactions

| User Action | System Response |
|------------|-----------------|
| Submits form | Calls `trpc.auth.magicLink`. On success, navigates to `/auth/magic-link/sent?email={email}`. |
| Error | Error banner with message. |

### API Dependencies

| Method | Endpoint | Trigger | Rate Limit |
|--------|----------|---------|------------|
| tRPC mutation | `auth.magicLink` | Form submit | Normal: 10/15min |

### Business Rules

- Always returns success regardless of whether email exists (prevents enumeration).
- If user exists, generates a magic link token valid for 15 minutes and sends it via email.
- Audit event `MAGIC_LINK_REQUESTED` logged.

---

## 10. Magic Link Sent Page

**Route:** `/auth/magic-link/sent`

### Overview

Confirmation page shown after requesting a magic link. Instructs the user to check their email.

### Query Parameters

| Param | Type | Source |
|-------|------|--------|
| `email` | string (optional) | Passed from magic link request page |

### Layout

- Auth Card containing:
  - Auth Logo
  - Mail icon (blue)
  - Heading: "Check your email"
  - Body: "We sent a magic link to {email}. Click the link to sign in. Expires in 15 minutes."
  - Primary button: "Open Email App" (mailto: link)
  - Resend timer (60s)
  - "Use password instead" link
  - "Back to sign in" link

### Interactions

| User Action | System Response |
|------------|-----------------|
| Clicks "Open Email App" | Opens the default email client via `mailto:` |
| Timer expires, clicks "Resend" | Calls `trpc.auth.magicLink` with the stored email. Resets timer. |
| Clicks "Use password instead" | Navigates to `/auth/login` |
| Clicks "Back to sign in" | Navigates to `/auth/login` |

### API Dependencies

| Method | Endpoint | Trigger | Rate Limit |
|--------|----------|---------|------------|
| tRPC mutation | `auth.magicLink` | Resend click | Normal: 10/15min |

---

## 11. Callback Page

**Route:** `/auth/callback`

### Overview

Landing page for magic link email clicks. Automatically verifies the token and completes sign-in. Users never navigate here manually; they arrive by clicking a link in their email.

### Query Parameters

| Param | Type | Source |
|-------|------|--------|
| `token` | string (required) | UUID from the magic link email |

### State 1: Verifying (default)

**Layout:**
- Auth Logo
- Spinning loader
- Text: "Completing sign in..."

### State 2: Error

**Layout:**
- Auth Card containing:
  - Auth Logo
  - Warning icon (red)
  - Heading: "Link expired"
  - Body: error message
  - Primary button: "Request New Link" (navigates to `/auth/magic-link`)
  - "Back to sign in" link

### Interactions

| User Action | System Response |
|------------|-----------------|
| Page loads with token | Automatically calls `trpc.auth.verifyMagicLink`. |
| Verification succeeds, no 2FA | Creates session via `POST /api/auth/create-session`, navigates to `/auth/redirect`. |
| Verification succeeds, 2FA required | Navigates to `/auth/2fa?token={tempToken}`. |
| Verification fails | Shows error state with "Request New Link" option. |

### API Dependencies

| Method | Endpoint | Trigger | Rate Limit |
|--------|----------|---------|------------|
| tRPC mutation | `auth.verifyMagicLink` | Page mount | Strict: 5/15min |
| POST | `/api/auth/create-session` | After successful verification (no 2FA) | N/A |

### Business Rules

- Token is invalidated after use (single-use).
- If the user's email was not previously verified, it is marked as verified upon magic link use.
- If the user has 2FA enabled, a temporary 2FA token (5 min validity) is generated and the user is sent to the 2FA page.
- Audit event `MAGIC_LINK_VERIFIED` logged on success.

---

## 12. Two-Factor Authentication Page

**Route:** `/auth/2fa`

### Overview

Prompts the user to enter a 6-digit code from their authenticator app. Users arrive here after a successful login or magic link verification when their account has 2FA enabled.

### Query Parameters

| Param | Type | Source |
|-------|------|--------|
| `token` | string (required) | Temporary 2FA token (UUID, 5 min validity) from login or magic link verification |

### Layout

- Auth Card containing:
  - Auth Logo
  - Shield icon (blue)
  - Heading: "Two-factor authentication"
  - Body: "Enter the 6-digit code from your authenticator app or the code sent to your phone."
  - Error banner (conditional)
  - 6-digit OTP input
  - Helper text: "Open your authenticator app to get the code."
  - Primary button: "Verify Code" (disabled until 6 digits entered)
  - "or" text
  - "Didn't get a code? Resend (45s)" text
  - "Use a recovery code instead" link
  - "Back to sign in" link

### Fields and Controls

| Element | Type | Validation | Behavior |
|---------|------|------------|----------|
| OTP Input | 6 individual digit boxes | Digits only, exactly 6 | Auto-advances focus. Supports paste of full code. Backspace moves to previous box. |
| Verify Code | Primary button | N/A | Disabled until code is 6 digits. Shows loading spinner. |
| Use a recovery code instead | Link | N/A | Navigates to `/auth/2fa/backup?token={token}` |
| Back to sign in | Link | N/A | Navigates to `/auth/login` |

### Interactions

| User Action | System Response |
|------------|-----------------|
| Enters 6 digits, clicks Verify | Calls `trpc.auth.verify2FA` with `twoFactorToken` and `code`. |
| Verification succeeds | Creates session via `POST /api/auth/create-session`, navigates to `/auth/redirect`. |
| Invalid code | Error banner with message. |
| Too many failed attempts (5+) | Navigates to `/auth/error/2fa-locked`. |
| Session creation fails | Error banner: "Failed to create session" |

### API Dependencies

| Method | Endpoint | Trigger | Rate Limit |
|--------|----------|---------|------------|
| tRPC mutation | `auth.verify2FA` | Verify button click | Strict: 5/15min |
| POST | `/api/auth/create-session` | After successful verification | N/A |

### Business Rules

- The temp token is valid for 5 minutes. If it expires, the user must log in again.
- Server tracks failed 2FA attempts per temp token (max 5). On the 5th failure, the temp token is invalidated and the user is locked out of 2FA for 30 minutes.
- TOTP codes are verified using the `otplib` library against the user's encrypted 2FA secret.
- The 2FA secret is stored encrypted (AES-256-GCM) in the database.
- Audit events: `2FA_FAILED` on bad code, `2FA_VERIFIED` on success, `2FA_LOCKED` on lockout.

---

## 13. 2FA Backup Code Page

**Route:** `/auth/2fa/backup`

### Overview

Allows users to authenticate using a one-time recovery code instead of their authenticator app. Each backup code can only be used once.

### Query Parameters

| Param | Type | Source |
|-------|------|--------|
| `token` | string (required) | Temporary 2FA token from login flow |

### Layout

- Auth Card containing:
  - Auth Logo
  - Shield icon (blue)
  - Heading: "Enter backup code"
  - Body: "Enter one of your recovery codes. Each code can only be used once."
  - Error banner (conditional)
  - Backup Code text input
  - Primary button: "Verify Backup Code"
  - "Back to 2FA" link
  - "Back to sign in" link

### Fields and Controls

| Element | Type | Validation | Behavior |
|---------|------|------------|----------|
| Backup Code | Text input | Format: XXXX-XXXX-XXXX (uppercase alphanumeric) | Input is auto-uppercased on change |
| Verify Backup Code | Primary button | N/A | Shows loading spinner |
| Back to 2FA | Link | N/A | Navigates to `/auth/2fa?token={token}` |
| Back to sign in | Link | N/A | Navigates to `/auth/login` |

### Interactions

| User Action | System Response |
|------------|-----------------|
| Enters code, clicks Verify | Calls `trpc.auth.verifyBackupCode` with `twoFactorToken` and `backupCode`. |
| Valid backup code | Creates session via `POST /api/auth/create-session`, navigates to `/auth/redirect`. |
| Invalid backup code | Error banner: "Invalid backup code". |
| Other error | Error banner with message. |

### API Dependencies

| Method | Endpoint | Trigger | Rate Limit |
|--------|----------|---------|------------|
| tRPC mutation | `auth.verifyBackupCode` | Verify button click | Strict: 5/15min |
| POST | `/api/auth/create-session` | After successful verification | N/A |

### Business Rules

- Backup codes are stored as bcrypt hashes. The server iterates through stored hashes to find a match.
- Once used, the matching backup code is removed from the user's backup codes array.
- The response includes the number of remaining backup codes (`backupCodesRemaining`).
- Audit events: `BACKUP_CODE_FAILED` on invalid code, `BACKUP_CODE_USED` on success.

---

## 14. OTP Page

**Route:** `/auth/otp`

### Overview

Generic OTP verification page for code-based verification sent via phone or email. This is a secondary entry point that forwards the entered code to the 2FA page for processing.

### Query Parameters

| Param | Type | Source |
|-------|------|--------|
| `token` | string (optional) | Token from the login flow |

### Layout

- Auth Card containing:
  - Auth Logo
  - Phone icon (blue)
  - Heading: "Enter verification code"
  - Body: "We sent a code to your phone/email"
  - 6-digit OTP input
  - Primary button: "Verify" (disabled until 6 digits)
  - Resend timer (60s)
  - "Back to sign in" link

### Interactions

| User Action | System Response |
|------------|-----------------|
| Enters 6 digits, clicks Verify | Redirects browser to `/auth/2fa?token={token}&code={code}` via `window.location.href`. |
| Resend timer expires, clicks Resend | Clears the code input. (No API call -- placeholder behavior.) |

### Business Rules

- This page does not make API calls directly. It forwards the code to the 2FA page via URL.
- Primarily serves as a UI for phone/email-based OTP delivery (as opposed to authenticator-app-based 2FA).

---

## 15. Check Inbox Page

**Route:** `/auth/check-inbox`

### Overview

Universal "check your email" confirmation page used after forgot-password and email verification requests. The content adapts based on the `type` query parameter.

### Query Parameters

| Param | Type | Source |
|-------|------|--------|
| `type` | "reset" or "verify" | Determines the messaging variant |
| `email` | string (optional) | Email to display and use for resend |

### Layout

- Auth Card containing:
  - Auth Logo
  - Mail icon (blue)
  - Heading: "Check your inbox"
  - Body: varies by type
    - reset: "We sent password reset instructions to"
    - verify: "We sent a verification link to"
  - Email address badge with mail icon (if email provided)
  - Primary "Open Email App" button (mailto: link)
  - Resend timer (60s)
  - "Use a different email" link (to `/auth/forgot-password`)
  - Spam/junk hint text
  - "Back to sign in" link

### Interactions

| User Action | System Response |
|------------|-----------------|
| Clicks "Open Email App" | Opens default email client |
| Timer expires, clicks Resend (reset type) | Calls `trpc.auth.forgotPassword` with email |
| Timer expires, clicks Resend (verify type) | Calls `trpc.auth.resendVerification` with email |
| Clicks "Use a different email" | Navigates to `/auth/forgot-password` |
| Clicks "Back to sign in" | Navigates to `/auth/login` |

### API Dependencies

| Method | Endpoint | Trigger | Rate Limit |
|--------|----------|---------|------------|
| tRPC mutation | `auth.forgotPassword` | Resend (reset type) | Normal: 10/15min |
| tRPC mutation | `auth.resendVerification` | Resend (verify type) | Normal: 10/15min |

---

## 16. Redirect Page

**Route:** `/auth/redirect`

### Overview

Post-authentication routing page. After a successful sign-in (credential, social, or magic link), the user is sent here. The page determines where to send the user next based on their onboarding state.

### Layout

- Full-screen white background
- Centered spinner (branded red color)
- Text: "Signing you in..."

### Interactions

| User Action | System Response |
|------------|-----------------|
| Automatic | On mount, calls `useOnboardingFlow()` hook. Once loaded, calls `navigateToCurrentStep()` to route the user to the appropriate page (dashboard, onboarding step, etc.). |

### Business Rules

- This page requires authentication. Middleware redirects unauthenticated users to `/auth/login`.
- The `useOnboardingFlow` hook determines the user's current onboarding state and navigates accordingly (e.g., to dashboard if fully onboarded, or to the next onboarding step if incomplete).

---

## 17. Invite Page

**Route:** `/auth/invite`

### Overview

Displays a workspace invitation and allows the user to accept or decline. Users arrive by clicking an invite link (typically from an email).

### Query Parameters

| Param | Type | Source |
|-------|------|--------|
| `token` | string (required) | Invite token from email link |

### State 1: Loading

- Auth Card with Auth Logo and "Loading invitation..." text.

### State 2: Invite Not Found

- Auth Logo, Warning icon (red), "Invitation not found" heading, "This invite link is invalid." body, "Back to sign in" link.

### State 3: Invite Expired

- Automatically redirects to `/auth/error/invite-expired`.

### State 4: Valid Invitation

**Layout:**
- Auth Card containing:
  - Auth Logo
  - Mail icon (blue)
  - Heading: "You've been invited"
  - Body: "Join {workspaceName} as {role}"
  - Sub-body: "Invited by {inviterName}"
  - Error banner (conditional)
  - Primary button: "Accept Invitation"
  - Secondary button: "Decline"
  - "Back to sign in" link

### Interactions

| User Action | System Response |
|------------|-----------------|
| Clicks "Accept Invitation" | Calls `trpc.auth.acceptInvite`. On success, navigates to `/dashboard`. |
| Accept fails, user not authenticated | Redirects to `/auth/login?returnUrl=/auth/invite?token={token}` |
| Clicks "Decline" | Calls `trpc.auth.declineInvite`. On success, navigates to `/auth/login`. |
| Accept error (already a member) | Error banner: "You are already a member of this workspace" |

### API Dependencies

| Method | Endpoint | Trigger | Rate Limit |
|--------|----------|---------|------------|
| tRPC query | `auth.getInviteDetails` | Page mount (when token present) | None (public) |
| tRPC mutation | `auth.acceptInvite` | Accept button | None (protected, requires auth) |
| tRPC mutation | `auth.declineInvite` | Decline button | None (public) |

### Business Rules

- `getInviteDetails` is a public endpoint (no auth required) so the user can see the invitation before signing in.
- `acceptInvite` requires authentication. If the user is not signed in, they are redirected to login with a return URL.
- Accepting creates a `workspaceMember` record with the invited role. If the invite includes specific site IDs, `sitePermission` records are also created.
- The invite status is updated to "ACCEPTED" or "DECLINED" in a transaction.
- A notification is sent to the inviter when the invite is accepted.
- If the accepting user's email differs from the invite email, an audit event `INVITE_EMAIL_MISMATCH` is logged (but the accept still succeeds).
- Expired invites or already-used invites result in "NOT_FOUND" errors.

---

## 18. Workspace Select Page

**Route:** `/auth/workspace-select`

### Overview

Presented when a user belongs to multiple workspaces and must choose which one to enter. Currently uses hardcoded placeholder data.

### Layout

- Auth Card containing:
  - Auth Logo
  - Heading: "Select a workspace"
  - Subheading: "Choose a workspace to continue"
  - List of workspace cards, each showing:
    - Workspace name (bold)
    - Role and member count
  - "Create new workspace" link

### Fields and Controls

| Element | Type | Behavior |
|---------|------|----------|
| Workspace card | Button | Hoverable card. Click behavior not yet implemented. |
| Create new workspace | Link button | Not yet implemented. |

### Business Rules

- Requires authentication (middleware-protected).
- Currently uses static placeholder data (Acme Corp, Design Studio, Freelance). Real implementation would query the user's workspace memberships.

---

## 19. Success Page

**Route:** `/auth/success`

### Overview

Transitional page shown during workspace setup. Displays a loading state and auto-redirects to the redirect page.

### Layout

- Auth Logo
- Spinning loader
- Text: "Setting up your workspace..."

### Interactions

| User Action | System Response |
|------------|-----------------|
| Automatic | 3-second timer. Redirects to `/auth/redirect` on expiry. |

### Business Rules

- Requires authentication (middleware-protected).

---

## 20. Splash Page

**Route:** `/auth/splash`

### Overview

Minimal loading screen showing only the brand logo and a spinner. Used as a brief transitional state.

### Layout

- Auth Logo
- Spinning loader

### Business Rules

- Static page with no interaction or API calls.
- This is a server component (no "use client" directive).

---

## 21. Error: Access Denied

**Route:** `/auth/error/access-denied`

### Overview

Shown when a user attempts to access a resource they do not have permission for.

### Layout

- Auth Card containing:
  - Auth Logo
  - Shield-X icon (red)
  - Heading: "Access denied"
  - Body: "You don't have permission to access this resource."
  - Primary button: "Go to Dashboard" (navigates to `/dashboard`)
  - "Contact workspace admin" link (mailto: admin@buildrik.com)
  - "Back to sign in" link

---

## 22. Error: Captcha

**Route:** `/auth/error/captcha`

### Overview

Shown when the system detects unusual activity and requires CAPTCHA verification. Currently a placeholder page.

### Layout

- Auth Card containing:
  - Auth Logo
  - Shield icon (blue)
  - Heading: "Verify you're human"
  - Body: "We detected unusual activity. Please complete the verification."
  - CAPTCHA widget placeholder (dashed border box)
  - Primary button: "Continue" (permanently disabled)
  - "Back to sign in" link

### Business Rules

- CAPTCHA widget is not yet integrated. The Continue button is disabled.

---

## 23. Error: Expired Link

**Route:** `/auth/error/expired-link`

### Overview

Shown when a user clicks an authentication link that has expired. Displays different content based on the link type.

### Query Parameters

| Param | Type | Values |
|-------|------|--------|
| `type` | string | "reset" (default), "verify", "magic-link" |

### Variants

**Reset (default):**
- Heading: "Reset link expired"
- Body: "This password reset link has expired (1 hour limit)."
- Button: "Request New Reset Link" (navigates to `/auth/forgot-password`)

**Verify:**
- Heading: "Verification link expired"
- Body: "This link has expired. Request a new verification email."
- Button: "Resend Verification Email" (navigates to `/auth/signup`)

**Magic Link:**
- Heading: "Magic link expired"
- Body: "This link has expired (15 min limit). Request a new one."
- Button: "Request New Magic Link" (navigates to `/auth/magic-link`)
- Additional link: "Use password instead" (to `/auth/login`)

All variants include Auth Logo, Warning icon (red), and "Back to sign in" link.

---

## 24. Error: Invite Expired

**Route:** `/auth/error/invite-expired`

### Overview

Shown when a user clicks an invitation link that has expired.

### Layout

- Auth Card containing:
  - Auth Logo
  - Warning icon (red)
  - Heading: "Invite expired"
  - Body: "This invitation link has expired. Ask the workspace admin to send a new invite."
  - Primary button: "Go to Dashboard" (navigates to `/dashboard`)
  - "Back to sign in" link

---

## 25. Error: Session Expired

**Route:** `/auth/error/session-expired`

### Overview

Shown when a user's session has timed out.

### Layout

- Auth Card containing:
  - Auth Logo
  - Clock icon (gray)
  - Heading: "Session expired"
  - Body: "Your session has expired. Please sign in again."
  - Primary button: "Sign In Again" (navigates to `/auth/login`)
  - "Back to sign in" link

---

## 26. Error: Social Login Error

**Route:** `/auth/error/social-error`

### Overview

Shown when OAuth authentication with a social provider fails.

### Query Parameters

| Param | Type | Source |
|-------|------|--------|
| `provider` | string (optional) | Name of the failed provider (e.g., "google", "github"). Defaults to "the provider". |

### Layout

- Auth Card containing:
  - Auth Logo
  - Warning icon (red)
  - Heading: "Authentication failed"
  - Body: "Could not authenticate with {Provider}. Please try again."
  - Primary button: "Try Again" (calls `window.history.back()`)
  - "Use email instead" link (to `/auth/login`)
  - "Back to sign in" link

---

## 27. Error: 2FA Locked

**Route:** `/auth/error/2fa-locked`

### Overview

Shown when a user exceeds the maximum number of 2FA verification attempts.

### Layout

- Auth Card containing:
  - Auth Logo
  - Shield-alert icon (red)
  - Heading: "Too many attempts"
  - Body: "2FA verification has been locked. Try again in 30 minutes."
  - "Use a recovery code" link (to `/auth/2fa/backup`)
  - "Contact support" link (mailto: support@buildrik.com)
  - "Back to sign in" link

### Business Rules

- After 5 failed 2FA attempts, the temporary token is invalidated.
- Lockout duration is 30 minutes.
- Users can still attempt backup code recovery.

---

## 28. Error: Account Disabled

**Route:** `/auth/error/disabled`

### Overview

Shown when a user's account has been disabled by an administrator.

### Layout

- Auth Card containing:
  - Auth Logo
  - Lock icon (red)
  - Heading: "Account disabled"
  - Body: "Your account has been disabled by an administrator."
  - "Contact support" link (mailto: support@buildrik.com)
  - "Use a different account" link (to `/auth/login`)
  - "Back to sign in" link

---

## 29. Error: Account Locked

**Route:** `/auth/error/locked`

### Overview

Shown when a user's account is temporarily locked due to too many failed login attempts. Displays a live countdown to when the lockout expires.

### Query Parameters

| Param | Type | Source |
|-------|------|--------|
| `until` | string (ISO 8601 datetime) | Timestamp when the lockout expires. Passed from the login page. |

### Layout

- Auth Card containing:
  - Auth Logo
  - Lock icon (red)
  - Heading: "Account locked"
  - Body: "Too many failed attempts." + countdown "Try again in MM:SS" (while locked)
  - "Back to sign in" link (appears only after lockout expires)
  - "Reset your password" link (to `/auth/forgot-password`)
  - "Contact support" link (mailto: support@buildrik.com)

### Interactions

| User Action | System Response |
|------------|-----------------|
| Waits for countdown | Timer updates every second. When it reaches zero, "Back to sign in" link appears. |

---

## 30. Error: Rate Limited

**Route:** `/auth/error/rate-limited`

### Overview

Shown when a user has made too many requests and is temporarily throttled.

### Layout

- Auth Card containing:
  - Auth Logo
  - Warning icon (red)
  - Heading: "Too many requests"
  - Body: "You've made too many requests. Please wait and try again."
  - Countdown text in CTA color: "Try again in {N}s" or "You can try again now"
  - "Back to sign in" link

### Interactions

| User Action | System Response |
|------------|-----------------|
| Waits | 60-second countdown from page load. Text updates to "You can try again now" at zero. |

---

## 31. Error: Suspicious Login

**Route:** `/auth/error/suspicious`

### Overview

Shown when the system detects a sign-in from a new or unrecognized device. Requires the user to enter a verification code sent to their email.

### Layout

- Auth Card containing:
  - Auth Logo
  - Warning icon (red)
  - Heading: "New device detected"
  - Body: "We noticed a sign-in from a new device. We sent a verification code to your email."
  - 6-digit OTP input
  - Primary button: "Verify Device" (disabled until 6 digits)
  - Device info panel (currently hardcoded: "Chrome 120, macOS - Karachi, PK")
  - "This wasn't me" link (red text, links to #)
  - "Back to sign in" link

### Interactions

| User Action | System Response |
|------------|-----------------|
| Enters 6 digits, clicks Verify | Redirects to `/auth/2fa?code={code}` via `window.location.href`. |

### Business Rules

- Device info is currently hardcoded placeholder. Real implementation would populate from request headers.
- "This wasn't me" action is not yet implemented (links to `#`).

---

## 32. API Endpoints Summary

### tRPC Mutations (via `auth` router)

| Endpoint | Auth Required | Input Schema | Rate Limit | Description |
|----------|--------------|-------------|------------|-------------|
| `auth.login` | No | `loginSchema` | Strict (5/15min) | Credential login, returns session or 2FA token |
| `auth.signup` | No | `signupSchema` | Normal (10/15min) | Creates user, workspace, sends verification email |
| `auth.verifyEmail` | No | `{ token: UUID }` | Normal | Verifies email address |
| `auth.resendVerification` | No | `{ email: string }` | Normal | Resends verification email (silent on missing user) |
| `auth.forgotPassword` | No | `forgotPasswordSchema` | Normal | Sends password reset email (silent on missing user) |
| `auth.resetPassword` | No | `resetPasswordSchema` | Strict (5/15min) | Sets new password, invalidates all sessions |
| `auth.magicLink` | No | `magicLinkSchema` | Normal | Sends magic link email (silent on missing user) |
| `auth.verifyMagicLink` | No | `{ token: UUID }` | Strict (5/15min) | Verifies magic link, returns session or 2FA token |
| `auth.verify2FA` | No | `{ twoFactorToken: UUID, code: string(6) }` | Strict (5/15min) | Verifies TOTP code |
| `auth.verifyBackupCode` | No | `{ twoFactorToken: UUID, backupCode: XXXX-XXXX-XXXX }` | Strict (5/15min) | Verifies backup recovery code |
| `auth.logout` | Yes | None | None | Deletes all sessions for user |
| `auth.acceptInvite` | Yes | `{ token: string }` | None | Accepts workspace invite |
| `auth.declineInvite` | No | `{ token: string }` | None | Declines workspace invite |

### tRPC Queries

| Endpoint | Auth Required | Input | Description |
|----------|--------------|-------|-------------|
| `auth.getInviteDetails` | No | `{ token: string }` | Returns invite details (workspace name, role, inviter, expiry status) |

### REST API Routes

| Method | Path | Auth Required | Description |
|--------|------|--------------|-------------|
| POST | `/api/auth/create-session` | No (token-based) | Validates session grant token, creates JWT cookie and DB session record |
| POST | `/api/auth/logout` | Cookie-based | Decodes JWT, deletes DB sessions, clears cookie |

---

## 33. Validation Rules Summary

All validation schemas live in `lib/validations/auth.ts`.

### Password Rules

- Minimum 8 characters
- At least one uppercase letter [A-Z]
- At least one number [0-9]
- At least one special character from: !@#$%^&*(),.?":{}|<>

### Email

- Standard email format validation via Zod `.email()`

### Full Name

- Minimum 2 characters
- Maximum 100 characters

### OTP Code

- Exactly 6 characters
- Digits only (regex: `^\d+$`)

### Backup Code

- Format: XXXX-XXXX-XXXX
- Uppercase alphanumeric only (regex: `^[A-Z0-9]{4}-[A-Z0-9]{4}-[A-Z0-9]{4}$`)

### Terms Acceptance

- Must be literal `true` (enforced via `z.literal(true)`)

---

## 34. Rate Limiting Summary

Two tiers of rate limiting are applied at the tRPC router level:

| Tier | Limit | Window | Applied To |
|------|-------|--------|-----------|
| Strict | 5 attempts | 15 minutes | Login, reset password, verify magic link, verify 2FA, verify backup code |
| Normal | 10 attempts | 15 minutes | Signup, verify email, resend verification, forgot password, magic link request |

Additionally, login-specific rate limiting exists at the service level:
- Failed login attempts are tracked per user.
- After exceeding the threshold, the account is locked with a `lockedUntil` timestamp.
- Locked accounts are rejected before the bcrypt comparison step (fail-fast).

2FA-specific rate limiting:
- Maximum 5 failed 2FA attempts per temporary token.
- On the 5th failure, the temp token is invalidated and the user is redirected to the 2FA locked error page.

---

## 35. Middleware and Routing Rules

The edge middleware (`middleware.ts`) enforces the following rules:

### Session Validation

Sessions are validated by decoding the JWT from the session cookie (not just checking cookie existence). The cookie name is environment-dependent:
- Production: `__Secure-next-auth.session-token`
- Development: `next-auth.session-token`

### Routing Rules

| Condition | Action |
|-----------|--------|
| Logged-in user visits any `/auth/*` page (except authenticated-auth routes) | Redirect to `/dashboard` |
| Unauthenticated user visits authenticated-auth routes (`/auth/workspace-select`, `/auth/success`, `/auth/redirect`) | Redirect to `/auth/login` |
| Unauthenticated user visits `/dashboard/*` | Redirect to `/auth/login` |
| Unauthenticated user visits `/onboarding/*` | Redirect to `/auth/login` |

### Matcher

Middleware runs on: `/auth/:path*`, `/dashboard/:path*`, `/onboarding/:path*`

---

## 36. Session Management

### Session Creation Flow

1. User completes authentication (login, 2FA, magic link, or social OAuth).
2. A short-lived `session_grant` token (5 min) is generated server-side.
3. The client sends the grant token to `POST /api/auth/create-session`.
4. The endpoint validates the grant token, invalidates it (single-use), and creates:
   - A JWT encoded with user ID, email, and name
   - A database `Session` record with hashed JWT, expiry, device info (User-Agent), and IP address
5. The JWT is set as an HTTP-only, SameSite=lax cookie.
6. CSRF protection: the endpoint verifies the `Origin` header matches the application URL.

### Session Duration

- Default: browser session (no `maxAge` on cookie)
- "Remember me" checked: 30 days (`maxAge: 2592000`)
- Database session expiry matches cookie duration

### Session Limits

- Maximum 10 active sessions per user. Oldest sessions are pruned when the limit is exceeded.

### Session Termination

- Logout: all sessions for the user are deleted from the database, cookie is cleared with `maxAge: 0`.
- Password reset: all sessions are deleted (forces re-authentication on all devices).

### Audit Trail

All authentication events are logged via the audit service:
- `LOGIN_SUCCESS`, `LOGIN_FAILED`, `LOGIN_LOCKED`
- `SIGNUP`
- `EMAIL_VERIFIED`
- `PASSWORD_RESET_REQUESTED`, `PASSWORD_RESET_COMPLETED`
- `MAGIC_LINK_REQUESTED`, `MAGIC_LINK_VERIFIED`
- `2FA_VERIFIED`, `2FA_FAILED`, `2FA_LOCKED`
- `BACKUP_CODE_USED`, `BACKUP_CODE_FAILED`
- `SESSION_CREATED`, `LOGOUT`
- `INVITE_ACCEPTED`, `INVITE_DECLINED`, `INVITE_EMAIL_MISMATCH`

Login attempts are also recorded in a separate `loginAttempt` table with email, user ID, IP address, and result (SUCCESS, FAILED, LOCKED).
