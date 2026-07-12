import { z } from "zod";

const passwordRules = z
  .string()
  .min(8, "Must be at least 8 characters")
  .regex(/[A-Z]/, "Must contain at least one uppercase letter")
  .regex(/[0-9]/, "Must contain at least one number")
  .regex(/[!@#$%^&*(),.?":{}|<>]/, "Must contain at least one special character");

// Email is case-insensitive: trim whitespace and lowercase before validating so
// "Saqib@X.com" / "saqib@x.com " match the stored (lowercased) address on login,
// signup, checkEmail, etc. Applied at the SSOT so every auth flow is consistent.
export const emailField = z
  .string()
  .trim()
  .toLowerCase()
  .email("Please enter a valid email address");

export const loginSchema = z.object({
  email: emailField,
  password: z.string().min(8, "Password must be at least 8 characters"),
  rememberMe: z.boolean().optional().default(false),
  // Cloudflare Turnstile token — required once an IP trips the failed-login
  // threshold (server enforces; see auth router).
  turnstileToken: z.string().optional(),
});

export const signupSchema = z.object({
  fullName: z.string().min(2, "Name must be at least 2 characters").max(100, "Name must be under 100 characters"),
  email: emailField,
  password: passwordRules,
  termsAccepted: z.literal(true, { errorMap: () => ({ message: "You must accept the terms" }) }),
});

export const forgotPasswordSchema = z.object({
  email: emailField,
});

export const resetPasswordSchema = z.object({
  token: z.string().uuid(),
  newPassword: passwordRules,
  confirmPassword: z.string(),
}).refine((data) => data.newPassword === data.confirmPassword, {
  message: "Passwords don't match",
  path: ["confirmPassword"],
});

export const otpSchema = z.object({
  code: z.string().length(6, "Code must be 6 digits").regex(/^\d+$/, "Code must be numbers only"),
});

export const backupCodeSchema = z.object({
  backupCode: z.string().regex(/^[A-Z0-9]{4}-[A-Z0-9]{4}-[A-Z0-9]{4}$/, "Invalid backup code format"),
});

export const magicLinkSchema = z.object({
  email: emailField,
});

export type LoginInput = z.infer<typeof loginSchema>;
export type SignupInput = z.infer<typeof signupSchema>;
export type ForgotPasswordInput = z.infer<typeof forgotPasswordSchema>;
export type ResetPasswordInput = z.infer<typeof resetPasswordSchema>;
export type OTPInput = z.infer<typeof otpSchema>;
export type BackupCodeInput = z.infer<typeof backupCodeSchema>;
export type MagicLinkInput = z.infer<typeof magicLinkSchema>;
