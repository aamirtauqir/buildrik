"use client";

import { SocialButton } from "./social-button";

interface AuthSocialButtonsProps {
  onSelect: (provider: "google" | "github") => void;
  disabled?: boolean;
}

/**
 * The Google + GitHub block, in ONE place.
 *
 * Sign-in and sign-up each hand-assembled this, and drifted: sign-in said "Login
 * with Google" while sign-up said "Continue with Google", sign-in rendered GitHub
 * as a white outline while sign-up rendered it near-black, and the gap between
 * them differed. Same two buttons, same action, three inconsistencies. Composing
 * it once means the two screens cannot disagree again.
 */
export function AuthSocialButtons({ onSelect, disabled }: AuthSocialButtonsProps) {
  return (
    <>
      <SocialButton provider="google" variant="primary" onClick={() => onSelect("google")} disabled={disabled} />
      <div className="h-3" />
      <SocialButton provider="github" variant="dark" onClick={() => onSelect("github")} disabled={disabled} />
    </>
  );
}
